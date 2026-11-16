{
  // Shared by the checks below: build src/lib.rs (the shown Rust) into a wheel and install it into .venv, then run the
  // shown Python file twice, as pure Python and with `from <module> import *` in front of its "# Use it" part.
  // Both runs must print exactly what the `# ...` comments after the print calls say.
  const PYO3 = String.raw`
pyo3_build() {
  mkdir -p src
  cp "$RS" src/lib.rs
  cat > Cargo.toml <<EOF
[package]
name = "$1"
version = "0.1.0"
edition = "2024"

[lib]
crate-type = ["cdylib"]

[dependencies]
pyo3 = "0.30"
EOF
  cat > pyproject.toml <<EOF
[build-system]
requires = ["maturin>=1.9,<2"]
build-backend = "maturin"

[project]
name = "$1"
version = "0.1.0"
EOF
  uv venv --quiet
  uvx --quiet maturin build --release --quiet --interpreter .venv/bin/python --out dist
  uv pip install --quiet dist/*.whl
}
same_output() {
  sed -n 's/^.*print(.*)  # //p' "$PY" > expected.txt
  test -s expected.txt
  python3 "$PY" > pure.txt
  diff expected.txt pure.txt
  { echo "from $1 import *"; sed -n '/^# Use it/,$p' "$PY"; } > use.py
  .venv/bin/python use.py > rust.txt
  diff expected.txt rust.txt
}
`;

  LESSONS.push({
    id: 'pyo3',
    title: 'Rust inside Python with PyO3',
    summary: 'Write a Python module in Rust: functions, type conversions, exceptions, classes and the GIL.',
    intro: `
      <p>This is where many Python developers first meet Rust: a slow part of a Python program is rewritten in Rust,
      and Python keeps calling it like any other module. pydantic-core, polars, orjson and tokenizers all work this way.</p>
      <p>Two tools do it together:</p>
      <ul>
        <li><b>PyO3</b> is a Rust crate. Its attributes, like <code>#[pyfunction]</code> and <code>#[pyclass]</code>, turn Rust
          functions and structs into Python functions and classes, and convert values in both directions.</li>
        <li><b>maturin</b> is a build tool. It runs Cargo and packs the result into a normal wheel that pip and uv can
          install.</li>
      </ul>
      <p>Lesson 18 showed the smallest possible module. This lesson goes further. In every example, the left side is a
      pure-Python module and the right side is the Rust version of it. The calls at the bottom of the Python file work
      with either one, and the checks run them both ways to make sure they print the same thing.</p>
      <p>The Rust Playground can't build Python modules, so the examples here have no Playground link. The exercises at
      the end are plain Rust.</p>`,
    examples: [
      {
        title: 'The project: two config files',
        text: `<p>A PyO3 project is a Rust crate and a Python package at the same time, so it has both config files side by
        side:</p>
        <pre>stats/
├── Cargo.toml        the Rust side
├── pyproject.toml    the Python side
└── src/lib.rs        the code</pre>
        <p>The commands you need:</p>
        <ul>
          <li><code>maturin develop</code> builds the module and installs it into the active virtual environment. Rust is
            compiled, so run it again after every change to the Rust code, then restart Python.</li>
          <li><code>maturin build --release</code> builds wheels to publish, in <code>target/wheels/</code>.</li>
          <li><code>pip install .</code> and <code>uv build</code> work too, because <code>pyproject.toml</code> names maturin as
            the build backend.</li>
        </ul>`,
        files: true,
        pyLabel: 'pyproject.toml',
        pyLang: 'ini',
        rsLabel: 'Cargo.toml',
        rsLang: 'ini',
        py: code`
          [build-system]
          requires = ["maturin>=1.9,<2"]
          build-backend = "maturin"

          [project]
          name = "stats"
          version = "0.1.0"
          requires-python = ">=3.9"
        `,
        rs: code`
          [package]
          name = "stats"
          version = "0.1.0"
          edition = "2024"

          [lib]
          crate-type = ["cdylib"]

          [dependencies]
          pyo3 = "0.30"
        `,
        check: code`
          cp "$RS" Cargo.toml
          cp "$PY" pyproject.toml
          mkdir src
          cat > src/lib.rs <<'EOF'
          use pyo3::prelude::*;

          #[pyfunction]
          fn hello() -> &'static str {
              "hello from Rust"
          }

          #[pymodule]
          fn stats(m: &Bound<'_, PyModule>) -> PyResult<()> {
              m.add_function(wrap_pyfunction!(hello, m)?)?;
              Ok(())
          }
          EOF
          uv venv --quiet
          VIRTUAL_ENV="$PWD/.venv" uvx --quiet maturin develop --uv --release --quiet
          test "$(.venv/bin/python -c 'import stats; print(stats.hello())')" = "hello from Rust"
          rm -rf .venv
          uv venv --quiet
          uv pip install --quiet .
          test "$(.venv/bin/python -c 'import stats; print(stats.hello())')" = "hello from Rust"
        `,
        links: [
          [1, 5, `<code>[package]</code> and <code>[project]</code> say the same thing twice: the name and the version. Python tools
            read <code>pyproject.toml</code>; Cargo reads <code>Cargo.toml</code>.`],
          [7, 3, `<code>cdylib</code> means "build a shared library" (a <code>.so</code> file, or <code>.pyd</code> on Windows)
            instead of a program. That file is what Python imports. <code>build-backend = "maturin"</code> tells pip and uv to
            let maturin run Cargo and put the file into a wheel.`],
          [10, 2, `<code>pyo3</code> is the Rust side of the bridge: the attributes and the type conversions. maturin is only
            needed to build, so it is listed on the Python side.`],
        ],
      },
      {
        title: 'Rust functions Python can call',
        text: `<p>Mark a function with <code>#[pyfunction]</code> and register it in the <code>#[pymodule]</code>, and Python can
        call it. PyO3 converts the arguments and the return value for you, using the types in the signature:</p>
        <ul>
          <li><code>int</code> ↔ <code>i64</code>, <code>u8</code>, <code>usize</code>… and <code>float</code> ↔ <code>f64</code></li>
          <li><code>str</code> ↔ <code>&amp;str</code> or <code>String</code></li>
          <li><code>list</code> ↔ <code>Vec&lt;T&gt;</code> and <code>dict</code> ↔ <code>HashMap&lt;K, V&gt;</code></li>
          <li><code>None</code> or a value ↔ <code>Option&lt;T&gt;</code></li>
        </ul>
        <p>Each value is converted when it crosses over: a Python list becomes a new Rust <code>Vec</code>, item by item.</p>`,
        files: true,
        pyLabel: 'Python · stats.py',
        rsLabel: 'Rust · src/lib.rs',
        py: code`
          from collections import Counter


          def mean(values: list[float]) -> float:
              return sum(values) / len(values)


          def word_counts(text: str) -> dict[str, int]:
              return dict(Counter(text.split()))


          def greet(name: str | None = None) -> str:
              return f"Hello, {name if name is not None else 'stranger'}!"


          # Use it: the same calls work with the Rust module
          print(mean([1.0, 2.0, 6.0]))  # 3.0
          print(sorted(word_counts("to be or not to be").items()))  # [('be', 2), ('not', 1), ('or', 1), ('to', 2)]
          print(greet())  # Hello, stranger!
          print(greet("Ada"))  # Hello, Ada!
        `,
        rs: code`
          use pyo3::prelude::*;
          use std::collections::HashMap;

          #[pyfunction]
          fn mean(values: Vec<f64>) -> f64 {
              values.iter().sum::<f64>() / values.len() as f64
          }

          #[pyfunction]
          fn word_counts(text: &str) -> HashMap<String, usize> {
              let mut counts = HashMap::new();
              for word in text.split_whitespace() {
                  *counts.entry(word.to_string()).or_insert(0) += 1;
              }
              counts
          }

          #[pyfunction]
          #[pyo3(signature = (name=None))]
          fn greet(name: Option<&str>) -> String {
              format!("Hello, {}!", name.unwrap_or("stranger"))
          }

          #[pymodule]
          fn stats(m: &Bound<'_, PyModule>) -> PyResult<()> {
              m.add_function(wrap_pyfunction!(mean, m)?)?;
              m.add_function(wrap_pyfunction!(word_counts, m)?)?;
              m.add_function(wrap_pyfunction!(greet, m)?)?;
              Ok(())
          }
        `,
        check: PYO3 + code`
          pyo3_build stats
          same_output stats
        `,
        links: [
          [1, null, `<code>pyo3::prelude::*</code> brings in everything the attributes need, like <code>use</code> with a star.`],
          [4, 4, `<code>#[pyfunction]</code> makes this function callable from Python.`],
          [5, 4, `Python passes a <code>list</code> of numbers. PyO3 checks each item and copies it into a new
            <code>Vec&lt;f64&gt;</code>. Python <code>int</code>s are accepted too. A <code>str</code> in the list raises
            <code>TypeError</code> before any Rust code runs.`],
          [10, [8, 18], `The returned <code>HashMap</code> becomes a Python <code>dict</code>. Its order is random (lesson 7), which is
            why the call below sorts the items.`],
          [19, 12, `Rust has no default arguments (lesson 5), but PyO3 can add them for Python callers:
            <code>signature = (name=None)</code> makes <code>greet()</code> work without an argument.`],
          [20, 12, `<code>Option&lt;&amp;str&gt;</code>: Python's <code>None</code> arrives as <code>None</code>, and a string as
            <code>Some(...)</code>.`],
          [24, null, `<code>#[pymodule]</code> is what <code>import stats</code> runs. The function name must match the module
            name in <code>Cargo.toml</code>.`],
          [26, null, `Each function must be added to the module by hand. Forget a line, and Python gets an
            <code>AttributeError</code>.`],
        ],
      },
      {
        title: 'Errors become exceptions',
        text: `<p>A <code>#[pyfunction]</code> that can fail returns a <code>PyResult&lt;T&gt;</code>, a <code>Result</code> whose
        error is a Python exception. <code>Ok(value)</code> returns normally. <code>Err(PyValueError::new_err("..."))</code>
        raises <code>ValueError</code> in Python, so the caller's <code>try</code> / <code>except</code> catches it as usual.
        Every built-in exception has a type like this: <code>PyTypeError</code>, <code>PyKeyError</code> and so on.</p>`,
        files: true,
        pyLabel: 'Python · ages.py',
        rsLabel: 'Rust · src/lib.rs',
        py: code`
          def parse_age(text: str) -> int:
              try:
                  age = int(text)
              except ValueError:
                  raise ValueError(f"not a number: {text}")
              if age > 150:
                  raise ValueError(f"out of range: {age}")
              return age


          # Use it: the same calls work with the Rust module
          def show(text: str) -> str:
              try:
                  return str(parse_age(text))
              except ValueError as e:
                  return f"ValueError: {e}"


          print(show("42"))  # 42
          print(show("abc"))  # ValueError: not a number: abc
          print(show("200"))  # ValueError: out of range: 200
        `,
        rs: code`
          use pyo3::exceptions::PyValueError;
          use pyo3::prelude::*;

          #[pyfunction]
          fn parse_age(text: &str) -> PyResult<u8> {
              let age: u8 = text
                  .parse()
                  .map_err(|_| PyValueError::new_err(format!("not a number: {text}")))?;
              if age > 150 {
                  return Err(PyValueError::new_err(format!("out of range: {age}")));
              }
              Ok(age)
          }

          #[pymodule]
          fn ages(m: &Bound<'_, PyModule>) -> PyResult<()> {
              m.add_function(wrap_pyfunction!(parse_age, m)?)?;
              Ok(())
          }
        `,
        check: PYO3 + code`
          pyo3_build ages
          same_output ages
        `,
        links: [
          [1, null, `Python's built-in exceptions live in <code>pyo3::exceptions</code>, each with a <code>Py</code> in front.`],
          [5, 1, `<code>PyResult&lt;u8&gt;</code>: either an age, or a Python exception. The <code>u8</code> becomes a Python
            <code>int</code>.`],
          [8, [4, 5], `<code>map_err</code> swaps the parse error for a <code>ValueError</code>, and <code>?</code> returns it
            (lesson 12). Together they do what <code>except ValueError: raise ValueError(...)</code> does.`],
          [10, 7, `<code>return Err(...)</code> is <code>raise</code>.`],
          [12, 8, `<code>Ok(age)</code> is a normal <code>return</code>.`],
        ],
      },
      {
        title: 'A Rust struct as a Python class',
        text: `<p><code>#[pyclass]</code> turns a struct into a Python class, and <code>#[pymethods]</code> turns its
        <code>impl</code> block into methods. <code>#[new]</code> marks the constructor, which plays the part of
        <code>__init__</code>. Fields are hidden from Python unless you expose them; <code>#[pyo3(get)]</code> exposes one
        read-only, like a <code>@property</code> without a setter. Dunder methods such as <code>__repr__</code> are written
        under their Python names.</p>`,
        files: true,
        pyLabel: 'Python · counters.py',
        rsLabel: 'Rust · src/lib.rs',
        py: code`
          class Counter:
              def __init__(self, step: int = 1):
                  self._count = 0
                  self._step = step

              @property
              def count(self) -> int:
                  return self._count

              def bump(self) -> int:
                  self._count += self._step
                  return self._count

              def __repr__(self) -> str:
                  return f"Counter(count={self._count}, step={self._step})"


          # Use it: the same calls work with the Rust module
          c = Counter(step=2)
          c.bump()
          print(c.bump())  # 4
          print(c.count)  # 4
          print(c)  # Counter(count=4, step=2)
        `,
        rs: code`
          use pyo3::prelude::*;

          #[pyclass]
          struct Counter {
              #[pyo3(get)]
              count: i64,
              step: i64,
          }

          #[pymethods]
          impl Counter {
              #[new]
              #[pyo3(signature = (step=1))]
              fn new(step: i64) -> Self {
                  Counter { count: 0, step }
              }

              fn bump(&mut self) -> i64 {
                  self.count += self.step;
                  self.count
              }

              fn __repr__(&self) -> String {
                  format!("Counter(count={}, step={})", self.count, self.step)
              }
          }

          #[pymodule]
          fn counters(m: &Bound<'_, PyModule>) -> PyResult<()> {
              m.add_class::<Counter>()?;
              Ok(())
          }
        `,
        check: PYO3 + code`
          pyo3_build counters
          same_output counters
          .venv/bin/python - <<'EOF'
          import counters

          c = counters.Counter()
          try:
              c.count = 5
          except AttributeError:
              pass
          else:
              raise SystemExit("count should be read-only")
          EOF
        `,
        links: [
          [3, 1, `<code>#[pyclass]</code>: this struct becomes a Python class called <code>Counter</code>.`],
          [5, [6, 7, 8], `<code>#[pyo3(get)]</code> lets Python read <code>c.count</code>. Setting it raises
            <code>AttributeError</code>, as with a property that has no setter. <code>step</code> has no attribute, so Python
            can't see it at all.`],
          [10, null, `<code>#[pymethods]</code>: every method in this <code>impl</code> block is visible from Python.`],
          [12, 2, `<code>#[new]</code> is the constructor: <code>Counter(step=2)</code> in Python calls it. The
            <code>signature</code> line adds the default, as in the previous example.`],
          [18, 10, `<code>&amp;mut self</code>, because <code>bump</code> changes the counter (lesson 9). PyO3 makes sure only one
            caller changes it at a time.`],
          [23, 14, `Python calls <code>__repr__</code> for <code>repr(c)</code> and, with no <code>__str__</code>, for
            <code>print(c)</code> too.`],
          [30, null, `Classes are registered with <code>add_class</code>, the way functions are registered with
            <code>add_function</code>.`],
        ],
      },
      {
        title: 'Letting other threads run: releasing the GIL',
        text: `<p>Rust code called from Python normally holds the GIL (lesson 22), so other Python threads wait while it runs.
        A function that does a lot of pure-Rust work can let go of the GIL with <code>py.detach(...)</code>. Inside the
        closure it can't touch Python objects, but other threads can run Python meanwhile, and several threads can run the
        Rust code truly in parallel. That is how libraries like polars use every core. (In PyO3 versions before 0.26 this
        was called <code>allow_threads</code>.)</p>`,
        files: true,
        pyLabel: 'Python · heavy.py',
        rsLabel: 'Rust · src/lib.rs',
        py: code`
          def checksum(n: int) -> int:
              return sum(x * x % 7 for x in range(n))


          # Use it: the same calls work with the Rust module
          from concurrent.futures import ThreadPoolExecutor

          with ThreadPoolExecutor() as pool:
              print(list(pool.map(checksum, [10, 1000, 100000])))  # [19, 2001, 199999]
        `,
        rs: code`
          use pyo3::prelude::*;

          #[pyfunction]
          fn checksum(py: Python<'_>, n: u64) -> u64 {
              py.detach(|| (0..n).map(|x| x * x % 7).sum())
          }

          #[pymodule]
          fn heavy(m: &Bound<'_, PyModule>) -> PyResult<()> {
              m.add_function(wrap_pyfunction!(checksum, m)?)?;
              Ok(())
          }
        `,
        check: PYO3 + code`
          pyo3_build heavy
          same_output heavy
        `,
        links: [
          [4, 1, `<code>py: Python&lt;'_&gt;</code> is proof that this code holds the GIL. PyO3 passes it in by itself, so Python
            callers still write <code>checksum(10)</code> with one argument.`],
          [5, 2, `<code>py.detach</code> releases the GIL, runs the closure, and takes the GIL back. The pure-Python version
            holds the GIL the whole time, so its threads take turns instead of running together.`],
        ],
      },
    ],
    quiz: [
      {
        type: 'choice',
        q: 'What does <code>crate-type = ["cdylib"]</code> in <code>Cargo.toml</code> do?',
        options: [
          'It builds a shared library that Python can import, instead of a program',
          'It makes the crate a Python package on crates.io',
          'It turns on the GIL',
          'It builds a Docker image',
        ],
        answer: 0,
        explain: `A <code>cdylib</code> is a <code>.so</code> file (<code>.pyd</code> on Windows). maturin puts it into a wheel, and
          <code>import stats</code> loads it.`,
      },
      {
        type: 'choice',
        q: 'Python calls the Rust <code>fn mean(values: Vec&lt;f64&gt;)</code> as <code>mean(["a", "b"])</code>. What happens?',
        options: [
          'Python gets a <code>TypeError</code>, before any Rust code runs',
          'The Rust function gets <code>NaN</code> values',
          'The Python process crashes',
          'It is a compile error',
        ],
        answer: 0,
        explain: `PyO3 converts every argument before it calls your function. A <code>str</code> can't become an
          <code>f64</code>, so the call raises <code>TypeError</code>. Python's own type hints never stop a call like this.`,
      },
      {
        type: 'choice',
        q: 'A <code>#[pyfunction]</code> calls <code>panic!("oh no")</code>. What does Python see?',
        options: [
          'The process ends at once',
          'A <code>pyo3_runtime.PanicException</code>, which <code>except Exception</code> does not catch',
          'A <code>ValueError</code>',
          'Nothing: the panic is ignored',
        ],
        answer: 1,
        explain: `PyO3 catches the panic at the border and raises <code>PanicException</code>. It is based on
          <code>BaseException</code>, like <code>KeyboardInterrupt</code>, because a panic means a bug, not a normal error. For
          errors you expect, return <code>Err(PyValueError::new_err(...))</code>.`,
      },
      {
        type: 'choice',
        q: 'You changed <code>src/lib.rs</code> while a Python shell has the module imported. What do you need to do?',
        options: [
          'Nothing: Python reloads it',
          'Run <code>importlib.reload(stats)</code>',
          'Run <code>maturin develop</code> again, then start a new Python process',
          'Only restart Python',
        ],
        answer: 2,
        explain: `Rust is compiled, so the change has to be built first. And Python can't reload a compiled extension module, so
          the new version only appears in a fresh process.`,
      },
      {
        type: 'choice',
        q: 'A <code>#[pyfunction]</code> returns a <code>HashMap&lt;String, usize&gt;</code>. What does Python get?',
        options: [
          'A <code>dict</code>, in random key order',
          'A <code>dict</code>, sorted by key',
          'A list of tuples',
          'A special Rust object you must convert yourself',
        ],
        answer: 0,
        explain: `PyO3 builds a real <code>dict</code> from the map. A <code>HashMap</code> has no order (lesson 7), so neither has
          the new <code>dict</code>. Return a <code>BTreeMap</code> if you want the keys sorted.`,
      },
    ],
    exercise: {
      test: true,
      task: `<p>The Playground can't build Python modules, so this is the plain Rust function that the module from the examples
        would wrap. Its tests fail: for an empty list it gives back <code>Some(NaN)</code>, because 0 divided by 0 is not a
        number. Make it return <code>None</code> for an empty list.</p>
        <p>With PyO3, a thin <code>#[pyfunction]</code> around it would turn that <code>None</code> into a
        <code>ValueError</code>. Keeping the logic in plain Rust like this is common: it can be tested with
        <code>cargo test</code>, without Python.</p>`,
      starter: code`
        pub fn mean(values: &[f64]) -> Option<f64> {
            let total: f64 = values.iter().sum();
            Some(total / values.len() as f64)
        }

        #[cfg(test)]
        mod tests {
            use super::*;

            #[test]
            fn average_of_three() {
                assert_eq!(mean(&[1.0, 2.0, 6.0]), Some(3.0));
            }

            #[test]
            fn empty_list_has_no_mean() {
                assert_eq!(mean(&[]), None);
            }
        }
      `,
      solution: code`
        pub fn mean(values: &[f64]) -> Option<f64> {
            if values.is_empty() {
                return None;
            }
            let total: f64 = values.iter().sum();
            Some(total / values.len() as f64)
        }

        #[cfg(test)]
        mod tests {
            use super::*;

            #[test]
            fn average_of_three() {
                assert_eq!(mean(&[1.0, 2.0, 6.0]), Some(3.0));
            }

            #[test]
            fn empty_list_has_no_mean() {
                assert_eq!(mean(&[]), None);
            }
        }
      `,
      hint: `Check <code>values.is_empty()</code> at the top and <code>return None;</code> early, as in the "return for an
        early exit" example of lesson 5.`,
    },
    breaks: [
      `The module is compiled. Editing a <code>.py</code> file needs nothing; after a change to the Rust code you run
        <code>maturin develop</code> again and start a new Python process.`,
      `Types are checked at the border. PyO3 converts every argument before your Rust code runs, so a wrong type raises
        <code>TypeError</code> at the call. Python's own type hints are never checked like this.`,
      `Crossing the border copies data. A Python list passed as <code>Vec&lt;f64&gt;</code> becomes a new Rust
        <code>Vec</code>, item by item, and the result is converted back. For big arrays, libraries pass memory buffers
        instead, for example through the <code>numpy</code> crate.`,
      `A panic doesn't crash Python, but it isn't a normal exception either. It becomes
        <code>pyo3_runtime.PanicException</code>, a <code>BaseException</code>, so <code>except Exception</code> lets it
        through.`,
      `The GIL is still there. Rust code inside a <code>#[pyfunction]</code> holds it, so other Python threads wait, unless the
        function lets go with <code>py.detach(...)</code>.`,
    ],
    translate: {
      task: `<p>Before adding PyO3 attributes, it helps to write the plain Rust version of the Python function you want to
        move. The attributes come later and don't change the body. Write the Rust version of this Python: it should print
        exactly the same thing.</p>`,
      py: code`
        def normalize(scores: list[float]) -> list[float]:
            top = max(scores)
            return [round(s / top, 2) for s in scores]


        print(normalize([50.0, 100.0, 75.0, 33.0]))
      `,
      starter: code`
        fn normalize(scores: &[f64]) -> Vec<f64> {
            Vec::new()
        }

        fn main() {
            println!("{:?}", normalize(&[50.0, 100.0, 75.0, 33.0]));
        }
      `,
      solution: code`
        fn normalize(scores: &[f64]) -> Vec<f64> {
            let top = scores.iter().cloned().fold(f64::MIN, f64::max);
            scores.iter().map(|s| (s / top * 100.0).round() / 100.0).collect()
        }

        fn main() {
            println!("{:?}", normalize(&[50.0, 100.0, 75.0, 33.0]));
        }
      `,
      expected: '[0.5, 1.0, 0.75, 0.33]',
      hint: `<code>f64</code> has no <code>max()</code> on an iterator, because <code>NaN</code> can't be compared. Use
        <code>scores.iter().cloned().fold(f64::MIN, f64::max)</code>. Round to 2 places with
        <code>(x * 100.0).round() / 100.0</code>, and build the list with <code>.map(...).collect()</code>.`,
    },
    cheat: [
      ['# a pure-Python module stats.py', 'src/lib.rs with #[pymodule] fn stats(...)'],
      ['def mean(values: list[float]) -> float:', '#[pyfunction]\nfn mean(values: Vec<f64>) -> f64 {'],
      ['def greet(name=None):', '#[pyfunction]\n#[pyo3(signature = (name=None))]\nfn greet(name: Option<&str>) -> String {'],
      ['raise ValueError("no values")', 'return Err(PyValueError::new_err("no values"));'],
      ['def f() -> int:  # may raise', 'fn f() -> PyResult<i64> {'],
      ['class Counter:', '#[pyclass]\nstruct Counter { ... }'],
      ['def __init__(self, step=1):', '#[new]\n#[pyo3(signature = (step=1))]\nfn new(step: i64) -> Self {'],
      ['@property\ndef count(self): ...', '#[pyo3(get)]\ncount: i64,'],
      ['def __repr__(self): ...', 'fn __repr__(&self) -> String {'],
      ['list / dict / None', 'Vec<T> / HashMap<K, V> / Option<T>'],
      ['pip install -e .', 'maturin develop  // again after every Rust change'],
      ['python -m build', 'maturin build --release'],
    ],
  });
}
