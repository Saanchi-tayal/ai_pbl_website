import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isWin = process.platform === 'win32';
const npmCmd = isWin ? 'npm.cmd' : 'npm';

console.log('========================================================');
console.log('  Starting Patient Admission Management System (PAMS)   ');
console.log('========================================================\n');

// Start Server
console.log('[Server] Launching backend API on http://localhost:5000 ...');
const server = spawn(npmCmd, ['run', 'dev'], {
  cwd: path.join(__dirname, 'server'),
  stdio: 'inherit',
  shell: true
});

// Start Client
console.log('[Client] Launching frontend application on http://localhost:5173 ...');
const client = spawn(npmCmd, ['run', 'dev', '--', '--host'], {
  cwd: path.join(__dirname, 'client'),
  stdio: 'inherit',
  shell: true
});

function cleanup() {
  console.log('\nGracefully terminating PAMS services...');
  server.kill();
  client.kill();
  process.exit();
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
