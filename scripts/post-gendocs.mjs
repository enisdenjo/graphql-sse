/**
 * Turns the typedoc-plugin-markdown output in website/content/docs into pages
 * for the-guild-org/website, which renders the docs at the-guild.dev/graphql/sse:
 *
 * - links lose their `.md` suffix (`/docs/modules/client.md#response`
 *   becomes `/docs/modules/client#response`);
 * - each page gets frontmatter with a `title` taken from its first heading
 *   (which is removed, the site renders the title) and the module it belongs
 *   to, a `sidebarTitle`, and a `description` from its first paragraph;
 * - each folder gets a `meta.json` with its sidebar `title` and ordered `pages`.
 *
 * Run through `yarn gendocs`; .github/workflows/docs-regenerate.yaml does the
 * same on every push to master that touches src/.
 */
import fsp from 'fs/promises';
import path from 'path';

const docsDir = path.join('website', 'content', 'docs');
const PACKAGE = 'graphql-sse';

const ROOT_TITLE = 'API Reference';
const ROOT_DESCRIPTION = `Every module, function, class, interface and type exported by ${PACKAGE}, generated from the source.`;
/** Folders typedoc groups pages by, in sidebar order. */
const KIND_DIRS = ['modules', 'classes', 'interfaces'];
const MAX_DESCRIPTION = 160;

(async function main() {
  await processDir('');
})().catch((err) => {
  console.error(err);
  process.exit(1);
});

/**
 * @param {string} relDir directory relative to the docs root ('' for the root)
 */
async function processDir(relDir) {
  const dirPath = path.join(docsDir, relDir);
  const entries = await fsp.readdir(dirPath, { withFileTypes: true });
  const dirs = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort(
      (a, b) =>
        (KIND_DIRS.includes(a) ? KIND_DIRS.indexOf(a) : KIND_DIRS.length) -
        (KIND_DIRS.includes(b) ? KIND_DIRS.indexOf(b) : KIND_DIRS.length),
    );
  const files = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
    .map((entry) => entry.name)
    .sort();

  for (const dir of dirs) {
    await processDir(relDir ? `${relDir}/${dir}` : dir);
  }
  for (const file of files) {
    await processFile(relDir, file);
  }

  const meta = {
    title: relDir ? humanize(path.basename(relDir)) : ROOT_TITLE,
    pages: [
      ...(files.includes('index.md') ? ['index'] : []),
      ...dirs,
      ...files
        .filter((file) => file !== 'index.md')
        .map((file) => file.slice(0, -3)),
    ],
  };
  await fsp.writeFile(
    path.join(dirPath, 'meta.json'),
    JSON.stringify(meta, null, 2) + '\n',
  );
}

/**
 * @param {string} relDir
 * @param {string} file
 */
async function processFile(relDir, file) {
  const filePath = path.join(docsDir, relDir, file);
  let src = await fsp.readFile(filePath, 'utf8');

  // `](/docs/interfaces/client.Client.md)` -> `](/docs/interfaces/client.Client)`
  src = src.replace(/\]\(([^)\s]+?)\.md(#[^)]*)?\)/g, ']($1$2)');
  // `](/docs/index)` -> `](/docs)`
  src = src.replace(/\]\(([^)\s]*?)\/index(#[^)]*)?\)/g, ']($1$2)');

  const lines = src.split('\n');
  const headingIndex = lines.findIndex((line) => line.startsWith('# '));
  const heading =
    headingIndex === -1
      ? ''
      : unescape(lines[headingIndex]?.slice(2).trim() ?? '');
  if (headingIndex !== -1) {
    lines.splice(headingIndex, 1);
    // The `[client](/docs/modules/client).Client` breadcrumb under the heading.
    const next = lines.slice(headingIndex).findIndex((line) => line.trim());
    if (
      next !== -1 &&
      /^\[[^\]]+\]\(\/docs\/modules\/[^)]+\)\.\S+$/.test(
        lines[headingIndex + next] ?? '',
      )
    ) {
      lines.splice(headingIndex + next, 1);
    }
  }
  const body = lines.join('\n').replace(/^\n+/, '');

  const base = file.slice(0, -3);
  let title;
  let sidebarTitle;
  let description;
  if (!relDir && base === 'index') {
    title = ROOT_TITLE;
    sidebarTitle = 'Overview';
    description = ROOT_DESCRIPTION;
  } else if (relDir === 'modules') {
    // `use_express` -> `use/express`
    const module = base.replace(/_/g, '/');
    title = `Module: ${module}`;
    sidebarTitle = module;
    description = `Everything exported by ${PACKAGE}/${module}: functions, classes, interfaces and types.`;
  } else {
    // `use_express.RequestContext` -> module `use/express`, symbol `RequestContext`
    const dot = base.indexOf('.');
    const module = base.slice(0, dot).replace(/_/g, '/');
    const symbol = base.slice(dot + 1);
    // Several modules export a `RequestContext`; the module keeps titles
    // and descriptions distinct.
    title = `${heading.replace(/<.*>$/, '') || symbol} (${module})`;
    sidebarTitle = `${module}.${symbol}`;
    const paragraph = firstParagraph(body);
    description = paragraph
      ? truncate(`${symbol} (${PACKAGE}/${module}): ${paragraph}`)
      : `${symbol}, exported by ${PACKAGE}/${module}.`;
  }

  const frontmatter = [
    '---',
    `title: ${JSON.stringify(title)}`,
    ...(sidebarTitle !== title
      ? [`sidebarTitle: ${JSON.stringify(sidebarTitle)}`]
      : []),
    `description: ${JSON.stringify(description)}`,
    '---',
    '',
  ].join('\n');

  await fsp.writeFile(filePath, frontmatter + body);
}

/**
 * The first prose paragraph of a page, as a plain sentence for the meta
 * description; undefined when the page has none.
 *
 * @param {string} body
 */
function firstParagraph(body) {
  for (const line of body.split('\n')) {
    const text = line.trim();
    if (
      !text ||
      /^([#>|*\-`▸•]|Defined in|\d+\.)/.test(text) ||
      text.startsWith('[')
    ) {
      continue;
    }
    const plain = unescape(text)
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/[`*_]/g, '')
      .trim();
    if (plain.length < 20) {
      continue;
    }
    return plain;
  }
  return undefined;
}

/**
 * @param {string} text
 */
function truncate(text) {
  return text.length > MAX_DESCRIPTION
    ? text.slice(0, MAX_DESCRIPTION - 3).trimEnd() + '...'
    : text;
}

/**
 * Drops the markdown escapes typedoc-plugin-markdown adds (`\_`, `\<`, ...).
 *
 * @param {string} text
 */
function unescape(text) {
  return text.replace(/\\(.)/g, '$1');
}

/**
 * `modules` -> `Modules`
 *
 * @param {string} name
 */
function humanize(name) {
  return name
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
