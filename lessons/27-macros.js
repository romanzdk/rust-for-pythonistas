LESSONS.push({
  id: 'macros',
  title: 'Reading macros and attributes',
  summary: 'What the ! in println! and the #[...] above a struct really do: code that writes code while Rust compiles.',
  intro: `
    <p>Open almost any Rust file and you see two kinds of special syntax:</p>
    <ul>
      <li>Names that end in <code>!</code>, like <code>println!</code>, <code>vec!</code> and <code>assert_eq!</code>. These
        are <b>macros</b>.</li>
      <li>Lines that start with <code>#[</code>, like <code>#[derive(Debug)]</code>, <code>#[test]</code> and
        <code>#[tokio::main]</code>. These are <b>attributes</b>.</li>
    </ul>
    <p>You have used both since lesson 3. This lesson shows what they actually are, so you can read the ones you haven't
    seen yet. The short version: both are <b>code that writes code</b>, and they run while Rust compiles, not while your
    program runs. Python has nothing that runs at compile time. The closest things are decorators and
    <code>@dataclass</code>, which change functions and classes when Python runs the file.</p>`,
  examples: [
    {
      title: 'Why println! has a !',
      text: `<p>A normal Rust function takes a fixed number of arguments with fixed types. <code>println!</code> takes any number
      of arguments, of any type that can be printed. A function can't do that, so <code>println!</code> is a macro: the
      compiler reads the format string and writes the printing code for you.</p>
      <p>Because this happens while compiling, the format string is <b>checked</b>. Two <code>{}</code> with one argument is a
      compile error. In Python, <code>"{} scored {}".format(name)</code> is only a string method; you find the mistake when
      that line runs, if it ever does.</p>`,
      py: code`
        name = "ada"
        score = 9.5
        print("{} scored {}".format(name))
      `,
      rs: code`
        fn main() {
            let name = "ada";
            let score = 9.5;
            println!("{} scored {}", name);
        }
      `,
      out: code`
        ada scored 9.5
        ada scored 9.5
           ada|9.50|[1, 2]
      `,
      pyError: 'IndexError: Replacement index 1 out of range for positional args tuple',
      rsError: code`
        error: 2 positional arguments in format string, but there is 1 argument
         --> src/main.rs:4:15
          |
        4 |     println!("{} scored {}", name);
          |               ^^        ^^   ----
      `,
      pyFix: code`
        name = "ada"
        score = 9.5
        print("{} scored {}".format(name, score))
        print(f"{name} scored {score}")
        print(f"{name:>6}|{score:.2f}|{[1, 2]!r}")
      `,
      rsFix: code`
        fn main() {
            let name = "ada";
            let score = 9.5;
            println!("{} scored {}", name, score);
            println!("{name} scored {score}");
            println!("{name:>6}|{score:.2}|{:?}", vec![1, 2]);
        }
      `,
      fixNote: `Pass both values, or put the names inside the braces like an f-string. The format specs after <code>:</code> are
        almost the same as Python's: <code>&gt;6</code> is right-aligned in 6 characters, and <code>.2</code> is two
        decimals (Python writes <code>.2f</code>). <code>{:?}</code> uses <code>Debug</code>, Rust's <code>!r</code>.`,
      links: [
        [4, 3, `The compiler counts the <code>{}</code> placeholders and the arguments before the program exists. Python's
          <code>.format</code> counts them when the line runs.`],
      ],
    },
    {
      title: 'derive writes the methods @dataclass would',
      text: `<p>Lesson 14 used <code>#[derive(Debug, Clone, PartialEq)]</code>. There are more you will see all the time.
      <code>@dataclass(order=True, frozen=True)</code> asks Python to write <code>__lt__</code>, <code>__hash__</code> and
      friends; each name in <code>derive(...)</code> asks the compiler to write one trait <code>impl</code>. The generated code
      is plain Rust, as if you had typed it.</p>`,
      py: code`
        from dataclasses import dataclass


        @dataclass(order=True, frozen=True)
        class Version:
            major: int = 0
            minor: int = 0


        versions = [Version(1, 2), Version(0, 9), Version(1, 0)]
        versions.sort()
        for v in versions:
            print(f"{v.major}.{v.minor}")

        newest = max(versions)
        print(f"newest: {newest.major}.{newest.minor}")
        empty = Version()
        print(f"default: {empty.major}.{empty.minor}")
        print(f"unique: {len({Version(1, 0), Version(1, 0)})}")
      `,
      rs: code`
        use std::collections::HashSet;

        #[derive(Debug, Default, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash)]
        struct Version {
            major: u32,
            minor: u32,
        }

        fn main() {
            let mut versions = vec![
                Version { major: 1, minor: 2 },
                Version { major: 0, minor: 9 },
                Version { major: 1, minor: 0 },
            ];
            versions.sort();
            for v in &versions {
                println!("{}.{}", v.major, v.minor);
            }

            let newest = versions.iter().max().unwrap();
            println!("newest: {}.{}", newest.major, newest.minor);
            let empty = Version::default();
            println!("default: {}.{}", empty.major, empty.minor);
            let unique: HashSet<Version> = [Version { major: 1, minor: 0 }, Version { major: 1, minor: 0 }].into();
            println!("unique: {}", unique.len());
        }
      `,
      out: code`
        0.9
        1.0
        1.2
        newest: 1.2
        default: 0.0
        unique: 1
      `,
      links: [
        [3, 4, `One line, eight trait impls: <code>Debug</code> (<code>{:?}</code>), <code>Default</code>
          (<code>Version::default()</code>), <code>Clone</code>/<code>Copy</code> (copying), <code>PartialEq</code>/<code>Eq</code>
          (<code>==</code>), <code>PartialOrd</code>/<code>Ord</code> (<code>&lt;</code> and sorting) and <code>Hash</code>
          (set and dict keys). <code>order=True</code> and <code>frozen=True</code> are the Python versions of the last two.`],
        [5, 6, `Derived ordering compares the fields from top to bottom, like comparing <code>(major, minor)</code> tuples. That is
          exactly what <code>order=True</code> does too. Swap the two fields and the sort order changes.`],
        [15, 11, `<code>sort()</code> needs <code>Ord</code>. Without the derive, this line doesn't compile.`],
        [22, 17, `<code>Default</code> gives every field its own default: 0 for numbers, empty for <code>String</code> and
          <code>Vec</code>. Python needs <code>= 0</code> written on each field.`],
        [24, 19, `A <code>HashSet</code> needs <code>Hash</code> and <code>Eq</code>, like a Python set needs
          <code>__hash__</code> and <code>__eq__</code>. The two equal versions become one.`],
      ],
    },
    {
      title: 'Built-in attributes are notes to the compiler',
      text: `<p>An attribute says something about the item right below it: a function, struct, field, module or line. Many come
      with Rust itself. You don't need to memorize them; read them like this:</p>
      <ul>
        <li><code>#[cfg(...)]</code>: "only compile this if ...". The other version is removed before the compiler even looks
          at it.</li>
        <li><code>#[must_use]</code>: "warn if a caller ignores the result".</li>
        <li><code>#[allow(...)]</code>: "don't warn about this here", like <code># noqa</code>.</li>
        <li><code>#[deprecated]</code>: "warn every caller", like <code>warnings.warn(DeprecationWarning)</code>, but when
          compiling.</li>
        <li><code>#[inline]</code>: a hint about speed. Safe to ignore while reading.</li>
      </ul>`,
      py: code`
        import os

        if os.name == "nt":
            SEP = "\\"
        else:
            SEP = "/"


        def double(x):
            return x * 2


        def old_helper():  # unused, kept on purpose
            pass


        print(f"separator: {SEP}")
        print(double(21))
      `,
      rs: code`
        #[cfg(windows)]
        const SEP: &str = "\\";
        #[cfg(not(windows))]
        const SEP: &str = "/";

        #[must_use]
        fn double(x: i32) -> i32 {
            x * 2
        }

        #[allow(dead_code)]
        fn old_helper() {}

        fn main() {
            println!("separator: {SEP}");
            println!("{}", double(21));
        }
      `,
      out: code`
        separator: /
        42
      `,
      links: [
        [1, 3, `Python picks a branch when the program runs. <code>#[cfg(windows)]</code> picks when compiling: on Linux and macOS
          this line is thrown away, so the program has only one <code>SEP</code>.`],
        [3, 5, `<code>not(...)</code>, <code>all(...)</code> and <code>any(...)</code> combine conditions. Other common ones are
          <code>cfg(test)</code> (lesson 18) and <code>cfg(feature = "json")</code> for optional features in
          <code>Cargo.toml</code>.`],
        [6, null, `Writing <code>double(21);</code> on its own line would now print a warning: "unused return value". The
          standard library marks things like <code>Result</code> this way, which is why an ignored error gets a warning.`],
        [11, 13, `Rust warns about code nothing uses. <code>allow</code> turns that warning off for this one item.`],
      ],
    },
    {
      title: 'Attribute macros are decorators that run while compiling',
      text: `<p>Some attributes come from crates and rewrite the item below them: <code>#[tokio::main]</code> (lesson 24),
      <code>#[test]</code>, <code>#[pyfunction]</code> (lesson 25), <code>#[serde(rename = ...)]</code> (lesson 23). They look
      like decorators and do a similar job, with one difference: a decorator wraps your function when Python runs the file,
      and an attribute macro <b>replaces your code with new code</b> when Rust compiles it.</p>
      <p>On the left is a hand-written decorator that does what <code>asyncio.run(main())</code> does. On the right is roughly
      the code that <code>#[tokio::main]</code> writes when you put it above <code>async fn main() { ... }</code>. You never
      see this code in the file; the tool <code>cargo expand</code> can show it.</p>`,
      py: code`
        import asyncio


        def run_async(fn):
            def wrapper():
                return asyncio.run(fn())

            return wrapper


        @run_async
        async def main():
            await asyncio.sleep(0)
            print("inside the runtime")


        main()
      `,
      rs: code`
        fn main() {
            let body = async {
                tokio::task::yield_now().await;
                println!("inside the runtime");
            };
            tokio::runtime::Builder::new_multi_thread()
                .enable_all()
                .build()
                .expect("Failed building the Runtime")
                .block_on(body)
        }
      `,
      out: 'inside the runtime',
      links: [
        [1, [5, 12], `Your <code>async fn main</code> becomes a plain <code>fn main</code>, because a program can only start from a
          normal function. Python's decorator does the same trick: <code>main</code> is now <code>wrapper</code>.`],
        [2, [12, 13, 14], `The body you wrote moves into an <code>async</code> block. Nothing in it runs yet, just like calling an
          <code>async def</code> only creates a coroutine.`],
        [6, 6, `Build a tokio runtime and run the body on it until it finishes: the same job as <code>asyncio.run</code>.`],
        [9, null, `This <code>expect</code> message comes from the macro, so it is what you'd see if the runtime couldn't
          start. Knowing a macro wrote it helps when you search for it.`],
      ],
    },
    {
      title: 'Small macros you will see everywhere',
      text: `<p>A handful of macros show up in almost every project. Each one replaces a Python habit:</p>
      <ul>
        <li><code>dbg!(x)</code> prints the file, line, the code and its value to stderr, then hands the value back. Like
          <code>print(f"{x=}")</code>, but you can wrap it around any expression.</li>
        <li><code>assert!</code> and <code>assert_eq!</code> stop the program with a message if the check fails.</li>
        <li><code>writeln!</code> is <code>println!</code> into a <code>String</code> or a file, like
          <code>print(..., file=f)</code>.</li>
        <li><code>matches!(value, pattern)</code> is a <code>match</code> that gives <code>true</code> or <code>false</code>.</li>
        <li><code>unreachable!()</code>, <code>todo!()</code> and <code>unimplemented!()</code> panic with a clear message. You
          see them where a Python programmer would write <code>raise AssertionError</code> or
          <code>raise NotImplementedError</code>.</li>
      </ul>`,
      py: code`
        import io
        import sys


        def grade(score):
            if 90 <= score <= 100:
                return "A"
            if 75 <= score <= 89:
                return "B"
            if 0 <= score <= 74:
                return "C"
            raise AssertionError("scores are 0 to 100")


        scores = [95, 80, 60]
        total = sum(scores)
        print(f"{total=}", file=sys.stderr)
        assert total == 235, "the sum is wrong"

        report = io.StringIO()
        for s in scores:
            print(f"{s}: {grade(s)}", file=report)
        print(report.getvalue(), end="")

        good = sum(1 for s in scores if grade(s) in ("A", "B"))
        print(f"A or B: {good}")
      `,
      rs: code`
        use std::fmt::Write;

        fn grade(score: u32) -> char {
            match score {
                90..=100 => 'A',
                75..=89 => 'B',
                0..=74 => 'C',
                _ => unreachable!("scores are 0 to 100"),
            }
        }

        fn main() {
            let scores = vec![95, 80, 60];
            let total: u32 = dbg!(scores.iter().sum());
            assert_eq!(total, 235, "the sum is wrong");

            let mut report = String::new();
            for s in &scores {
                writeln!(report, "{s}: {}", grade(*s)).unwrap();
            }
            print!("{report}");

            let good = scores.iter().map(|s| grade(*s)).filter(|g| matches!(g, 'A' | 'B')).count();
            println!("A or B: {good}");
        }
      `,
      out: code`
        95: A
        80: B
        60: C
        A or B: 2
      `,
      links: [
        [1, null, `<code>writeln!</code> into a <code>String</code> needs the <code>std::fmt::Write</code> trait in scope (lesson 14:
          a method only exists where its trait is imported).`],
        [8, 12, `A <code>match</code> on a number must cover every value, so the last arm handles numbers above 100.
          <code>unreachable!</code> says "this can't happen" and panics with the message if it does.`],
        [14, [16, 17], `<code>dbg!</code> prints <code>[src/main.rs:14:22] scores.iter().sum() = 235</code> to stderr, then
          returns the 235, so it can sit in the middle of a line. Remove it before you commit, like a debug print.`],
        [15, 18, `<code>assert_eq!</code> shows both values when they differ, like pytest does. Unlike Python's
          <code>assert</code>, it is never switched off.`],
        [19, 22, `<code>writeln!</code> returns a <code>Result</code>, because writing to a file can fail. Writing to a
          <code>String</code> can't, so <code>unwrap</code> is fine.`],
        [23, 25, `<code>matches!(g, 'A' | 'B')</code> means "does <code>g</code> fit the pattern <code>'A' | 'B'</code>?". Here it
          reads like Python's <code>in ("A", "B")</code>, but any <code>match</code> pattern works.`],
      ],
    },
    {
      title: 'Reading a macro_rules! macro',
      text: `<p>Projects sometimes define their own small macros with <code>macro_rules!</code>. The syntax looks scary, but it
      is a <code>match</code> on code instead of on values: each arm is <code>(pattern) =&gt; { code to write }</code>. In the
      pattern, <code>$x:expr</code> means "capture one expression and call it <code>$x</code>", and <code>$( ... ),*</code>
      means "repeat this, separated by commas", like <code>*args</code>. Python has no macros, so the closest Python is a
      function and a dict literal.</p>`,
      py: code`
        def square(x):
            return x * x


        print(square(7))
        print(square(2 + 1))

        ages = {
            "ada": 36,
            "bob": 41,
        }
        for name, age in ages.items():
            print(f"{name}: {age}")
      `,
      rs: code`
        use std::collections::BTreeMap;

        macro_rules! square {
            ($x:expr) => {
                $x * $x
            };
        }

        macro_rules! map {
            ($($key:expr => $value:expr),* $(,)?) => {{
                let mut m = BTreeMap::new();
                $( m.insert($key, $value); )*
                m
            }};
        }

        fn main() {
            println!("{}", square!(7));
            println!("{}", square!(2 + 1));

            let ages = map! {
                "ada" => 36,
                "bob" => 41,
            };
            for (name, age) in &ages {
                println!("{name}: {age}");
            }
        }
      `,
      out: code`
        49
        9
        ada: 36
        bob: 41
      `,
      links: [
        [3, 1, `<code>macro_rules! square</code> defines a macro you call as <code>square!(...)</code>. It must be defined above
          the code that uses it.`],
        [4, 1, `The pattern: exactly one expression, captured as <code>$x</code>.`],
        [5, 2, `What to write instead: the expression, <code>*</code>, the expression again.`],
        [10, 8, `<code>$( ... ),*</code> repeats <code>key =&gt; value</code> any number of times, separated by commas.
          <code>$(,)?</code> allows one trailing comma, like Python does.`],
        [12, null, `<code>$( ... )*</code> writes this line once for every pair that matched. With two pairs, the macro writes
          two <code>insert</code> lines.`],
        [18, 5, `<code>square!(7)</code> becomes <code>7 * 7</code> before the program is compiled.`],
        [19, 6, `<code>$x</code> is a whole expression, so this becomes <code>(2 + 1) * (2 + 1)</code>, which is 9, not
          <code>2 + 1 * 2 + 1</code>.`],
        [21, [8, 9, 10, 11], `The macro invents its own syntax: <code>=&gt;</code> between key and value. The
          <code>{ }</code> after <code>map!</code> is just style; <code>map!(...)</code> and <code>map![...]</code> mean the
          same.`],
      ],
    },
  ],
  quiz: [
    {
      type: 'output',
      q: 'What does this print?',
      code: code`
        fn main() {
            let x = 5;
            println!("{x:>4}|{:<3}|{:.1}", "ab", 3.14159);
        }
      `,
      options: ['   5|ab |3.1', '5   |  ab|3.1', '   5|ab |3.14159', '{x:>4}|ab|3.1'],
      answer: 0,
      explain: `The specs work like Python's: <code>&gt;4</code> right-aligns in 4 characters, <code>&lt;3</code> left-aligns
        in 3, and <code>.1</code> keeps one decimal. <code>{x:&gt;4}</code> takes <code>x</code> by name, like
        <code>f"{x:&gt;4}"</code>.`,
    },
    {
      type: 'compiles',
      q: 'Does this compile?',
      code: code`
        fn main() {
            let (a, b, c) = (1, 2, 3);
            println!("{} and {}", a, b, c);
        }
      `,
      answer: false,
      explain: `<code>println!</code> checks the format string while compiling. Here <code>c</code> has no placeholder, and the
        error is "argument never used". Python's <code>"{} and {}".format(1, 2, 3)</code> silently ignores the extra value.`,
    },
    {
      type: 'output',
      q: 'Look at the order of the fields. What does this print?',
      code: code`
        #[derive(PartialEq, PartialOrd)]
        struct Version {
            minor: u32,
            major: u32,
        }

        fn main() {
            let a = Version { major: 1, minor: 9 };
            let b = Version { major: 2, minor: 0 };
            println!("{}", a < b);
        }
      `,
      options: ['true', 'false'],
      answer: 1,
      explain: `Derived ordering compares fields in the order they are <b>declared</b>, not the order you write them when
        creating a value. <code>minor</code> comes first, and 9 &lt; 0 is false. <code>@dataclass(order=True)</code> has the
        same rule.`,
    },
    {
      type: 'compiles',
      q: 'Does this compile?',
      code: code`
        #[derive(PartialEq, Eq, Hash)]
        struct Point {
            x: f64,
            y: f64,
        }

        fn main() {}
      `,
      answer: false,
      explain: `A derive only works if every field supports that trait. <code>f64</code> is not <code>Eq</code> or
        <code>Hash</code>, because <code>NaN</code> is not equal to itself. The error is E0277, "the trait bound
        <code>f64: Eq</code> is not satisfied". Python lets you hash a frozen dataclass with floats.`,
    },
    {
      type: 'choice',
      q: 'On Linux, what happens to a function marked <code>#[cfg(windows)]</code>?',
      options: [
        'It is compiled, but calling it panics',
        'It is removed before compiling, as if it was never written',
        'It is compiled and works, but prints a warning',
        'Rust picks it at run time, like an <code>if sys.platform</code> check',
      ],
      answer: 1,
      explain: `<code>cfg</code> decides while compiling. On Linux the function is gone, so it isn't even type-checked, and
        calling it from code that is compiled is an error.`,
    },
  ],
  exercise: {
    task: `<p>This program sorts tasks, prints the first one with <code>{:?}</code>, and compares two tasks with
      <code>==</code>. It doesn't compile, because <code>Task</code> has none of the traits that needs. Add <b>one
      <code>#[derive(...)]</code> line</b> so it prints the expected output.</p>`,
    starter: code`
      struct Task {
          priority: u32,
          name: String,
      }

      fn main() {
          let mut tasks = vec![
              Task { priority: 2, name: String::from("write tests") },
              Task { priority: 1, name: String::from("fix bug") },
              Task { priority: 3, name: String::from("update docs") },
          ];
          tasks.sort();
          println!("{:?}", tasks[0]);
          println!("{}", tasks[0] == tasks[1]);
      }
    `,
    solution: code`
      #[derive(Debug, PartialEq, Eq, PartialOrd, Ord)]
      struct Task {
          priority: u32,
          name: String,
      }

      fn main() {
          let mut tasks = vec![
              Task { priority: 2, name: String::from("write tests") },
              Task { priority: 1, name: String::from("fix bug") },
              Task { priority: 3, name: String::from("update docs") },
          ];
          tasks.sort();
          println!("{:?}", tasks[0]);
          println!("{}", tasks[0] == tasks[1]);
      }
    `,
    expected: code`
      Task { priority: 1, name: "fix bug" }
      false
    `,
    hint: `<code>{:?}</code> needs <code>Debug</code> and <code>==</code> needs <code>PartialEq</code>. <code>sort()</code> needs
      <code>Ord</code>, and <code>Ord</code> also needs <code>Eq</code> and <code>PartialOrd</code>. The compiler errors name
      the missing traits one by one.`,
  },
  breaks: [
    `Decorators run when Python runs the file, so they can look at arguments, read config, or be applied in a loop. Macros
      and attributes run while compiling: they only see the code as written, and they cost nothing when the program runs.`,
    `<code>#[cfg(...)]</code> code that is switched off is not checked at all. A typo in a <code>#[cfg(windows)]</code> function
      compiles fine on Linux and breaks the Windows build. Python at least parses both branches of an
      <code>if sys.platform</code>.`,
    `A macro pastes code, it doesn't call a function. <code>square!(next_number())</code> becomes
      <code>next_number() * next_number()</code>, so the call runs twice. A Python function would evaluate the argument once.`,
    `<code>assert!</code> always runs, also in release builds. Python removes <code>assert</code> with <code>python -O</code>.
      The Rust version of an assert that is switched off in release is <code>debug_assert!</code>.`,
    `There is no <code>#[derive(Display)]</code> in the standard library: <code>{}</code> output is always written by hand
      (lesson 14). <code>Debug</code> is derived, and it is for programmers, like <code>repr</code>, while <code>Display</code>
      is for users, like <code>str</code>.`,
  ],
  translate: {
    py: code`
      from dataclasses import dataclass


      @dataclass(order=True)
      class Item:
          cents: int
          name: str


      items = [Item(350, "tea"), Item(1200, "cake"), Item(125, "gum")]
      items.sort()
      for item in items:
          print(f"{item.name:<6}{item.cents / 100:>7.2f}")

      total = sum(item.cents for item in items)
      assert total == 1675, "wrong total"
      print(f"{'total':<6}{total / 100:>7.2f}")
    `,
    starter: code`
      struct Item {
          cents: u32,
          name: String,
      }

      fn main() {
      }
    `,
    solution: code`
      #[derive(PartialEq, Eq, PartialOrd, Ord)]
      struct Item {
          cents: u32,
          name: String,
      }

      fn main() {
          let mut items = vec![
              Item { cents: 350, name: String::from("tea") },
              Item { cents: 1200, name: String::from("cake") },
              Item { cents: 125, name: String::from("gum") },
          ];
          items.sort();
          for item in &items {
              println!("{:<6}{:>7.2}", item.name, item.cents as f64 / 100.0);
          }

          let total: u32 = items.iter().map(|item| item.cents).sum();
          assert_eq!(total, 1675, "wrong total");
          println!("{:<6}{:>7.2}", "total", total as f64 / 100.0);
      }
    `,
    expected: code`
      gum      1.25
      tea      3.50
      cake    12.00
      total   16.75
    `,
    hint: `<code>order=True</code> becomes <code>#[derive(PartialEq, Eq, PartialOrd, Ord)]</code>, and the fields compare in
      order, so <code>cents</code> first. The format specs carry over: <code>{:&lt;6}</code> and <code>{:&gt;7.2}</code>.
      Turn the cents into a float with <code>as f64 / 100.0</code>, and use <code>assert_eq!</code> for the
      <code>assert</code>.`,
  },
  cheat: [
    ['print(f"{a} {b}")', 'println!("{a} {b}");'],
    ['f"{x:>6}" / f"{x:.2f}" / f"{x!r}"', 'format!("{x:>6}") / format!("{x:.2}") / format!("{x:?}")'],
    ['print(..., file=f)', 'writeln!(f, ...)?;'],
    ['print(f"{x=}", file=sys.stderr)', 'dbg!(x)'],
    ['assert a == b, "msg"', 'assert_eq!(a, b, "msg");'],
    ['value in ("A", "B")', "matches!(value, 'A' | 'B')"],
    ['raise NotImplementedError', 'todo!()  // or unimplemented!()'],
    ['raise AssertionError("can\'t happen")', 'unreachable!("can\'t happen")'],
    ['@dataclass(order=True, frozen=True)', '#[derive(PartialEq, Eq, PartialOrd, Ord, Hash)]'],
    ['field: int = 0', '#[derive(Default)]  // 0, "", empty Vec'],
    ['if sys.platform == "win32": ...', '#[cfg(windows)]'],
    ['# noqa', '#[allow(dead_code)]'],
    ['warnings.warn(..., DeprecationWarning)', '#[deprecated(note = "...")]'],
    ['@decorator  # runs when the file runs', '#[some_macro]  // runs while compiling'],
  ],
});
