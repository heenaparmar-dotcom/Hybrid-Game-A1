// Publishes the production build to the `gh-pages` branch of this repository's `origin` remote (GitHub Pages).
// Usage: npm run deploy
// Needs: git, and push access to origin. In the repo settings, set Pages to "Deploy from a branch" > gh-pages > / (root).
import { execFileSync } from 'node:child_process';
import { cpSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const run = (cmd, args, cwd) => execFileSync(cmd, args, { cwd, stdio: 'inherit', shell: process.platform === 'win32' });
const read = (cmd, args) => execFileSync(cmd, args, { encoding: 'utf8', shell: process.platform === 'win32' }).trim();

const remote = read('git', ['remote', 'get-url', 'origin']);
console.log(`Building and publishing to ${remote} (branch gh-pages)`);
run('npm', ['run', 'build']);

const tmp = mkdtempSync(join(tmpdir(), 'rhythm-rush-pages-'));
try {
  cpSync('dist', tmp, { recursive: true });
  writeFileSync(join(tmp, '.nojekyll'), '');
  run('git', ['init', '-q', '-b', 'gh-pages'], tmp);
  run('git', ['add', '-A'], tmp);
  run('git', ['-c', 'user.name=deploy', '-c', 'user.email=deploy@example.invalid', 'commit', '-q', '-m', 'Deploy RHYTHM RUSH build'], tmp);
  run('git', ['remote', 'add', 'origin', remote], tmp);
  run('git', ['push', '-f', 'origin', 'gh-pages'], tmp);
  console.log('Done. If this is the first deploy, enable Pages: repo Settings > Pages > Deploy from a branch > gh-pages > / (root).');
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
