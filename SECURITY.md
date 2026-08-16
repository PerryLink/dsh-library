# Security policy

## Reporting a vulnerability

Please **do not** open a public issue for security vulnerabilities.

Report privately through GitHub's private vulnerability reporting:

**https://github.com/PerryLink/dsh-library/security/advisories/new**

That flow keeps the report confidential while we triage, and it is the channel we watch first.

## Before you report

- **Redact sensitive data** from any logs, indexed documents, or session excerpts you attach: tokens, API keys, secrets, Authorization/request headers, personal paths, and account identifiers. Trimmed stack traces are usually enough.
- Include, when possible: the plugin version, the harness (`dsh`) version, Node and OS versions, and the minimal steps to reproduce.

## What to expect

- **Acknowledgment**: within 5 business days.
- **Triage**: within 10 business days we confirm the issue and assess severity, or ask for more details.
- **Fix**: security fixes are prepared in a private fork, released as a patch version, and announced in the release notes.

## Disclosure and credit

- We follow coordinated disclosure: a public advisory (and CVE request where appropriate) is published once a fix ships.
- Reporters are credited in the advisory unless they ask to remain anonymous. There is no bug bounty program at this time.

## Scope

This plugin builds a local document index: it reads files you point it at through the harness filesystem service, stores chunk text and embeddings in the host's storage domain, and injects retrieved text into the calling agent. Its own guarantees:

- Document paths and embedding vectors are never written to the session log; only chunk ids and lengths appear in audit events.
- Retrieval and citation checks are deterministic local computations — the plugin makes no network requests and downloads no models unless you configure an external embedder command.
- The configured embedder command runs through `ctx.subprocess` without shell interpretation, bounded by timeout and output caps; a misbehaving command fails the batch loudly.
- Indexed documents inherit the deployment's storage backend access control; the plugin itself adds no encryption — treat the index medium as sensitive when the documents are.

Vulnerabilities in the harness itself should be reported to the official harness maintainers instead.
