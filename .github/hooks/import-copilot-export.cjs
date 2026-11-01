const fs = require('node:fs');
const path = require('node:path');

function getArgument(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : null;
}

function fail(message) {
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
}

const source = getArgument('--source');
const sessionId = getArgument('--session-id');
const outputDirectory = getArgument('--output-dir') || path.resolve(__dirname, '..', '..', '.agent-logs');
const timestamp = getArgument('--timestamp');

if (!source || !sessionId || !timestamp) {
  fail('Usage: node import-copilot-export.cjs --source <export> --session-id <id> --timestamp <YYYY-MM-DD_HH-MM-SS> [--output-dir <dir>]');
} else {
  const sourcePath = path.resolve(source);
  if (!fs.existsSync(sourcePath) || !fs.statSync(sourcePath).isFile()) {
    fail(`Chat export not found: ${sourcePath}`);
  } else {
    const content = fs.readFileSync(sourcePath);
    if (content.length === 0) {
      fail('Chat export is empty.');
    } else {
      const text = content.toString('utf8');
      if (!/\b(user|human)\b/i.test(text) || !/\b(assistant|copilot)\b/i.test(text)) {
        fail('Chat export does not visibly contain both user and assistant message roles.');
      } else {
        fs.mkdirSync(path.resolve(outputDirectory), { recursive: true });
        const destination = path.resolve(outputDirectory, `${timestamp}_${sessionId}${path.extname(sourcePath) || '.md'}`);
        if (fs.existsSync(destination)) {
          fail(`Refusing to overwrite existing chat export: ${destination}`);
        } else {
          fs.copyFileSync(sourcePath, destination);
          process.stdout.write(`${destination}\n`);
        }
      }
    }
  }
}
