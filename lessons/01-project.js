LESSONS.push({
  id: 'project',
  part: 'Get started',
  title: 'Your first Rust project',
  summary: 'cargo new next to uv init: the files you get, Cargo.toml next to pyproject.toml, and how to run it.',
  intro: `
    <p>Before any syntax, start a project the way you would in Python. Rust comes with <b>Cargo</b>, one tool that
    creates projects, downloads dependencies, builds, runs and tests. It plays the role of <code>uv</code>, plus a few more.
    If you don't have Rust yet, install it with <a href="https://rustup.rs" target="_blank" rel="noopener">rustup</a>.
    You can also do every exercise in this course in the browser.</p>
    <p>One word you will see everywhere: a <b>crate</b> is one Rust package, the unit Cargo builds. A new project is one crate.</p>`,
  examples: [
    {
      title: 'Create a project and run it',
      text: `<p>Three commands on each side. <code>cargo run</code> prints <code>Hello, world!</code> and
      <code>uv run hello</code> prints <code>Hello from hello!</code>. There is no virtual environment to create or activate:
      Cargo keeps everything it builds inside the project.</p>`,
      files: true,
      pyLabel: 'Terminal · Python',
      pyLang: 'bash',
      rsLabel: 'Terminal · Rust',
      rsLang: 'bash',
      py: code`
        uv init hello
        cd hello
        uv run hello
      `,
      rs: code`
        cargo new hello
        cd hello
        cargo run
      `,
      check: code`
        mkdir rs py
        (cd rs && source "$RS") > rs.txt
        grep -qx 'Hello, world!' rs.txt
        (cd py && source "$PY") > py.txt
        grep -qx 'Hello from hello!' py.txt
      `,
      links: [
        [1, 1, '<code>cargo new hello</code> creates the folder <code>hello/</code> with a ready-to-run program and a git repository.'],
        [3, 3, '<code>cargo run</code> compiles the program (only what changed) and then runs it. The first build takes a moment, and later ones are quick.'],
      ],
    },
    {
      title: 'The files you get',
      text: `<p>A new crate is tiny: one config file and one source file. The Python side has a few more files, but the idea
      is the same. After the first build a <code>target/</code> folder appears. It holds everything Cargo builds, a bit like
      <code>.venv/</code>. It is already in <code>.gitignore</code>, and you can delete it any time.</p>`,
      files: true,
      pyLabel: 'uv init hello',
      pyLang: 'plaintext',
      rsLabel: 'cargo new hello',
      rsLang: 'plaintext',
      py: code`
        hello/
        ├── .gitignore
        ├── .python-version
        ├── README.md
        ├── pyproject.toml
        └── src/
            └── hello/
                └── __init__.py
      `,
      rs: code`
        hello/
        ├── .gitignore
        ├── Cargo.toml
        └── src/
            └── main.rs
      `,
      check: code`
        mkdir rs py
        (cd rs && cargo new --quiet hello && cd hello && find . -type f -not -path './.git/*' | LC_ALL=C sort | tr '\n' ' ') > rs.txt
        test "$(cat rs.txt)" = "./.gitignore ./Cargo.toml ./src/main.rs "
        (cd py && uv init --quiet hello && cd hello && find . -type f -not -path './.git/*' | LC_ALL=C sort | tr '\n' ' ') > py.txt
        test "$(cat py.txt)" = "./.gitignore ./.python-version ./README.md ./pyproject.toml ./src/hello/__init__.py "
      `,
      links: [
        [2, 2, '<code>cargo new</code> already ignores <code>/target</code>, the build folder.'],
        [3, 5, 'The project file: name, version and dependencies. It plays the role of <code>pyproject.toml</code>.'],
        [5, 8, '<code>src/main.rs</code> holds <code>fn main</code>, where the program starts. <code>__init__.py</code> holds the <code>main</code> function that <code>uv run hello</code> calls.'],
      ],
    },
    {
      title: 'Cargo.toml next to pyproject.toml',
      text: `<p>This is the whole <code>Cargo.toml</code> that <code>cargo new</code> writes, next to the important part of
      <code>pyproject.toml</code>. There is no <code>[project.scripts]</code> in Rust: <code>src/main.rs</code> is the
      program, and the program gets the crate's name.</p>`,
      files: true,
      pyLabel: 'pyproject.toml (shortened)',
      pyLang: 'ini',
      rsLabel: 'Cargo.toml',
      rsLang: 'ini',
      py: code`
        [project]
        name = "hello"
        version = "0.1.0"
        requires-python = ">=3.12"
        dependencies = []

        [project.scripts]
        hello = "hello:main"

        [build-system]
        requires = ["uv_build>=0.9,<1"]
        build-backend = "uv_build"
      `,
      rs: code`
        [package]
        name = "hello"
        version = "0.1.0"
        edition = "2024"

        [dependencies]
      `,
      check: code`
        mkdir rs py
        (cd rs && cargo new --quiet hello && diff hello/Cargo.toml "$RS")
        cd py
        uv init --quiet hello
        cd hello
        cp "$PY" pyproject.toml
        test "$(uv run --quiet hello)" = 'Hello from hello!'
      `,
      links: [
        [1, 1, '<code>[package]</code> is <code>[project]</code>: who this crate is.'],
        [2, 2, 'The crate name. It is also the name of the program that <code>cargo build</code> makes.'],
        [4, null, 'The <b>edition</b> is a set of language rules, not a Rust version. 2024 is the newest. Lesson 17 explains more.'],
        [6, 5, 'Dependencies go here, one per line, like <code>dependencies = [...]</code>. Lesson 17 covers adding them.'],
      ],
    },
    {
      title: 'The program itself',
      text: `<p><code>cargo new</code> writes this <code>src/main.rs</code>. On the Python side, here is the same idea as
      a script you can run directly. Rust needs no <code>if __name__ == "__main__"</code>: the program always starts at
      <code>fn main</code>.</p>`,
      py: code`
        def main() -> None:
            print("Hello, world!")


        if __name__ == "__main__":
            main()
      `,
      rs: code`
        fn main() {
            println!("Hello, world!");
        }
      `,
      out: 'Hello, world!',
      links: [
        [1, [1, 5, 6], '<code>fn</code> is <code>def</code>. A function named <code>main</code> is where every Rust program starts. Rust calls it for you.'],
        [2, 2, '<code>println!</code> is <code>print</code>. Lesson 3 explains the <code>!</code>.'],
        [3, null, 'A closing brace ends the function. Rust uses braces where Python uses indentation.'],
      ],
    },
    {
      title: 'Check, run, build',
      text: `<p>Three commands you will use all the time. <code>cargo check</code> only looks for errors, so it is the
      fastest. <code>cargo build</code> makes the program file without running it. Python has no build step.
      <code>uv build</code> makes a package to share, which is a different job.</p>`,
      files: true,
      pyLabel: 'Terminal · Python',
      pyLang: 'bash',
      rsLabel: 'Terminal · Rust',
      rsLang: 'bash',
      py: code`
        uvx mypy src
        uv run hello
        .venv/bin/hello
      `,
      rs: code`
        cargo check
        cargo run
        cargo build
        ./target/debug/hello
      `,
      check: code`
        mkdir rs py
        (cd rs && cargo new --quiet hello && cd hello && source "$RS") > rs.txt
        test "$(grep -cx 'Hello, world!' rs.txt)" = 2
        (cd py && uv init --quiet hello && cd hello && source "$PY") > py.txt
        test "$(grep -cx 'Hello from hello!' py.txt)" = 2
      `,
      links: [
        [1, 1, 'Compiles without making a program, and reports every error. Like <code>mypy</code>, except you can\'t skip it: code with errors never runs.'],
        [2, 2, 'Build, then run.'],
        [3, null, 'Build only. The program lands in <code>target/debug/hello</code>.'],
        [4, 3, 'Run the built program directly. This is a <i>debug</i> build: quick to compile, slower to run. Lesson 18 shows <code>--release</code>.'],
      ],
    },
  ],
  quiz: [
    {
      type: 'choice',
      q: 'Which file holds the code that runs first?',
      options: ['<code>src/main.rs</code>', '<code>Cargo.toml</code>', '<code>src/lib.rs</code>', '<code>target/debug/hello</code>'],
      answer: 0,
      explain: 'Every program starts at <code>fn main</code> in <code>src/main.rs</code>. <code>target/debug/hello</code> is the built program, made from it.',
    },
    {
      type: 'choice',
      q: 'What is the <code>target/</code> folder?',
      options: [
        'Everything Cargo builds. It is git-ignored and safe to delete.',
        'Your source code',
        'The list of dependencies',
        'A virtual environment you must activate',
      ],
      answer: 0,
      explain: 'Cargo rebuilds <code>target/</code> whenever it needs to. You never edit it and never commit it.',
    },
    {
      type: 'choice',
      q: 'You changed some code and only want to know if it has errors. Which command is fastest?',
      options: ['<code>cargo check</code>', '<code>cargo run</code>', '<code>cargo build</code>', '<code>cargo new</code>'],
      answer: 0,
      explain: '<code>cargo check</code> stops after finding errors and does not make a program, so it is quicker than <code>build</code> or <code>run</code>.',
    },
    {
      type: 'compiles',
      q: 'Is this a complete program that compiles?',
      code: code`
        fn hello() {
            println!("Hello!");
        }
      `,
      answer: false,
      explain: 'A program needs <code>fn main</code>. The compiler stops with error E0601: "<code>main</code> function not found". A Python file can run without a main function, but a Rust program can\'t.',
    },
  ],
  exercise: {
    task: `<p>This is the program <code>cargo new</code> writes. Make it print a second line, <code>I am learning Rust.</code></p>`,
    starter: code`
      fn main() {
          println!("Hello, world!");
      }
    `,
    solution: code`
      fn main() {
          println!("Hello, world!");
          println!("I am learning Rust.");
      }
    `,
    expected: code`
      Hello, world!
      I am learning Rust.
    `,
    hint: 'Copy the <code>println!</code> line, change the text, and keep the <code>;</code> at the end.',
  },
  cheat: [
    ['uv init hello', 'cargo new hello'],
    ['uv run hello', 'cargo run'],
    ['mypy src', 'cargo check'],
    ['# no build step', 'cargo build  // program in target/debug/'],
    ['pyproject.toml', 'Cargo.toml'],
    ['[project]', '[package]'],
    ['dependencies = []', '[dependencies]'],
    ['def main(): ...', 'fn main() { }'],
    ['if __name__ == "__main__": main()', '// not needed: Rust starts at main()'],
    ['.venv/', 'target/'],
  ],
});
