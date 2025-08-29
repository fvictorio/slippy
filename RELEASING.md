# Releasing

This project uses GitHub Actions to publish to npm. The publish workflow runs on two triggers:

- Manually via `workflow_dispatch`
- Automatically when a GitHub Release is published

## Steps to cut a release

1. **Decide the new version**. Use `pnpm version` to bump the version and create a git tag for it. Commit and push the change and the tag.
2. **Create a GitHub release**. Go to the tags page and create a release using the pushed tag.

## npm dist-tags

The workflow chooses the npm tag automatically based on the version string:

- `*-alpha.*` → published under `alpha`
- `*-beta.*` → published under `beta`
- `*-rc.*` → published under `next`
- Everything else → `latest`

So, for prereleases, remember to add the correct suffix to the version (e.g. `1.2.3-beta.0`).
