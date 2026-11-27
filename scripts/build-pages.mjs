// Builds the deployed site: the static files as they are, plus one real page per lesson (/ownership/, ...) with its own
// title and description and the lesson text already in the HTML, so search engines can index every lesson.
// The app itself still runs on #/ routes; a lesson page just tells it which page to start on.
// Usage: node scripts/build-pages.mjs [out-dir]   (default: _site)
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const out = path.resolve(process.argv[2] || path.join(root, '_site'));
const SITE = 'https://romanzdk.github.io/rust-for-pythonistas/';
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

const ctx = vm.createContext({});
vm.runInContext('globalThis.window = globalThis;', ctx);
for (const [, src] of html.matchAll(/<script src="((?:lib|errors|lessons\/)[^"]*\.js)"/g)) vm.runInContext(fs.readFileSync(path.join(root, src), 'utf8'), ctx);
const { LESSONS, ERRORS } = ctx;

fs.rmSync(out, { recursive: true, force: true });
for (const f of ['index.html', 'app.js', 'lib.js', 'errors.js', 'style.css', '.nojekyll', 'lessons', 'docs/images']) {
  fs.cpSync(path.join(root, f), path.join(out, f), { recursive: true });
}

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const strip = (s) => String(s).replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
const pre = (label, src) => `<figure><figcaption>${esc(label)}</figcaption><pre><code>${esc(src)}</code></pre></figure>`;

// JSON for a <script> tag: "<" escaped so text in it can never close the tag.
const ldJson = (data) => `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;

function page({ slug, title, description, body, head = '' }) {
  const url = slug ? `${SITE}${slug}/` : SITE;
  const set = (s, re, value) => {
    if (!re.test(s)) throw new Error(`index.html: ${re} not found`);
    return s.replace(re, value);
  };
  let s = html;
  if (slug) s = set(s, /<meta charset="utf-8">/, '<meta charset="utf-8">\n  <base href="../">');
  s = set(s, /<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`);
  s = set(s, /<meta name="description" content="[^"]*">/, `<meta name="description" content="${esc(description)}">`);
  s = set(s, /<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${url}">`);
  s = set(s, /<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${esc(title)}">`);
  s = set(s, /<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${esc(description)}">`);
  s = set(s, /<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${url}">`);
  if (head) s = set(s, /<\/head>/, `${head}\n</head>`);
  if (slug) s = set(s, /<body>/, `<body data-page="${slug}">`);
  s = set(s, /<main id="main"><\/main>/, `<main id="main">${body}</main>`);
  const file = path.join(out, slug, 'index.html');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, s);
  return url;
}

const urls = [];
const lessonLinks = LESSONS.map((l, i) => `<li><a href="${l.id}/">${i + 1}. ${esc(l.title)}</a>: ${esc(l.summary)}</li>`).join('');
urls.push(
  page({
    slug: '',
    title: 'Rust for Pythonistas',
    description: 'Learn to read Rust and make small changes to it, using the Python you already know. Side-by-side examples, quizzes and runnable exercises.',
    body: `<h1>Learn to read Rust using the Python you already know</h1><ol>${lessonLinks}</ol>
      <p><a href="phrasebook/">Python → Rust phrasebook</a> · <a href="errors/">Rust compiler error index</a></p>`,
    head: ldJson({
      '@context': 'https://schema.org',
      '@type': 'Course',
      name: 'Rust for Pythonistas',
      description: 'Learn to read Rust and make small changes to it, using the Python you already know.',
      url: SITE,
      inLanguage: 'en',
      isAccessibleForFree: true,
      educationalLevel: 'Beginner',
      teaches: 'Reading and changing Rust code, for Python developers',
      provider: { '@type': 'Person', name: 'Roman Žydyk', url: 'https://romanzdk.com' },
      hasPart: LESSONS.map((l) => ({ '@type': 'LearningResource', name: strip(l.title), url: `${SITE}${l.id}/` })),
    }),
  }),
);

LESSONS.forEach((l, i) => {
  const body = [
    `<article class="lesson"><p class="eyebrow">Lesson ${i + 1} of ${LESSONS.length}</p><h1>${esc(l.title)}</h1>`,
    `<div class="prose intro">${l.intro}</div>`,
    ...l.examples.map(
      (ex) => `<section class="example"><h2>${esc(ex.title)}</h2>${ex.text || ''}
        ${pre(ex.pyLabel || 'Python', ex.py)}${pre(ex.rsLabel || 'Rust', ex.rs)}${ex.out ? pre('Output', ex.out) : ''}</section>`,
    ),
    `<h2>Where the Python analogy breaks</h2><ul>${l.breaks.map((b) => `<li>${b}</li>`).join('')}</ul>`,
    `<h2>Cheat card</h2><table><tr><th>Python</th><th>Rust</th></tr>${l.cheat.map(([py, rs]) => `<tr><td><code>${esc(py)}</code></td><td><code>${esc(rs)}</code></td></tr>`).join('')}</table>`,
    `<p>${LESSONS[i - 1] ? `<a href="${LESSONS[i - 1].id}/">← ${esc(LESSONS[i - 1].title)}</a>` : ''} ${LESSONS[i + 1] ? `<a href="${LESSONS[i + 1].id}/">${esc(LESSONS[i + 1].title)} →</a>` : ''}</p></article>`,
  ].join('\n');
  urls.push(page({ slug: l.id, title: `${l.title} · Rust for Pythonistas`, description: `${strip(l.summary)} A Rust lesson for Python developers.`, body }));
});

urls.push(
  page({
    slug: 'phrasebook',
    title: 'Python → Rust phrasebook · Rust for Pythonistas',
    description: 'Every Python construct next to the Rust that does the same thing, in one searchable table.',
    body: `<h1>Python → Rust phrasebook</h1><table><tr><th>Python</th><th>Rust</th><th>Lesson</th></tr>${LESSONS.flatMap((l) =>
      l.cheat.map(([py, rs]) => `<tr><td><code>${esc(py)}</code></td><td><code>${esc(rs)}</code></td><td><a href="${l.id}/">${esc(l.title)}</a></td></tr>`),
    ).join('')}</table>`,
  }),
  page({
    slug: 'errors',
    title: 'Rust compiler error index for Python developers · Rust for Pythonistas',
    description: 'Common rustc errors (E0382, E0502, E0308 and more) explained for Python developers, each with code that causes it and the fix.',
    body: `<h1>Error index</h1>${ERRORS.map(
      (e) => `<section><h2>error[${e.code}]: ${esc(e.message)}</h2><p>In Python: ${e.python}</p><p>${e.why}</p>${pre('Does not compile', e.rs)}${pre('Fixed', e.fix)}</section>`,
    ).join('')}`,
  }),
);

// GitHub Pages serves this for any missing URL, at any depth: absolute base, not indexed, the app shows the course start.
fs.writeFileSync(
  path.join(out, '404.html'),
  html
    .replace('<meta charset="utf-8">', '<meta charset="utf-8">\n  <base href="/rust-for-pythonistas/">\n  <meta name="robots" content="noindex">')
    .replace(/<title>[^<]*<\/title>/, '<title>Page not found · Rust for Pythonistas</title>')
    .replace(/\s*<link rel="canonical" href="[^"]*">/, ''),
);

fs.writeFileSync(path.join(out, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${u}</loc></url>`).join('\n')}
</urlset>
`);
console.log(`Built ${urls.length} pages into ${path.relative(root, out) || out}`);
