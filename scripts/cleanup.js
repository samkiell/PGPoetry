const fs = require('fs');
const path = require('path');

const targets = [
  'client',
  'admin',
  'css',
  'images',
  'server',
  'menu.py',
  'setup.js',
  'scripts/generate_previews.js',
  '.hintrc'
];

console.log('🧹 Starting cleanup of legacy v1 files...');

targets.forEach(target => {
  const fullPath = path.join(__dirname, '..', target);
  if (fs.existsSync(fullPath)) {
    try {
      const stats = fs.statSync(fullPath);
      if (stats.isDirectory()) {
        fs.rmSync(fullPath, { recursive: true, force: true });
        console.log(`✅ Deleted directory: ${target}`);
      } else {
        fs.rmSync(fullPath, { force: true });
        console.log(`✅ Deleted file: ${target}`);
      }
    } catch (error) {
      console.error(`❌ Failed to delete ${target}:`, error.message);
    }
  } else {
    console.log(`ℹ️ Already deleted or does not exist: ${target}`);
  }
});

console.log('🧹 Cleanup complete.');
