# Design

## Why

People who know Python well keep running into Rust code: in libraries (pydantic-core, polars, ruff, uv), in
services at work, and in code reviews. They need to **read** it and make **small, safe changes**. They don't
need to become Rust authors. Existing courses (the Rust Book, rustlings) start from zero and aim at writing.
This course starts from Python and aims at reading.

## Goals / non-goals

- Goal: after the course, a Python developer can read typical Rust (structs, enums, `match`, `Option`/`Result`,
  `?`, borrowing, traits, iterators) and make small edits guided by compiler errors.
- Goal: everything shown is correct. Every snippet is run in CI (`scripts/check.mjs`).
- Non-goal: async, unsafe, macros by example, writing lifetimes. These are only mentioned so readers can recognize them.
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
- Examples with `files: true` show files or commands (Cargo.toml, terminal) and are not run. Examples and exercises
  with `test: true` are test modules; they must pass `rustc --test` (`cargo test` on the Playground).
- `scripts/check.mjs` loads the same files as `index.html` and runs every Python/Rust snippet locally with `python3` and
  `rustc --edition 2024`. GitHub Actions runs it on each push. GitHub Pages serves `main` as-is.

## Curriculum

1. Hello, variables and mut
2. Numbers and strings (`i32`/`f64`/`usize`, `as`, `String` vs `&str`)
3. Functions and expressions (type hints → types, last expression is the return value)
4. if, loops and ranges
5. Vec and HashMap (list / dict)
6. Iterators and closures (list comprehensions → `map`/`filter`/`collect`)
7. Structs and impl (classes)
8. Enums and match
9. Option instead of None
10. Result and `?` instead of exceptions
11. Ownership and borrowing
12. Traits (duck typing / Protocols)
13. Reading compiler errors
14. Reading real code (modules, `use`, attributes, recognizing lifetimes, a realistic program)
15. Cargo projects and Cargo.toml (layout, dependencies, features, modules as files, workspaces)
16. Tests, builds and shipping (`#[test]`, `cargo test` output, doc tests, release builds, crates.io, PyO3 + maturin)
