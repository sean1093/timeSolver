#!/usr/bin/env node

/**
 * Documentation gate.
 *
 * The published doc set is nine files under docs/ plus four at the root, and
 * they link to each other heavily. Nothing checked those links: a renamed file
 * or a retitled section left a 404, or a link that silently scrolls nowhere,
 * and the only way to find out was for a reader to click it.
 *
 * This script checks what can be checked offline:
 *
 * - every relative link resolves to a file or directory that exists;
 * - every anchor -- `#section` and `other.md#section` alike -- resolves to a
 *   real heading in the target file, using GitHub's slug rules;
 * - every fenced code block declares a language, so nothing renders unhighlighted;
 * - no file carries an unresolved merge marker, a TODO or a FIXME;
 * - README.md links to other documents absolutely, and docs/*.md link to each
 *   other relatively.
 *
 * That last rule is not pedantry. README.md is the npm landing page, where a
 * relative link resolves against the registry and 404s, so those links have to
 * be absolute GitHub URLs. Inside docs/ the opposite holds: relative links
 * follow a branch, a fork and a pull request preview, and absolute ones pin
 * readers to master.
 *
 * External URLs are deliberately not fetched. A network check in CI is flaky,
 * it fails on rate limits and on sites that dislike CI user agents, and this
 * repository has already removed one badge for rendering an error. Absolute
 * links back into this repository are the exception: they are resolved against
 * the working tree, with no network, which is what catches a README link to a
 * document that a commit renamed.
 *
 * The checked set is the published doc set: docs/*.md and the four root
 * documents. Design records under docs/specs/ are dated, frozen accounts of a
 * decision, so they are not restyled; they are still validated as link targets,
 * which is what a link into one from docs/README.md needs.
 *
 * Zero dependencies. Reports every problem it finds, then exits non-zero.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** Documents at the repository root that ship to readers. */
const ROOT_DOCS = ['README.md', 'CONTRIBUTING.md', 'SECURITY.md', 'CODE_OF_CONDUCT.md'];

/** The published guides. Nested design records are link targets, not documents. */
const DOC_DIR = 'docs';

/** The npm landing page. Its links to other documents must be absolute. */
const LANDING_PAGE = 'README.md';

/** The branch absolute in-repo links are expected to point at. */
const BRANCH = 'master';

/** `<<<<<<< HEAD`, `||||||| base`, `=======`, `>>>>>>> branch`. */
const MERGE_MARKER = /^(?:<{7}|\|{7}|={7}|>{7})(?:$|\s)/;
const LOOSE_END = /\b(?:TODO|FIXME)\b/;

const problems = [];

function report(file, line, message) {
  problems.push({ file, line, message });
}

/** Repository-relative, with forward slashes on every platform. */
function label(absolute) {
  return relative(root, absolute).split(sep).join('/');
}

function exists(absolute) {
  try {
    statSync(absolute);
    return true;
  } catch {
    return false;
  }
}

function isDirectory(absolute) {
  try {
    return statSync(absolute).isDirectory();
  } catch {
    return false;
  }
}

/** The markdown files directly in `dir`, in a stable order. */
function markdownIn(dir) {
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
    .map((entry) => entry.name)
    .sort()
    .map((name) => join(dir, name));
}

const manifest = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const slug = /github\.com[/:]+([^/]+\/[^/]+?)(?:\.git)?\/?$/.exec(manifest.repository?.url ?? '');

/**
 * An absolute URL that points back into this repository's file tree, so it can
 * be resolved on disk. `github.com/<owner>/<repo>/issues/new` is not one of
 * these, and is treated as external.
 */
const SELF_LINK =
  slug === null
    ? null
    : new RegExp(`^https?://(?:www\\.)?github\\.com/${slug[1]}/(blob|tree|raw)/[^/]+/(.+)$`, 'i');

/**
 * GitHub's heading anchor: the rendered heading text, lowercased, with
 * punctuation and symbols dropped, each space turned into a hyphen, and a
 * `-1`, `-2` ... suffix on repeats. Hyphens, underscores and letters of any
 * script survive, which is what gives the Japanese and Chinese guides usable
 * anchors.
 */
function slugify(text, seen) {
  const base = text
    .replace(/<[^>]*>/g, '')
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/!?\[([^\]]*)\]\[[^\]]*\]/g, '$1')
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\p{M}\s_-]/gu, '')
    .replace(/\s/g, '-');
  const before = seen.get(base) ?? 0;
  seen.set(base, before + 1);
  return before === 0 ? base : `${base}-${before}`;
}

/** The destination of a link, starting just after its `](`. */
function destinationAt(text, from) {
  let index = from;
  while (index < text.length && /\s/.test(text[index])) index += 1;
  if (text[index] === '<') {
    const end = text.indexOf('>', index);
    return end === -1 ? '' : text.slice(index + 1, end);
  }
  let depth = 0;
  let out = '';
  for (; index < text.length; index += 1) {
    const character = text[index];
    if (/\s/.test(character)) break;
    if (character === '(') depth += 1;
    else if (character === ')') {
      if (depth === 0) break;
      depth -= 1;
    }
    out += character;
  }
  return out;
}

/**
 * Headings, links and code blocks of one document. Links are read from the
 * source with fenced blocks and inline code blanked out, so a markdown example
 * inside a ```md block is not mistaken for a link the reader can click.
 *
 * ATX headings only (`## Title`). The doc set uses no setext headings, and
 * guessing at one would invent anchors GitHub does not publish.
 */
function readDocument(absolute) {
  const source = readFileSync(absolute, 'utf8');
  const name = label(absolute);
  const headings = new Map();
  const seen = new Map();
  const links = [];
  const blocks = [];
  let fence = null;

  source.split(/\r?\n/).forEach((raw, index) => {
    const line = index + 1;

    if (MERGE_MARKER.test(raw)) {
      report(name, line, `unresolved merge marker: ${raw.trim().slice(0, 40)}`);
    }
    if (LOOSE_END.test(raw)) {
      report(name, line, `unfinished note: ${raw.trim().slice(0, 60)}`);
    }

    const fenced = /^ {0,3}(`{3,}|~{3,})(.*)$/.exec(raw);

    if (fenced !== null) {
      const bars = fenced[1];
      const info = fenced[2].trim();

      if (fence === null) {
        fence = { marker: bars, line, language: info.split(/\s+/)[0] ?? '' };
        blocks.push(fence);
        if (fence.language === '') {
          report(name, line, 'fenced code block declares no language');
        }
      } else if (info === '' && bars.startsWith(fence.marker)) {
        // A closing fence is the same character, at least as long, and alone.
        fence = null;
      }
      return;
    }

    if (fence !== null) return;

    const heading = /^ {0,3}(#{1,6})\s+(.*?)\s*#*\s*$/.exec(raw);
    if (heading !== null) {
      const anchor = slugify(heading[2], seen);
      if (!headings.has(anchor)) headings.set(anchor, line);
      return;
    }

    // Inline code cannot contain a link, and often contains something that
    // looks like one.
    const text = raw.replace(/`[^`]*`/g, (span) => ' '.repeat(span.length));

    for (const match of text.matchAll(/]\(/g)) {
      const destination = destinationAt(text, match.index + 2);
      if (destination !== '') links.push({ line, destination });
    }

    const definition = /^ {0,3}\[(?:[^\]\\]|\\.)+]:\s*<?([^>\s]+)>?/.exec(text);
    if (definition !== null) links.push({ line, destination: definition[1] });
  });

  if (fence !== null) {
    report(name, fence.line, 'fenced code block is never closed');
  }

  return { absolute, name, headings, links, blocks };
}

const documents = [...ROOT_DOCS.map((file) => join(root, file)), ...markdownIn(join(root, DOC_DIR))]
  .map(readDocument)
  .map((document) => ({ ...document, counts: { internal: 0, external: 0 } }));

/** Headings of a link target, which may be a document outside the checked set. */
const byPath = new Map(documents.map((document) => [document.absolute, document]));

function headingsOf(absolute) {
  const known = byPath.get(absolute);
  if (known !== undefined) return known.headings;
  const parsed = readDocument(absolute);
  byPath.set(absolute, parsed);
  return parsed.headings;
}

function decode(destination) {
  try {
    return decodeURIComponent(destination);
  } catch {
    return destination;
  }
}

/** An absolute GitHub URL for a path in this repository. */
function absoluteForm(path) {
  const kind = isDirectory(join(root, path)) ? 'tree' : 'blob';
  return `https://github.com/${slug?.[1] ?? '<owner>/<repo>'}/${kind}/${BRANCH}/${path}`;
}

/** Resolve a path-and-anchor target against the tree, reporting what is wrong. */
function checkTarget(document, line, described, path, anchor) {
  const absolute = path === '' ? document.absolute : resolve(root, path);

  if (!exists(absolute)) {
    report(document.name, line, `${described} does not exist (looked for ${label(absolute)})`);
    return;
  }
  if (anchor === undefined || !absolute.endsWith('.md') || isDirectory(absolute)) return;

  const headings = headingsOf(absolute);
  if (headings.has(anchor)) return;

  const where = absolute === document.absolute ? 'this file' : label(absolute);
  const near = [...headings.keys()].find(
    (candidate) => candidate.includes(anchor) || anchor.includes(candidate),
  );
  report(
    document.name,
    line,
    `${described} has no matching heading in ${where}${near === undefined ? '' : ` (closest: #${near})`}`,
  );
}

for (const document of documents) {
  const directory = dirname(document.absolute);
  const isLandingPage = document.name === LANDING_PAGE;
  const isGuide = document.name.startsWith(`${DOC_DIR}/`);

  for (const { line, destination } of document.links) {
    const [target, ...rest] = destination.split('#');
    const anchor = rest.length === 0 ? undefined : decode(rest.join('#'));
    const path = decode(target ?? '');

    // An anchor on its own always stays relative: it works on npm too.
    if (path === '') {
      document.counts.internal += 1;
      checkTarget(document, line, `anchor '${destination}'`, '', anchor);
      continue;
    }

    if (/^[a-z][a-z0-9+.-]*:/i.test(path) || path.startsWith('//')) {
      const self = SELF_LINK?.exec(path);
      if (self === null || self === undefined) {
        document.counts.external += 1;
        continue;
      }

      document.counts.internal += 1;
      const inRepo = self[2] ?? '';
      checkTarget(document, line, `absolute link '${path}'`, inRepo, anchor);

      if (isGuide) {
        const suggestion = relative(directory, join(root, inRepo)).split(sep).join('/');
        report(
          document.name,
          line,
          `absolute in-repo link '${path}': documents under ${DOC_DIR}/ link to each ` +
            `other with relative paths, which follow a branch, a fork and a pull ` +
            `request preview. Use '${suggestion}${anchor === undefined ? '' : `#${anchor}`}'`,
        );
      }
      continue;
    }

    document.counts.internal += 1;
    const resolved = path.startsWith('/') ? join(root, path) : resolve(directory, path);
    checkTarget(document, line, `relative link '${destination}'`, label(resolved), anchor);

    if (isLandingPage) {
      report(
        document.name,
        line,
        `relative link '${destination}': ${LANDING_PAGE} is the npm landing page, ` +
          `where relative links resolve against the registry and 404. Use ` +
          `'${absoluteForm(label(resolved))}${anchor === undefined ? '' : `#${anchor}`}'`,
      );
    }
  }
}

const width = Math.max(...documents.map((document) => document.name.length));
const failing = new Set(problems.map((problem) => problem.file));
const totals = { headings: 0, links: 0, internal: 0, external: 0, blocks: 0 };

console.log(`documentation gate over ${documents.length} files, external URLs not fetched`);
console.log('');

for (const document of documents) {
  const { internal, external } = document.counts;
  totals.headings += document.headings.size;
  totals.links += internal + external;
  totals.internal += internal;
  totals.external += external;
  totals.blocks += document.blocks.length;

  const summary =
    `${String(document.headings.size).padStart(3)} headings, ` +
    `${String(internal).padStart(3)} in-repo links, ` +
    `${String(external).padStart(2)} external, ` +
    `${String(document.blocks.length).padStart(2)} code blocks`;

  if (failing.has(document.name)) {
    console.error(`  not ok - ${document.name.padEnd(width)}  ${summary}`);
    for (const problem of problems.filter((entry) => entry.file === document.name)) {
      console.error(`      line ${problem.line}: ${problem.message}`);
    }
  } else {
    console.log(`      ok - ${document.name.padEnd(width)}  ${summary}`);
  }
}

console.log('');

if (problems.length > 0) {
  console.error(
    `docs gate failed - ${problems.length} problem${problems.length === 1 ? '' : 's'} ` +
      `in ${failing.size} of ${documents.length} files.`,
  );
  process.exit(1);
}

console.log(
  `docs gate passed - ${documents.length} files, ${totals.headings} headings, ` +
    `${totals.internal} in-repo links resolved, ${totals.external} external links left alone, ` +
    `${totals.blocks} code blocks.`,
);
