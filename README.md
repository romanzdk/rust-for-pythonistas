<div align="center">

# 🦀 Rust for Pythonistas

**Learn to read Rust, and make small changes to it, using the Python you already know.**

A free, interactive course: Python and Rust side by side, quizzes, and exercises that compile on the official Rust Playground. Nothing to install.

[![Open the course](https://img.shields.io/badge/Open_the_course-%E2%86%92-c2410c?style=for-the-badge)](https://romanzdk.github.io/rust-for-pythonistas/)

[![check](https://github.com/romanzdk/rust-for-pythonistas/actions/workflows/check.yml/badge.svg)](https://github.com/romanzdk/rust-for-pythonistas/actions/workflows/check.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
![16 lessons](https://img.shields.io/badge/lessons-16-orange)
![Rust edition 2024](https://img.shields.io/badge/Rust-edition_2024-b7410e?logo=rust)
![Python 3.12+](https://img.shields.io/badge/Python-3.12%2B-3776ab?logo=python&logoColor=white)

</div>

![A lesson: Python on the left, Rust on the right. Hovering a Rust line highlights the matching Python line and shows a note.](docs/images/side-by-side.png)

## Why this course

You know Python well. Rust keeps showing up in the tools you use (uv, ruff, polars, pydantic-core) and in code you
have to review or change at work. You don't need to become a Rust author. You need to **read** Rust confidently and
make **small, safe changes**, guided by the compiler.

Most Rust courses start from zero and aim at writing large programs. This one starts from Python and aims at reading.

## How a lesson works

| | |
|---|---|
| **1 · Side by side** | Python on the left, Rust on the right. Hover over or tap a marked Rust line to light up the matching Python line and read a short note on how to read it. |
| **2 · Read it** | Short questions you answer by reading only: *what does this print*, *does this compile*, *what type is this*. |
| **3 · Change it** | A small edit to real Rust code. **Run** compiles it on the official [Rust Playground](https://play.rust-lang.org) and checks the result. |
| **4 · Cheat card** | A Python ↔ Rust lookup table for the topic, to come back to later. |

Examples that fail on purpose show the real compiler error, and you can open the fixed version next to it.

<p align="center"><img src="docs/images/exercise.png" alt="An exercise: a Rust editor with Run, Reset, Hint and Show solution buttons, and a green Solved message." width="720"></p>

## Lessons

| # | Lesson | What you learn |
|---|---|---|
| 1 | [Hello, variables and mut](https://romanzdk.github.io/rust-for-pythonistas/#/basics) | `fn main`, `println!`, `let`, `mut`, shadowing, and why there are semicolons |
| 2 | [Numbers and strings](https://romanzdk.github.io/rust-for-pythonistas/#/types) | Fixed-size numbers, casts with `as`, and the two string types |
| 3 | [Functions and expressions](https://romanzdk.github.io/rust-for-pythonistas/#/functions) | Required types, the last expression as the return value, expressions everywhere |
| 4 | [if, loops and ranges](https://romanzdk.github.io/rust-for-pythonistas/#/control-flow) | `if` needs a real bool, `0..5` is `range(5)`, `while`, and `loop` with a break value |
| 5 | [Vec and HashMap](https://romanzdk.github.io/rust-for-pythonistas/#/collections) | A list is a `Vec`, a dict is a `HashMap`, plus slices, tuples, and why map order is random |
| 6 | [Iterators and closures](https://romanzdk.github.io/rust-for-pythonistas/#/iterators) | List comprehensions become `.iter().filter().map().collect()` |
| 7 | [Structs and impl](https://romanzdk.github.io/rust-for-pythonistas/#/structs) | A struct plus an `impl` block is a class: fields, a constructor and methods |
| 8 | [Enums and match](https://romanzdk.github.io/rust-for-pythonistas/#/enums) | Variants that carry data, and a `match` that must handle all of them |
| 9 | [Option instead of None](https://romanzdk.github.io/rust-for-pythonistas/#/option) | A value that might be missing, and the compiler making you handle it |
| 10 | [Result and ? instead of exceptions](https://romanzdk.github.io/rust-for-pythonistas/#/result) | Errors in the return type: `Ok`, `Err`, `?`, `unwrap`, your own error enum |
| 11 | [Ownership and borrowing](https://romanzdk.github.io/rust-for-pythonistas/#/ownership) | Move, `&`, `&mut` and `.clone()`: the rules behind most Rust errors |
| 12 | [Traits instead of duck typing](https://romanzdk.github.io/rust-for-pythonistas/#/traits) | `trait`, `impl`, default methods, generic bounds, `Display` and `derive` |
| 13 | [Reading compiler errors](https://romanzdk.github.io/rust-for-pythonistas/#/compiler-errors) | How to read a rustc error from the top and let its `help:` lines tell you the fix |
| 14 | [Reading real code](https://romanzdk.github.io/rust-for-pythonistas/#/real-code) | Modules, `use`, `pub`, attributes, lifetimes, and a realistic program to read line by line |
| 15 | [Cargo projects and Cargo.toml](https://romanzdk.github.io/rust-for-pythonistas/#/cargo) | Project layout, `Cargo.toml` vs `pyproject.toml`, `Cargo.lock`, features, workspaces |
| 16 | [Tests, builds and shipping](https://romanzdk.github.io/rust-for-pythonistas/#/testing-shipping) | `#[test]`, reading `cargo test` output, release builds, crates.io, Rust inside Python wheels |

## Every example is checked

A course is only useful if its examples are right, so CI checks **every** example on every push
([`scripts/check.mjs`](scripts/check.mjs)):

- Every Python and Rust program runs, and both must print exactly the output the lesson shows.
- "Does it compile?" and "What does it print?" answers are checked against the real `rustc` and real output.
- Examples that fail on purpose must fail with the exact error shown, and their fixed versions must run.
- Every exercise solution must pass, and no starter code may pass before you change it.
- `Cargo.toml`, terminal commands, `cargo test` output and the PyO3 example are checked by running the real tools
  (`cargo`, `uv`, `pytest`, `maturin`) on exactly what the page shows.

## Run it locally

It is a static site with no build step:

```sh
git clone https://github.com/romanzdk/rust-for-pythonistas.git
cd rust-for-pythonistas
python3 -m http.server 8000   # then open http://localhost:8000
```

To run the checks you need `rustc`/`cargo` (stable), `python3`, `uv`, `node` and network access:

```sh
node scripts/check.mjs            # all lessons
node scripts/check.mjs ownership  # one lesson
```

## Contributing

Found a mistake, or have an idea for a lesson? [Open an issue](https://github.com/romanzdk/rust-for-pythonistas/issues/new/choose).
To change or add a lesson, see [CONTRIBUTING.md](CONTRIBUTING.md). Each lesson is one JavaScript file in `lessons/`.
The design notes are in [docs/design.md](docs/design.md).

## License

[MIT](LICENSE) © Roman Žydyk
