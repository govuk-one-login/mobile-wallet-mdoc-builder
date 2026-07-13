# Mobile Wallet mdoc Builder

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## Overview

A TypeScript library for building mdoc (ISO 18013-5) documents for use with GOV.UK Wallet. It provides a type-safe API
for constructing and encoding mdoc-based credentials.

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

## Release process

Releases are created using the [release workflow](.github/workflows/release.yml), which is triggered manually via GitHub Actions `workflow_dispatch`.

When triggered from `main`, the workflow:

1. Runs code quality and security analysis (SonarQube)
2. Runs type checking, linting, and formatting checks
3. Runs build and component tests
4. Validates conventional commits
5. If all checks pass, creates a semantic version tag using [cocogitto](https://docs.cocogitto.io/) based on the conventional commit history
6. Pushes the version tag and creates a GitHub release with auto-generated release notes

The version is determined automatically from commit messages following [Conventional Commits](https://www.conventionalcommits.org/) — `fix:` commits bump
the patch version, `feat:` commits bump the minor version, and breaking changes bump the major version.

### Known limitations

1. **package.json version is not updated** — the semantic version tag is created but `package.json` is not bumped to
   match. This will come in a future iteration.
2. **No publish to a registry** — the release does not publish the package to npm or any other registry. This will come in a future release.
3. **Manual trigger only** — the release workflow must be triggered by a human via the GitHub Actions UI. Automation
   (e.g. triggering on merge to `main`) will come in the future.

## Licence

[MIT License](LICENSE)
