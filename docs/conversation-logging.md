# Codex conversation logging

Effective 2026-11-02 (Asia/Karachi). Codex replaces Antigravity for new sessions. Existing Antigravity artifacts are preserved; their completeness has not been audited.

## Current status

Logging is assistant-maintained under AGENTS.md. Automatic Codex capture has NOT been configured or verified. The existing `.agents/` scripts read Antigravity-specific transcripts and fields. They are retained as legacy artifacts, not repurposed as Codex hooks. GEMINI.md describes the old workflow; AGENTS.md governs Codex.

Official Codex hook documentation exists at https://developers.openai.com/codex/hooks (redirects to https://learn.chatgpt.com/docs/hooks). Hook availability and setup must be verified for the installed client before claiming automatic capture. Repository instructions alone cannot guarantee capture on interruptions, crashes, or future sessions that do not follow them. No Git hook captures chat content.

## Manual fallback

1. Create a new timestamped session file in `.agent-logs/`. Use the native chat identifier if exposed; otherwise explicitly label a generated logging-session UUID.
2. Copy exact user prompts and exact final responses from the visible chat. Label each role and record capture time with timezone. Do not manufacture original message times. Save the prepared final response before sending it.
3. If the client offers a supported conversation export, save and review that export for completeness. Do not assume the export exists. Do not read private application databases. Text copying is the fallback when no export is available.
4. Record unavailable prior turns, attachments, tool output, interrupted responses, or truncation in a capture-gap entry. Keep summaries separate from verbatim records.
5. Review new text for secrets before writing it; mark each redaction and its reason. Never copy credentials or `.env` content into Git.
6. Review the diff, stage only the new log and relevant changed files, commit incrementally, then push the reviewed commit when permitted. Record any blocker. Never use broad staging to include unrelated working changes.

## Known gaps

- Earlier Codex exchanges in this chat were not saved by this workflow. Their original timestamps are unavailable here. No retrospective transcript has been fabricated.
- The initial record begins with the user's instruction to log Codex going forward.
- Assistant-maintained files cover user prompts and final answers; they are not full runtime transcripts of tools, commentary, hidden reasoning, or attachments.
- Persistent automatic capture remains unverified. Future omissions must be reported, not silently treated as complete.
