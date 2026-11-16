// Checks every lesson: structure, Python and Rust outputs, quiz answers, and exercise solutions.
// Usage: node scripts/check.mjs [lesson-id ...]
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

function exec(cmd, args, input) {
  return new Promise((resolve) => {
    const child = execFile(cmd, args, { timeout: 20000, maxBuffer: 1 << 22 }, (err, stdout, stderr) =>
      resolve({ ok: !err, stdout, stderr }),
    );
    if (input !== undefined) child.stdin.end(input);
  });
}

async function rust(src) {
  const id = jobId++;
  const file = path.join(tmp, `p${id}.rs`);
  const bin = path.join(tmp, `p${id}`);
  fs.writeFileSync(file, src);
  const c = await exec('rustc', ['--edition', '2024', '-A', 'warnings', '-o', bin, file]);
  if (!c.ok) return { compiled: false, ok: false, stdout: '', stderr: c.stderr };
  return { compiled: true, ...(await exec(bin, [], '')) };
}

const python = (src) => exec('python3', ['-I', '-'], src);
const run = (src, lang) => (lang === 'python' ? python(src) : rust(src));

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
  for (const f of ['id', 'title', 'summary', 'intro', 'examples', 'quiz', 'exercise', 'cheat']) if (!l[f]) fail(`missing "${f}"`);
  if (ctx.LESSONS.filter((x) => x.id === l.id).length > 1) fail('duplicate id');

  (l.examples || []).forEach((ex, i) => {
    const w = `example ${i + 1} "${ex.title}"`;
    if (!ex.title || !ex.py || !ex.rs) return fail(`${w}: needs title, py and rs`);
    for (const [rs, py, note] of ex.links || []) {
      if (!(rs >= 1 && rs <= lineCount(ex.rs))) fail(`${w}: link Rust line ${rs} is out of range`);
      for (const p of py == null ? [] : [].concat(py)) if (!(p >= 1 && p <= lineCount(ex.py))) fail(`${w}: link Python line ${p} is out of range`);
      if (!note) fail(`${w}: link on Rust line ${rs} has no note`);
    }
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
        if (r.compiled || !r.stderr.includes(ex.rsError)) fail(`${w}: Rust should fail to compile with "${ex.rsError}"\n${r.stderr}`);
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
        const r = await rust(q.code);
        if (r.compiled !== q.answer) fail(`${w}: answer says compiles=${q.answer}, rustc says ${r.compiled}\n${r.stderr}`);
      });
    } else if (q.type === 'output' || q.type === 'choice') {
      if (!Array.isArray(q.options) || !(q.answer >= 0 && q.answer < q.options.length)) return fail(`${w}: answer index out of range`);
      if (new Set(q.options).size !== q.options.length) fail(`${w}: duplicate options`);
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
    for (const f of ['task', 'starter', 'solution', 'expected']) if (!ex[f]) fail(`exercise: missing "${f}"`);
    tasks.push(async () => {
      const r = await rust(ex.solution);
      if (!r.ok) fail(`exercise: solution failed\n${r.stderr}`);
      else if (normalize(r.stdout) !== normalize(ex.expected)) fail(`exercise: solution printed\n${r.stdout}\nexpected\n${ex.expected}`);
    });
    tasks.push(async () => {
      const r = await rust(ex.starter);
      if (r.ok && normalize(r.stdout) === normalize(ex.expected)) fail('exercise: the starter code already prints the expected output');
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
