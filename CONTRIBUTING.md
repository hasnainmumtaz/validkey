# Contributing to Validkey

Contributions can include bug fixes, documentation, tests, and additional provider validators. Please follow the [code of conduct](CODE_OF_CONDUCT.md).

## Before you start

Search existing issues and pull requests. For substantial changes or a new provider, open a feature request describing the problem and proposed behavior first. Small documentation fixes can go directly into a pull request. Report vulnerabilities through [SECURITY.md](SECURITY.md), without posting real credentials.

## Local setup

Use Node.js 22 or 24 and npm. Fork the repository if you do not have write access, clone your fork, and create a branch for your change.

```sh
npm ci
npm run build
npm test
npm run check:package
node dist/index.js --help
```

`npm test` compiles TypeScript and runs the Node.js test suite. Tests mock network responses and use fake credentials. Do not add tests that call a live provider or require secrets. `npm run check:package` previews package contents without publishing.

## Project structure

- `src/index.ts`: argument handling, output, and exit status.
- `src/validators/index.ts`: provider registry and environment variables.
- `src/validators/request.ts`: result types, status classification, and request deadlines.
- `src/validators/*.ts`: provider authentication headers and endpoints.
- `src/input.ts`: bounded stdin and hidden terminal entry.
- `test/`: offline validator and CLI tests.
- `codebase/`: implementation documentation.

Keep changes focused and follow the existing TypeScript style. Avoid unnecessary runtime dependencies. Do not commit generated builds, dependencies, environment files, logs, or credentials.

## Adding a provider

1. Choose an official, minimal, read-only endpoint. Explain what success proves and which permissions are required.
2. Implement a validator accepting `ValidationOptions` and returning `Promise<ValidationResult>` from `src/validators/request.ts`. Reuse the shared request handler where appropriate. Send the key only to the intended provider and avoid printing it.
3. Register the CLI name and environment variable in `src/validators/index.ts`.
4. Add offline tests for success, empty input, rejected credentials, permission denial, unexpected responses, network failure, timeout, and credential redaction. Verify the destination and authentication headers with fake values.
5. Update the README and relevant `codebase/` documentation.

Diagnostic text should distinguish credential, permission, and network failures. Discuss changes to exit codes, flags, or runtime requirements because scripts may depend on them.

## Pull requests and releases

Describe the problem, resulting behavior, and validation. Link an issue when applicable. Add meaningful regression tests for behavior changes and update documentation. Run the commands above and review package contents.

Maintainers review contributions as time permits; no response deadline is guaranteed. Contributions are provided under the existing [MIT license](LICENSE).

Only maintainers publish releases. CI does not publish to npm. Do not bump the version for a routine contribution unless requested. Maintainers should review package contents, run the full test suite, and follow semantic versioning when preparing a release.
