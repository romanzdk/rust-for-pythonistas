const PLAYGROUND = 'https://play.rust-lang.org';
const main = document.getElementById('main');
const nav = document.getElementById('nav');

const store = {
  get(key, fallback) {
    try {
      const v = localStorage.getItem(key);
      return v === null ? fallback : JSON.parse(v);
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  },
  del(key) {
    try {
      localStorage.removeItem(key);
    } catch {}
  },
};

const REPO = 'https://github.com/romanzdk/rust-for-pythonistas';
const THEMES = [
  ['light', '☀', 'Light'],
  ['dark', '☾', 'Dark'],
  ['system', '◐', 'System'],
];
const currentTheme = () => document.documentElement.dataset.theme || 'system';
function setTheme(theme) {
  if (theme === 'system') delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = theme;
  try {
    if (theme === 'system') localStorage.removeItem('rfp-theme');
    else localStorage.setItem('rfp-theme', theme);
  } catch {}
  document.querySelectorAll('[data-set-theme]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.setTheme === theme)));
}
const themeSwitch = () =>
  `<div class="theme" role="group" aria-label="Color theme">${THEMES.map(
    ([t, icon, label]) => `<button type="button" data-set-theme="${t}" aria-pressed="${currentTheme() === t}" title="${label} theme">${icon}<span>${label}</span></button>`,
  ).join('')}</div>`;
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-set-theme]');
  if (b) setTheme(b.dataset.setTheme);
});

const EXERCISE_IDS = new Set(LESSONS.flatMap((l) => [l.id, ...(l.translate ? [`${l.id}/translate`] : [])]));
const solved = () => new Set(store.get('rfp-solved', []));
function markSolved(id) {
  store.set('rfp-solved', [...solved().add(id)]);
  renderNav();
}

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const normalize = (s) => s.split('\n').map((l) => l.trimEnd()).join('\n').trim();
const playLink = (src) => `${PLAYGROUND}/?version=stable&mode=debug&edition=2024&code=${encodeURIComponent(src)}`;

// Highlight the whole snippet (so multi-line strings/comments stay correct), then split it into
// lines, re-opening any <span> that was still open at a line break.
function highlightLines(src, lang) {
  const html = window.hljs ? hljs.highlight(src, { language: lang, ignoreIllegals: true }).value : esc(src);
  const lines = [];
  const open = [];
  let cur = '';
  for (const part of html.split(/(<span[^>]*>|<\/span>|\n)/)) {
    if (part === '\n') {
      lines.push(cur + '</span>'.repeat(open.length));
      cur = open.join('');
    } else if (part.startsWith('<span')) {
      open.push(part);
      cur += part;
    } else if (part === '</span>') {
      open.pop();
      cur += part;
    } else {
      cur += part;
    }
  }
  lines.push(cur + '</span>'.repeat(open.length));
  return lines;
}

function codeBlock(src, lang, side = '', marked = new Set()) {
  const lines = highlightLines(src, lang)
    .map((h, i) => {
      const n = i + 1;
      const m = marked.has(n);
      return `<div class="ln${m ? ' marked' : ''}" data-n="${n}"${m ? ' tabindex="0"' : ''}><span class="num">${n}</span><code>${h || ' '}</code></div>`;
    })
    .join('');
  return `<pre class="code" data-side="${side}"><div class="lines">${lines}</div></pre>`;
}

const inlineCode = (src, lang) => `<code class="inline">${window.hljs ? hljs.highlight(src, { language: lang, ignoreIllegals: true }).value : esc(src)}</code>`;

// Lessons are grouped into parts; a lesson with `part` starts a new group.
function parts() {
  const groups = [];
  LESSONS.forEach((l, i) => {
    if (l.part || !groups.length) groups.push({ title: l.part || '', items: [] });
    groups.at(-1).items.push([l, i]);
  });
  return groups;
}

function renderNav() {
  const current = location.hash.replace(/^#\/?/, '');
  const done = solved();
  nav.innerHTML =
    `<a class="brand" href="#/">Rust <span>for</span> Pythonistas</a>` +
    `<p class="progress">${[...done].filter((id) => EXERCISE_IDS.has(id)).length} / ${EXERCISE_IDS.size} exercises solved</p>` +
    `<a class="phrase-link" href="#/phrasebook"${current === 'phrasebook' ? ' aria-current="page"' : ''}>📖 Phrasebook</a>` +
    parts()
      .map(
        (p) =>
          `<p class="part">${esc(p.title)}</p><ol start="${p.items[0][1] + 1}">` +
          p.items
            .map(
              ([l]) =>
                `<li><a href="#/${l.id}"${l.id === current ? ' aria-current="page"' : ''}>${esc(l.title)}${done.has(l.id) ? ' <span class="check" title="Exercise solved">✓</span>' : ''}</a></li>`,
            )
            .join('') +
          '</ol>',
      )
      .join('') +
    `<div class="nav-foot">${themeSwitch()}
      <p class="links"><a href="${REPO}" target="_blank" rel="noopener">GitHub ↗</a> · <a href="https://romanzdk.com" target="_blank" rel="noopener">romanzdk.com ↗</a></p></div>`;
}

function renderHome() {
  document.title = 'Rust for Pythonistas';
  const done = solved();
  const next = LESSONS.find((l) => !done.has(l.id)) || LESSONS[0];
  const label = done.size ? `Continue: ${esc(next.title)}` : 'Start lesson 1';
  main.innerHTML = `
    <section class="hero">
      <p class="eyebrow">A course for people who already know Python</p>
      <h1>Learn to read Rust using the Python you already know</h1>
      <p class="lead">Every idea is shown twice, as Python you would write and as the Rust that does the same thing, side by side.
      The goal is modest on purpose: read Rust code and make small, safe changes to it. You won't write large programs here.</p>
      <p><a class="button primary" href="#/${next.id}">${label} →</a><a class="button" href="#/phrasebook">📖 Phrasebook</a><a class="button" href="${REPO}" target="_blank" rel="noopener">★ Star on GitHub</a></p>
      <p class="why">I made this course to learn Rust myself. I learn best by analogy: seeing something I already know next to
      the new thing. So every idea starts in Python and then shows the Rust. If you learn the same way, I hope it helps you too.
      <span>— <a href="https://romanzdk.com" target="_blank" rel="noopener">Roman</a></span></p>
    </section>
    <section class="how">
      <div><b>1 · Side by side</b><p>Python next to Rust. Hover a marked Rust line to see the matching Python line and a short note. Then: where the Python analogy breaks.</p></div>
      <div><b>2 · Read it</b><p>Short questions: what does this print, does it compile, what type is this? No running, just reading.</p></div>
      <div><b>3 · Change it</b><p>A small edit to real Rust code. Press Run and it compiles on the official Rust Playground.</p></div>
      <div><b>4 · Translate it</b><p>A short Python program. Write the Rust that prints the same thing.</p></div>
      <div><b>5 · Cheat card</b><p>Python on the left, Rust on the right. The <a href="#/phrasebook">phrasebook</a> puts every card in one searchable page.</p></div>
    </section>
    <h2>Lessons</h2>
    ${parts()
      .map(
        (p) =>
          `<h3 class="part">${esc(p.title)}</h3><ol class="cards">${p.items
            .map(
              ([l, i]) =>
                `<li><a href="#/${l.id}"><span class="num">${i + 1}</span><b>${esc(l.title)}${done.has(l.id) ? ' <span class="check">✓</span>' : ''}</b><span>${esc(l.summary)}</span></a></li>`,
            )
            .join('')}</ol>`,
      )
      .join('')}
    ${done.size ? '<p class="muted"><button class="link" id="reset-progress">Reset my progress</button></p>' : ''}`;
  const reset = document.getElementById('reset-progress');
  if (reset)
    reset.onclick = () => {
      store.del('rfp-solved');
      EXERCISE_IDS.forEach((id) => store.del(`rfp-draft-${id}`));
      route();
    };
}

function exampleHTML(ex) {
  const links = (ex.links || []).map(([rs, py, note]) => ({ rs, py: py == null ? [] : [].concat(py), note }));
  const rsMarked = new Set(links.map((l) => l.rs));
  const pyMarked = new Set(links.flatMap((l) => l.py));
  const rsLang = ex.rsLang || 'rust';
  const play = rsLang === 'rust' && !ex.files && !ex.run ? `<a class="play" href="${playLink(ex.rs)}" target="_blank" rel="noopener">Open in Playground ↗</a>` : '';
  return {
    links,
    html: `
    <section class="example">
      <h3>${esc(ex.title)}</h3>
      ${ex.text ? `<div class="prose">${ex.text}</div>` : ''}
      <div class="pair">
        <figure class="panel"><figcaption>${esc(ex.pyLabel || 'Python')}</figcaption>${codeBlock(ex.py, ex.pyLang || 'python', 'py', pyMarked)}</figure>
        <figure class="panel"><figcaption>${esc(ex.rsLabel || 'Rust')} ${ex.rsError ? '<span class="badge bad">does not compile</span>' : ''}${play}</figcaption>
          ${codeBlock(ex.rs, rsLang, 'rs', rsMarked)}</figure>
      </div>
      ${links.length ? '<div class="note" aria-live="polite"><p class="muted">Hover over or tap a <span class="marker">marked</span> line to see what it means.</p></div>' : ''}
      ${ex.run ? runHTML(ex) : ex.out ? `<div class="output"><span>${ex.rsError ? 'Python prints' : ex.pyError ? 'Rust prints' : 'Both print'}</span><pre>${esc(ex.out)}</pre></div>` : ''}
      ${ex.pyError ? `<div class="output bad"><span>Python crashes at run time with</span><pre>${esc(ex.pyError)}</pre></div>` : ''}
      ${ex.rsError ? `<div class="output bad"><span>Rust compiler says</span><pre>${esc(ex.rsError)}</pre></div>` : ''}
      ${fixHTML(ex)}
    </section>`,
  };
}

// A terminal session: show the input files, the two commands, then what both programs print.
function runHTML(ex) {
  const r = ex.run;
  const q = (a) => (/^[\w./-]+$/.test(a) ? a : `'${a}'`);
  const env = Object.entries(r.env || {}).map(([k, v]) => `${k}=${q(v)} `).join('');
  const args = (r.args || []).map(q).join(' ');
  const stdin = r.stdin ? ` < ${r.stdin}` : '';
  const files = Object.entries(r.files || {}).map(([name, text]) => `<span class="prompt">$ cat ${esc(name)}</span>\n${esc(text.replace(/\n$/, ''))}\n`).join('');
  const lines = [`python main.py ${args}`.trim(), `cargo run -- ${args}`.trim().replace(/ --$/, '')].map((c) => `$ ${env}${c}${stdin}`);
  const width = Math.max(...lines.map((l) => l.length));
  const cmd = (i, who) => `<span class="prompt">${esc(lines[i].padEnd(width))}</span>   <span class="who"># ${who}</span>\n`;
  const out = (ex.out ? esc(ex.out) + '\n' : '') + (r.stderr ? `<span class="err">${esc(r.stderr)}</span>   <span class="who"># to stderr</span>\n` : '');
  const code = r.exitCode ? `<span class="prompt">$ echo $?</span>\n${r.exitCode}\n` : '';
  return `<div class="output terminal"><span>Run it: both print the same</span><pre>${files}${cmd(0, 'Python')}${cmd(1, 'Rust')}${out}${code}</pre></div>`;
}

function fixHTML(ex) {
  const fixOut = ex.fixOut ?? ex.out;
  const fixes = [
    ex.pyFix && { label: 'Python, fixed', src: ex.pyFix, lang: 'python', out: ex.pyFixOut ?? fixOut },
    ex.rsFix && { label: 'Rust, fixed', src: ex.rsFix, lang: 'rust', out: fixOut },
  ].filter(Boolean);
  if (!fixes.length) return '';
  return `<details class="fix"><summary>Show the fixed version</summary>
    ${ex.fixNote ? `<p>${ex.fixNote}</p>` : ''}
    <div class="pair">${fixes
      .map(
        (f) => `<figure class="panel"><figcaption>${f.label}${
          f.lang === 'rust' ? `<a class="play" href="${playLink(f.src)}" target="_blank" rel="noopener">Open in Playground ↗</a>` : ''
        }</figcaption>${codeBlock(f.src, f.lang)}${f.out ? `<div class="output fix-out"><span>Prints</span><pre>${esc(f.out)}</pre></div>` : ''}</figure>`,
      )
      .join('')}</div></details>`;
}

function wireExample(sec, links) {
  if (!links.length) return;
  const note = sec.querySelector('.note');
  const find = (side, nums) => nums.map((n) => sec.querySelector(`.code[data-side="${side}"] .ln[data-n="${n}"]`)).filter(Boolean);
  const show = (e) => {
    const ln = e.target.closest('.ln.marked');
    if (!ln) return;
    const side = ln.closest('.code').dataset.side;
    const n = Number(ln.dataset.n);
    const hits = links.filter((l) => (side === 'rs' ? l.rs === n : l.py.includes(n)));
    sec.querySelectorAll('.ln.lit').forEach((el) => el.classList.remove('lit'));
    hits.forEach((l) => [...find('rs', [l.rs]), ...find('py', l.py)].forEach((el) => el.classList.add('lit')));
    note.innerHTML = hits.map((l) => `<p><b>Rust line ${l.rs}${l.py.length ? ` ↔ Python line ${l.py.join(', ')}` : ''}:</b> ${l.note}</p>`).join('');
  };
  sec.addEventListener('mouseover', show);
  sec.addEventListener('focusin', show);
  sec.addEventListener('click', show);
}

function quizHTML(q, k) {
  const options = q.type === 'compiles' ? ['Yes, it compiles', 'No, it does not compile'] : q.options;
  const answer = q.type === 'compiles' ? (q.answer ? 0 : 1) : q.answer;
  const opt = (o) => (q.type === 'output' ? `<pre>${esc(o)}</pre>` : o);
  return `
    <div class="quiz" data-answer="${answer}">
      <p class="q"><span class="qn">Q${k + 1}.</span> ${q.q}</p>
      ${q.code ? codeBlock(q.code, q.lang || 'rust') : ''}
      <div class="options">${options.map((o, j) => `<button data-j="${j}">${opt(o)}</button>`).join('')}</div>
      <div class="explain" hidden>${q.explain}</div>
    </div>`;
}

function wireQuiz(el) {
  const answer = Number(el.dataset.answer);
  el.querySelectorAll('.options button').forEach((b) => {
    b.onclick = () => {
      const right = Number(b.dataset.j) === answer;
      el.querySelectorAll('.options button').forEach((o) => {
        o.disabled = true;
        if (Number(o.dataset.j) === answer) o.classList.add('right');
      });
      if (!right) b.classList.add('wrong');
      const ex = el.querySelector('.explain');
      ex.hidden = false;
      ex.insertAdjacentHTML('afterbegin', `<b>${right ? 'Correct!' : 'Not quite.'}</b> `);
    };
  });
}

async function runRust(src, test = false) {
  const res = await fetch(`${PLAYGROUND}/execute`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ channel: 'stable', mode: 'debug', edition: '2024', crateType: test ? 'lib' : 'bin', tests: test, backtrace: false, code: src }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

const cleanStderr = (s) =>
  s
    .split('\n')
    .filter((l) => !/^\s*(Compiling|Finished|Running) /.test(l))
    .join('\n')
    .trim();

function exerciseHTML(ex, intro = '') {
  return `<div class="exercise">
        <div class="prose">${ex.task}</div>
        ${intro}
        ${ex.test
          ? '<p class="muted">This code has no <code>main</code>. <b>Run</b> runs its tests (<code>cargo test</code>). The goal is for all of them to pass.</p>'
          : `<div class="output"><span>Expected output</span><pre>${esc(ex.expected)}</pre></div>`}
        <div class="editor-wrap"><textarea spellcheck="false" aria-label="Rust code editor"></textarea></div>
        <div class="actions">
          <button class="primary run" title="Ctrl/Cmd + Enter">▶ Run</button>
          <button class="reset">Reset</button>
          ${ex.hint ? '<button class="show-hint">Hint</button>' : ''}
          <button class="show-solution">Show solution</button>
        </div>
        ${ex.hint ? `<p class="hint" hidden>💡 ${ex.hint}</p>` : ''}
        <div class="result" aria-live="polite"></div>
      </div>`;
}

function wireExercise(box, ex, lesson, id) {
  const key = `rfp-draft-${id}`;
  const $ = (sel) => box.querySelector(sel);
  const ta = $('textarea');
  ta.value = store.get(key, ex.starter);
  const btn = $('.run');
  const run = () => btn.click();
  const ed = window.CodeMirror
    ? CodeMirror.fromTextArea(ta, {
        mode: 'rust',
        lineNumbers: true,
        indentUnit: 4,
        viewportMargin: Infinity,
        extraKeys: { 'Ctrl-Enter': run, 'Cmd-Enter': run, Tab: (cm) => cm.replaceSelection('    ') },
      })
    : { getValue: () => ta.value, setValue: (v) => (ta.value = v), on: (_, f) => ta.addEventListener('input', f) };
  ed.on('change', () => store.set(key, ed.getValue()));

  const result = $('.result');
  btn.onclick = async () => {
    btn.disabled = true;
    result.className = 'result';
    result.innerHTML = '<p class="muted">Compiling on the Rust Playground… (usually a few seconds)</p>';
    const src = ed.getValue();
    try {
      const r = await runRust(src, !!ex.test);
      const out = normalize(r.stdout);
      const err = cleanStderr(r.stderr);
      if (ex.test && r.success) {
        result.className = 'result ok';
        result.innerHTML = `<p><b>✅ Solved!</b> All tests pass. ${nextLink(lesson)}</p><pre>${esc(out)}</pre>`;
        markSolved(id);
      } else if (ex.test && out.includes('test result: FAILED')) {
        result.className = 'result warn';
        result.innerHTML = `<p><b>It compiles, but a test fails.</b> Read the <code>left</code> / <code>right</code> lines: they show what the code gave and what the test expected.</p><pre>${esc(out)}</pre>`;
      } else if (!ex.test && r.success && out === normalize(ex.expected)) {
        result.className = 'result ok';
        result.innerHTML = `<p><b>✅ Solved!</b> The output matches. ${nextLink(lesson)}</p><pre>${esc(out)}</pre>`;
        markSolved(id);
      } else if (!ex.test && r.success) {
        result.className = 'result warn';
        result.innerHTML = `<p><b>It compiles and runs, but the output is different.</b></p>
          <div class="cmp"><div><span>Your output</span><pre>${esc(out) || '(nothing)'}</pre></div>
          <div><span>Expected</span><pre>${esc(normalize(ex.expected))}</pre></div></div>`;
      } else {
        result.className = 'result bad';
        result.innerHTML = `<p><b>It didn't compile, or it crashed.</b> Read the first error from the top. It usually names the line and often suggests the fix.</p>
          ${out ? `<pre>${esc(out)}</pre>` : ''}<pre class="stderr">${esc(err)}</pre>`;
      }
    } catch (e) {
      result.className = 'result bad';
      result.innerHTML = `<p><b>Couldn't reach the Rust Playground</b> (${esc(e.message)}). Check your connection, or
        <a href="${playLink(src)}" target="_blank" rel="noopener">open this code in the Playground ↗</a> and compare the output yourself.</p>`;
    } finally {
      btn.disabled = false;
    }
  };
  $('.reset').onclick = () => {
    ed.setValue(ex.starter);
    result.innerHTML = '';
  };
  $('.show-solution').onclick = () => {
    if (confirm('Replace your code with the solution?')) ed.setValue(ex.solution);
  };
  const hint = $('.show-hint');
  if (hint) hint.onclick = () => ($('.hint').hidden = false);
}

function nextLink(lesson) {
  const i = LESSONS.indexOf(lesson);
  const n = LESSONS[i + 1];
  return n ? `<a href="#/${n.id}">Next lesson: ${esc(n.title)} →</a>` : '<a href="#/">Back to all lessons</a>';
}

function renderLesson(i) {
  const l = LESSONS[i];
  document.title = `${l.title} · Rust for Pythonistas`;
  const examples = l.examples.map(exampleHTML);
  const prev = LESSONS[i - 1];
  const next = LESSONS[i + 1];
  main.innerHTML = `
    <article class="lesson">
      <p class="eyebrow">Lesson ${i + 1} of ${LESSONS.length}</p>
      <h1>${esc(l.title)}</h1>
      <div class="prose intro">${l.intro}</div>

      <h2><span class="step">1</span> Side by side</h2>
      ${examples.map((e) => e.html).join('')}
      <aside class="breaks"><h3>Where the Python analogy breaks</h3><ul>${l.breaks.map((b) => `<li>${b}</li>`).join('')}</ul></aside>

      <h2><span class="step">2</span> Read it</h2>
      <p class="muted">Answer by reading the code. Don't run it.</p>
      ${l.quiz.map(quizHTML).join('')}

      <h2><span class="step">3</span> Change it</h2>
      <div id="change">${exerciseHTML(l.exercise)}</div>
${l.translate ? `
      <h2><span class="step">4</span> Translate it</h2>
      <div id="translate">${exerciseHTML(
        { task: '<p>Here is a short Python program. Write the Rust version: it should print exactly the same thing.</p>', ...l.translate },
        `<figure class="panel"><figcaption>Python</figcaption>${codeBlock(l.translate.py, 'python')}</figure>`,
      )}</div>` : ''}
      <h2><span class="step">${l.translate ? 5 : 4}</span> Cheat card</h2>
      ${cheatTable(l.cheat)}

      <nav class="pager">
        ${prev ? `<a href="#/${prev.id}">← ${esc(prev.title)}</a>` : '<a href="#/">← All lessons</a>'}
        ${next ? `<a href="#/${next.id}">${esc(next.title)} →</a>` : '<a href="#/">All lessons →</a>'}
      </nav>
    </article>`;
  main.querySelectorAll('.example').forEach((sec, k) => wireExample(sec, examples[k].links));
  main.querySelectorAll('.quiz').forEach(wireQuiz);
  wireExercise(document.querySelector('#change .exercise'), l.exercise, l, l.id);
  if (l.translate) wireExercise(document.querySelector('#translate .exercise'), l.translate, l, `${l.id}/translate`);
}

const cheatTable = (rows, lesson = false) =>
  `<div class="table-wrap"><table class="cheat${lesson ? ' phrases' : ''}"><thead><tr><th>Python</th><th>Rust</th>${lesson ? '<th>Lesson</th>' : ''}</tr></thead><tbody>
    ${rows.map(([py, rs, l, i]) => `<tr data-text="${esc(`${py}\n${rs}`.toLowerCase())}"><td>${inlineCode(py, 'python')}</td><td>${inlineCode(rs, 'rust')}</td>${
      lesson ? `<td><a href="#/${l.id}">${i + 1}. ${esc(l.title)}</a></td>` : ''}</tr>`).join('')}
  </tbody></table></div>`;

function renderPhrasebook() {
  document.title = 'Phrasebook · Rust for Pythonistas';
  const rows = LESSONS.flatMap((l, i) => l.cheat.map(([py, rs]) => [py, rs, l, i]));
  main.innerHTML = `
    <article class="lesson">
      <p class="eyebrow">Every cheat card in one place</p>
      <h1>Python → Rust phrasebook</h1>
      <p class="lead">Search for the Python you know, like <code>append</code>, <code>range</code> or <code>except</code>, to find the
      Rust that does the same thing and the lesson that explains it.</p>
      <p><input id="phrase-search" type="search" placeholder="Search Python or Rust…" aria-label="Search the phrasebook" autocomplete="off"></p>
      <p class="muted" id="phrase-count"></p>
      ${cheatTable(rows, true)}
    </article>`;
  const input = document.getElementById('phrase-search');
  const count = document.getElementById('phrase-count');
  const filter = () => {
    const words = input.value.toLowerCase().split(/\s+/).filter(Boolean);
    let shown = 0;
    main.querySelectorAll('tbody tr').forEach((tr) => {
      const hit = words.every((w) => tr.dataset.text.includes(w));
      tr.hidden = !hit;
      shown += hit;
    });
    count.textContent = `${shown} of ${rows.length} rows`;
  };
  input.addEventListener('input', filter);
  filter();
  input.focus();
}

function route() {
  const id = location.hash.replace(/^#\/?/, '');
  const i = LESSONS.findIndex((l) => l.id === id);
  if (id === 'phrasebook') renderPhrasebook();
  else if (i < 0) renderHome();
  else renderLesson(i);
  renderNav();
  document.body.classList.remove('nav-open');
  window.scrollTo(0, 0);
}

document.querySelector('.topbar .theme-slot').innerHTML = themeSwitch();
document.getElementById('menu').onclick = () => document.body.classList.toggle('nav-open');
window.addEventListener('hashchange', route);
route();
