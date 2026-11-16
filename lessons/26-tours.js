LESSONS.push({
  id: 'tours',
  title: 'Reading real projects: uv, ruff and pydantic-core',
  summary: 'Five short pieces of real Rust from tools you use every day, read line by line next to the Python you would write.',
  intro: `
    <p>Time to read code nobody wrote for a course. The examples below are taken unchanged from three Rust projects that
    Python developers use every day:</p>
    <ul>
      <li><a href="https://github.com/astral-sh/uv" target="_blank" rel="noopener">uv</a>, the package manager
        (<a href="https://github.com/astral-sh/uv/blob/57f7f6835992a7403512ce71d32b7cf7a45510dd/LICENSE-MIT" target="_blank" rel="noopener">MIT</a>
        or <a href="https://github.com/astral-sh/uv/blob/57f7f6835992a7403512ce71d32b7cf7a45510dd/LICENSE-APACHE" target="_blank" rel="noopener">Apache-2.0</a> license),</li>
      <li><a href="https://github.com/astral-sh/ruff" target="_blank" rel="noopener">ruff</a>, the linter
        (<a href="https://github.com/astral-sh/ruff/blob/0222c19dd8e0c9a927f2e47bf3774a108431da25/LICENSE" target="_blank" rel="noopener">MIT</a> license),</li>
      <li><a href="https://github.com/pydantic/pydantic-core" target="_blank" rel="noopener">pydantic-core</a>, the engine
        inside pydantic (<a href="https://github.com/pydantic/pydantic-core/blob/383eb95a19433754c0cecf7025b50c26b6d97a36/LICENSE" target="_blank" rel="noopener">MIT</a>
        license, © Samuel Colvin).</li>
    </ul>
    <p>Each excerpt is pinned to one commit, and <b>View on GitHub</b> opens exactly those lines, so you can scroll
    around and see the rest of the file. Next to it is the Python you would write for the same job. You won't know
    every name, and that's normal in real code: read the shape, use the hover notes, and guess the rest from the names.</p>`,
  examples: [
    {
      title: 'ruff: is this a good module name?',
      text: `<p>ruff checks that module names follow PEP 8: lowercase letters, digits and underscores, not starting with a
      digit, and not a keyword. It is all iterators and closures from lesson 8, plus <code>Option</code> from lesson 11.</p>`,
      excerpt: { repo: 'astral-sh/ruff', commit: '0222c19dd8e0c9a927f2e47bf3774a108431da25', path: 'crates/ruff_python_stdlib/src/identifiers.rs', from: 54, to: 77 },
      rsLabel: 'Rust · ruff, crates/ruff_python_stdlib/src/identifiers.rs',
      py: code`
        import keyword


        def is_module_name(name: str) -> bool:
            # Is the first character a letter or underscore?
            if not name or not ("a" <= name[0] <= "z" or name[0] == "_"):
                return False

            # Are the rest of the characters letters, digits, or underscores?
            if not all("a" <= c <= "z" or "0" <= c <= "9" or c == "_" for c in name[1:]):
                return False

            # Is the identifier a keyword?
            if keyword.iskeyword(name):
                return False

            return True


        for name in ["utils", "my_module2", "MyModule", "2fast", "class"]:
            print(name, is_module_name(name))
      `,
      rs: code`
        /// Returns \`true\` if a string is a PEP 8-compliant module name (i.e., consists of lowercase
        /// letters, numbers, underscores, and is not a keyword).
        pub fn is_module_name(name: &str) -> bool {
            // Is the first character a letter or underscore?
            let mut chars = name.chars();
            if !chars
                .next()
                .is_some_and(|c| c.is_ascii_lowercase() || c == '_')
            {
                return false;
            }

            // Are the rest of the characters letters, digits, or underscores?
            if !chars.all(|c| c.is_ascii_lowercase() || c.is_ascii_digit() || c == '_') {
                return false;
            }

            // Is the identifier a keyword?
            if is_keyword(name) {
                return false;
            }

            true
        }
      `,
      out: code`
        utils True
        my_module2 True
        MyModule False
        2fast False
        class False
      `,
      links: [
        [1, null, `<code>///</code> is a doc comment (lesson 3). It becomes the function's documentation; the backticks are
          Markdown.`],
        [3, 4, `A plain function: it borrows the name as <code>&amp;str</code> (lesson 4) and returns a <code>bool</code>.`],
        [5, null, `<code>name.chars()</code> is an iterator over the characters (lesson 8). It is <code>mut</code> because taking
          items out of an iterator changes it.`],
        [8, 6, `<code>chars.next()</code> gives an <code>Option&lt;char&gt;</code> (lesson 11): <code>None</code> for an empty
          name. <code>.is_some_and(|c| ...)</code> means "it is <code>Some</code>, and the closure says true". One call covers
          Python's <code>not name or not (...)</code>, and it can't crash on an empty string.`],
        [14, 10, `<code>chars.all(...)</code> is Python's <code>all(...)</code>. It carries on where <code>next()</code> stopped,
          so it only sees the characters after the first one, like <code>name[1:]</code>.`],
        [19, 14, `<code>is_keyword</code> is another ruff function, the same idea as <code>keyword.iskeyword</code>.`],
        [23, 17, `The last expression, with no semicolon, is the return value (lesson 5).`],
      ],
    },
    {
      title: 'pydantic-core: is "yes" a boolean?',
      text: `<p>In lax mode, pydantic accepts strings like <code>"yes"</code> and <code>"off"</code> for a <code>bool</code>
      field. This is the function that decides. The body is simple; the signature is the part to practise reading.</p>`,
      excerpt: { repo: 'pydantic/pydantic-core', commit: '383eb95a19433754c0cecf7025b50c26b6d97a36', path: 'src/input/shared.rs', from: 25, to: 45 },
      rsLabel: 'Rust · pydantic-core, src/input/shared.rs',
      py: code`
        def str_as_bool(value: str) -> bool:
            if value.lower() in ("0", "f", "n", "no", "off", "false"):
                return False
            elif value.lower() in ("1", "t", "y", "on", "yes", "true"):
                return True
            else:
                raise ValueError("Input should be a valid boolean, unable to interpret input")


        for value in ["yes", "Off", "TRUE", "0", "maybe"]:
            try:
                print(value, "->", str_as_bool(value))
            except ValueError as e:
                print(value, "->", e)
      `,
      rs: code`
        pub fn str_as_bool<'py>(input: &(impl Input<'py> + ?Sized), str: &str) -> ValResult<bool> {
            if str == "0"
                || str.eq_ignore_ascii_case("f")
                || str.eq_ignore_ascii_case("n")
                || str.eq_ignore_ascii_case("no")
                || str.eq_ignore_ascii_case("off")
                || str.eq_ignore_ascii_case("false")
            {
                Ok(false)
            } else if str == "1"
                || str.eq_ignore_ascii_case("t")
                || str.eq_ignore_ascii_case("y")
                || str.eq_ignore_ascii_case("on")
                || str.eq_ignore_ascii_case("yes")
                || str.eq_ignore_ascii_case("true")
            {
                Ok(true)
            } else {
                Err(ValError::new(ErrorTypeDefaults::BoolParsing, input))
            }
        }
      `,
      out: code`
        yes -> True
        Off -> False
        TRUE -> True
        0 -> False
        maybe -> Input should be a valid boolean, unable to interpret input
      `,
      links: [
        [1, 1, `Read the signature in pieces. <code>&lt;'py&gt;</code> is a lifetime (lesson 19), tied to Python's interpreter.
          <code>impl Input&lt;'py&gt;</code> means "any type that implements the <code>Input</code> trait" (lesson 14): a Python
          object, a JSON value or a string. <code>?Sized</code> also allows types like <code>str</code> behind the
          <code>&amp;</code>. <code>ValResult&lt;bool&gt;</code> is pydantic-core's short name for
          <code>Result&lt;bool, ValError&gt;</code>.`],
        [3, 2, `<code>eq_ignore_ascii_case</code> compares without caring about upper or lower case, and without building a
          new lowercase string the way <code>.lower()</code> does.`],
        [9, 3, `<code>Ok(false)</code>: the input is fine, and its value is false (lesson 12).`],
        [19, 7, `Nothing is raised. The caller gets the error back as a value. It carries an error type and the input, and
          pydantic turns it into the "Input should be a valid boolean" message you know.`],
      ],
    },
    {
      title: 'uv: normalizing a package name',
      text: `<p>PEP 503 says <code>Zope.Interface</code>, <code>zope_interface</code> and <code>zope-interface</code> are the
      same package. In Python the rule is usually one line, <code>re.sub(r"[-_.]+", "-", name).lower()</code>. uv does the
      same work in one pass over the bytes and checks the name is valid at the same time. The Python below follows uv's
      steps, so the two can be read side by side.</p>`,
      excerpt: { repo: 'astral-sh/uv', commit: '57f7f6835992a7403512ce71d32b7cf7a45510dd', path: 'crates/uv-normalize/src/lib.rs', from: 26, to: 63 },
      rsLabel: 'Rust · uv, crates/uv-normalize/src/lib.rs',
      py: code`
        def normalize(name: str) -> str:
            # An empty string is not a valid package, extra, or group name.
            if not name:
                raise ValueError(name)

            normalized = []

            last = None
            for char in name:
                if "A" <= char <= "Z":
                    normalized.append(char.lower())
                elif "a" <= char <= "z" or "0" <= char <= "9":
                    normalized.append(char)
                elif char in "-_.":
                    # Names can't start with punctuation.
                    if last is None:
                        raise ValueError(name)
                    if last not in "-_.":
                        normalized.append("-")
                else:
                    raise ValueError(name)
                last = char

            # Names can't end with punctuation.
            if last in "-_.":
                raise ValueError(name)

            return "".join(normalized)


        for name in ["Django", "zope.interface", "My__Pkg", "-bad"]:
            try:
                print(normalize(name))
            except ValueError:
                print(f"invalid: {name}")
      `,
      rs: code`
        /// Normalize an unowned package or extra name.
        fn normalize(name: &str) -> Result<String, InvalidNameError> {
            // An empty string is not a valid package, extra, or group name.
            if name.is_empty() {
                return Err(InvalidNameError(name.to_string()));
            }

            let mut normalized = String::with_capacity(name.len());

            let mut last = None;
            for char in name.bytes() {
                match char {
                    b'A'..=b'Z' => {
                        normalized.push(char.to_ascii_lowercase() as char);
                    }
                    b'a'..=b'z' | b'0'..=b'9' => {
                        normalized.push(char as char);
                    }
                    b'-' | b'_' | b'.' => {
                        match last {
                            // Names can't start with punctuation.
                            None => return Err(InvalidNameError(name.to_string())),
                            Some(b'-' | b'_' | b'.') => {}
                            Some(_) => normalized.push('-'),
                        }
                    }
                    _ => return Err(InvalidNameError(name.to_string())),
                }
                last = Some(char);
            }

            // Names can't end with punctuation.
            if matches!(last, Some(b'-' | b'_' | b'.')) {
                return Err(InvalidNameError(name.to_string()));
            }

            Ok(normalized)
        }
      `,
      out: code`
        django
        zope-interface
        my-pkg
        invalid: -bad
      `,
      links: [
        [2, 1, `It returns <code>Result&lt;String, InvalidNameError&gt;</code> (lesson 12): the normalized name, or an error.
          <code>InvalidNameError</code> is a tuple struct (lesson 9) that holds the bad name.`],
        [5, 4, `<code>return Err(...)</code> is the <code>raise</code>.`],
        [8, 6, `<code>String::with_capacity</code> reserves room for <code>name.len()</code> bytes up front, so adding to the
          string never has to grow it. In Python, a list plus <code>"".join</code> is the usual fast way.`],
        [10, 8, `<code>let mut last = None;</code> The type, <code>Option&lt;u8&gt;</code>, is worked out from how
          <code>last</code> is used further down.`],
        [11, 9, `<code>name.bytes()</code> walks the raw UTF-8 bytes, not the characters (lesson 4). Valid package names are
          ASCII, so bytes are enough, and faster.`],
        [13, 10, `<code>b'A'..=b'Z'</code> is a range pattern over byte values (lesson 10): any uppercase ASCII letter.`],
        [20, [16, 18], `A <code>match</code> inside a <code>match</code>, on the byte before this one. <code>None</code>: this is
          the first character, so it's an error. <code>Some(b'-' | b'_' | b'.')</code>: the one before was punctuation too, so
          do nothing. That is how a run like <code>__</code> becomes a single <code>-</code>.`],
        [27, 21, `<code>_</code> catches everything else, like <code>case _</code> (lesson 10).`],
        [33, 25, `<code>matches!(value, pattern)</code> is a <code>match</code> that only answers true or false.`],
        [37, 28, `The happy ending: <code>Ok</code> with the new string.`],
      ],
    },
    {
      title: 'uv: parsing "pypy" into an enum',
      text: `<p>uv knows four Python implementations, as an enum: <code>CPython</code>, <code>PyPy</code>, <code>GraalPy</code>
      and <code>Pyodide</code>. Earlier in the same file, <code>long_name()</code> returns names like
      <code>"cpython"</code>, and <code>short_name()</code> returns tags like <code>Some("cp")</code>, or <code>None</code> for
      Pyodide. This excerpt is the parser: it lets you write <code>"pypy".parse::&lt;ImplementationName&gt;()</code>.</p>`,
      excerpt: { repo: 'astral-sh/uv', commit: '57f7f6835992a7403512ce71d32b7cf7a45510dd', path: 'crates/uv-python-types/src/implementation.rs', from: 106, to: 122 },
      rsLabel: 'Rust · uv, crates/uv-python-types/src/implementation.rs',
      py: code`
        from enum import Enum


        class ImplementationName(Enum):
            CPYTHON = ("cpython", "cp")
            PYPY = ("pypy", "pp")
            GRAALPY = ("graalpy", "gp")
            PYODIDE = ("pyodide", None)

            @classmethod
            def from_str(cls, s: str) -> "ImplementationName":
                found = next(
                    (
                        impl
                        for impl in cls
                        if s.lower() == impl.value[0]
                        or (impl.value[1] is not None and s.lower() == impl.value[1])
                    ),
                    None,
                )
                if found is None:
                    raise ValueError(f"Unknown Python implementation \`{s}\`")
                return found


        for text in ["CPython", "pp", "jython"]:
            try:
                print(ImplementationName.from_str(text).name)
            except ValueError as e:
                print(e)
      `,
      rs: code`
        impl FromStr for ImplementationName {
            type Err = Error;

            /// Parse a Python implementation name from a string.
            ///
            /// Supports the full name and the platform compatibility tag style name.
            fn from_str(s: &str) -> Result<Self, Self::Err> {
                Self::iter_all()
                    .find(|implementation| {
                        s.eq_ignore_ascii_case(implementation.long_name())
                            || implementation
                                .short_name()
                                .is_some_and(|name| s.eq_ignore_ascii_case(name))
                    })
                    .ok_or_else(|| Error::UnknownImplementation(s.to_string()))
            }
        }
      `,
      out: code`
        CPYTHON
        PYPY
        Unknown Python implementation \`jython\`
      `,
      links: [
        [1, 10, `<code>FromStr</code> is the standard "parse me from a string" trait (lesson 14). Implementing it is what makes
          <code>s.parse::&lt;ImplementationName&gt;()</code> work, like a <code>from_str</code> class method.`],
        [2, 22, `<code>type Err = Error;</code> names the error type that parsing returns. <code>Error</code> is an enum at the top
          of this file, with one variant, <code>UnknownImplementation(String)</code>.`],
        [7, 11, `<code>Result&lt;Self, Self::Err&gt;</code>: <code>Self</code> is <code>ImplementationName</code>, and
          <code>Self::Err</code> is the <code>Error</code> from line 2.`],
        [8, 15, `<code>iter_all()</code>, defined earlier in the file, is an iterator over the four variants, like looping
          over an <code>Enum</code> class.`],
        [9, [12, 16], `<code>.find(closure)</code> is <code>next((x for x in ... if ...), None)</code>: it gives
          <code>Some(first match)</code> or <code>None</code> (lessons 8 and 11).`],
        [13, 17, `<code>short_name()</code> returns an <code>Option</code>, because Pyodide has no short name.
          <code>is_some_and</code> checks "is <code>Some</code>, and the closure says true" in one step.`],
        [15, [21, 22], `<code>.ok_or_else(...)</code> turns the <code>Option</code> into a <code>Result</code>:
          <code>Some(x)</code> becomes <code>Ok(x)</code>, and <code>None</code> becomes the <code>Err</code> built by the
          closure. The closure only runs on failure, so the error's <code>String</code> is only made when needed.`],
      ],
    },
    {
      title: 'pydantic-core: a guard that cleans up in Drop',
      text: `<p>A model can contain itself, like a dict that holds itself. Validating it naively would loop forever, so
      pydantic-core remembers which (object, validator) pairs it is in the middle of. The guard adds the pair when it is
      created and removes it in <code>drop</code> (lesson 20). Python would use a context manager. The Python version here
      is simplified: it skips the depth limit.</p>`,
      excerpt: { repo: 'pydantic/pydantic-core', commit: '383eb95a19433754c0cecf7025b50c26b6d97a36', path: 'src/recursion_guard.rs', from: 28, to: 58 },
      rsLabel: 'Rust · pydantic-core, src/recursion_guard.rs',
      py: code`
        class RecursionState:
            def __init__(self):
                self.ids = set()
                self.depth = 0


        class RecursionGuard:
            def __init__(self, state, obj_id, node_id):
                if (obj_id, node_id) in state.ids:
                    raise RecursionError("cyclic")
                state.ids.add((obj_id, node_id))
                state.depth += 1
                self.state, self.obj_id, self.node_id = state, obj_id, node_id

            def __enter__(self):
                return self

            def __exit__(self, *exc):
                self.state.depth -= 1
                self.state.ids.discard((self.obj_id, self.node_id))


        state = RecursionState()
        with RecursionGuard(state, 1, 7):
            print("inside:", state.depth, len(state.ids))
        print("after:", state.depth, len(state.ids))
      `,
      rs: code`
        impl<S: ContainsRecursionState> RecursionGuard<'_, S> {
            /// Creates a recursion guard for the given object and node id.
            ///
            /// When dropped, this will release the recursion for the given object and node id.
            pub fn new(state: &'_ mut S, obj_id: usize, node_id: usize) -> Result<RecursionGuard<'_, S>, RecursionError> {
                state.access_recursion_state(|state| {
                    if !state.insert(obj_id, node_id) {
                        return Err(RecursionError::Cyclic);
                    }
                    if state.incr_depth() {
                        return Err(RecursionError::Depth);
                    }
                    Ok(())
                })?;
                Ok(RecursionGuard { state, obj_id, node_id })
            }

            /// Retrieves the underlying state for further use.
            pub fn state(&mut self) -> &mut S {
                self.state
            }
        }

        impl<S: ContainsRecursionState> Drop for RecursionGuard<'_, S> {
            fn drop(&mut self) {
                self.state.access_recursion_state(|state| {
                    state.decr_depth();
                    state.remove(self.obj_id, self.node_id);
                });
            }
        }
      `,
      out: code`
        inside: 1 1
        after: 0 0
      `,
      links: [
        [1, 7, `<code>impl&lt;S: ContainsRecursionState&gt;</code>: these methods work for any state type <code>S</code> that
          implements the <code>ContainsRecursionState</code> trait (generics with a bound, lessons 14 and 19).
          <code>'_</code> is a lifetime the compiler fills in by itself (lesson 19).`],
        [5, 8, `<code>new</code> returns a <code>Result</code>: a guard, or a <code>RecursionError</code> saying why not. The
          guard holds <code>&amp;mut S</code>: it borrows the state and may change it (lesson 13).`],
        [6, null, `<code>access_recursion_state</code> takes a closure (lesson 8) and calls it with the real state. Here the
          closure returns a <code>Result</code>.`],
        [7, 9, `<code>insert</code> returns false when this pair is already being validated: the input contains itself.`],
        [14, null, `The <code>?</code> after the call: if the closure returned an <code>Err</code>, <code>new</code> returns that
          error right here (lesson 12).`],
        [15, 13, `Struct shorthand: <code>RecursionGuard { state, obj_id, node_id }</code> means <code>state: state</code>,
          <code>obj_id: obj_id</code>, and so on.`],
        [24, 18, `<code>impl Drop</code> (lesson 20) is the <code>__exit__</code>. It runs when the guard goes out of scope, on
          every path: the normal end, an early <code>return</code>, or a <code>?</code> passing an error up. Python needs
          <code>with</code> for that; Rust gets it from the closing <code>}</code>.`],
        [28, 20, `Undo what <code>new</code> did: lower the depth, and forget the pair.`],
      ],
    },
  ],
  quiz: [
    {
      type: 'choice',
      q: `In uv's <code>normalize</code>, what does <code>"My__Pkg"</code> become?`,
      options: ['<code>"my__pkg"</code>', '<code>"my-pkg"</code>', '<code>"my_pkg"</code>', 'An <code>InvalidNameError</code>'],
      answer: 1,
      explain: `Uppercase letters are lowered, and a run of <code>-</code>, <code>_</code> or <code>.</code> becomes a single
        <code>-</code>: the first <code>_</code> pushes a <code>-</code>, and the second sees <code>Some(b'_')</code> in
        <code>last</code> and does nothing.`,
    },
    {
      type: 'choice',
      q: `What does ruff's <code>is_module_name("")</code> return?`,
      options: [
        '<code>false</code>: <code>next()</code> gives <code>None</code>, and <code>is_some_and</code> is false for <code>None</code>',
        '<code>true</code>: an empty name has no bad characters',
        'It panics, like <code>name[0]</code> would raise in Python',
        'It does not compile',
      ],
      answer: 0,
      explain: `<code>is_some_and</code> handles the missing case for you, so there is no separate empty check. The Python
        version needs <code>not name or ...</code> to avoid an <code>IndexError</code>.`,
    },
    {
      type: 'output',
      q: `The <code>find</code> + <code>ok_or_else</code> pattern from uv, in a small program. What does it print?`,
      code: code`
        fn main() {
            let names = ["cpython", "pypy"];
            let found: Result<&str, String> = names
                .iter()
                .find(|n| n.eq_ignore_ascii_case("PyPy"))
                .copied()
                .ok_or_else(|| String::from("unknown"));
            println!("{:?}", found);
        }
      `,
      options: ['Ok("pypy")', 'Some("pypy")', 'Err("unknown")', '"pypy"'],
      answer: 0,
      explain: `<code>find</code> gives <code>Some("pypy")</code>, because the comparison ignores case.
        <code>ok_or_else</code> turns that <code>Some</code> into <code>Ok</code>. <code>{:?}</code> prints the
        <code>Ok(...)</code> wrapper too.`,
    },
    {
      type: 'choice',
      q: `When does pydantic-core's <code>RecursionGuard::drop</code> run?`,
      options: [
        'Only when validation succeeds',
        'When the guard goes out of scope: at the end of its block, on an early return, or when <code>?</code> passes an error up',
        'When the garbage collector gets to it',
        'Only when someone calls <code>guard.drop()</code>',
      ],
      answer: 1,
      explain: `Rust runs <code>drop</code> wherever the owner ends, on every path out of the block. That is why real code puts
        cleanup there instead of trusting every caller to remember it.`,
    },
    {
      type: 'choice',
      q: `In <code>fn str_as_bool&lt;'py&gt;(input: &amp;(impl Input&lt;'py&gt; + ?Sized), str: &amp;str)</code>, how should you read
        <code>impl Input&lt;'py&gt; + ?Sized</code>?`,
      options: [
        'Any type that implements the <code>Input</code> trait; <code>?Sized</code> also allows types like <code>str</code> behind the <code>&amp;</code>',
        'A Python object, and nothing else',
        'An optional input, like <code>Optional[Input]</code>',
        'A type whose size must be known when compiling',
      ],
      answer: 0,
      explain: `<code>impl Trait</code> in a parameter means "any type with this trait" (lesson 14). By default a generic type
        must have a known size; <code>?Sized</code> lifts that rule, which is fine because the value sits behind a reference.`,
    },
  ],
  exercise: {
    task: `<p>This is a short version of pydantic-core's <code>str_as_bool</code>. The real one also accepts
      <code>on</code> and <code>off</code>, in any case. Add them so the output matches.</p>`,
    starter: code`
      fn str_as_bool(s: &str) -> Result<bool, String> {
          if s == "0" || s.eq_ignore_ascii_case("false") || s.eq_ignore_ascii_case("no") {
              Ok(false)
          } else if s == "1" || s.eq_ignore_ascii_case("true") || s.eq_ignore_ascii_case("yes") {
              Ok(true)
          } else {
              Err(format!("cannot read {s:?} as a bool"))
          }
      }

      fn main() {
          for s in ["yes", "OFF", "On", "maybe"] {
              match str_as_bool(s) {
                  Ok(b) => println!("{s} -> {b}"),
                  Err(e) => println!("{s} -> error: {e}"),
              }
          }
      }
    `,
    solution: code`
      fn str_as_bool(s: &str) -> Result<bool, String> {
          if s == "0" || s.eq_ignore_ascii_case("false") || s.eq_ignore_ascii_case("no") || s.eq_ignore_ascii_case("off") {
              Ok(false)
          } else if s == "1" || s.eq_ignore_ascii_case("true") || s.eq_ignore_ascii_case("yes") || s.eq_ignore_ascii_case("on") {
              Ok(true)
          } else {
              Err(format!("cannot read {s:?} as a bool"))
          }
      }

      fn main() {
          for s in ["yes", "OFF", "On", "maybe"] {
              match str_as_bool(s) {
                  Ok(b) => println!("{s} -> {b}"),
                  Err(e) => println!("{s} -> error: {e}"),
              }
          }
      }
    `,
    expected: code`
      yes -> true
      OFF -> false
      On -> true
      maybe -> error: cannot read "maybe" as a bool
    `,
    hint: `Add <code>|| s.eq_ignore_ascii_case("off")</code> to the first condition and
      <code>|| s.eq_ignore_ascii_case("on")</code> to the second. <code>eq_ignore_ascii_case</code> already takes care of
      <code>OFF</code> and <code>On</code>.`,
  },
  breaks: [
    `Real code checks bytes when it can. uv and ruff walk <code>name.bytes()</code> or match <code>b'A'..=b'Z'</code>, because
      ASCII checks are much faster than Unicode ones. Python code rarely thinks about this, because a <code>str</code> is
      always characters.`,
    `Errors are returned, not raised. Even uv's "this name is invalid" path is a <code>return Err(...)</code>. The return type
      tells you that a function can fail, and with which error type. In Python you have to read the body or the docs to
      know what it raises.`,
    `Cleanup lives in <code>Drop</code>, not in <code>with</code>. pydantic-core's guard undoes its work in <code>drop</code>,
      which runs on every way out. There is no <code>with</code> statement for a caller to forget.`,
    `Real code avoids making copies. <code>eq_ignore_ascii_case</code> compares without building a lowercase string, and
      <code>String::with_capacity</code> reserves memory once. In Python, <code>s.lower() == "yes"</code> makes a new
      string, and nobody minds.`,
    `Small types get their own names. <code>ValResult&lt;bool&gt;</code> is pydantic-core's alias for
      <code>Result&lt;bool, ValError&gt;</code>, and <code>InvalidNameError(String)</code> wraps a plain string in its own
      type. Python code would usually use <code>str</code> and raise <code>ValueError</code>.`,
  ],
  translate: {
    task: `<p>ruff has a one-line function for Python's private-name rule (a name that starts with <code>__</code> but doesn't
      end with it gets mangled inside a class). Write the Rust version of this Python: it should print exactly the same
      thing.</p>`,
    py: code`
      def is_mangled_private(name: str) -> bool:
          return name.startswith("__") and not name.endswith("__")


      for name in ["__secret", "__init__", "_hidden", "plain"]:
          print(f"{name}: {'mangled' if is_mangled_private(name) else 'not mangled'}")
    `,
    starter: code`
      // Write is_mangled_private here.

      fn main() {
          for name in ["__secret", "__init__", "_hidden", "plain"] {
          }
      }
    `,
    solution: code`
      fn is_mangled_private(id: &str) -> bool {
          id.starts_with("__") && !id.ends_with("__")
      }

      fn main() {
          for name in ["__secret", "__init__", "_hidden", "plain"] {
              println!("{name}: {}", if is_mangled_private(name) { "mangled" } else { "not mangled" });
          }
      }
    `,
    expected: code`
      __secret: mangled
      __init__: not mangled
      _hidden: not mangled
      plain: not mangled
    `,
    hint: `<code>startswith</code> and <code>endswith</code> are <code>starts_with</code> and <code>ends_with</code>;
      <code>and</code> / <code>not</code> are <code>&amp;&amp;</code> / <code>!</code>. ruff's real line is
      <code>id.starts_with("__") &amp;&amp; !id.ends_with("__")</code>.`,
  },
  cheat: [
    ['all(p(c) for c in s)', 's.chars().all(|c| p(c))'],
    ['next((x for x in xs if p(x)), None)', 'xs.iter().find(|x| p(x))'],
    ['x is not None and p(x)', 'x.is_some_and(|v| p(v))'],
    ['if x is None:\n    raise MyError()', 'x.ok_or_else(|| MyError::new())?'],
    ['s.lower() == "yes"', 's.eq_ignore_ascii_case("yes")'],
    ['"A" <= c <= "Z"', "matches!(c, b'A'..=b'Z')"],
    ['def __exit__(self, *exc): ...', 'impl Drop for Guard { fn drop(&mut self) { ... } }'],
    ['@classmethod\ndef from_str(cls, s): ...', 'impl FromStr for X { fn from_str(s: &str) -> Result<Self, Self::Err> { ... } }'],
    ['"".join(parts)', 'let mut s = String::with_capacity(n);  s.push(c);'],
  ],
});
