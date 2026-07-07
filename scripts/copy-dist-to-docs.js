import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');
const source = path.join(root, 'dist');
const target = path.join(root, 'docs');

if (!fs.existsSync(source)) {
  console.error('Error: dist directory not found. Run `npm run build` first.');
  process.exit(1);
}

if (fs.existsSync(target)) {
  fs.rmSync(target, { recursive: true, force: true });
}

fs.mkdirSync(target, { recursive: true });

function copyDir(src, dest) {
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      fs.mkdirSync(destPath, { recursive: true });
      copyDir(srcPath, destPath);
    } else if (entry.isFile()) {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

copyDir(source, target);
console.log('Copied dist/ to docs/ successfully.');
