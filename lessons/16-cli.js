LESSONS.push({
  id: 'cli',
  part: 'Real projects',
  title: 'Building and running a real program',
  summary: 'Command-line arguments, files, stdin, environment variables, errors with exit codes, and a Dockerfile.',
  intro: `
    <p>A real program takes arguments, reads files or input, looks at environment variables, and reports errors with an
    exit code. This lesson builds a small word counter, step by step, next to the same program in Python.</p>
    <p>Each example shows how you run it. In Rust, <code>cargo run -- notes.txt</code> builds and runs the program. Everything
    after <code>--</code> goes to <b>your</b> program, not to Cargo. The built program in <code>target/debug/</code> takes the
    same arguments.</p>`,
  examples: [
    {
      title: 'Arguments: sys.argv and env::args()',
      text: `<p><code>env::args()</code> is <code>sys.argv</code>. The first item is the program itself, so you skip it. For
      real tools with flags and <code>--help</code>, Rust code uses the <code>clap</code> crate, the
      <code>argparse</code>/<code>click</code> of Rust.</p>`,
      py: code`
        import sys

        args = sys.argv[1:]
        print(f"{len(args)} arguments")
        for arg in args:
            print(arg)
      `,
      rs: code`
        use std::env;

        fn main() {
            let args: Vec<String> = env::args().skip(1).collect();
            println!("{} arguments", args.len());
            for arg in &args {
                println!("{arg}");
            }
        }
      `,
      run: { args: ['notes.txt', '--top', '3'] },
      out: code`
        3 arguments
        notes.txt
        --top
        3
      `,
      links: [
        [1, 1, '<code>std::env</code> is the part of the standard library for the program\'s environment: arguments and environment variables.'],
        [4, 3, '<code>env::args()</code> gives the arguments one by one, the program path first. <code>.skip(1)</code> is the <code>[1:]</code>, and <code>collect</code> builds a <code>Vec&lt;String&gt;</code> (lesson 8).'],
        [6, 5, 'Loop over the arguments. <code>&amp;args</code> borrows them (lesson 13).'],
      ],
    },
    {
      title: 'Reading a file',
      text: `<p><code>fs::read_to_string</code> is <code>open(path).read()</code>. Reading can fail, so it returns a
      <code>Result</code> (lesson 12). Here <code>.expect(...)</code> stops the program with a message if anything goes
      wrong. The next example handles errors properly.</p>`,
      py: code`
        import sys

        path = sys.argv[1]
        with open(path) as f:
            text = f.read()
        words = len(text.split())
        print(f"{path}: {words} words")
      `,
      rs: code`
        use std::env;
        use std::fs;

        fn main() {
            let path = env::args().nth(1).expect("usage: count <file>");
            let text = fs::read_to_string(&path).expect("could not read the file");
            let words = text.split_whitespace().count();
            println!("{path}: {words} words");
        }
      `,
      run: { args: ['notes.txt'], files: { 'notes.txt': 'Rust is fast\nPython is friendly\n' } },
      out: 'notes.txt: 6 words',
      links: [
        [2, null, '<code>std::fs</code> is the file system module: read, write, list and delete files.'],
        [5, 3, '<code>.nth(1)</code> is the first real argument. It is an <code>Option</code>, because the user may not pass one (lesson 11).'],
        [6, [4, 5], 'The whole file as one <code>String</code>. <code>&amp;path</code> lends the path to the function.'],
        [7, 6, '<code>split_whitespace</code> is <code>split()</code> with no arguments.'],
      ],
    },
    {
      title: 'Errors go to stderr, with an exit code',
      text: `<p>A good command-line tool prints errors to <b>stderr</b> and exits with a non-zero code, so scripts and CI
      can tell that it failed. <code>eprintln!</code> is <code>print(..., file=sys.stderr)</code>. Returning an
      <code>ExitCode</code> from <code>main</code> is <code>sys.exit(main())</code>. Here the file does not exist.</p>`,
      py: code`
        import sys


        def main() -> int:
            if len(sys.argv) < 2:
                print("usage: count <file>", file=sys.stderr)
                return 2
            path = sys.argv[1]
            try:
                with open(path) as f:
                    text = f.read()
            except OSError as e:
                print(f"error: cannot read {path}: {e.strerror}", file=sys.stderr)
                return 1
            print(f"{path}: {len(text.split())} words")
            return 0


        sys.exit(main())
      `,
      rs: code`
        use std::env;
        use std::fs;
        use std::process::ExitCode;

        fn main() -> ExitCode {
            let Some(path) = env::args().nth(1) else {
                eprintln!("usage: count <file>");
                return ExitCode::from(2);
            };
            let text = match fs::read_to_string(&path) {
                Ok(text) => text,
                Err(e) => {
                    eprintln!("error: cannot read {path}: {e}");
                    return ExitCode::FAILURE;
                }
            };
            println!("{path}: {} words", text.split_whitespace().count());
            ExitCode::SUCCESS
        }
      `,
      run: { args: ['missing.txt'], exitCode: 1, stderr: 'error: cannot read missing.txt: No such file or directory' },
      out: '',
      links: [
        [5, [4, 19], '<code>main</code> returns an <code>ExitCode</code>, the number the shell sees in <code>$?</code>. Python returns an int and passes it to <code>sys.exit</code>.'],
        [6, [5, 8], '<code>let ... else</code> (lesson 11): take the argument, or print the usage and stop.'],
        [7, 6, '<code>eprintln!</code> prints to stderr, so the message doesn\'t mix with real output in a pipe.'],
        [8, 7, 'Exit code 2 is the usual code for "wrong usage".'],
        [10, [9, 12], '<code>match</code> on the <code>Result</code> is the <code>try</code>/<code>except</code>.'],
        [13, 13, '<code>{e}</code> prints the operating system\'s message. Rust adds the error number, as in <code>(os error 2)</code>.'],
        [14, 14, '<code>ExitCode::FAILURE</code> is exit code 1.'],
        [18, 16, '<code>ExitCode::SUCCESS</code> is 0. It is the last expression, so it is the return value.'],
      ],
    },
    {
      title: 'Environment variables',
      text: `<p><code>env::var("NAME")</code> is <code>os.environ["NAME"]</code>. It returns a <code>Result</code>,
      because the variable may not be set. <code>.unwrap_or(...)</code> supplies a default, like
      <code>os.environ.get(name, default)</code>.</p>`,
      py: code`
        import os

        name = os.environ.get("GREETING_NAME", "world")
        print(f"Hello, {name}!")
      `,
      rs: code`
        use std::env;

        fn main() {
            let name = env::var("GREETING_NAME").unwrap_or(String::from("world"));
            println!("Hello, {name}!");
        }
      `,
      run: { env: { GREETING_NAME: 'Ferris' } },
      out: 'Hello, Ferris!',
      links: [
        [4, 3, '<code>Ok(value)</code> if the variable is set, <code>Err(...)</code> if not. <code>unwrap_or</code> takes the value or the default (lesson 11).'],
        [5, 4, 'The rest is ordinary printing.'],
      ],
    },
    {
      title: 'Reading stdin',
      text: `<p>Command-line tools often read from a pipe: <code>cat notes.txt | cargo run</code> or
      <code>cargo run &lt; notes.txt</code>. <code>io::stdin().lines()</code> is <code>for line in sys.stdin</code>.</p>`,
      py: code`
        import sys

        lines = 0
        words = 0
        for line in sys.stdin:
            lines += 1
            words += len(line.split())
        print(f"{lines} lines, {words} words")
      `,
      rs: code`
        use std::io;

        fn main() {
            let mut lines = 0;
            let mut words = 0;
            for line in io::stdin().lines() {
                let line = line.expect("could not read stdin");
                lines += 1;
                words += line.split_whitespace().count();
            }
            println!("{lines} lines, {words} words");
        }
      `,
      run: { files: { 'notes.txt': 'Rust is fast\nPython is friendly\n' }, stdin: 'notes.txt' },
      out: '2 lines, 6 words',
      links: [
        [1, 1, '<code>std::io</code> holds stdin, stdout and stderr.'],
        [6, 5, 'One line at a time, without the line ending.'],
        [7, null, 'Each line is a <code>Result</code>, because reading can fail (for example, the input is not valid text).'],
        [9, 7, 'Count the words on this line.'],
      ],
    },
    {
      title: 'Ship it in a Docker image',
      text: `<p>For anything you measure or ship, build with <code>cargo build --release</code> or run with
      <code>cargo run --release -- notes.txt</code>. A debug build can be many times slower (lesson 18).</p>
      <p>To run the tool on a server, a two-stage Dockerfile builds with the full Rust image and then copies <b>only the
      finished program</b> into a small image. The Python image needs Python and your code. The Rust image needs just the
      one file. Both images below are built and run with the word counter from the "Errors go to stderr" example.</p>`,
      files: true,
      pyLabel: 'Dockerfile · Python',
      pyLang: 'bash',
      rsLabel: 'Dockerfile · Rust',
      rsLang: 'bash',
      py: code`
        FROM python:3.12-slim
        WORKDIR /app
        COPY main.py .

        ENTRYPOINT ["python", "main.py"]
      `,
      rs: code`
        FROM rust:1-slim-bookworm AS build
        WORKDIR /src
        COPY . .
        RUN cargo build --release

        FROM debian:bookworm-slim
        COPY --from=build /src/target/release/count /usr/local/bin/count
        ENTRYPOINT ["count"]
      `,
      check: code`
        mkdir -p rs/src py
        cat > rs/Cargo.toml <<'EOF'
        [package]
        name = "count"
        version = "0.1.0"
        edition = "2024"
        EOF
        cat > rs/src/main.rs <<'EOF'
        use std::env;
        use std::fs;
        use std::process::ExitCode;

        fn main() -> ExitCode {
            let Some(path) = env::args().nth(1) else {
                eprintln!("usage: count <file>");
                return ExitCode::from(2);
            };
            let text = match fs::read_to_string(&path) {
                Ok(text) => text,
                Err(e) => {
                    eprintln!("error: cannot read {path}: {e}");
                    return ExitCode::FAILURE;
                }
            };
            println!("{path}: {} words", text.split_whitespace().count());
            ExitCode::SUCCESS
        }
        EOF
        cat > py/main.py <<'EOF'
        import sys


        def main() -> int:
            if len(sys.argv) < 2:
                print("usage: count <file>", file=sys.stderr)
                return 2
            path = sys.argv[1]
            try:
                with open(path) as f:
                    text = f.read()
            except OSError as e:
                print(f"error: cannot read {path}: {e.strerror}", file=sys.stderr)
                return 1
            print(f"{path}: {len(text.split())} words")
            return 0


        sys.exit(main())
        EOF
        cp "$RS" rs/Dockerfile
        cp "$PY" py/Dockerfile
        printf 'Rust is fast\nPython is friendly\n' > notes.txt
        tag="rfp-check-$$"
        trap 'docker rmi --force "$tag-rs" "$tag-py" > /dev/null 2>&1 || true' EXIT
        docker build --quiet -t "$tag-rs" rs > /dev/null
        docker build --quiet -t "$tag-py" py > /dev/null
        for side in rs py; do
          test "$(docker run --rm -v "$PWD/notes.txt:/data/notes.txt:ro" "$tag-$side" /data/notes.txt)" = '/data/notes.txt: 6 words'
          if docker run --rm "$tag-$side" 2> err.txt; then echo "expected a usage error"; exit 1; fi
          grep -q 'usage: count <file>' err.txt
        done
      `,
      links: [
        [1, 1, 'Stage 1 uses the official Rust image, which includes Cargo and the compiler.'],
        [4, null, 'An optimized build. The result is <code>target/release/count</code>.'],
        [6, null, 'Stage 2 starts from a small, clean image. Nothing from stage 1 is kept unless it is copied.'],
        [7, 3, 'Copy only the finished program. No source code, no Cargo, no Rust compiler.'],
        [8, 5, 'Run the program. Arguments after the image name go to it: <code>docker run IMAGE notes.txt</code>.'],
      ],
    },
  ],
  quiz: [
    {
      type: 'output',
      q: 'This program is run with no arguments. What does it print?',
      code: code`
        use std::env;

        fn main() {
            println!("{}", env::args().count());
        }
      `,
      options: ['1', '0', '2'],
      answer: 0,
      explain: 'The first item is always the program itself, like <code>sys.argv[0]</code>. That is why the examples use <code>.skip(1)</code> or <code>.nth(1)</code>.',
    },
    {
      type: 'choice',
      q: 'What does the <code>--</code> in <code>cargo run -- --verbose</code> do?',
      options: [
        'It passes <code>--verbose</code> to your program instead of to Cargo',
        'It turns on debug output in Cargo',
        'It runs the release build',
        'Nothing; it is a comment',
      ],
      answer: 0,
      explain: 'Arguments before <code>--</code> are for Cargo (like <code>--release</code>), and arguments after it are for your program: <code>cargo run --release -- --verbose</code>.',
    },
    {
      type: 'compiles',
      q: 'Does this compile?',
      code: code`
        use std::process::ExitCode;

        fn main() -> ExitCode {
            println!("done");
            0
        }
      `,
      answer: false,
      explain: '<code>main</code> promises an <code>ExitCode</code>, but <code>0</code> is a number (error E0308, mismatched types). Write <code>ExitCode::SUCCESS</code>, or <code>ExitCode::from(0)</code>.',
    },
    {
      type: 'choice',
      q: 'Your tool can\'t open a file. Where should the message go?',
      options: [
        'To stderr with <code>eprintln!</code>, and exit with a non-zero code',
        'To stdout with <code>println!</code>, and exit with 0',
        'Into the output file',
        'Nowhere; just stop',
      ],
      answer: 0,
      explain: 'stdout is for real output that may be piped into another program. Errors go to stderr, and the exit code tells scripts and CI that something failed.',
    },
  ],
  exercise: {
    task: `<p>This greeting crashes when <code>GREETING_NAME</code> is not set, and on the Playground it is never set.
      Make it fall back to <code>world</code> instead, so it prints <code>Hello, world!</code>.</p>`,
    starter: code`
      use std::env;

      fn main() {
          let name = env::var("GREETING_NAME").unwrap();
          println!("Hello, {name}!");
      }
    `,
    solution: code`
      use std::env;

      fn main() {
          let name = env::var("GREETING_NAME").unwrap_or(String::from("world"));
          println!("Hello, {name}!");
      }
    `,
    expected: 'Hello, world!',
    hint: '<code>.unwrap()</code> crashes on an <code>Err</code>. <code>.unwrap_or(String::from("world"))</code> uses a default instead.',
  },
  cheat: [
    ['sys.argv', 'std::env::args()  // the program comes first, like argv[0]'],
    ['sys.argv[1]', 'env::args().nth(1)  // an Option'],
    ['argparse / click', 'clap  // a crate'],
    ['python main.py notes.txt', 'cargo run -- notes.txt'],
    ['open(path).read()', 'fs::read_to_string(&path)  // a Result'],
    ['for line in sys.stdin:', 'for line in io::stdin().lines() {'],
    ['os.environ.get("NAME", "x")', 'env::var("NAME").unwrap_or(String::from("x"))'],
    ['print(msg, file=sys.stderr)', 'eprintln!("{msg}");'],
    ['sys.exit(main())', 'fn main() -> ExitCode { ... }'],
    ['sys.exit(2)', 'std::process::exit(2);'],
    ['# no build step', 'cargo run --release -- notes.txt'],
    ['two [project.scripts]', 'src/bin/stats.rs + cargo run --bin stats'],
  ],
});
