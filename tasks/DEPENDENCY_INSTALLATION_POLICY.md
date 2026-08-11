# Dependency Installation Policy

Tasks share one workspace checkout, so an already-valid pnpm installation must be reused. Repeatedly deleting `node_modules` or downloading lockfile dependencies slows delivery and can hide unrelated defects.

## Normal task flow

Verify the toolchain and existing installation first:

```bash
corepack pnpm --version
corepack pnpm install --frozen-lockfile --offline
```

If the offline check reports that packages are not cached, use `corepack pnpm install --frozen-lockfile`. Reuse the installation for lint, typecheck, tests and builds. Do not run a full install at the start of every task.

Run a frozen network install only when the lockfile or workspace dependency declarations changed, packages are missing, the local store is corrupt/incompatible, or the task runs in a new isolated CI/container environment. Never regenerate the lockfile casually.

Deleting dependency directories or package-manager caches is diagnostic only. Record the exact reason and paths in the execution log first. Never delete the repository root, user directories or unrelated data.

## Docker

Use cached `docker compose build` or `docker compose up --build` for normal validation. Use `build --no-cache` only to diagnose a Dockerfile/base-image/dependency-layer problem or when a task explicitly requires a clean image. A fresh runtime means a recreated process/container from the current worktree; it does not imply a fresh package download.

Dockerfiles should copy manifests and the lockfile before application source so unchanged dependency layers remain cached. Container builds may install dependencies in their isolated image, but repeated local package deletion is not required.

Execution logs for container tasks must state `Dependency layer: REUSED` when Docker reports a cached install layer, or `Dependency layer: REBUILT` with the reason when a manifest, lockfile, base image or explicit no-cache build invalidated it.

## Troubleshooting

- Missing declarations: verify package manifests and build workspace dependencies in topological order.
- Lockfile mismatch: stop and resolve the dependency change; do not bypass `--frozen-lockfile`.
- Corrupt store: inspect pnpm state and reset only the affected cache with an explicit log entry.
- Native/platform mismatch: reinstall in the target environment after confirming the platform.
- Docker cache issue: inspect Dockerfile layer inputs and use one diagnostic `--no-cache` build, then return to cached builds.
