const fs = require('node:fs');
const path = require('node:path');

const logsDirectory = path.resolve(__dirname, '..', '..', '.agent-logs');
const fallbackSessionId = 'unknown-session';

function firstString(...values) {
  return values.find((value) => typeof value === 'string' && value.length > 0) || null;
}

function readEvent() {
  const input = fs.readFileSync(0, 'utf8').trim();
  if (!input) {
    return {};
  }

  const event = JSON.parse(input);
  if (!event || typeof event !== 'object' || Array.isArray(event)) {
    throw new Error('Copilot hook input must be a JSON object');
  }
  return event;
}

function redact(value) {
  if (typeof value !== 'string') {
    return value;
  }

  return value
    .replace(/\b(Bearer\s+)[A-Za-z0-9._~+/=-]+/gi, '$1[REDACTED]')
    .replace(/\b(api[_-]?key|token|secret|password)\b(\s*[:=]\s*)["']?[^"',\s]+["']?/gi, '$1$2[REDACTED]');
}

function getAttachmentMetadata(event) {
  const attachments = event.attachments || event.attachment;
  if (!Array.isArray(attachments)) {
    return undefined;
  }

  return attachments.map((attachment) => {
    if (typeof attachment === 'string') {
      return { name: attachment };
    }

    if (!attachment || typeof attachment !== 'object') {
      return { name: '[unavailable]' };
    }

    return {
      name: firstString(attachment.name, attachment.fileName, attachment.filename, attachment.title),
      type: firstString(attachment.type, attachment.mimeType),
      text: typeof attachment.text === 'string' ? redact(attachment.text) : undefined,
    };
  });
}

function main() {
  const event = readEvent();
  const eventName = firstString(event.hookEventName, event.hook_event_name, event.eventName, event.event) || 'unknown';
  const sessionId =
    firstString(event.sessionId, event.session_id, event.conversationId, event.conversation_id) ||
    fallbackSessionId;
  const prompt = firstString(event.prompt, event.userPrompt, event.user_prompt);
  const response = firstString(event.response, event.assistantResponse, event.assistant_response);
  const timestamp =
    firstString(event.timestamp, event.createdAt, event.created_at) || new Date().toISOString();
  const isPromptEvent = eventName === 'userPromptSubmitted';
  const isStopEvent = eventName === 'agentStop';
  const record = {
    capturedAt: new Date().toISOString(),
    timestamp,
    sessionId,
    event: eventName,
    role: isPromptEvent ? 'user' : isStopEvent ? 'assistant' : 'event',
    content: isPromptEvent ? (prompt ? redact(prompt) : null) : response ? redact(response) : null,
    attachments: getAttachmentMetadata(event),
    responseCapture: isStopEvent
      ? response
        ? 'captured_from_hook_payload'
        : 'unavailable_via_supported_hook'
      : 'not_applicable',
  };

  fs.mkdirSync(logsDirectory, { recursive: true });
  const logPath = path.join(logsDirectory, `copilot-${sessionId}.jsonl`);
  fs.appendFileSync(logPath, `${JSON.stringify(record)}\n`, 'utf8');
}

try {
  main();
} catch (error) {
  process.stderr.write(`Copilot logging hook failed: ${error.message}\n`);
}

process.stdout.write('{}');
