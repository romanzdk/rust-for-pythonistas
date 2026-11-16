LESSONS.push({
  id: 'first-app',
  title: 'A tiny app: a function and a module',
  summary: 'Write a function, move it into its own file with mod, pub and use, and run it.',
  intro: `
    <p>Now grow the <code>hello</code> project from lesson 1 the way you would grow a Python package. First you write
    a function, then you move it into its own module file, then you import it and run the program.</p>
    <p>Don't worry about every symbol yet. <code>&amp;str</code>, <code>String</code> and <code>format!</code> get their
    own lessons later. Here the goal is the shape of a small Rust program.</p>`,
  examples: [
    {
      title: 'A function in the same file',
      text: `<p>The Python function has type hints. Rust needs them: every parameter and the return value have a type.</p>`,
      py: code`
        def greet(name: str) -> str:
            return f"Hello, {name}!"


        def main() -> None:
            print(greet("Ferris"))


        if __name__ == "__main__":
            main()
      `,
      rs: code`
        fn greet(name: &str) -> String {
            format!("Hello, {name}!")
        }



        fn main() {
            println!("{}", greet("Ferris"));
        }
      `,
      out: 'Hello, Ferris!',
      links: [
        [1, 1, '<code>fn</code> is <code>def</code>. <code>name: &amp;str</code> is a text parameter and <code>-&gt; String</code> says it returns text. Lesson 4 explains why Rust has two text types.'],
        [2, 2, '<code>format!</code> builds a string like an f-string. The last line has no <code>;</code> and no <code>return</code>, which makes it the return value (lesson 5).'],
        [7, 5, 'The program starts here, as in lesson 1.'],
        [8, 6, 'Call the function and print the result. <code>{}</code> is where the value goes.'],
      ],
    },
    {
      title: 'Move it into its own module',
      text: `<p>In Python, a new file <code>greeting.py</code> is a module you can import right away. In Rust you also
      create a file, <code>src/greeting.rs</code>, but you must <b>declare</b> it in <code>main.rs</code> with
      <code>mod greeting;</code>. Rust also hides everything by default: <code>pub</code> makes the function usable from
      other modules. Both programs print <code>Hello, Ferris!</code>.</p>`,
      files: true,
      pyLabel: 'Python files',
      rsLabel: 'Rust files',
      py: code`
        # src/hello/greeting.py
        def greet(name: str) -> str:
            return f"Hello, {name}!"


        # src/hello/__init__.py
        from hello.greeting import greet


        def main() -> None:
            print(greet("Ferris"))
      `,
      rs: code`
        // src/greeting.rs
        pub fn greet(name: &str) -> String {
            format!("Hello, {name}!")
        }


        // src/main.rs
        mod greeting;

        use greeting::greet;

        fn main() {
            println!("{}", greet("Ferris"));
        }
      `,
      check: code`
        mkdir rs py
        cd rs
        cargo new --quiet hello
        cd hello
        split_files "$RS"
        test "$(cargo run --quiet)" = 'Hello, Ferris!'
        cd ../../py
        uv init --quiet hello
        cd hello
        split_files "$PY"
        test "$(uv run --quiet hello)" = 'Hello, Ferris!'
      `,
      links: [
        [1, 1, 'A new file next to <code>main.rs</code>. The file name is the module name: <code>greeting</code>.'],
        [2, 2, '<code>pub</code> = public. Without it, <code>main.rs</code> could not call <code>greet</code>. Python has no such rule; a leading <code>_</code> is only a hint.'],
        [8, null, '<code>mod greeting;</code> says "the file <code>src/greeting.rs</code> is part of this program". Without this line Rust ignores the file. Python has no equivalent: it finds files on its own.'],
        [10, 7, '<code>use</code> is <code>import</code>. <code>::</code> separates the parts of the path, like the dot in <code>hello.greeting</code>.'],
        [13, 11, 'After the <code>use</code>, the function is called by its short name, just like after <code>from ... import greet</code>.'],
      ],
    },
    {
      title: 'Forgetting pub is a compile error',
      text: `<p>A module can also be written <b>inline</b>, with <code>mod greeting { ... }</code> in the same file. It works
      exactly like <code>src/greeting.rs</code>. Later lessons use this form a lot, because one file fits in the browser.
      Without <code>pub</code>, the function is private to its module. Python lets you call a <code>_private</code>
      function anyway. Rust refuses to compile.</p>`,
      py: code`
        def _greet(name: str) -> str:
            return f"Hello, {name}!"





        print(_greet("Ferris"))
      `,
      rs: code`
        mod greeting {
            fn greet(name: &str) -> String {
                format!("Hello, {name}!")
            }
        }

        fn main() {
            println!("{}", greeting::greet("Ferris"));
        }
      `,
      out: 'Hello, Ferris!',
      rsError: 'error[E0603]: function `greet` is private',
      rsFix: code`
        mod greeting {
            pub fn greet(name: &str) -> String {
                format!("Hello, {name}!")
            }
        }

        fn main() {
            println!("{}", greeting::greet("Ferris"));
        }
      `,
      links: [
        [1, null, 'An inline module: the same as a file <code>src/greeting.rs</code>, written in place.'],
        [2, 1, 'No <code>pub</code>, so only code inside <code>greeting</code> may call it. The <code>_</code> in Python means the same thing, but nothing enforces it.'],
        [8, 8, '<code>greeting::greet</code> calls the function by its full path, without a <code>use</code>. Here it fails with error E0603 because the function is private.'],
      ],
    },
  ],
  quiz: [
    {
      type: 'choice',
      q: 'You created <code>src/utils.rs</code> with <code>pub fn slug()</code>, but <code>use utils::slug;</code> in <code>main.rs</code> fails. What is missing?',
      options: [
        '<code>mod utils;</code> in <code>main.rs</code>',
        'An <code>__init__.rs</code> file',
        '<code>cargo add utils</code>',
        'A <code>pub</code> in front of <code>use</code>',
      ],
      answer: 0,
      explain: 'A file only becomes part of the program when its parent declares it with <code>mod</code>. Then <code>use</code> can import from it.',
    },
    {
      type: 'output',
      q: 'What does this print?',
      code: code`
        mod shop {
            pub fn price(cents: u32) -> String {
                format!("{} EUR", cents / 100)
            }
        }

        use shop::price;

        fn main() {
            println!("{}", price(1250));
            println!("{}", shop::price(300));
        }
      `,
      options: ['12 EUR\n3 EUR', '12.5 EUR\n3 EUR', '1250 EUR\n300 EUR'],
      answer: 0,
      explain: 'Both lines call the same function: once by the short name brought in by <code>use</code>, once by the full path. <code>cents / 100</code> divides whole numbers, so 1250 becomes 12 (lesson 4).',
    },
    {
      type: 'compiles',
      q: 'Does this compile?',
      code: code`
        mod shop {
            pub fn price(cents: u32) -> u32 {
                cents / 100
            }
        }

        fn main() {
            println!("{}", price(1250));
        }
      `,
      answer: false,
      explain: 'There is no <code>use shop::price;</code>, so the short name <code>price</code> is unknown here (error E0425). Either add the <code>use</code> or call <code>shop::price(1250)</code>.',
    },
  ],
  exercise: {
    task: `<p>The <code>greeting</code> module is ready, but <code>main</code> still prints the old text. Change
      <code>main</code> so it calls <code>greet</code> and prints <code>Hello, Ada!</code>.</p>`,
    starter: code`
      mod greeting {
          pub fn greet(name: &str) -> String {
              format!("Hello, {name}!")
          }
      }

      fn main() {
          println!("Hello, world!");
      }
    `,
    solution: code`
      mod greeting {
          pub fn greet(name: &str) -> String {
              format!("Hello, {name}!")
          }
      }

      fn main() {
          println!("{}", greeting::greet("Ada"));
      }
    `,
    expected: 'Hello, Ada!',
    hint: 'Call it by its full path, <code>greeting::greet("Ada")</code>, and print the result with <code>println!("{}", ...)</code>.',
  },
  cheat: [
    ['def greet(name: str) -> str:', 'pub fn greet(name: &str) -> String {'],
    ['return f"Hello, {name}!"', 'format!("Hello, {name}!")  // last line, no ;'],
    ['# new file src/hello/greeting.py', '// new file src/greeting.rs, plus "mod greeting;" in main.rs'],
    ['from hello.greeting import greet', 'use greeting::greet;'],
    ['greeting.greet("Ada")', 'greeting::greet("Ada")'],
    ['def _helper(): ...  # private by convention', 'fn helper() { }  // private unless pub'],
    ['print(greet("Ada"))', 'println!("{}", greet("Ada"));'],
  ],
});
