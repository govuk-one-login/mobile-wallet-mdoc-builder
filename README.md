# devplatform-template

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Use this template to quickly populate a repo with common files

## Licence

[MIT License](LICENSE)

## Contributing

This project uses [pre-commit](https://pre-commit.com/) to enforce code quality and validate commit messages against [Conventional Commits](https://github.com/conventional-changelog/commitlint) standards across all projects in this repository. Non-conforming messages will be rejected.

Ensure your branch is up to date and all hooks pass before opening a pull request. Avoid using the git `--no-verify` flag to skip these checks unless absolutely necessary.

### Installation

Pre-commit

```bash
brew install pre-commit
```

```bash
pre-commit install
pre-commit install --hook-type commit-msg --hook-type commit-msg
```
