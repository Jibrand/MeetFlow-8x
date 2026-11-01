const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SCRIPT = path.join(__dirname, 'capture.js');
const BRAIN_DIR = path.join('C:', 'Users', 'Jibran', '.gemini', 'antigravity', 'brain');

console.log('Capture watcher started. Watching brain dir:', BRAIN_DIR);

function runCapture() {
  try {
    execSync(`node "${SCRIPT}"`, { stdio: 'ignore' });
  } catch (e) {
    // ignore errors
  }
}

// Initial capture run
runCapture();

// Watch the brain directory recursively if supported
try {
  fs.watch(BRAIN_DIR, { recursive: true }, (eventType, filename) => {
    if (filename && (filename.includes('transcript') || filename.endsWith('.jsonl'))) {
      runCapture();
    }
  });
} catch (err) {
  // Fallback to polling every 2 seconds
  setInterval(runCapture, 2000);
}
