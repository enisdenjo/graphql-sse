import path from 'path';
import fsp from 'fs/promises';

/**
 * Fixes links in markdown files by removing the `.md` extension.
 *
 * @param {string} dirPath
 */
async function fixLinksInDir(dirPath) {
  for (const file of await fsp.readdir(dirPath, { withFileTypes: true })) {
    const filePath = path.join(dirPath, file.name);
    if (file.isDirectory()) {
      // recursively fix links in files
      fixLinksInDir(filePath);
      continue;
    }
    if (!file.name.endsWith('.md')) {
      continue;
    }
    const contents = await fsp.readFile(filePath);
    const src = contents.toString();
    await fsp.writeFile(filePath, src.replaceAll('.md)', ')'));
  }
}

(async function main() {
  await fixLinksInDir(path.join('website', 'src'));
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
