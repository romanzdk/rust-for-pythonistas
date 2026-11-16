LESSONS.push({
  id: 'real-code',
  title: 'Reading real code',
  summary: 'Modules, use, pub, attributes, generics and lifetimes, plus a realistic program to read line by line.',
  intro: `
    <p>Real code adds a few things the earlier lessons skipped: modules and <code>use</code>, attributes like
    <code>#[derive]</code>, and syntax you only need to <b>recognize</b>, like lifetimes. This lesson ends with a realistic
    program that uses most of the course. It is the last lesson: if you can follow its program, you can follow a lot of everyday Rust.</p>`,
  examples: [
    {
      title: 'Modules: mod, pub and use',
      text: `<p>A <code>mod</code> is a module, usually its own file (<code>mod geometry;</code> loads <code>geometry.rs</code>).
      Here it is written inline so it fits in one file. Everything in a module is <b>private</b> unless marked
      <code>pub</code>. Python only has the <code>_name</code> convention. <code>use</code> is <code>import</code>,
      and <code>::</code> separates path parts the way <code>.</code> does in Python imports.</p>`,
      py: code`
        import math


        def circle_area(r):
            return math.pi * r * r



        print(f"{circle_area(2.0):.2f}")
      `,
      rs: code`
        mod geometry {
            use std::f64::consts::PI;

            pub fn circle_area(r: f64) -> f64 {
                PI * r * r
            }
        }

        use geometry::circle_area;

        fn main() {
            println!("{:.2}", circle_area(2.0));
        }
      `,
      out: '12.57',
      links: [
        [1, null, '<code>mod geometry { ... }</code> defines a module. In a real project this is usually the file <code>src/geometry.rs</code>.'],
        [2, 1, '<code>use</code> = <code>import</code>. <code>std</code> is the standard library, and <code>::</code> walks the path: <code>std → f64 → consts → PI</code>.'],
        [4, 4, '<code>pub</code> makes it visible outside the module. Without it, <code>main</code> could not call this function.'],
        [9, null, 'Like <code>from geometry import circle_area</code>. Paths starting with <code>crate::</code> start at the project root.'],
        [12, 9, '<code>{:.2}</code> = two decimals, same as <code>:.2f</code> in an f-string.'],
      ],
    },
    {
      title: "Lifetimes: recognize 'a, don't panic",
      text: `<p><code>'a</code> (a tick plus a name) is a <b>lifetime</b>. It says that the returned reference is
      <i>borrowed from</i> the inputs, so it can't be used after they are gone. You will rarely write these, and for
      small changes you can read <code>&amp;'a str</code> simply as <code>&amp;str</code>. The <code>&lt;'a&gt;</code> after the
      name declares the label, just like <code>&lt;T&gt;</code> declares a generic type.</p>`,
      py: code`
        def longest(a: str, b: str) -> str:
            return a if len(a) >= len(b) else b



        print(longest("pear", "banana"))
      `,
      rs: code`
        fn longest<'a>(a: &'a str, b: &'a str) -> &'a str {
            if a.len() >= b.len() { a } else { b }
        }

        fn main() {
            println!("{}", longest("pear", "banana"));
        }
      `,
      out: 'banana',
      links: [
        [1, 1, "Read it as: <i>longest takes two borrowed strings and returns one of them</i>. The <code>'a</code> connects the output to the inputs."],
        [2, 2, '<code>if</code> is an expression (lesson 5), like Python\'s <code>a if ... else b</code>.'],
      ],
    },
    {
      title: 'Putting it together: a realistic program',
      text: `<p>This program uses most of the course: a struct, a trait impl for printing, <code>Result</code> with <code>?</code>,
      closures, <code>match</code>, <code>if let</code> and iterators. Go through it line by line using the marked lines.
      If you can follow it, you can follow a lot of everyday Rust.</p>`,
      py: code`
        from dataclasses import dataclass


        @dataclass
        class Score:
            name: str
            points: int

            def __str__(self):
                return f"{self.name} ({self.points})"


        def parse_line(line: str) -> Score:
            if "," not in line:
                raise ValueError("missing comma")
            name, points = line.split(",", 1)
            if not points.isdigit():
                raise ValueError(f'bad number "{points}"')
            return Score(name, int(points))


        DATA = """ann,82
        bob,not-a-number
        cid,95
        dan"""

        scores = []
        for line in DATA.splitlines():
            try:
                scores.append(parse_line(line))
            except ValueError as e:
                print(f'skipping "{line}": {e}')
        if scores:
            best = max(scores, key=lambda s: s.points)
            print(f"best: {best}")
      `,
      rs: code`
        use std::fmt;

        #[derive(Debug)]
        struct Score {
            name: String,
            points: u32,
        }

        impl fmt::Display for Score {
            fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
                write!(f, "{} ({})", self.name, self.points)
            }
        }

        fn parse_line(line: &str) -> Result<Score, String> {
            let (name, points) = line.split_once(',').ok_or("missing comma")?;
            let points = points.parse().map_err(|_| format!("bad number {points:?}"))?;
            Ok(Score { name: name.to_string(), points })
        }

        const DATA: &str = "ann,82
        bob,not-a-number
        cid,95
        dan";

        fn main() {
            let mut scores = Vec::new();
            for line in DATA.lines() {
                match parse_line(line) {
                    Ok(score) => scores.push(score),
                    Err(e) => println!("skipping {line:?}: {e}"),
                }
            }
            if let Some(best) = scores.iter().max_by_key(|s| s.points) {
                println!("best: {best}");
            }
        }
      `,
      out: code`
        skipping "bob,not-a-number": bad number "not-a-number"
        skipping "dan": missing comma
        best: cid (95)
      `,
      links: [
        [1, 1, 'Import the formatting module, so the code below can write <code>fmt::Display</code>.'],
        [3, 4, '<code>#[...]</code> is an <i>attribute</i>, similar to a decorator. <code>derive(Debug)</code> generates <code>{:?}</code> printing for you.'],
        [4, [5, 6, 7], 'A struct with two typed fields, like the dataclass.'],
        [9, 9, '<code>impl Display for Score</code> is Rust\'s <code>__str__</code>: it controls how <code>{}</code> prints a <code>Score</code> (lesson 14).'],
        [10, 9, 'The signature is the same every time, so you can skim past it.'],
        [11, 10, '<code>write!</code> is <code>format!</code> that writes into <code>f</code>.'],
        [15, 13, 'Returns <code>Ok(Score)</code> or <code>Err(String)</code>. You can see from the signature that this can fail (lesson 12).'],
        [16, [14, 15, 16], '<code>split_once</code> gives an <code>Option</code>. <code>.ok_or(...)</code> turns <code>None</code> into an error, and <code>?</code> returns that error early.'],
        [17, [17, 18], '<code>parse()</code> works out the target type (<code>u32</code>) from the struct field. <code>map_err(|_| ...)</code> replaces the error message. <code>|_|</code> is a closure that ignores its argument.'],
        [18, 19, '<code>Ok(...)</code> wraps the success value. <code>points</code> alone means <code>points: points</code>.'],
        [21, 22, 'A constant string. <code>&amp;str</code> because it is baked into the program.'],
        [27, 27, '<code>Vec::new()</code> is <code>[]</code>. Rust works out the item type later, from what gets pushed.'],
        [28, 28, '<code>.lines()</code> is <code>.splitlines()</code>.'],
        [29, [29, 30, 31], '<code>match</code> on the <code>Result</code> is <code>try/except</code>: one arm per outcome.'],
        [31, [31, 32], '<code>{line:?}</code> prints with quotes (debug format).'],
        [34, [33, 34], '<code>max_by_key</code> is <code>max(key=...)</code>. It returns an <code>Option</code> because the list could be empty, and <code>if let</code> handles that.'],
      ],
    },
  ],
  quiz: [
    {
      type: 'choice',
      q: 'What is <code>use crate::db::Pool;</code> in Python terms?',
      options: [
        '<code>from mypackage.db import Pool</code> (import from this project)',
        '<code>pip install db</code>',
        '<code>import Pool</code> from the internet',
        'It creates a new database pool',
      ],
      answer: 0,
      explain: '<code>crate</code> means "the root of this project". <code>use</code> only imports names. Dependencies are added in <code>Cargo.toml</code>.',
    },
    {
      type: 'output',
      q: 'What does this print?',
      code: code`
        mod math {
            pub fn double(x: i32) -> i32 {
                helper(x) * 2
            }

            fn helper(x: i32) -> i32 {
                x + 1
            }
        }

        fn main() {
            println!("{}", math::double(4));
        }
      `,
      options: ['10', '8', '9'],
      answer: 0,
      explain: '<code>helper(4)</code> is 5, then <code>* 2</code> gives 10. <code>helper</code> is private, but <code>double</code> is in the same module, so it can call it.',
    },
    {
      type: 'compiles',
      q: 'Does this compile?',
      code: code`
        mod math {
            pub fn double(x: i32) -> i32 {
                x * 2
            }

            fn helper(x: i32) -> i32 {
                x + 1
            }
        }

        fn main() {
            println!("{}", math::helper(4));
        }
      `,
      answer: false,
      explain: '<code>helper</code> has no <code>pub</code>, so code outside <code>mod math</code> cannot call it (error E0603: function is private).',
    },
    {
      type: 'choice',
      q: "In <code>fn first_word&lt;'a&gt;(text: &amp;'a str) -&gt; &amp;'a str</code>, what does <code>'a</code> tell you?",
      options: [
        'The returned string is borrowed from <code>text</code>, so it cannot outlive <code>text</code>',
        'The function is asynchronous',
        'The string must be ASCII',
        'The function is generic over any type',
      ],
      answer: 0,
      explain: "Lifetimes link references together. Here they say the output points into the input. For small edits you can read <code>&amp;'a str</code> as plain <code>&amp;str</code>.",
    },
    {
      type: 'choice',
      q: '<code>#[derive(Debug, Clone, PartialEq)]</code> above a struct is most like...',
      options: [
        'A class decorator such as <code>@dataclass</code> that adds methods for you',
        'A comment the compiler ignores',
        'A type hint',
        'An import',
      ],
      answer: 0,
      explain: 'Attributes change or add code at compile time. <code>derive</code> generates trait implementations: <code>Debug</code> is like <code>__repr__</code>, <code>Clone</code> like <code>copy</code>, and <code>PartialEq</code> like <code>__eq__</code>.',
    },
  ],
  exercise: {
    task: `<p>Here's the realistic program from above. Change it to print the <b>lowest</b> score instead of the best one.
      Two small edits: the method name and the label.</p>`,
    starter: code`
      use std::fmt;

      #[derive(Debug)]
      struct Score {
          name: String,
          points: u32,
      }

      impl fmt::Display for Score {
          fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
              write!(f, "{} ({})", self.name, self.points)
          }
      }

      fn parse_line(line: &str) -> Result<Score, String> {
          let (name, points) = line.split_once(',').ok_or("missing comma")?;
          let points = points.parse().map_err(|_| format!("bad number {points:?}"))?;
          Ok(Score { name: name.to_string(), points })
      }

      const DATA: &str = "ann,82
      bob,not-a-number
      cid,95
      dan";

      fn main() {
          let mut scores = Vec::new();
          for line in DATA.lines() {
              match parse_line(line) {
                  Ok(score) => scores.push(score),
                  Err(e) => println!("skipping {line:?}: {e}"),
              }
          }
          if let Some(best) = scores.iter().max_by_key(|s| s.points) {
              println!("best: {best}");
          }
      }
    `,
    solution: code`
      use std::fmt;

      #[derive(Debug)]
      struct Score {
          name: String,
          points: u32,
      }

      impl fmt::Display for Score {
          fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
              write!(f, "{} ({})", self.name, self.points)
          }
      }

      fn parse_line(line: &str) -> Result<Score, String> {
          let (name, points) = line.split_once(',').ok_or("missing comma")?;
          let points = points.parse().map_err(|_| format!("bad number {points:?}"))?;
          Ok(Score { name: name.to_string(), points })
      }

      const DATA: &str = "ann,82
      bob,not-a-number
      cid,95
      dan";

      fn main() {
          let mut scores = Vec::new();
          for line in DATA.lines() {
              match parse_line(line) {
                  Ok(score) => scores.push(score),
                  Err(e) => println!("skipping {line:?}: {e}"),
              }
          }
          if let Some(lowest) = scores.iter().min_by_key(|s| s.points) {
              println!("lowest: {lowest}");
          }
      }
    `,
    expected: code`
      skipping "bob,not-a-number": bad number "not-a-number"
      skipping "dan": missing comma
      lowest: ann (82)
    `,
    hint: '<code>max_by_key</code> has a twin called <code>min_by_key</code>. Then change the text <code>best:</code> to <code>lowest:</code>.',
  },
  breaks: [
    `Lifetimes like <code>'a</code> have no Python version. They don't change how long anything lives. They only tell the
      compiler which input a returned reference points into.`,
    `<code>async</code> comes without an event loop. Python ships <code>asyncio</code>; Rust needs a runtime crate such as
      <code>tokio</code> to run an <code>async fn</code>.`,
    `Generics are checked. <code>fn f&lt;T&gt;(x: T)</code> may only use what its bounds allow: to print <code>x</code> it needs
      <code>T: Display</code>. A Python <code>TypeVar</code> is only a hint.`,
    `Shared ownership is opt-in. <code>Rc</code> and <code>Arc</code> let many names own one value, as Python does all the time,
      but the value is read-only unless you add <code>RefCell</code> or <code>Mutex</code>.`,
  ],
  translate: {
    py: code`
      from dataclasses import dataclass


      @dataclass
      class Score:
          name: str
          points: int


      scores = [Score("ada", 90), Score("bob", 72), Score("cy", 85)]
      best = max(scores, key=lambda s: s.points)
      passed = [s.name for s in scores if s.points >= 80]
      print(f"best: {best.name} ({best.points})")
      print(f"passed: {', '.join(passed)}")
    `,
    starter: code`
      struct Score {
          name: String,
          points: u32,
      }

      fn main() {
      }
    `,
    solution: code`
      struct Score {
          name: String,
          points: u32,
      }

      fn main() {
          let scores = vec![
              Score { name: String::from("ada"), points: 90 },
              Score { name: String::from("bob"), points: 72 },
              Score { name: String::from("cy"), points: 85 },
          ];
          let best = scores.iter().max_by_key(|s| s.points).unwrap();
          let passed: Vec<&str> = scores.iter().filter(|s| s.points >= 80).map(|s| s.name.as_str()).collect();
          println!("best: {} ({})", best.name, best.points);
          println!("passed: {}", passed.join(", "));
      }
    `,
    expected: code`
      best: ada (90)
      passed: ada, cy
    `,
    hint: `<code>max(..., key=...)</code> is <code>.iter().max_by_key(|s| s.points)</code>, which gives an <code>Option</code>
      because the list could be empty. The comprehension is <code>filter</code> then <code>map</code>; take
      <code>s.name.as_str()</code> so you can <code>join</code> the result.`,
  },
  cheat: [
    ['import json', 'use serde_json;'],
    ['from .models import User', 'use crate::models::User;'],
    ['module.function()', 'module::function()'],
    ['def _helper(): ...  # private by convention', 'fn helper() { }  // private unless pub'],
    ['@dataclass', '#[derive(Debug, Clone, PartialEq)]'],
    ['def __str__(self): ...', 'impl fmt::Display for Score { }'],
    ['raise ValueError("bad")', 'return Err("bad".into());'],
    ['def f(x: T) -> T:  # TypeVar', 'fn f<T>(x: T) -> T { }'],
    ['# (no equivalent)', "fn f<'a>(x: &'a str) -> &'a str { }"],
    ['async def f(): await g()', 'async fn f() { g().await; }'],
    ['# many names, one object', 'Rc<T> / Arc<T>  // shared ownership'],
    ['pyproject.toml / uv.lock', 'Cargo.toml / Cargo.lock'],
    ['uv add requests', 'cargo add reqwest'],
    ['python -m pytest', 'cargo test'],
  ],
});
