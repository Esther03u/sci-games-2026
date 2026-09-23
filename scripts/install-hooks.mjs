// Point git at the repo's hooks (.githooks/pre-commit). Runs from the npm
// `prepare` script, so every `npm install` / `npm ci` sets it up. Outside a
// git checkout (Vercel builds, tarballs) there is nothing to do.
import { execSync } from 'node:child_process';

try {
  execSync('git rev-parse --is-inside-work-tree', { stdio: 'ignore' });
  execSync('git config core.hooksPath .githooks', { stdio: 'ignore' });
  console.log('git hooks: .githooks');
} catch {
  // not a git checkout, or git is missing — hooks are optional
}
