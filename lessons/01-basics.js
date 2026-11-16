LESSONS.push({
  id: 'basics',
  title: 'Hello, variables and mut',
  summary: 'fn main, println!, let, mut, shadowing, and why there are semicolons.',
  intro: `
    <p>Python runs a file from top to bottom. Rust is <b>compiled</b>: before anything runs, the compiler reads the
    whole program, checks it, and only then builds something you can run. Most of what looks strange in Rust
    is there so the compiler can catch mistakes before the program runs.</p>
    <p>Three things you will see in every Rust file:</p>
    <ul>
      <li><code>fn main() { ... }</code> is where the program starts.</li>
      <li>Curly braces <code>{ }</code> mark blocks. Python uses indentation for this. Rust code is indented too, but only so people can read it.</li>
      <li>Most lines end with <code>;</code>.</li>
    </ul>`,
  examples: [
    {
      title: 'Hello and two variables',
      text: `<p>An almost line-by-line translation. Hover over the marked Rust lines.</p>`,
      py: code`
        name = "Ferris"
        age = 7
        print(f"Hello, {name}! You are {age}.")
      `,
      rs: code`
        fn main() {
            let name = "Ferris";
            let age = 7;
            println!("Hello, {name}! You are {age}.");
        }
      `,
      out: code`
        Hello, Ferris! You are 7.
      `,
      links: [
        [1, null, '<code>fn main()</code> is the entry point. Rust has no top-level code: everything runs from <code>main</code>.'],
        [2, 1, '<code>let</code> creates a new variable. Python creates one just by assigning to a name.'],
        [3, 2, 'No type is written, but Rust still gives <code>age</code> a fixed type. Here it guesses <code>i32</code>, a 32-bit integer.'],
        [4, 3, '<code>println!</code> is <code>print</code> with f-string-like <code>{name}</code> placeholders. The <code>!</code> means it is a <i>macro</i>, a special kind of function call.'],
        [5, null, 'The closing brace ends <code>main</code>. In Python, going back one level of indentation does this.'],
      ],
    },
    {
      title: 'Variables are read-only unless you say mut',
      text: `<p>In Python any name can be reassigned. In Rust a variable <b>cannot change</b> unless it is declared with
      <code>mut</code> (short for mutable). When reading Rust, <code>mut</code> tells you which variables to watch:
      everything else stays the same once it is set.</p>`,
      py: code`
        count = 0
        count += 1
        count += 1
        print(count)
      `,
      rs: code`
        fn main() {
            let mut count = 0;
            count += 1;
            count += 1;
            println!("{count}");
        }
      `,
      out: '2',
      links: [
        [2, 1, '<code>let mut</code> means "this variable will change later".'],
        [3, 2, '<code>+=</code> works just like in Python.'],
      ],
    },
    {
      title: 'Forgetting mut is a compile error',
      text: `<p>Python is fine with this. Rust refuses to build it, and the error message is clear. Learning to read
      these messages is a big part of reading Rust, and lesson 13 covers it.</p>`,
      py: code`
        total = 10
        total = total + 5
        print(total)
      `,
      rs: code`
        fn main() {
            let total = 10;
            total = total + 5;
            println!("{total}");
        }
      `,
      out: '15',
      rsError: 'error[E0384]: cannot assign twice to immutable variable `total`',
      links: [
        [2, 1, 'No <code>mut</code>, so <code>total</code> can never change...'],
        [3, 2, '...so assigning to it again is an error. The compiler suggests the fix: <code>let mut total = 10;</code>'],
      ],
    },
    {
      title: 'Shadowing: a new variable with the same name',
      text: `<p>A second <code>let</code> with the same name creates a <b>new</b> variable that hides the old one, and it may
      have a different type. You will often see this when converting a value, like text to a number. It is not
      <code>mut</code>: no variable changes here.</p>`,
      py: code`
        text = "42"
        text = int(text)
        print(text + 1)
      `,
      rs: code`
        fn main() {
            let text = "42";
            let text: i32 = text.parse().unwrap();
            println!("{}", text + 1);
        }
      `,
      out: '43',
      links: [
        [2, 1, '<code>text</code> is a string here.'],
        [3, 2, 'A new <code>text</code>, this time an <code>i32</code>. <code>: i32</code> is a type annotation, like a Python type hint, except the compiler enforces it. <code>.parse()</code> plays the role of <code>int()</code>. <code>.unwrap()</code> means "I am sure this worked, crash if not". Lesson 10 explains it.'],
        [4, 3, 'A placeholder can hold a name like <code>{text}</code>, but not an expression like <code>{text + 1}</code>. For expressions, use an empty <code>{}</code> and pass the value after the comma.'],
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
            let x = x * 2;
            {
                let x = x + 1;
                println!("{x}");
            }
            println!("{x}");
        }
      `,
      options: ['11\n10', '11\n11', '6\n10', '10\n10'],
      answer: 0,
      explain: 'The first <code>x</code> is 5. It is shadowed by a new <code>x</code> = 10. Inside the inner <code>{ }</code> block another <code>x</code> = 11 exists only until the closing brace. After that, the <code>x</code> that is 10 is visible again.',
    },
    {
      type: 'compiles',
      q: 'Does this compile?',
      code: code`
        fn main() {
            let score = 1;
            score += 1;
            println!("{score}");
        }
      `,
      answer: false,
      explain: '<code>score</code> is not <code>mut</code>, so <code>score += 1</code> is rejected (error E0384). Fix it with <code>let mut score = 1;</code>',
    },
    {
      type: 'compiles',
      q: 'And this one?',
      code: code`
        fn main() {
            let name = "Ada";
            let name = name.len();
            println!("{name}");
        }
      `,
      answer: true,
      explain: 'This is shadowing, not changing a value. The second <code>let</code> makes a brand new <code>name</code> (a number, 3) that hides the old string. No <code>mut</code> is needed.',
    },
    {
      type: 'choice',
      q: 'In <code>println!("{}", total)</code>, what does the <code>!</code> mean?',
      options: [
        'It is a macro, a call that the compiler expands into more code. <code>vec!</code> and <code>format!</code> work the same way.',
        'The call can fail',
        'It negates the value',
        'It forces the line to run first',
      ],
      answer: 0,
      explain: 'Names ending in <code>!</code> are macros. For reading code, treat them like function calls with special powers, for example <code>println!</code> accepts any number of arguments.',
    },
  ],
  exercise: {
    task: `<p>This countdown doesn't compile. Press <b>Run</b> to see the compiler error, then fix it.
      You only need to add <b>one word</b>.</p>`,
    starter: code`
      fn main() {
          let seconds = 3;
          println!("T-minus {seconds}");
          seconds -= 1;
          println!("T-minus {seconds}");
          seconds -= 1;
          println!("T-minus {seconds}");
          println!("Liftoff!");
      }
    `,
    solution: code`
      fn main() {
          let mut seconds = 3;
          println!("T-minus {seconds}");
          seconds -= 1;
          println!("T-minus {seconds}");
          seconds -= 1;
          println!("T-minus {seconds}");
          println!("Liftoff!");
      }
    `,
    expected: code`
      T-minus 3
      T-minus 2
      T-minus 1
      Liftoff!
    `,
    hint: 'The compiler error says "consider making this binding mutable". Which keyword makes a variable changeable?',
  },
  cheat: [
    ['print("hi")', 'println!("hi");'],
    ['print(f"{x} and {y}")', 'println!("{x} and {y}");'],
    ['print(f"{x + 1}")', 'println!("{}", x + 1);'],
    ['print(repr(items))', 'println!("{:?}", items);'],
    ['s = f"{x}!"', 'let s = format!("{x}!");'],
    ['x = 5', 'let x = 5;'],
    ['x = 5\nx += 1', 'let mut x = 5;\nx += 1;'],
    ['n: int = 5', 'let n: i32 = 5;'],
    ['MAX = 100  # by convention', 'const MAX: u32 = 100;'],
    ['# comment', '// comment'],
    ['"""docstring"""', '/// doc comment'],
    ['if __name__ == "__main__":', 'fn main() { }'],
  ],
});
