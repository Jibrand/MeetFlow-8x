const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..');
const AGENT_LOGS_DIR = path.join(REPO_ROOT, '.agent-logs');
const BRAIN_DIR = path.join('C:', 'Users', 'Jibran', '.gemini', 'antigravity', 'brain');
const AUTHOR = 'Jibrand';
const TOOL_NAME = 'antigravity';
const PROJECT_NAME = path.basename(REPO_ROOT);
const DEFAULT_MODEL = 'gemini-3.8-flash';

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function cleanPrompt(content) {
  if (!content) return '';
  const match = content.match(/<USER_REQUEST>([\s\S]*?)<\/USER_REQUEST>/);
  if (match) {
    return match[1].replace(/^\r?\n/, '').replace(/\r?\n$/, '');
  }
  return content;
}

function processTranscript(transcriptPath, conversationId) {
  if (!fs.existsSync(transcriptPath)) return null;
  const rawData = fs.readFileSync(transcriptPath, 'utf8');
  const lines = rawData.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return null;

  const exchanges = [];
  let currentPrompt = null;
  let lastPlannerResponse = null;

  for (const line of lines) {
    try {
      const step = JSON.parse(line);

      if (step.source === 'USER_EXPLICIT' && step.type === 'USER_INPUT') {
        if (currentPrompt) {
          exchanges.push({
            prompt: currentPrompt,
            response: lastPlannerResponse
          });
          currentPrompt = null;
          lastPlannerResponse = null;
        }
        currentPrompt = {
          content: cleanPrompt(step.content),
          timestamp: step.created_at,
          model: DEFAULT_MODEL
        };
      } else if (step.source === 'MODEL' && step.type === 'PLANNER_RESPONSE') {
        // If this planner response has content and no tool calls, it's a candidate for final response
        if (step.content && (!step.tool_calls || step.tool_calls.length === 0)) {
          lastPlannerResponse = {
            content: step.content,
            timestamp: step.created_at,
            model: DEFAULT_MODEL
          };
        }
      }
    } catch (e) {
      // skip invalid json line
    }
  }

  if (currentPrompt) {
    exchanges.push({
      prompt: currentPrompt,
      response: lastPlannerResponse
    });
  }

  if (exchanges.length === 0) return null;

  const firstPromptTime = exchanges[0].prompt.timestamp;
  const lastPromptTime = exchanges[exchanges.length - 1].prompt.timestamp;
  const dateStr = firstPromptTime.split('T')[0];
  const shortSession = conversationId.substring(0, 8);

  // Format filename: YYYY-MM-DD_HH-MM-SS_<session-id>.md
  // Using firstPromptTime: e.g. 2026-11-01T16:58:00Z -> 2026-11-01_16-58-00_<convId>.md
  const timePart = firstPromptTime.replace(/T/, '_').replace(/:/g, '-').replace(/\..+/, '').replace(/Z/, '');
  const fileName = `${timePart}_${conversationId}.md`;
  const filePath = path.join(AGENT_LOGS_DIR, fileName);

  ensureDir(AGENT_LOGS_DIR);

  let md = '';
  md += `---\n`;
  md += `session_id: ${conversationId}\n`;
  md += `date: ${dateStr}\n`;
  md += `author: ${AUTHOR}\n`;
  md += `model: ${DEFAULT_MODEL}\n`;
  md += `tool: ${TOOL_NAME}\n`;
  md += `project: ${PROJECT_NAME}\n`;
  md += `total_exchanges: ${exchanges.length}\n`;
  md += `first_prompt_time: ${firstPromptTime}\n`;
  md += `last_prompt_time: ${lastPromptTime}\n`;
  md += `---\n\n`;

  md += `# Session Log - ${dateStr}\n\n`;
  md += `Session: \`${shortSession}\` | Project: \`${PROJECT_NAME}\` | Author: \`${AUTHOR}\`\n\n`;
  md += `---\n\n`;

  exchanges.forEach((ex, idx) => {
    const num = idx + 1;
    md += `[LOG_ENTRY type=PROMPT num=${num} session=${shortSession}]\n`;
    md += `timestamp: ${ex.prompt.timestamp}\n`;
    md += `model: ${ex.prompt.model}\n\n`;
    md += `${ex.prompt.content}\n\n\n`;

    if (ex.response && ex.response.content) {
      md += `[LOG_ENTRY type=RESPONSE num=${num} session=${shortSession}]\n`;
      md += `timestamp: ${ex.response.timestamp}\n`;
      md += `model: ${ex.response.model}\n\n`;
      md += `${ex.response.content}\n\n\n`;
    }
  });

  fs.writeFileSync(filePath, md, 'utf8');
  return { filePath, exchangesCount: exchanges.length };
}

function findCurrentSession() {
  if (!fs.existsSync(BRAIN_DIR)) return null;
  const entries = fs.readdirSync(BRAIN_DIR);
  let best = null;
  let bestMtime = 0;

  for (const id of entries) {
    const fullJsonl = path.join(BRAIN_DIR, id, '.system_generated', 'logs', 'transcript_full.jsonl');
    const compactJsonl = path.join(BRAIN_DIR, id, '.system_generated', 'logs', 'transcript.jsonl');
    const target = fs.existsSync(fullJsonl) ? fullJsonl : (fs.existsSync(compactJsonl) ? compactJsonl : null);

    if (target) {
      try {
        const stat = fs.statSync(target);
        if (stat.mtimeMs > bestMtime) {
          bestMtime = stat.mtimeMs;
          best = { conversationId: id, transcriptPath: target };
        }
      } catch (e) {}
    }
  }
  return best;
}

function runStandalone() {
  const arg = process.argv[2];
  if (arg && arg !== '--hook' && fs.existsSync(arg)) {
    const convId = path.basename(path.resolve(arg, '..', '..', '..'));
    const result = processTranscript(arg, convId);
    console.log(JSON.stringify(result));
    return;
  }

  const session = findCurrentSession();
  if (session) {
    const result = processTranscript(session.transcriptPath, session.conversationId);
    console.log(JSON.stringify(result));
  } else {
    console.log(JSON.stringify({ error: 'No session found' }));
  }
}

const isHook = process.argv.includes('--hook');

if (isHook) {
  let input = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', chunk => {
    input += chunk;
  });
  process.stdin.on('end', () => {
    try {
      if (input.trim()) {
        const payload = JSON.parse(input);
        const convId = payload.conversationId;
        let transPath = payload.transcriptPath;
        if (transPath) {
          const fullPath = path.join(path.dirname(transPath), 'transcript_full.jsonl');
          if (fs.existsSync(fullPath)) transPath = fullPath;
        } else if (convId) {
          const fullPath = path.join(BRAIN_DIR, convId, '.system_generated', 'logs', 'transcript_full.jsonl');
          if (fs.existsSync(fullPath)) transPath = fullPath;
        }
        if (convId && transPath && fs.existsSync(transPath)) {
          processTranscript(transPath, convId);
        }
      } else {
        runStandalone();
      }
    } catch (e) {}
    process.stdout.write(JSON.stringify({}));
    process.exit(0);
  });
} else {
  runStandalone();
  process.exit(0);
}
