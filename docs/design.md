# Design

## Why

People who know Python well keep running into Rust code: in libraries (pydantic-core, polars, ruff, uv), in
services at work, and in code reviews. They need to **read** it and make **small, safe changes**. They don't
need to become Rust authors. Existing courses (the Rust Book, rustlings) start from zero and aim at writing.
This course starts from Python and aims at reading.

It started as the author's own way to learn Rust: by analogy, always seeing something already known (Python) next to
the new thing (Rust). Each lesson follows that idea: side-by-side examples, then a short "where the Python analogy
breaks" box, questions, a small change to Rust code, a Python program to translate into Rust, and a cheat card. A
phrasebook page (`#/phrasebook`) collects all cheat cards in one searchable table.

## Goals / non-goals

- Goal: after the course, a Python developer can read typical Rust (structs, enums, `match`, `Option`/`Result`,
  `?`, borrowing, traits, iterators) and make small edits guided by compiler errors.
- Goal: everything shown is correct. Every snippet is run in CI (`scripts/check.mjs`).
- Non-goal: unsafe, macros by example, writing lifetimes. These are only mentioned so readers can recognize them.
  (Async was a non-goal at first; lesson 24 now covers reading it, because most real services and CLIs use it.)
- Anti-goal: a long theory course. Each lesson stays short and has a concrete Python comparison.

## Approaches considered

| Approach | Pros | Cons |
|---|---|---|
| **Static web app + Rust Playground** (chosen) | Side-by-side view with line links, in-page quizzes and runnable edits, no install, free hosting on GitHub Pages | Run needs internet (play.rust-lang.org) |
| Local cargo exercises (rustlings style) | Real compiler, works offline | No side-by-side view, needs Rust installed before you can start |
| mdBook | Good for reading | Weak for quizzes and edit-and-check exercises |

## How it works

- Plain HTML/CSS/JS, no build step. highlight.js (read-only code) and CodeMirror 5 (editor) from cdnjs.
- `lib.js` sets up `LESSONS` and the `code` template tag. Each file in `lessons/` pushes one lesson. `app.js`
  renders a hash-routed page per lesson (`#/basics`).
- Run sends code to `https://play.rust-lang.org/execute` (CORS is open) and compares stdout with `expected`.
- Progress (solved exercises) and editor drafts are kept in `localStorage`. The site works without them.
- Every example is run. Plain examples: Python and Rust must print `out`. Examples that fail on purpose
  (`rsError`/`pyError`) must fail with that exact error and must have a fixed version (`rsFix`/`pyFix`) that runs.
  Test examples run under pytest and `rustc --test`. Command-line examples (`run`) get the same arguments, files,
  stdin and environment on both sides and must match the shown output, stderr and exit code. File/command examples (`files: true`) carry a hidden `check`
  script that runs the real tools (cargo, uv, pytest, docker, maturin) on the shown files and commands. Only folder-tree
  pictures (`diagram: true`) are not run. A "Translate it" step (`translate`) must print `expected` both as Python
  and as the Rust solution.
- `scripts/check.mjs` loads the same files as `index.html` and runs every Python/Rust snippet locally with `python3` and
  `rustc --edition 2024`. GitHub Actions runs it on each push. GitHub Pages serves `main` as-is.

## Curriculum

The order follows how a Python developer starts a real project: first the project and a tiny program, then the
language, then what real projects need.

**Get started**
1. Your first Rust project (`cargo new` vs `uv init`, the files, `Cargo.toml`, `cargo run/check/build`)
2. A tiny app: a function and a module (`fn`, `mod`, `pub`, `use`, inline modules)

**The language**
3. Hello, variables and mut
4. Numbers and strings (`i32`/`f64`/`usize`, `as`, `String` vs `&str`)
5. Functions and expressions (type hints → types, last expression is the return value)
6. if, loops and ranges
7. Vec and HashMap (list / dict)
8. Iterators and closures (list comprehensions → `map`/`filter`/`collect`)
9. Structs and impl (classes)
10. Enums and match
11. Option instead of None
12. Result and `?` instead of exceptions
13. Ownership and borrowing
14. Traits (duck typing / Protocols)
15. Reading compiler errors

**Real projects**
16. Building and running a real program (arguments, files, stdin, env vars, exit codes, Docker)
17. Cargo in depth (full `Cargo.toml`, dependencies, features, submodules, workspaces)
18. Tests, builds and shipping (`#[test]`, `cargo test` output, doc tests, release builds, crates.io, PyO3 + maturin)
19. Reading real code (modules, attributes, lifetimes, a realistic program)

**Going deeper**
20. Memory without a garbage collector (reference counting and `gc` vs owners and `Drop`, stack and heap, `Box`)
21. Shared ownership (`Rc`, `RefCell`, `Weak`, reference cycles; examples may set `pyOut` where Python and Rust print
    different things on purpose)
22. Threads without a GIL (`thread::spawn`, `Arc<Mutex<T>>`, `Send`, `thread::scope`, channels). Thread examples
    are written so their output never depends on timing: results are joined in order, counted under a lock, or sorted.

**Real-world Rust**
23. The crates you'll meet everywhere (serde, anyhow, thiserror, clap). Programs that use these crates are built in a
    shared Cargo project by the checker; the Playground has them too.
24. async/await vs asyncio (tokio, `join!`, `spawn`, timeouts, `select!`)
25. Rust inside Python with PyO3 (checked by building real wheels with maturin and importing them)
26. Reading function signatures (generics and bounds, `impl Trait`, `dyn` and closures, lifetimes in depth)
27. Reading macros and attributes (format macros checked at compile time, `#[derive]`, attribute macros vs decorators,
    `macro_rules!`)
28. Reading real projects: excerpts from uv, ruff and pydantic-core, pinned to a commit and checked against GitHub
    (`excerpt`)

## Tools and pages

- `#/phrasebook`: all cheat cards in one searchable table.
- `#/errors`: the error index (`errors.js`), each entry checked like a lesson example.
- `#/review`: random questions from lessons the reader has opened (kept in `localStorage`).
- Every example and lesson has a "report a mistake" link that opens a GitHub issue already filled in with the lesson.

## Deployment

GitHub Actions runs `scripts/check.mjs` on every push. On `main`, a second job runs `scripts/build-pages.mjs`, which
copies the static files and adds one real page per lesson (`/ownership/`, ...) with its own title, description and the
lesson text in the HTML, plus `sitemap.xml`, so search engines can index each lesson. Those pages start the same app
on that lesson. The result is deployed to GitHub Pages. Locally, `index.html` still works on its own, with no build.
