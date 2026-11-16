// Checks every lesson: structure, Python and Rust outputs, quiz answers, exercise solutions, and the
// file/command examples (by running the real cargo/uv/pytest/maturin tools on them).
// Usage: node scripts/check.mjs [lesson-id ...]
// Needs rustc + cargo (stable, edition 2024), python3, uv, and network access for the file/command examples.
import { execFile } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script src="((?:lib|lessons\/)[^"]*\.js)"/g)].map((m) => m[1]);
const ctx = vm.createContext({});
vm.runInContext('globalThis.window = globalThis;', ctx);
for (const s of scripts) vm.runInContext(fs.readFileSync(path.join(root, s), 'utf8'), ctx, { filename: s });

const only = process.argv.slice(2);
const lessons = ctx.LESSONS.filter((l) => !only.length || only.includes(l.id));
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'rfp-'));
const normalize = (s) => s.split('\n').map((l) => l.trimEnd()).join('\n').trim();
let jobId = 0;

function exec(cmd, args, input, opts = {}) {
  return new Promise((resolve) => {
    const child = execFile(cmd, args, { timeout: 20000, maxBuffer: 1 << 24, ...opts }, (err, stdout, stderr) =>
      resolve({ ok: !err, code: err ? (typeof err.code === 'number' ? err.code : -1) : 0, stdout, stderr }),
    );
    // A program that exits without reading stdin closes the pipe first; that EPIPE is harmless.
    child.stdin.on('error', () => {});
    child.stdin.end(input);
  });
}

async function rust(src, test = false, args = [], input = '', opts = {}) {
  const id = jobId++;
  const file = path.join(tmp, `p${id}.rs`);
  const bin = path.join(tmp, `p${id}`);
  fs.writeFileSync(file, src);
  const c = await exec('rustc', ['--edition', '2024', '-A', 'warnings', ...(test ? ['--test'] : []), '-o', bin, file]);
  if (!c.ok) return { compiled: false, ok: false, stdout: '', stderr: c.stderr };
  return { compiled: true, ...(await exec(bin, args, input, opts)) };
}

// An example with `run` is a command-line program: both sides get the same arguments, files, stdin and environment.
async function runBoth(ex) {
  const r = ex.run;
  const dir = fs.mkdtempSync(path.join(tmp, 'run-'));
  for (const [name, content] of Object.entries(r.files || {})) fs.writeFileSync(path.join(dir, name), content);
  fs.writeFileSync(path.join(dir, 'main.py'), ex.py);
  const opts = { cwd: dir, env: { ...process.env, ...(r.env || {}) } };
  const input = r.stdin ? r.files[r.stdin] : '';
  const [py, rs] = await Promise.all([
    exec('python3', ['-I', path.join(dir, 'main.py'), ...(r.args || [])], input, opts),
    rust(ex.rs, false, r.args || [], input, opts),
  ]);
  return { py, rs };
}

const python = (src) => exec('python3', ['-I', '-'], src);
const run = (src, lang, test) => (lang === 'python' ? python(src) : rust(src, test));

async function pytest(src) {
  const file = path.join(tmp, `test_p${jobId++}.py`);
  fs.writeFileSync(file, src);
  return exec('uvx', ['--quiet', 'pytest', '-q', '-p', 'no:cacheprovider', file], '', { timeout: 300000 });
}

// Runs an example's hidden `check` script in an empty folder. $RS and $PY point to the shown Rust and Python text;
// split_files writes a "// path" / "# path" separated listing out as real files.
const PREAMBLE = String.raw`set -euo pipefail
split_files() { awk '/^(\/\/|#) [^ ]+\.[A-Za-z]+$/ { f = $2; d = f; if (sub(/\/[^\/]*$/, "", d)) system("mkdir -p " d); next } f { print > f }' "$1"; }
`;
async function shell(script, ex) {
  const dir = fs.mkdtempSync(path.join(tmp, 'sh-'));
  const work = path.join(dir, 'work');
  fs.mkdirSync(work);
  fs.writeFileSync(path.join(dir, 'shown.rs.txt'), ex.rs + '\n');
  fs.writeFileSync(path.join(dir, 'shown.py.txt'), ex.py + '\n');
  const env = { ...process.env, RS: path.join(dir, 'shown.rs.txt'), PY: path.join(dir, 'shown.py.txt') };
  return exec('bash', ['-c', PREAMBLE + script], '', { cwd: work, env, timeout: 900000 });
}

// Run up to N async checks at once; rustc is the slow part.
async function pool(tasks, n = os.cpus().length) {
  const queue = [...tasks];
  await Promise.all(Array.from({ length: n }, async () => {
    while (queue.length) await queue.shift()();
  }));
}

const lineCount = (s) => s.split('\n').length;
const errors = [];

for (const l of lessons) {
  const where = (s) => `[${l.id}] ${s}`;
  const fail = (s) => errors.push(where(s));
  const tasks = [];
  for (const f of ['id', 'title', 'summary', 'intro', 'examples', 'quiz', 'exercise', 'breaks', 'cheat']) if (!l[f]) fail(`missing "${f}"`);
  if (l.breaks && !(Array.isArray(l.breaks) && l.breaks.length && l.breaks.every((b) => typeof b === 'string' && b.trim()))) fail('breaks: must be a list of HTML strings');
  if (ctx.LESSONS.filter((x) => x.id === l.id).length > 1) fail('duplicate id');

  (l.examples || []).forEach((ex, i) => {
    const w = `example ${i + 1} "${ex.title}"`;
    if (!ex.title || !ex.py || !ex.rs) return fail(`${w}: needs title, py and rs`);
    for (const [rs, py, note] of ex.links || []) {
      if (!(rs >= 1 && rs <= lineCount(ex.rs))) fail(`${w}: link Rust line ${rs} is out of range`);
      for (const p of py == null ? [] : [].concat(py)) if (!(p >= 1 && p <= lineCount(ex.py))) fail(`${w}: link Python line ${p} is out of range`);
      if (!note) fail(`${w}: link on Rust line ${rs} has no note`);
    }
    if (ex.files) {
      if (ex.diagram) return; // a picture (like a folder tree), not code
      if (!ex.check) return fail(`${w}: a files example needs a "check" script (or diagram: true)`);
      tasks.push(async () => {
        const r = await shell(ex.check, ex);
        if (!r.ok) fail(`${w}: check script failed\n${r.stdout.slice(-3000)}${r.stderr.slice(-3000)}`);
      });
      return;
    }
    if (ex.test) {
      // Both sides are test files: pytest and `cargo test` must pass.
      tasks.push(async () => {
        const [p, r] = await Promise.all([pytest(ex.py), rust(ex.rs, true)]);
        if (!p.ok) fail(`${w}: pytest fails\n${p.stdout}${p.stderr}`);
        if (!r.ok) fail(`${w}: Rust tests fail\n${r.stdout}${r.stderr}`);
      });
      return;
    }
    if (ex.run) {
      tasks.push(async () => {
        const { py, rs } = await runBoth(ex);
        for (const [side, r] of [['Python', py], ['Rust', rs]]) {
          if (side === 'Rust' && !r.compiled) { fail(`${w}: Rust does not compile\n${r.stderr}`); continue; }
          if (r.code !== (ex.run.exitCode ?? 0)) fail(`${w}: ${side} exit code ${r.code}, expected ${ex.run.exitCode ?? 0}\n${r.stderr}`);
          if (normalize(r.stdout) !== normalize(ex.out ?? '')) fail(`${w}: ${side} printed\n${r.stdout}\nexpected\n${ex.out ?? ''}`);
          if (ex.run.stderr ? !r.stderr.includes(ex.run.stderr) : r.stderr.trim()) fail(`${w}: ${side} stderr was\n${r.stderr}\nexpected it to contain\n${ex.run.stderr ?? '(nothing)'}`);
        }
      });
      return;
    }
    if (ex.rsError && !ex.rsFix) fail(`${w}: an example that does not compile needs an rsFix`);
    if (ex.pyError && !ex.pyFix) fail(`${w}: an example where Python crashes needs a pyFix`);
    const fixOut = ex.fixOut ?? ex.out;
    if (ex.rsFix)
      tasks.push(async () => {
        const r = await rust(ex.rsFix);
        if (!r.ok) fail(`${w}: rsFix failed\n${r.stderr}`);
        else if (fixOut !== undefined && normalize(r.stdout) !== normalize(fixOut)) fail(`${w}: rsFix printed\n${r.stdout}\nexpected\n${fixOut}`);
      });
    if (ex.pyFix)
      tasks.push(async () => {
        const r = await python(ex.pyFix);
        const want = ex.pyFixOut ?? fixOut;
        if (!r.ok) fail(`${w}: pyFix failed\n${r.stderr}`);
        else if (want !== undefined && normalize(r.stdout) !== normalize(want)) fail(`${w}: pyFix printed\n${r.stdout}\nexpected\n${want}`);
      });
    tasks.push(async () => {
      const r = await python(ex.py);
      if (ex.pyError) {
        if (r.ok || !r.stderr.includes(ex.pyError)) fail(`${w}: Python should fail with "${ex.pyError}"\n${r.stderr}`);
      } else if (!r.ok) fail(`${w}: Python failed\n${r.stderr}`);
      else if (ex.out !== undefined && normalize(r.stdout) !== normalize(ex.out)) fail(`${w}: Python printed\n${r.stdout}\nexpected\n${ex.out}`);
    });
    tasks.push(async () => {
      const r = await rust(ex.rs);
      if (ex.rsError) {
        // rsError may be the full compiler output; its "error..." and "help:..." lines must appear in rustc's stderr.
        const key = ex.rsError.split('\n').filter((s) => /^(error|help)/.test(s));
        const missing = key.filter((s) => !r.stderr.includes(s));
        if (r.compiled || !key.length || missing.length) fail(`${w}: Rust should fail to compile with:\n${missing.join('\n') || ex.rsError}\n--- rustc said:\n${r.stderr}`);
      } else if (!r.ok) fail(`${w}: Rust failed\n${r.stderr}`);
      else if (ex.out !== undefined && normalize(r.stdout) !== normalize(ex.out)) fail(`${w}: Rust printed\n${r.stdout}\nexpected\n${ex.out}`);
    });
  });

  (l.quiz || []).forEach((q, i) => {
    const w = `quiz ${i + 1}`;
    if (!q.q || !q.explain) fail(`${w}: needs q and explain`);
    if (q.type === 'compiles') {
      if (typeof q.answer !== 'boolean' || !q.code) return fail(`${w}: "compiles" needs code and a true/false answer`);
      tasks.push(async () => {
        const r = await rust(q.code, q.test);
        if (r.compiled !== q.answer) fail(`${w}: answer says compiles=${q.answer}, rustc says ${r.compiled}\n${r.stderr}`);
        else if (r.compiled && !r.ok) fail(`${w}: compiles but fails when run\n${r.stdout}${r.stderr}`);
      });
    } else if (q.type === 'output' || q.type === 'choice') {
      if (!Array.isArray(q.options) || !(q.answer >= 0 && q.answer < q.options.length)) return fail(`${w}: answer index out of range`);
      if (new Set(q.options).size !== q.options.length) fail(`${w}: duplicate options`);
      if (q.type === 'choice' && q.code) {
        const lang = q.lang || 'rust';
        if (lang === 'plaintext') return; // shows text like an error message, not code
        const src = q.harness ? q.harness.replace('{code}', q.code) : q.code;
        tasks.push(async () => {
          const r = await run(src, lang, q.test);
          if (q.rsError) {
            if (r.compiled || !r.stderr.includes(q.rsError)) fail(`${w}: code should fail with "${q.rsError}"\n${r.stderr}`);
          } else if (!r.ok) fail(`${w}: code fails (use "harness" for fragments, "rsError" for expected errors)\n${r.stderr}`);
        });
      }
      if (q.type === 'output')
        tasks.push(async () => {
          const r = await run(q.code, q.lang);
          if (!r.ok) return fail(`${w}: code failed\n${r.stderr}`);
          if (normalize(r.stdout) !== normalize(q.options[q.answer])) fail(`${w}: code printed\n${r.stdout}\nbut the answer is\n${q.options[q.answer]}`);
        });
    } else fail(`${w}: unknown type "${q.type}"`);
  });

  const ex = l.exercise;
  if (ex) {
    for (const f of ['task', 'starter', 'solution', ...(ex.test ? [] : ['expected'])]) if (!ex[f]) fail(`exercise: missing "${f}"`);
    if (ex.test)
      tasks.push(async () => {
        const [sol, start] = await Promise.all([rust(ex.solution, true), rust(ex.starter, true)]);
        if (!sol.ok) fail(`exercise: solution tests fail\n${sol.stdout}${sol.stderr}`);
        if (start.ok) fail('exercise: the starter tests already pass');
      });
    else tasks.push(async () => {
      const r = await rust(ex.solution);
      if (!r.ok) fail(`exercise: solution failed\n${r.stderr}`);
      else if (normalize(r.stdout) !== normalize(ex.expected)) fail(`exercise: solution printed\n${r.stdout}\nexpected\n${ex.expected}`);
    });
    if (!ex.test) tasks.push(async () => {
      const r = await rust(ex.starter);
      if (r.ok && normalize(r.stdout) === normalize(ex.expected)) fail('exercise: the starter code already prints the expected output');
    });
  }

  // Translate it: the Python must print `expected`, the Rust solution too, and the starter must not.
  const tr = l.translate;
  if (tr) {
    for (const f of ['py', 'starter', 'solution', 'expected']) if (!tr[f]) fail(`translate: missing "${f}"`);
    tasks.push(async () => {
      const [py, sol, start] = await Promise.all([python(tr.py), rust(tr.solution), rust(tr.starter)]);
      if (!py.ok) fail(`translate: Python failed\n${py.stderr}`);
      else if (normalize(py.stdout) !== normalize(tr.expected)) fail(`translate: Python printed\n${py.stdout}\nexpected\n${tr.expected}`);
      if (!sol.ok) fail(`translate: solution failed\n${sol.stderr}`);
      else if (normalize(sol.stdout) !== normalize(tr.expected)) fail(`translate: solution printed\n${sol.stdout}\nexpected\n${tr.expected}`);
      if (start.ok && normalize(start.stdout) === normalize(tr.expected)) fail('translate: the starter already prints the expected output');
    });
  }

  for (const row of l.cheat || []) if (!Array.isArray(row) || row.length !== 2) fail(`cheat: row must be [python, rust]: ${JSON.stringify(row)}`);

  await pool(tasks);
  const mine = errors.filter((e) => e.startsWith(`[${l.id}]`)).length;
  console.log(`${mine ? '✗' : '✓'} ${l.id} (${tasks.length} programs)`);
}

fs.rmSync(tmp, { recursive: true, force: true });
if (only.length && lessons.length !== only.length) errors.push(`unknown lesson id in: ${only.join(', ')}`);
if (errors.length) {
  console.error(`\n${errors.length} problem(s):\n\n${errors.join('\n\n')}`);
  process.exit(1);
}
console.log(`\nAll ${lessons.length} lessons OK.`);
