# Security and private data

The current research toolkit reads local fixtures and builds documents; it is not a hosted ingestion service. Do not run untrusted contribution scripts without review, upload private documents to a public example, or place API credentials in fixtures, output logs, screenshots, or generated archives.

Before a public service accepts private inputs, document source/context transfers, retention, access isolation, provider configuration, and deletion behavior. Treat instructions embedded in retrieved content as data, not execution authority. The method's evidence checks do not constitute a security guarantee.

Do not publish credential values or exploitation details in an issue. Use the repository's **Security → Advisories → Report a vulnerability** if the maintainer has enabled private vulnerability reporting. If that option is unavailable, ask the maintainer to establish a private channel without posting the sensitive details. No response-time commitment or currently monitored security mailbox is claimed.

The parent product repository needs its own release security review. This toolkit does not revoke previously exposed credentials or clean that repository's history.
