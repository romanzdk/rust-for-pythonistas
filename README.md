# 🦀 Rust for Pythonistas

Learn to **read Rust**, and make small changes to it, using the Python you already know.

**Open the course: https://romanzdk.github.io/rust-for-pythonistas/**

Every lesson has four parts:

1. **Side by side.** Python on the left, Rust on the right. Hover over a marked Rust line to see the matching Python line and a short note.
2. **Read it.** Short questions you answer by reading: what does this print, does it compile, what type is this?
3. **Change it.** A small edit to real Rust code. **Run** compiles it on the official [Rust Playground](https://play.rust-lang.org) and checks the output.
4. **Cheat card.** A Python ↔ Rust lookup table for the topic.

This course is not about writing large Rust programs. It aims to make Rust code readable and easy to change for someone who knows Python.

## Run it locally

It's a static site with no build step:

```sh
python3 -m http.server 8000   # then open http://localhost:8000
```

## Check the lessons

Every Python and Rust snippet in the course is run by the checker. It confirms that both sides print the stated
output, that "does it compile?" answers match `rustc`, that "what does this print?" answers match the real output,
that every exercise solution passes, and that no starter code passes before you change it.

```sh
node scripts/check.mjs            # all lessons
node scripts/check.mjs ownership  # one lesson
```

You need `rustc` (stable, edition 2024), `python3` and `node`. CI runs the same check on every push.

## Add or edit a lesson

Each lesson is one file in `lessons/`, listed in `index.html` in the order it should appear. The shape:

```js
LESSONS.push({
  id: 'option',                      // URL: #/option
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
    rsError: 'error[E0382]: ...',    // optional: Rust must fail to compile with this text
    pyError: 'TypeError: ...',       // optional: Python must crash with this text
  }],
  quiz: [
    { type: 'output', q: 'What does this print?', code: code`...`, options: ['a', 'b'], answer: 0, explain: '...' },
    { type: 'compiles', q: 'Does this compile?', code: code`...`, answer: false, explain: '...' },
    { type: 'choice', q: '...', code: code`...` /* optional */, options: ['...'], answer: 1, explain: '...' },
  ],
  exercise: { task: `<p>HTML</p>`, starter: code`...`, solution: code`...`, expected: code`...`, hint: '...' },
  cheat: [['python', 'rust'], ...],
});
```

`code` is a template tag that keeps backslashes as written and removes the common indentation.
