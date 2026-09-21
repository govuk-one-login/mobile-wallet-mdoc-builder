# Release process

This document explains how releasing works for maintainers of this project. It covers what happens
automatically, where the human gates are, and how to operate and troubleshoot the pipeline.

## Overview

Releasing is fully automated from a merge to `main` through to a published npm package, with two human
approval gates. It is driven by two workflows:

- **[`release.yml`](../.github/workflows/release.yml)** — runs on every push to `main`. Computes the next
  version from Conventional Commits, bumps `package.json`, and creates a version commit + `v*` tag.
- **[`publish.yml`](../.github/workflows/publish.yml)** — runs when a `v*.*.*` tag is pushed. Publishes to
  npm (staged, via OIDC) and creates a draft GitHub Release.

```
merge to main (feat:/fix:)
  └─ release.yml: cocogitto bump commit + vX.Y.Z tag (pushed as the release GitHub App)
       └─ tag push triggers publish.yml
            ├─ gate 1: npm-publish environment — a CODEOWNER approves the deployment
            ├─ npm ci → build → test
            ├─ npm stage publish (OIDC, automatic provenance) → version STAGED (not public)
            └─ draft GitHub Release created
                 └─ gate 2: a maintainer approves the staged version with 2FA on npmjs.com → PUBLIC
                      └─ maintainer publishes the draft GitHub Release
```

## Versioning

The version is derived automatically from commit messages since the last tag, following
[Conventional Commits](https://www.conventionalcommits.org/):

- `fix:` → patch bump
- `feat:` → minor bump
- `feat!:` / `fix!:` or a `BREAKING CHANGE:` footer → major bump

[cocogitto](https://docs.cocogitto.io/) computes the version. See [`cog.toml`](../cog.toml): it keeps a bare
semver in `package.json` (via a `pre_bump` hook running `npm version`) and prefixes only the git tag with `v`
(e.g. `v0.3.0`). Commits that don't affect the version produce no release.

## The release workflow (`release.yml`)

Triggers on push to `main` and via manual `workflow_dispatch`. After the standard quality gates it:

1. Assumes an AWS IAM role and etches the release GitHub App credentials from AWS Secrets Manager.
2. Mints a GitHub App installation token and derives the App's bot identity.
3. Runs cocogitto to create the bump commit + `v*` tag.
4. Pushes the commit to `main` and the tag — **as the GitHub App**, which is what re-triggers `publish.yml`

> The release App is a **bypass actor** on the branch and tag rulesets, so it can push the bump commit and `v*` tag.

## The publish workflow (`publish.yml`)

Triggers only on `v*.*.*` tag pushes (plus manual `workflow_dispatch`).

Steps:

1. **Environment gate** — the job is bound to the `npm-publish` GitHub Environment, which requires a CODEOWNER
   reviewer and is restricted to `v*.*.*` tags. The run pauses here until approved.
2. Version integrity → `npm ci` → `npm run build` → `npm test`.
3. **`npm stage publish`** via OIDC trusted publishing. Provenance is generated
   automatically (public repo + public package). The version is _staged_, not yet public.
4. **Draft GitHub Release** created with auto-generated notes (skipped if a release already exists for the tag).

> Node is pinned to 24 in this workflow to match npm's documented OIDC examples; the release workflow uses
> `.nvmrc`.

## Human gates

There are two deliberate manual approvals per release:

1. **`npm-publish` environment approval** (in GitHub) — a CODEOWNER approves the deployment before anything is
   staged.
2. **npm staged-publish 2FA approval** (on npmjs.com) — a GOVUK One Login npm org maintainer reviews and approves
   the staged version with 2FA. Confirm the package version is live (with a provenance badge) on npmjs.com.
3. Open the **draft** GitHub Release created by `publish.yml`, review the notes, and **publish** it
   (draft → published).

## How to cut a release

Normally you don't do anything special — merge PRs to `main` with Conventional Commit messages and the
pipeline runs. To release:

1. Merge a `feat:` or `fix:` PR to `main`.
2. Wait for `release.yml` to create the bump commit + tag, then `publish.yml` to start.
3. Approve the `npm-publish` environment deployment (CODEOWNER).
4. Approve the staged version on npmjs.com with 2FA.
5. Publish the draft GitHub Release.

## Related configuration (manual, one-time setup)

The pipeline depends on infrastructure and settings configured outside this repo

- AWS Secrets Manager + OIDC role,
- The release GitHub App,
- Branch/tag rulesets,
- The `npm-publish` environment,
- The npm Trusted Publisher.

Without these one-time setups the release will not work.
