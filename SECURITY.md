# Security Policy

## Supported versions

| Version | Supported | Notes |
|---|---|---|
| `2.x` | Yes | Actively maintained. Security fixes land here. |
| `1.x` | No | End of life. The published `1.x` tarball is broken and receives no fixes; upgrade to `2.x`. |

## Reporting a vulnerability

Report privately through GitHub Security Advisories:

**<https://github.com/sean1093/timeSolver/security/advisories/new>**

**Do not open a public issue, discussion, or pull request for a suspected
vulnerability.** A public report tells everyone how to exploit it before a fix
exists.

Please include:

- the version of `timesolver` and of Node.js or the browser,
- a minimal snippet that reproduces the behaviour,
- the impact you believe it has.

You will get an acknowledgement within **5 business days**. If the report is
accepted we will agree a disclosure timeline with you, publish a fixed release,
and credit you in the advisory unless you ask us not to.

## Scope

`timesolver` has **zero runtime dependencies**, performs **no I/O**, and makes
**no network access**. It reads and writes plain values and native `Date`
objects. There is no file system, child process, or prototype-extension surface
to attack. Errors are thrown, never logged; the only console output in the
package is the profiler's `print()` and its 1.x shim `timeLookReport()`, which
a caller opts into.

The realistic attack surface is untrusted strings reaching the format/parse
layer, where `parse` and `isValid` compile the caller's format string into a
`RegExp`:

- `getString(date, format)` — an attacker-controlled *format* string.
- `parse(input, format)` and `isValid(input, format?)` — an attacker-controlled
  *date* string, an attacker-controlled *format* string, or both.

Reports in scope include, for such inputs: catastrophic backtracking or other
denial of service, unbounded memory growth, a crash that is not a
`TimeSolverError`, or output that escapes the token grammar. Note that invalid
input is *designed* to throw a `TimeSolverError` with a `code`; a thrown
`TimeSolverError` is correct behaviour, not a vulnerability.

Out of scope:

- Results that differ because the host time zone or system clock differs. Every
  function operates in the host local time zone by design.
- Vulnerabilities in development-only dependencies that cannot affect the
  published `dist/` output.
- Missing hardening that has no demonstrated impact.
