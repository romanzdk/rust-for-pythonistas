LESSONS.push({
  id: 'testing-shipping',
  title: 'Tests, builds and shipping',
  summary: '#[test] and assert_eq!, reading cargo test output, debug vs release, one-file binaries, crates.io, and Rust inside Python wheels.',
  intro: `
    <p><code>cargo test</code> is Rust's <code>pytest</code>, and it is built in. It runs three kinds of tests:</p>
    <ul>
      <li><b>Unit tests</b>: in a <code>tests</code> module inside the same file as the code. They can test private functions.</li>
      <li><b>Integration tests</b>: files in the <code>tests/</code> folder. They use your crate from the outside, like a user would.</li>
      <li><b>Doc tests</b>: code examples inside <code>///</code> doc comments, like Python doctests. Examples in the docs are always run, so they can't go out of date.</li>
    </ul>
    <p>Shipping is also different from Python. A Python program needs Python and its packages on the target machine. A Rust
    program is compiled into <b>one executable file</b> that already contains all its dependencies.</p>`,
  examples: [
    {
      title: 'A unit test is a function with #[test]',
      text: `<p>pytest finds functions named <code>test_*</code>. Cargo finds functions marked <code>#[test]</code>. By
      convention they live at the bottom of the same file, in a module called <code>tests</code>. A test fails when it
      panics, and a failing <code>assert_eq!</code> panics.</p>`,
      test: true,
      pyLabel: 'Python · pytest',
      rsLabel: 'Rust · cargo test',
      py: code`
        def add(a: int, b: int) -> int:
            return a + b


        def test_add():
            assert add(2, 3) == 5


        def test_negative():
            assert add(-2, -3) == -5
      `,
      rs: code`
        pub fn add(a: i32, b: i32) -> i32 {
            a + b
        }

        #[cfg(test)]
        mod tests {
            use super::*;

            #[test]
            fn adds() {
                assert_eq!(add(2, 3), 5);
            }

            #[test]
            fn negative() {
                assert_eq!(add(-2, -3), -5);
            }
        }
      `,
      links: [
        [5, null, '<code>#[cfg(test)]</code>: compile this module only for <code>cargo test</code>. Test code never ends up in the program you ship.'],
        [6, null, 'An ordinary module named <code>tests</code>, inside the same file.'],
        [7, null, '<code>use super::*;</code> imports everything from the parent module (this file), even private functions. Without it, <code>add</code> would be unknown inside <code>tests</code>.'],
        [9, 5, '<code>#[test]</code> marks a test. The name doesn\'t matter, unlike pytest\'s <code>test_</code> prefix.'],
        [11, 6, '<code>assert_eq!(actual, expected)</code> is <code>assert actual == expected</code>. When it fails, it prints both values. <code>assert!(condition)</code> is the plain <code>assert</code>.'],
      ],
    },
    {
      title: 'Reading cargo test output',
      check: code`
        mkdir -p rs py/tests
        cd rs
        cargo new --quiet --vcs none --lib shop
        cd shop
        cat > src/lib.rs <<'EOF'
        pub fn add(a: i32, b: i32) -> i32 {
            a + b
        }

        #[cfg(test)]
        mod tests {
            use super::*;

            #[test]
            fn adds() {
                assert_eq!(add(2, 3), 5);
            }

            #[test]
            fn negative() {
                assert_eq!(add(-2, -3), -6);
            }
        }
        EOF
        if cargo test > out.txt 2>&1; then echo "cargo test should fail"; exit 1; fi
        grep -v -e '^[$] ' -e 'Compiling' -e 'Finished' -e 'Running' -e 'panicked at' -e 'test result' "$RS" | while IFS= read -r line; do
          grep -qxF -- "$line" out.txt || { echo "not in cargo test output: [$line]"; cat out.txt; exit 1; }
        done
        grep -q "panicked at src/lib.rs:16:9:" out.txt
        grep -qF "test result: FAILED. 1 passed; 1 failed; 0 ignored; 0 measured; 0 filtered out" out.txt
        cd ../../py
        cat > tests/test_math.py <<'EOF'
        def add(a: int, b: int) -> int:
            return a + b


        def test_add():
            assert add(2, 3) == 5


        def test_negative():
            assert add(-2, -3) == -6
        EOF
        if uvx --quiet pytest -p no:cacheprovider > out.txt 2>&1; then echo "pytest should fail"; exit 1; fi
        for line in 'collected 2 items' 'tests/test_math.py .F' '>       assert add(-2, -3) == -6' 'E       assert -5 == -6' 'tests/test_math.py:10: AssertionError' '1 failed, 1 passed'; do
          grep -qF -- "$line" out.txt || { echo "not in pytest output: [$line]"; cat out.txt; exit 1; }
        done
      `,
      text: `<p>Here is the output when the second test expects <code>-6</code> instead of <code>-5</code>. Both tools show the same
      things, in a different layout: what ran, what failed, where, and the two values that differ.</p>`,
      files: true,
      pyLabel: 'pytest output (shortened)',
      pyLang: 'plaintext',
      rsLabel: 'cargo test output',
      rsLang: 'plaintext',
      py: code`
        $ uv run pytest
        ================ test session starts ================
        collected 2 items

        tests/test_math.py .F                          [100%]

        ===================== FAILURES ======================
        ___________________ test_negative ___________________

            def test_negative():
        >       assert add(-2, -3) == -6
        E       assert -5 == -6

        tests/test_math.py:10: AssertionError
        ============ 1 failed, 1 passed in 0.01s ============
      `,
      rs: code`
        $ cargo test
           Compiling shop v0.1.0 (/home/me/shop)
            Finished \`test\` profile [unoptimized + debuginfo] target(s) in 0.20s
             Running unittests src/lib.rs (target/debug/deps/shop-cc2afb116b8768ed)

        running 2 tests
        test tests::adds ... ok
        test tests::negative ... FAILED

        failures:

        ---- tests::negative stdout ----

        thread 'tests::negative' panicked at src/lib.rs:16:9:
        assertion \`left == right\` failed
          left: -5
         right: -6
        note: run with \`RUST_BACKTRACE=1\` environment variable to display a backtrace


        failures:
            tests::negative

        test result: FAILED. 1 passed; 1 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
      `,
      links: [
        [3, null, 'Tests are compiled first, in the <code>test</code> profile (a debug build).'],
        [6, 3, 'How many tests were found.'],
        [8, 5, 'One line per test, named by module path: <code>tests::negative</code>.'],
        [14, [11, 14], 'Where it failed: file <code>src/lib.rs</code>, line 16, column 9, the <code>assert_eq!</code> line.'],
        [16, 12, '<code>left</code> is the <b>first</b> argument of <code>assert_eq!</code>, here what the code returned (-5).'],
        [17, 12, '<code>right</code> is the second argument, what the test expected (-6).'],
        [24, 15, 'The summary. <code>cargo test negative</code> runs only tests whose name contains "negative", like <code>pytest -k negative</code>.'],
      ],
    },
    {
      title: 'Integration tests and doc tests',
      check: code`
        mkdir rs py
        cd rs
        cargo new --quiet --vcs none --lib shop
        cd shop
        split_files "$RS"
        cargo test > out.txt 2>&1 || { cat out.txt; exit 1; }
        grep -q 'test add_from_outside ... ok' out.txt
        grep -q 'test src/lib.rs - add (line 3) ... ok' out.txt
        cd ../../py
        split_files "$PY"
        PYTHONPATH=src uvx --quiet pytest -q -p no:cacheprovider --doctest-modules src tests
      `,
      text: `<p>A file in <code>tests/</code> is compiled as a separate crate. It can only use what your library makes
      <code>pub</code>, exactly like a user who installed it. Doc tests are code blocks inside <code>///</code> comments.
      <code>cargo test</code> compiles and runs them, and docs.rs shows them as examples.</p>`,
      files: true,
      pyLabel: 'Python files',
      rsLabel: 'Rust files',
      py: code`
        # tests/test_shop.py
        from shop import add


        def test_add_from_outside():
            assert add(1, 1) == 2


        # src/shop/__init__.py
        def add(a, b):
            """Add two numbers.

            >>> add(2, 2)
            4
            """
            return a + b
      `,
      rs: code`
        // tests/shop.rs
        use shop::add;

        #[test]
        fn add_from_outside() {
            assert_eq!(add(1, 1), 2);
        }


        // src/lib.rs
        /// Add two numbers.
        ///
        /// \`\`\`
        /// assert_eq!(shop::add(2, 2), 4);
        /// \`\`\`
        pub fn add(a: i32, b: i32) -> i32 {
            a + b
        }
      `,
      links: [
        [2, 2, '<code>shop</code> is the crate name from <code>Cargo.toml</code>. A dash in the name becomes <code>_</code> here. No <code>mod</code> or <code>#[cfg(test)]</code> is needed: everything in <code>tests/</code> is test code.'],
        [4, 5, 'The same <code>#[test]</code> marker.'],
        [11, 11, '<code>///</code> is a doc comment, Rust\'s docstring. It is written <b>above</b> the item, not inside it.'],
        [13, [13, 14], 'A code block in a doc comment is a doc test. <code>cargo test</code> runs it. It can only use the public API, so it calls <code>shop::add</code>.'],
        [16, 10, 'The function being documented. <code>cargo doc --open</code> builds HTML docs for your crate and all its dependencies.'],
      ],
    },
    {
      title: 'Debug vs release builds',
      check: code`
        mkdir rs py
        (cd rs && cargo new --quiet shop && cd shop && source "$RS")
        (cd py && uv init --quiet shop && cd shop && source "$PY")
      `,
      text: `<p><code>cargo build</code> and <code>cargo run</code> make a <b>debug</b> build. It compiles fast, runs slowly, and
      checks for number overflow. <code>--release</code> turns on optimizations. Compiling takes longer, but the program
      often runs many times faster. Always measure speed with <code>--release</code>. A slow debug build doesn't tell you anything.</p>
      <p>The result is <b>one file</b> that contains your code and every dependency. Copy it to another machine with the
      same OS and CPU type and run it: no Python, no virtual environment, and no Rust needed there. To build for another
      platform, use <code>--target</code>, for example <code>--target x86_64-unknown-linux-musl</code> for a fully
      static Linux binary that fits in a tiny Docker image.</p>`,
      files: true,
      pyLabel: 'Terminal · Python',
      pyLang: 'bash',
      rsLabel: 'Terminal · Rust',
      rsLang: 'bash',
      py: code`
        uv run shop
        uv build
        ls dist/
        # shop-0.1.0-py3-none-any.whl  (needs Python + deps)
        uv pip install dist/shop-0.1.0-py3-none-any.whl
      `,
      rs: code`
        cargo run
        cargo build --release
        ls target/release/
        # shop  (the whole program in one file)
        ./target/release/shop
      `,
      links: [
        [1, 1, 'Debug build, then run. Fast to compile, slow to run.'],
        [2, 2, 'Optimized build. Use this for anything you measure or ship.'],
        [4, 4, 'The finished program. On Windows it is <code>shop.exe</code>.'],
        [5, 5, 'Runs anywhere with the same OS and CPU type. You only copy the one file.'],
      ],
    },
    {
      title: 'Publishing and installing',
      check: code`
        export CARGO_INSTALL_ROOT="$PWD/tools/cargo" UV_TOOL_DIR="$PWD/tools/uv" UV_TOOL_BIN_DIR="$PWD/tools/bin"
        cargo() { if [ "$1" = publish ]; then command cargo publish --dry-run --allow-dirty; else command cargo "$@"; fi; }
        uv() { if [ "$1" = publish ]; then command uv publish --dry-run; else command uv "$@"; fi; }
        mkdir rs py
        (cd rs && command cargo new --quiet --vcs none shop && cd shop && source "$RS")
        test -x tools/cargo/bin/rg
        (cd py && command uv init --quiet shop && cd shop && source "$PY")
        test -x tools/bin/ruff
      `,
      text: `<p>crates.io is Rust's PyPI. One difference: it stores <b>source code</b>, not built files like wheels. Whoever
      depends on your crate compiles it on their own machine. That's why the first build of a project takes a while.
      Command-line tools are installed with <code>cargo install</code>, which compiles them into
      <code>~/.cargo/bin</code>.</p>`,
      files: true,
      pyLabel: 'Terminal · Python',
      pyLang: 'bash',
      rsLabel: 'Terminal · Rust',
      rsLang: 'bash',
      py: code`
        uv build
        uv publish

        uv tool install ruff
      `,
      rs: code`
        cargo package
        cargo publish

        cargo install ripgrep
      `,
      links: [
        [1, 1, 'Packs the source into a <code>.crate</code> file (like an sdist) and checks that it builds on its own.'],
        [2, 2, 'Uploads to crates.io. A few minutes later, docs.rs has built its documentation. Versions can never be overwritten, only <i>yanked</i>.'],
        [4, 4, 'Downloads, compiles and installs the tool. The program is called <code>rg</code>.'],
      ],
    },
    {
      title: 'Rust inside a Python package',
      check: code`
        mkdir src
        cp "$RS" src/lib.rs
        cat > Cargo.toml <<'EOF'
        [package]
        name = "shop-fast"
        version = "0.1.0"
        edition = "2024"

        [lib]
        name = "shop_fast"
        crate-type = ["cdylib"]

        [dependencies]
        pyo3 = "0.30"
        EOF
        cat > pyproject.toml <<'EOF'
        [build-system]
        requires = ["maturin>=1.9,<2"]
        build-backend = "maturin"

        [project]
        name = "shop-fast"
        version = "0.1.0"
        EOF
        uv venv --quiet
        uvx --quiet maturin build --release --quiet --interpreter .venv/bin/python --out dist
        uv pip install --quiet dist/*.whl
        test "$(.venv/bin/python "$PY")" = 5
      `,
      text: `<p>Rust code can be shipped as a normal Python package. <b>PyO3</b> connects Rust to Python, and
      <b>maturin</b> builds the wheel: <code>maturin develop</code> installs it into your current virtual environment,
      and <code>maturin build --release</code> makes wheels to publish. pydantic-core, polars and orjson are built this way.
      ruff and uv are Rust programs that maturin wraps in wheels, which is why <code>pip install ruff</code> works.</p>`,
      files: true,
      pyLabel: 'Python · using it',
      rsLabel: 'Rust · src/lib.rs',
      py: code`
        # pip install shop-fast   (a wheel built by maturin)
        import shop_fast

        print(shop_fast.add(2, 3))
      `,
      rs: code`
        use pyo3::prelude::*;

        #[pyfunction]
        fn add(a: i64, b: i64) -> i64 {
            a + b
        }

        #[pymodule]
        fn shop_fast(m: &Bound<'_, PyModule>) -> PyResult<()> {
            m.add_function(wrap_pyfunction!(add, m)?)?;
            Ok(())
        }
      `,
      links: [
        [1, null, 'Imports PyO3. In <code>Cargo.toml</code>, <code>crate-type = ["cdylib"]</code> builds a shared library: the <code>.so</code> or <code>.pyd</code> file inside the wheel.'],
        [3, 4, '<code>#[pyfunction]</code> makes this callable from Python. PyO3 converts the Python <code>int</code> arguments to <code>i64</code> and the result back.'],
        [8, 2, '<code>#[pymodule]</code> defines what <code>import shop_fast</code> loads. The function name must match the module name.'],
        [9, null, '<code>Bound&lt;\'_, PyModule&gt;</code> is "the Python module object". The <code>\'_</code> is a lifetime (lesson 19). <code>PyResult</code> is a <code>Result</code> whose error becomes a Python exception.'],
        [10, 4, 'Registers <code>add</code> on the module, so <code>shop_fast.add</code> exists.'],
      ],
    },
  ],
  quiz: [
    {
      type: 'choice',
      q: 'What does <code>#[cfg(test)]</code> above <code>mod tests</code> do?',
      options: [
        'Compiles the module only for <code>cargo test</code>, so test code is not in the shipped program',
        'Runs the tests every time the program starts',
        'Marks the module as private',
        'Tells pytest where the tests are',
      ],
      answer: 0,
      explain: '<code>cfg</code> means "only compile this when...". <code>cfg(test)</code> is true only while building tests. You will also see <code>cfg(windows)</code> or <code>cfg(feature = "json")</code> for platform- and feature-specific code.',
    },
    {
      type: 'choice',
      q: '<code>assert_eq!(total(&amp;cart), 30)</code> fails with <code>left: 25</code> and <code>right: 30</code>. What did <code>total</code> return?',
      options: ['25', '30', '55', 'It did not return'],
      answer: 0,
      explain: '<code>left</code> is the first argument, which is the call, and <code>right</code> is the second, which is the expected value. Putting the actual value first is the usual convention.',
    },
    {
      type: 'compiles',
      test: true,
      q: 'Does <code>cargo test</code> compile this?',
      code: code`
        pub fn double(x: i32) -> i32 {
            x * 2
        }

        #[cfg(test)]
        mod tests {
            #[test]
            fn doubles() {
                assert_eq!(double(4), 8);
            }
        }
      `,
      answer: false,
      explain: '<code>tests</code> is a separate module, so it can\'t see <code>double</code> automatically (error E0425: cannot find function). Add <code>use super::*;</code> at the top of the module.',
    },
    {
      type: 'choice',
      q: 'After <code>cargo build --release</code> in a crate named <code>shop</code>, where is the program?',
      options: ['<code>target/release/shop</code>', '<code>dist/shop.whl</code>', '<code>src/main</code>', '<code>~/.cargo/bin/shop</code>'],
      answer: 0,
      explain: 'Debug builds go to <code>target/debug/</code> and release builds to <code>target/release/</code>. <code>~/.cargo/bin</code> is where <code>cargo install</code> puts tools.',
    },
    {
      type: 'choice',
      q: 'You copy a release binary built for Linux x86-64 to a Linux x86-64 server. What else must be installed there to run it?',
      options: [
        'Usually nothing, since dependencies are compiled into the file',
        'Rust and Cargo',
        'The <code>Cargo.lock</code> file',
        'A virtual environment with the dependencies',
      ],
      answer: 0,
      explain: 'Rust dependencies are compiled into the binary. The one usual exception is the system C library (glibc). A <code>musl</code> target build avoids even that.',
    },
  ],
  exercise: {
    test: true,
    task: `<p>The tests for <code>discounted</code> fail. Press <b>Run</b> to run them, read the <code>left</code> /
      <code>right</code> lines, and fix the <b>one line</b> in the function. Don't change the tests.</p>`,
    starter: code`
      /// Price in cents after a discount in percent.
      pub fn discounted(cents: u32, percent: u32) -> u32 {
          cents * percent / 100
      }

      #[cfg(test)]
      mod tests {
          use super::*;

          #[test]
          fn ten_percent_off() {
              assert_eq!(discounted(1000, 10), 900);
          }

          #[test]
          fn no_discount() {
              assert_eq!(discounted(1000, 0), 1000);
          }
      }
    `,
    solution: code`
      /// Price in cents after a discount in percent.
      pub fn discounted(cents: u32, percent: u32) -> u32 {
          cents * (100 - percent) / 100
      }

      #[cfg(test)]
      mod tests {
          use super::*;

          #[test]
          fn ten_percent_off() {
              assert_eq!(discounted(1000, 10), 900);
          }

          #[test]
          fn no_discount() {
              assert_eq!(discounted(1000, 0), 1000);
          }
      }
    `,
    hint: 'The code computes the discount itself (100 for 10% of 1000), not the price that is left. You pay <code>100 - percent</code> percent.',
  },
  breaks: [
    `Unit tests live next to the code, in a <code>#[cfg(test)] mod tests</code> block in the same file, and they can test private
      functions. Python usually keeps tests in a separate <code>tests/</code> folder.`,
    `No fixtures and no <code>parametrize</code> built in. A test is a plain function. For a table of cases, loop over an array
      inside one test.`,
    `<code>cargo test</code> runs tests in parallel, on several threads, by default. Tests that share a file or a global
      setting can get in each other's way.`,
    `A release build runs on one platform. A pure-Python wheel runs anywhere Python does. A Rust binary is built for one OS and
      CPU type, so you build one for Linux, one for macOS, and so on.`,
  ],
  translate: {
    task: `<p>Here is a short Python program with plain <code>assert</code>s. Write the Rust version, with
      <code>assert!</code> or <code>assert_eq!</code> in <code>main</code>: it should print exactly the same thing. When it
      passes, break the function on purpose and run it again to see what a failed assert looks like.</p>`,
    py: code`
      def is_leap(year: int) -> bool:
          return year % 4 == 0 and (year % 100 != 0 or year % 400 == 0)


      assert is_leap(2024)
      assert not is_leap(1900)
      assert is_leap(2000)
      assert not is_leap(2023)
      print("all checks pass")
    `,
    starter: code`
      // Write is_leap here.

      fn main() {
      }
    `,
    solution: code`
      fn is_leap(year: i32) -> bool {
          year % 4 == 0 && (year % 100 != 0 || year % 400 == 0)
      }

      fn main() {
          assert!(is_leap(2024));
          assert!(!is_leap(1900));
          assert_eq!(is_leap(2000), true);
          assert_eq!(is_leap(2023), false);
          println!("all checks pass");
      }
    `,
    expected: 'all checks pass',
    hint: `<code>and</code>, <code>or</code> and <code>not</code> are <code>&amp;&amp;</code>, <code>||</code> and
      <code>!</code>. <code>assert x</code> is <code>assert!(x);</code>, and <code>assert a == b</code> is
      <code>assert_eq!(a, b);</code>.`,
  },
  cheat: [
    ['pytest', 'cargo test'],
    ['pytest -k negative', 'cargo test negative'],
    ['pytest -s', 'cargo test -- --nocapture'],
    ['def test_add():', '#[test]\nfn add_works() { }'],
    ['assert a == b', 'assert_eq!(a, b);'],
    ['assert ok', 'assert!(ok);'],
    ['with pytest.raises(ValueError): ...', '#[should_panic]  // or assert!(r.is_err());'],
    ['"""Docstring. >>> add(2, 2)"""', '/// Doc comment with a ``` code block'],
    ['sphinx-build docs/ html/', 'cargo doc --open'],
    ['ruff format / ruff check', 'cargo fmt / cargo clippy'],
    ['uv build', 'cargo build --release'],
    ['uv publish', 'cargo publish'],
    ['uv tool install ruff', 'cargo install ripgrep'],
    ['# C extension module', 'pyo3 + maturin  // Rust inside a wheel'],
  ],
});
