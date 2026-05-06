const { execSync } = require('child_process');

const PORT = 5173;
try {
  const out = execSync(`netstat -ano | findstr :${PORT}`, { encoding: 'utf8' });
  const pids = new Set(
    out.trim().split('\n')
      .map(l => l.trim().split(/\s+/).pop())
      .filter(p => p && /^\d+$/.test(p) && p !== '0')
  );
  for (const pid of pids) {
    try {
      execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
      console.log(`[kill-port] Killed PID ${pid} (was holding :${PORT})`);
    } catch (_) {}
  }
} catch (_) {
  // nothing on that port — fine
}
