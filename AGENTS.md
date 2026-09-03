# AGENTS.md

## Scope and sources

These instructions apply to the entire repository.

- Product source of truth: the detailed Markdown document under `docs/`.
- UI reference: the standalone design-prototype HTML document under `docs/`.
- If code, prototype, and specification conflict, record the decision in an ADR before changing behavior.
- Read only task-relevant sections; do not duplicate the specification in comments or new documents.

## Product invariants

- Android is primary; Windows is required. UX may differ, domain behavior must not.
- Local-first: text, audio, search, and installed-model inference work without an account or server.
- ASR and optional AI inference are local. No hidden network fallback.
- A note has zero or one project, global/project tags, and exactly `in_work` or `done` status.
- Audio remains after transcription until explicit deletion. Inline images reference managed media assets.
- Project and tags are optional during quick capture. Autosave and crash recovery are mandatory.
- App data and backups are intentionally unencrypted. Do not add misleading PIN/biometric "protection". Future sync still requires TLS and secure password hashing.

## Architecture

- Keep `Domain` and `Application` independent of UI, SQLite, filesystem, OS APIs, and inference runtimes.
- Access persistence, files, recorder, ASR, editor host, notifications, and sync only through adapters.
- UI sends commands/queries and renders immutable state; no SQL, file I/O, or business rules in views/code-behind.
- Canonical rich text is a versioned JSON AST. HTML and plain text are projections.
- Store large media as files with DB metadata/lifecycle; never SQLite BLOBs or base64 document content.
- Use stable UUID/ULID IDs, UTC, explicit format/schema versions, optimistic revisions, operation IDs, and tombstones.
- Never synchronize a live SQLite file.

## Integrity and concurrency

- Mutating use cases commit fully or leave the previous state intact.
- Keep DB transactions short; never await UI, network, inference, picker, recorder, or large file work inside them.
- Serialize writes through one coordinator and make retries idempotent with `OperationId`.
- For media/import/export/backup/restore use staging -> validate/hash -> atomic rename -> DB publish.
- Persist drafts during editing/lifecycle transitions and recover after process death.
- Never silently overwrite a newer revision or resolve sync conflicts only by timestamps.

## Security and privacy

- Treat imports, archives, document JSON, model packs, and native libraries as untrusted.
- Parameterize SQL; allowlist sorts/formats; enforce path, archive, size, and nesting limits.
- Never log note text, transcripts, media, project/tag names, credentials, or user paths.
- Verify model compatibility, license metadata, and SHA-256 before activation.
- Keep secrets/signing material out of Git. Pin dependencies; produce an SBOM for releases.

## Working method

1. Identify relevant requirement IDs and affected invariants.
2. Add/update an ADR before cross-cutting or irreversible decisions.
3. Implement the smallest vertical slice across domain, persistence, adapter, UI, and tests.
4. Preserve unrelated user changes; avoid unrequested broad cleanup.
5. Update the specification only for accepted behavior/decision changes.

## Quality gates

- Add domain tests and persistence/adapter integration tests with every behavior change.
- Test success, cancellation, retry, stale completion, process death, low storage, and partial I/O where relevant.
- Run targeted tests, then the full suite, static analysis, formatting, and available platform builds.
- Verify released-schema migrations and Android/Windows backup compatibility.
- Never claim checks not run; report exact commands, failures, and untested platform risks.
- Done includes acceptance criteria, accessibility, localization, privacy-safe diagnostics, and recovery behavior.

## Hygiene

- Keep generated artifacts, models, recordings, databases, backups, logs, and secrets out of Git.
- Prefer small cohesive files and explicit names. Comments explain constraints, not obvious code.
- Do not add a framework, dependency, permission, network call, or background service without documented need and license/security review.