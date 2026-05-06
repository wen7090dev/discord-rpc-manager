const { spawn } = require('child_process');
const path = require('path');

const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;

const electronPath = require('./node_modules/electron');
const proc = spawn(electronPath, ['.'], {
  stdio: 'inherit',
  env,
  cwd: __dirname
});

proc.on('close', (code) => process.exit(code ?? 0));
