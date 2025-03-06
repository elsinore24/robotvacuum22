import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getFiles(dir, files = []) {
  fs.readdirSync(dir).forEach(file => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getFiles(filePath, files);
    } else {
      files.push(filePath);
    }
  });
  return files;
}

const files = getFiles(process.cwd());

const sizes = files.map(file => {
  const stats = fs.statSync(file);
  return { file, size: stats.size };
});

sizes.sort((a, b) => b.size - a.size);

const top5 = sizes.slice(0, 5);

console.log('Top 5 Largest Files:');
top5.forEach(item => {
  console.log(`${item.file}: ${item.size} bytes`);
});
