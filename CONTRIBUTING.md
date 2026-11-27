# Contributing

Thanks for helping! Small fixes are very welcome: a confusing sentence, a wrong note, a better example.

## Report a problem

[Open an issue](https://github.com/romanzdk/rust-for-pythonistas/issues/new/choose) and say which lesson and which
example or question. If you have it, include what you expected instead.

## Change or add a lesson

1. Each lesson is one file in `lessons/`, listed in `index.html` in the order it appears.
2. Edit the file (the format is below), then open `index.html` through a local server to see it:
   `python3 -m http.server 8000`.
3. Run the checks. They must pass before a pull request can be merged:

   ```sh
   node scripts/check.mjs <lesson-id>   # quick: one lesson
   node scripts/check.mjs               # everything, as CI does
   ```

   You need `rustc` and `cargo` (stable, edition 2024), `python3` (3.12+), `uv`, `docker`, `node` and network access.

### Writing style

- Plain, simple English. Short sentences. Talk to the reader as "you".
- The goal is **reading** Rust and making **small changes**. Don't teach large programs.
- Start from what a Python developer already knows, and compare.
- Only use ideas from earlier lessons. If you must show something from a later lesson, add a one-line note and name
  the lesson.
- Output must be the same on every run: no randomness, no time, and no printing in `HashMap` order.
- Rust programs must not panic (the checker needs exit code 0). Show a panic in the text instead.

### Lesson format

```js
LESSONS.push({
  id: 'option',                      // URL: #/option
  part: 'The language',              // optional: starts a new group in the menu and on the home page
  title: 'Option instead of None',
  summary: 'One line for the home page.',
  intro: `<p>HTML</p>`,
  examples: [{
    title: '...',
    text: `<p>HTML explanation</p>`,
    py: code`...`,                   // full runnable Python script
    rs: code`...`,                   // full Rust program with fn main
    out: code`...`,                  // what both print (checked)
    links: [[rsLine, pyLine | [pyLines] | null, 'note HTML']],  // 1-based line numbers

    // Optional:
    rsError: 'error[E0382]: ...',    // Rust must fail to compile with this text (can be the full rustc output;
                                     // its error/help lines are checked). Then rsFix is required.
    pyError: 'TypeError: ...',       // Python must crash with this text. Then pyFix is required.
    rsFix: code`...`, pyFix: code`...`,  // the working version, shown under "Show the fixed version"
    pyOut: code`...`,                // Python prints something else on purpose (then out is what Rust prints)
    fixOut: code`...`,               // what the fixes print, if different from out
    fixNote: 'HTML',                 // a sentence shown above the fixes
    test: true,                      // both sides are test files: pytest and `cargo test` must pass
    run: { args: ['notes.txt'], files: { 'notes.txt': '...' }, stdin: 'notes.txt', env: { NAME: 'x' },
           exitCode: 1, stderr: 'error: ...' },  // a command-line program; py is saved as main.py

    // Files or commands instead of a program (Cargo.toml, terminal output, several files):
    files: true, pyLabel: 'pyproject.toml', pyLang: 'ini', rsLabel: 'Cargo.toml', rsLang: 'ini',
    check: code`bash`,               // runs in an empty folder; $RS / $PY hold the shown text, and
                                     // split_files "$RS" writes a "// path"-separated listing out as files
    diagram: true,                   // a picture such as a folder tree; nothing to run

    // Real code from another project instead of a program. rs must be exactly those lines (checked against GitHub);
    // py only has to parse, unless you also give out. Also list it, with its license text, in THIRD_PARTY_NOTICES:
    excerpt: { repo: 'astral-sh/uv', commit: '<full 40-character SHA>', path: 'crates/x/src/lib.rs', from: 10, to: 30 },
  }],
  quiz: [
    { type: 'output', q: 'What does this print?', code: code`...`, options: ['a', 'b'], answer: 0, explain: '...' },
    { type: 'compiles', q: 'Does this compile?', code: code`...`, answer: false, explain: '...' },  // test: true → as `cargo test`
    { type: 'choice', q: '...', options: ['...'], answer: 1, explain: '...' },
    // A choice question's code must run, or set rsError: 'error[E0384]'.
    // A fragment gets a wrapper: harness: code`fn main() { {code} }`
  ],
  exercise: { task: `<p>HTML</p>`, starter: code`...`, solution: code`...`, expected: code`...`, hint: '...' },
  // or a test exercise (no main, no expected; it passes when `cargo test` passes):
  // exercise: { test: true, task, starter, solution, hint },
  breaks: [`HTML: one place where Python intuition misleads you`, ...],  // "Where the Python analogy breaks"
  // Optional "Translate it" step. py must print expected, and so must the Rust solution (checked):
  translate: { py: code`...`, starter: code`...`, solution: code`...`, expected: code`...`, hint: '...', task: '<p>optional</p>' },
  cheat: [['python', 'rust'], ...],
});
```

`code` is a template tag that keeps backslashes as written and removes the common indentation. Write a backtick
inside it as `` \` ``.

Rust programs that use serde, serde_json, anyhow, thiserror, clap or tokio are built in a shared Cargo project
automatically (the versions are in `CARGO_TOML` in `scripts/check.mjs`). The Rust Playground has these crates too.

### The error index

`errors.js` holds the entries of the error index (`#/errors`): the error code and message, the lesson that explains
it, what Python would do, a small program `rs` that must fail with exactly that error, and a `fix` that must print
`out`. `node scripts/check.mjs errors` checks only the index.

## Pull requests

Keep them small and focused. Say what you changed and why, and paste the last line of `node scripts/check.mjs`.
By contributing you agree that your work is released under the [MIT License](LICENSE) and that you follow the
[Code of Conduct](CODE_OF_CONDUCT.md).
