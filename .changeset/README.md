# Changesets

This folder holds unreleased change descriptions. Every pull request that
changes shipped behaviour needs one; the release workflow turns them into a
version bump and a `CHANGELOG.md` entry.

Add one from the repository root:

```sh
npx changeset
```

Pick the bump type (`patch` for fixes, `minor` for additions, `major` for
breaking changes), then write the summary for the person reading the
changelog — what changed and what they must do about it, not which files you
touched. The command writes a Markdown file here; commit it with your change.

Do not edit `package.json#version` or `CHANGELOG.md` by hand. Pushing to
`master` makes `.github/workflows/release.yml` open a "Version Packages" pull
request that consumes every file in this folder; merging that pull request
publishes to npm.

`config.json` is the shared configuration and is not a changeset.
