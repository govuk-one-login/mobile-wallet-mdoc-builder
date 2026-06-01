# Mobile Wallet mdoc Builder

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## Overview

A TypeScript library for building mdoc (ISO 18013-5) documents for use with GOV.UK Wallet. It provides a type-safe API for constructing and encoding mobile driving licence and other mdoc-based credentials.

## Tech stack

Built with TypeScript and Node.js, published as a dual-format (ESM and CJS) npm package.

## Prerequisites

- [Node.js](https://nodejs.org/en) — we recommend managing versions with [nvm](https://github.com/nvm-sh/nvm)
- [Pre-commit](https://pre-commit.com/)

## Set up locally

### Install

```bash
nvm use
npm install
```

### Lint and format

```bash
npm run lint
npm run format
```

### Type check

```bash
npm run typecheck
```

### Build

```bash
npm run build
```

## Contributing

This project uses [pre-commit](https://pre-commit.com/) to enforce code quality and validate commit messages against [Conventional Commits](https://www.conventionalcommits.org/) standards. Non-conforming messages will be rejected.

Ensure your branch is up to date and all hooks pass before opening a pull request. Avoid using the git `--no-verify` flag to skip these checks unless absolutely necessary.

### Installing pre-commit hooks

```bash
brew install pre-commit
```

```bash
pre-commit install --hook-type pre-commit --hook-type commit-msg
```

## Licence

[MIT License](LICENSE)
