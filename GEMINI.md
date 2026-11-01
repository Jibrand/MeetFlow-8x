# Workspace Agent Guidelines & Logging

## Agent Capture Requirement
- All user prompts and final model responses must be automatically captured in `.agent-logs/` matching the format: `YYYY-MM-DD_HH-MM-SS_<session-id>.md`.
- Capture is wired via `.agents/hooks.json` (`Stop` and `PostToolUse` lifecycle hooks) and backed by the active daemon `.agents/watcher.js` running against the IDE's transcript store at `C:\Users\Jibran\.gemini\antigravity\brain\`.
- Whenever a turn finishes or code changes are committed, ensure logs in `.agent-logs/` are staged and committed alongside code.
