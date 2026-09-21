import fs from 'node:fs';
import path from 'node:path';

const isDry = process.argv.includes('--dry');
const targetArg = process.argv.find((arg) => !arg.startsWith('--') && arg !== process.argv[0] && arg !== process.argv[1]);
const rootDir = targetArg ? path.resolve(targetArg) : path.resolve('src');

const IGNORE_FILES = new Set([
  'handbook.js',
  'SportIcon.js',
  'ThemeToggle.js',
  'layout.js',
]);

const REPLACEMENTS = [
  // Overlays
  { from: /rgba\(\s*0\s*,\s*0\s*,\s*0\s*,\s*0?\.6\s*\)/gi, to: 'var(--overlay)' },
  { from: /rgba\(\s*0\s*,\s*0\s*,\s*0\s*,\s*0?\.55\s*\)/gi, to: 'var(--overlay)' },

  // Backgrounds with high alpha white
  { from: /rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.9[0-9]*\s*\)/gi, to: 'var(--glass-bg)' },
  { from: /rgba\(\s*228\s*,\s*228\s*,\s*231\s*,\s*0\.8[0-9]*\s*\)/gi, to: 'var(--glass-border)' },

  // Accent surfaces & borders
  { from: /#fef3c7/gi, to: 'var(--accent-surface)' },
  { from: /#fde68a/gi, to: 'var(--accent-border)' },

  // Specific text & brand colors
  { from: /#09090b/gi, to: 'var(--text)' },
  { from: /#18181b/gi, to: 'var(--text)' },
  { from: /#52525b/gi, to: 'var(--text-2)' },
  { from: /#71717a/gi, to: 'var(--text-3)' },
  { from: /#a1a1aa/gi, to: 'var(--text-muted)' },

  // Borders & Dividers
  { from: /#d4d4d8/gi, to: 'var(--border-strong)' },
  { from: /#e4e4e7/gi, to: 'var(--border)' },

  // Surfaces & Neutral BG
  { from: /#f4f4f5/gi, to: 'var(--surface-2)' },
  { from: /#f8fafc/gi, to: 'var(--surface-2)' },
  { from: /#fafafa/gi, to: 'var(--bg)' },

  // Gold / Accent Text
  { from: /#ca8a04/gi, to: 'var(--accent-text)' },
  { from: /#a16207/gi, to: 'var(--accent-text)' },
  { from: /#b45309/gi, to: 'var(--accent-text)' },
  { from: /#fbbf24/gi, to: 'var(--accent)' },

  // Semantic Status Text
  { from: /#b91c1c/gi, to: 'var(--danger-text)' },
  { from: /#dc2626/gi, to: 'var(--danger-text)' },
  { from: /#15803d/gi, to: 'var(--success-text)' },
  { from: /#16a34a/gi, to: 'var(--success-text)' },
  { from: /#1d4ed8/gi, to: 'var(--info-text)' },
];

function scanDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.next') {
        files.push(...scanDir(fullPath));
      }
    } else if (entry.isFile() && (entry.name.endsWith('.js') || entry.name.endsWith('.jsx'))) {
      if (!IGNORE_FILES.has(entry.name)) {
        files.push(fullPath);
      }
    }
  }

  return files;
}

const files = fs.statSync(rootDir).isDirectory() ? scanDir(rootDir) : [rootDir];
let totalReplacements = 0;
let modifiedFiles = 0;

console.log(`Starting theme codemod on ${files.length} file(s)... (Mode: ${isDry ? 'DRY-RUN' : 'WRITE'})`);

for (const file of files) {
  const original = fs.readFileSync(file, 'utf8');
  let content = original;
  let fileReplacements = 0;

  for (const rule of REPLACEMENTS) {
    const matches = content.match(rule.from);
    if (matches) {
      fileReplacements += matches.length;
      content = content.replace(rule.from, rule.to);
    }
  }

  if (fileReplacements > 0) {
    modifiedFiles++;
    totalReplacements += fileReplacements;
    console.log(`  [${fileReplacements} changes] ${path.relative(process.cwd(), file)}`);
    if (!isDry) {
      fs.writeFileSync(file, content, 'utf8');
    }
  }
}

console.log(`\nFinished! Modified: ${modifiedFiles} files, Total Replacements: ${totalReplacements}`);
