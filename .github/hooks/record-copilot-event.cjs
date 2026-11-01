const fs = require('node:fs');
const path = require('node:path');

const logsDirectory = path.resolve(__dirname, '..', '..', '.agent-logs');
const fallbackSessionId = 'unknown-session';

function argumentValue(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : null;
}

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

function getNestedObject(event, ...keys) {
  for (const key of keys) {
    const value = event[key];
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return value;
    }
  }
  return {};
}

function getContent(event, ...keys) {
  const nested = getNestedObject(event, 'data', 'payload', 'context');
  return firstString(...keys.flatMap((key) => [event[key], nested[key]]));
}

function getAttachmentMetadata(event) {
  const nested = getNestedObject(event, 'data', 'payload', 'context');
  const attachments = event.attachments || event.attachment || nested.attachments || nested.attachment;
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
  const configuredEventName = argumentValue('--event');
  const eventName =
    configuredEventName ||
    firstString(event.hookEventName, event.hook_event_name, event.eventName, event.event, event.type) ||
    'hook_invoked';
  const nested = getNestedObject(event, 'data', 'payload', 'context');
  const sessionId =
    firstString(
      event.sessionId,
      event.session_id,
      event.conversationId,
      event.conversation_id,
      nested.sessionId,
      nested.session_id,
      nested.conversationId,
      nested.conversation_id
    ) ||
    fallbackSessionId;
  const prompt = getContent(event, 'prompt', 'userPrompt', 'user_prompt', 'message', 'content');
  const response = getContent(event, 'response', 'assistantResponse', 'assistant_response', 'message', 'content');
  const timestamp =
    firstString(event.timestamp, event.createdAt, event.created_at, nested.timestamp, nested.createdAt) ||
    new Date().toISOString();
  const isPromptEvent = eventName === 'userPromptSubmitted';
  const isStopEvent = eventName === 'agentStop';
  const content = isPromptEvent ? prompt : isStopEvent ? response : null;
  const record = {
    capturedAt: new Date().toISOString(),
    timestamp,
    sessionId,
    event: eventName,
    role: isPromptEvent ? 'user' : isStopEvent ? 'assistant' : 'event',
    content: content ? redact(content) : null,
    contentAvailable: Boolean(content),
    attachments: getAttachmentMetadata(event),
    responseCapture: isStopEvent
      ? response
        ? 'captured_from_hook_payload'
        : 'unavailable_via_supported_hook'
      : 'not_applicable',
    captureNote: content
      ? 'content_supplied_by_hook_payload'
      : isStopEvent
        ? 'assistant_transcript_not_supplied_by_supported_hook'
        : isPromptEvent
          ? 'prompt_not_supplied_by_hook_payload'
          : 'lifecycle_metadata_only',
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
