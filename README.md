# timeSolver

![npm](https://img.shields.io/badge/npm-ready-green)
![tests](https://img.shields.io/badge/tests-passing-brightgreen)
![license](https://img.shields.io/badge/license-MIT-blue)

timeSolver is a small, zero-dependency JavaScript utility for manipulating,
validating and formatting Date objects. It also includes a lightweight
`timeLook` helper to measure execution intervals during development.

Current version: v1.2.0

## Contents

- [Installation](#installation)
- [Usage](#usage)
- [Development](#development)
- [Contributing](#contributing)
- [Changelog](#changelog)
- [License](#license)

## Installation

Install from npm:

```bash
npm install timesolver
```

Or include the UMD bundle in the browser (`dist/timeSolver.umd.min.js`).

## Usage

CommonJS:

```js
const timeSolver = require('timesolver');
```

ES Module:

```js
import timeSolver from 'timesolver';
```

Browser global (after including UMD bundle):

```js
timeSolver.getString(new Date(), 'YYYYMMDD');
```

Examples:

```js
timeSolver.add('2020-01-01', 1, 'D'); // add 1 day
timeSolver.between('2020-01-01', '2020-01-02', 'H'); // hours between
timeSolver.getString(new Date(), 'YYYY-MM-DD HH:MM:SS.SSS');
```

## Development

Install dependencies and run tests:

```bash
npm install
npm test
```

Build the distribution bundles (requires `rollup`):

```bash
npm run build
```

## Contributing

See `CONTRIBUTING.md` for contribution guidelines, branching model and testing
requirements. In short:

- Fork and create a feature branch
- Add tests for new behavior
- Run `npm test` and ensure green
- Open a PR describing your changes

## Changelog

See `CHANGELOG.md` for the release history.

## License

MIT — see `LICENSE`
