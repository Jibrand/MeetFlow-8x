# AI conversation logging

## Scope

The files in [`.agent-logs/`](../.agent-logs/) are the authoritative, committed
conversation records for this assignment. Existing Antigravity logs are
preserved and must not be rewritten or removed.

## GitHub Copilot in VS Code

The repository hook at [`.github/hooks/copilot-logging.json`](../.github/hooks/copilot-logging.json)
uses the supported Copilot `userPromptSubmitted` and `agentStop` events. Each
configured command passes its event name explicitly, so a missing or differently
shaped payload cannot produce `event: "unknown"`. It
records the event timestamp, session identifier, an explicit `role`, and
prompt/response content only when that content is present in the hook payload.
Attachment descriptors and attachment text are recorded only when the payload
actually includes them.

This hook does **not** claim to capture complete conversations. In the current
supported VS Code hook contract, `agentStop` does not provide the assistant's
final response transcript, so it records
`responseCapture: "unavailable_via_supported_hook"`, `contentAvailable: false`,
and an explicit `captureNote`. A null content field in such a record means the
platform did not provide the message; it is not a fabricated response.
Likewise, an attachment marker such as `#attachment:...` cannot be expanded
unless the hook payload itself contains the attachment text. Git hooks do not
receive Copilot chat messages and are not used for capture.

Hook availability depends on the VS Code Copilot session target, version, and
workspace trust. A missing or incomplete hook event is a capture gap, not a
reason to reconstruct the conversation.

## Required manual export workflow

Before ending each coding session:

1. In the VS Code Chat view, use the built-in **Export Chat** or **Save Chat**
   command when it is available for the active Copilot session.
2. Save the export to a temporary location without editing it.
3. Run:
   `pnpm copilot:import -- --source <export> --session-id <session-id> --timestamp <YYYY-MM-DD_HH-MM-SS>`
   The importer verifies that the export is non-empty and visibly contains
   both user and assistant roles, then copies the original bytes unchanged to
   `.agent-logs/`.
4. Review the copied export for credentials, tokens, private keys, and `.env`
   contents before staging. If redaction is necessary, keep the original
   outside the repository and document the redaction in the commit.
5. Commit the export incrementally with the related code changes.

If the installed VS Code build does not offer a chat export command, record that
as a capture gap and use the supported chat/session history export available in
that build. Do not use filesystem scraping of private VS Code state or claim
that an unverified transcript was captured.

## Verification

To verify the repository hook without a real conversation, pipe a non-sensitive
fixture to the recorder and inspect the resulting JSONL. A real Copilot
verification must start a new Copilot session, submit a harmless prompt, stop
the session, and confirm the corresponding session file exists. The assistant
response still requires the manual export workflow above. To verify the export
workflow, use a real exported session and confirm that the imported file
contains both the original user and assistant messages; never create a
transcript by reconstructing messages from hook metadata.

## Capture matrix

| Content | Automatic supported-hook capture | Full content |
| --- | --- | --- |
| User prompt text | When present in `userPromptSubmitted` payload | Yes, from the hook payload |
| Pasted attachment text | Only when included in the hook payload | Yes, from the original chat export |
| Assistant response | Only if an `agentStop` payload includes it; current payloads do not | Yes, from the original chat export |
| Timestamp and session ID | When present; timestamp falls back to capture time | Yes, from hook/export metadata |
| Message role | Hook records `user`/`assistant`/`event` | Export preserves the source roles |
