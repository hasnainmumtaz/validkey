# Security policy

## Supported versions

Security fixes target the latest published release. Older releases do not receive separate backports. Check [npm](https://www.npmjs.com/package/validkey) for the current release.

## Reporting vulnerabilities

Use GitHub's [private vulnerability reporting form](https://github.com/hasnainmumtaz/validkey/security/advisories/new). If unavailable, email [naqvi@uni.minerva.edu](mailto:naqvi@uni.minerva.edu) with the subject `Validkey security report`.

Include the affected version, impact, reproduction steps using fake credentials, and any proposed mitigation. Do not include working API keys. Avoid public issues or pull requests that disclose an unpatched vulnerability.

Reports are reviewed on a best-effort basis. The maintainer will coordinate investigation, remediation, and disclosure with the reporter where practical. There is no guaranteed response time or bug bounty.

## Credential handling

- Use only credentials you own or are authorized to validate.
- Prefer environment variables over key arguments, which may appear in shell history and process listings.
- Keys are sent to the selected provider over HTTPS. Validkey has no hosted validation service.
- Remove secrets from logs, screenshots, and reproduction examples. Rotate an exposed credential through its provider.
- Success only confirms that the provider accepted the validation endpoint request. It does not establish access to all models, available credit, or future availability.

Credential disclosure, unexpected credential destinations, and executable supply-chain compromise are examples of security issues. Ordinary feature requests and non-sensitive bugs belong in public issues.
