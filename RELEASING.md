# Releasing

This project uses GitHub Actions to publish to npm. The publish workflow runs when a tag with the format `v*` is pushed.

## Steps to cut a release

1. **Decide the new version**. Use `pnpm version` to bump the version and create a git tag for it. Commit and push the change and the tag.
2. **Create a GitHub release**. Go to the tags page and create a release using the pushed tag.
