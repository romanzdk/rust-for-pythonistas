LESSONS.push({
  id: 'functions',
  title: 'Functions and expressions',
  summary: 'fn, types that are required, the last expression as the return value, and expressions everywhere.',
  intro: `
    <p>A Python function is a block of lines you call, and you give it type hints if you like. A Rust function looks
    close, but three things are different, and all three make it easier to <b>read</b>: the types are written down and
    checked, the value at the end of the function is the return value, and <code>if</code> and <code>{ }</code> blocks can
    give back a value instead of only doing something.</p>
    <p>Once you know that, most Rust functions read like a Python function with the <code>return</code> moved to the
    last line and the <code>;</code> removed.</p>`,
  examples: [
    {
      title: 'Same function, types written down',
      text: `<p>A Python type hint is a note for other people and for tools. In Rust the types are part of the function
      and the compiler checks every call: two arguments, both <code>i32</code>, and the result is an
      <code>i32</code>.</p>
      <p>Two lines to notice: the parameter types come after a colon, and <code>-&gt; i32</code> says what the function
      gives back. Rust does not care about the order of functions, so <code>add</code> could be below
      <code>main</code>.</p>`,
      py: code`
        def add(a: int, b: int) -> int:
            return a + b


        print(add(2, 3))
      `,
      rs: code`
        fn add(a: i32, b: i32) -> i32 {
            a + b
        }

        fn main() {
            println!("{}", add(2, 3));
        }
      `,
      out: '5',
      links: [
        [1, 1, '<code>fn</code> replaces <code>def</code>, and <code>-&gt; i32</code> reads "returns <code>i32</code>", like the Python hint. Here the types are required and checked.'],
        [2, 2, 'The last line has no <code>;</code>. That makes it the value the function gives back, so no <code>return</code> is needed.'],
        [3, 3, 'The closing brace ends the function body.'],
        [6, null, 'Rust reads the whole file before running, so a function may be defined after the code that calls it.'],
        [7, 5, 'The call looks the same as in Python.'],
      ],
    },
    {
      title: 'return for an early exit',
      text: `<p><code>return</code> still exists, and you use it for the same reason as in Python: to leave the function
      before the end. The difference is that the last line, with no <code>;</code>, is the normal way to give back a
      value.</p>
      <p>Read a Rust function like this: check the <code>return</code> lines first, then the last expression. In
      <code>level</code> below, the answer is 0 for small scores, 100 for big ones, and the score itself in between.</p>`,
      py: code`
        def level(score: int) -> int:
            if score < 0:
                return 0
            if score > 100:
                return 100
            return score


        print(level(-5))
        print(level(50))
        print(level(120))
      `,
      rs: code`
        fn level(score: i32) -> i32 {
            if score < 0 {
                return 0;
            }
            if score > 100 {
                return 100;
            }
            score
        }

        fn main() {
            println!("{}", level(-5));
            println!("{}", level(50));
            println!("{}", level(120));
        }
      `,
      out: code`
        0
        50
        100
      `,
      links: [
        [1, 1, 'The parameter is <code>i32</code> and the result is <code>i32</code>. Python\'s hints are optional; here they are the signature.'],
        [2, 2, 'The <code>if</code> condition needs no parentheses, the body needs braces.'],
        [3, 3, 'An early exit: <code>return 0;</code> with a semicolon, exactly like Python\'s <code>return 0</code>.'],
        [8, 6, 'The last expression has no <code>;</code> and no <code>return</code>. It is the result when neither exit above fired.'],
      ],
    },
    {
      title: 'if and blocks give back a value',
      text: `<p>Python has one expression for a choice: <code>a if cond else b</code>. Rust uses <code>if</code> itself as
      an expression, so the two branches sit in braces and the value is whatever the branch ends with. Every branch
      must produce the same type.</p>
      <p>A plain block <code>{ ... }</code> is an expression too. That is the same rule as in a function body: the last
      line, with no <code>;</code>, is the value of the block. In Python you would just write the lines one after
      another; in Rust you can keep a temporary value inside a block and let the block hand back the result.</p>`,
      py: code`
        is_member = True
        discount = 2 if is_member else 0
        base = 10
        total = base - discount
        print(total)
      `,
      rs: code`
        fn main() {
            let is_member = true;
            let discount = if is_member { 2 } else { 0 };
            let total = {
                let base = 10;
                base - discount
            };
            println!("{total}");
        }
      `,
      out: '8',
      links: [
        [3, 2, 'This is Python\'s <code>2 if is_member else 0</code>. The value of the chosen branch becomes the value of the whole <code>if</code>.'],
        [4, [3, 4], 'The block opens and its value becomes <code>total</code>. <code>base</code> exists only inside these braces, like a temporary variable you did not need later.'],
        [6, 4, '<code>base - discount</code> has no <code>;</code>, so the block gives it back. A <code>;</code> here would make the block produce <code>()</code>.'],
        [7, 5, 'The block ended, so <code>total</code> is 8 and <code>base</code> is gone.'],
      ],
    },
    {
      title: 'No return type means unit',
      text: `<p>A function with no <code>-&gt;</code> returns <code>()</code>, called <b>unit</b>. Unit is the type with one
      value, also written <code>()</code>, and it plays the part of <code>None</code>: the function does something and
      gives nothing back. You will see it in function signatures and in error messages like "expected <code>()</code>,
      found <code>i32</code>".</p>
      <p>Rust also has no default argument values and no keyword arguments. A Rust function takes every value, in
      order. When Python code would use defaults, Rust code usually writes a second function with a shorter name, or
      groups the options in a struct (lesson 7).</p>`,
      py: code`
        def greet(name: str, loud: bool) -> None:
            if loud:
                print(f"HELLO, {name}!")
            else:
                print(f"Hello, {name}.")


        greet("Ferris", False)
        greet("Ferris", True)
      `,
      rs: code`
        fn greet(name: &str, loud: bool) {
            if loud {
                println!("HELLO, {name}!");
            } else {
                println!("Hello, {name}.");
            }
        }

        fn main() {
            greet("Ferris", false);
            greet("Ferris", true);
        }
      `,
      out: code`
        Hello, Ferris.
        HELLO, Ferris!
      `,
      links: [
        [1, 1, 'No <code>-&gt;</code> after the parameters, so this function returns <code>()</code>. The Python hint says <code>None</code>; both mean "gives nothing back".'],
        [2, 2, 'A <code>bool</code> parameter. There are no default values, so every call must pass it.'],
        [10, 8, 'Both arguments are passed by position. There is no <code>loud=true</code>: Rust has no keyword arguments and no defaults.'],
      ],
    },
    {
      title: 'The semicolon that eats the return value',
      text: `<p>This is the mistake everyone makes once. A <code>;</code> turns a value into a statement, and a statement
      produces <code>()</code>. So the function promises an <code>i32</code> and gives back unit, and the compiler
      stops with <code>E0308</code>, mismatched types.</p>
      <p>When you see E0308 on the last line of a function, look for a stray semicolon first. The compiler message even
      shows the two types it compared.</p>`,
      py: code`
        def double(n: int) -> int:
            return n * 2


        print(double(4))
      `,
      rs: code`
        fn double(n: i32) -> i32 {
            n * 2;
        }

        fn main() {
            println!("{}", double(4));
        }
      `,
      out: '8',
      rsError: 'error[E0308]: mismatched types',
      links: [
        [1, 1, 'The signature promises an <code>i32</code>.'],
        [2, 2, 'The <code>;</code> throws the value away, so this line is a statement, and the function body now ends with <code>()</code>.'],
      ],
    },
  ],
  quiz: [
    {
      type: 'output',
      q: 'What does this print?',
      code: code`
        fn double(n: i32) -> i32 {
            n * 2
        }

        fn main() {
            let total = {
                let a = double(2);
                let b = double(3);
                a + b
            };
            println!("{total}");
        }
      `,
      options: ['10', '12', '6', '5'],
      answer: 0,
      explain: '<code>double(2)</code> is 4 and <code>double(3)</code> is 6. The block ends with <code>a + b</code> and no semicolon, so the block gives back 10 and <code>total</code> is 10.',
    },
    {
      type: 'output',
      q: 'What does this print?',
      code: code`
        fn main() {
            let n = 7;
            let label = if n % 2 == 0 { "even" } else { "odd" };
            println!("{label}");
        }
      `,
      options: ['odd', 'even', '7', 'It does not compile'],
      answer: 0,
      explain: 'Rust\'s <code>if</code> can give back a value, like <code>a if cond else b</code> in Python. 7 % 2 is 1, so the <code>else</code> branch runs and <code>label</code> is <code>"odd"</code>.',
    },
    {
      type: 'compiles',
      q: 'Does this compile?',
      code: code`
        fn triple(n: i32) -> i32 {
            n * 3;
        }

        fn main() {
            println!("{}", triple(2));
        }
      `,
      answer: false,
      explain: 'The <code>;</code> turns <code>n * 3</code> into a statement, so the function returns <code>()</code> while the signature says <code>i32</code>. The error is E0308. Remove the semicolon.',
    },
    {
      type: 'compiles',
      q: 'And this one?',
      code: code`
        fn add(a, b: i32) -> i32 {
            a + b
        }

        fn main() {
            println!("{}", add(1, 2));
        }
      `,
      answer: false,
      explain: 'Every parameter needs a type. After <code>a</code> the compiler expects a colon and a type, so it stops with "expected one of <code>:</code>, <code>@</code>, or <code>|</code>" and points at the signature. Write <code>a: i32</code>.',
    },
    {
      type: 'choice',
      q: 'A Rust function with no <code>-&gt;</code> after its parameters returns what?',
      options: [
        '<code>()</code>, the unit type, the same idea as a Python function returning <code>None</code>',
        '<code>None</code>, the Python value',
        'The last value it computed',
        'Nothing at all, so it cannot be used in an expression',
      ],
      answer: 0,
      explain: '<code>()</code> is a real type with one value, written the same way. It means "no useful value", which is what <code>None</code> means in a Python <code>-&gt; None</code> function.',
    },
  ],
  exercise: {
    task: `<p>This computes the area of a rectangle but does not compile. Press <b>Run</b> to see the error, then fix it.
      You only need to delete <b>one character</b>.</p>`,
    starter: code`
      fn area(width: u32, height: u32) -> u32 {
          width * height;
      }

      fn main() {
          println!("area: {}", area(3, 4));
      }
    `,
    solution: code`
      fn area(width: u32, height: u32) -> u32 {
          width * height
      }

      fn main() {
          println!("area: {}", area(3, 4));
      }
    `,
    expected: code`
      area: 12
    `,
    hint: 'The function promises a <code>u32</code> but ends with a statement, so it gives back <code>()</code>. Look at the last line of the body: the <code>;</code> is the problem.',
  },
  cheat: [
    ['def add(a: int, b: int) -> int:', 'fn add(a: i32, b: i32) -> i32 {'],
    ['return a + b', 'a + b   // last expression, no semicolon'],
    ['return x   # early exit', 'return x;'],
    ['def f() -> None:', 'fn f() {   // returns ()'],
    ['def f(x, y=1):', 'no default args; write a second function or pass every value'],
    ['f(x=1, y=2)', 'f(1, 2)   // no keyword arguments'],
    ['a if c else b', 'if c { a } else { b }'],
    ['value = 1 + 2', 'let value = { 1 + 2 };   // a block is an expression'],
    ['f(1)   # call', 'f(1);'],
    ['def main(): ...', 'fn main() { ... }'],
    ['lambda x: x * 2', '|x| x * 2   // closure, lesson 6'],
    ['print(f(1))', 'println!("{}", f(1));'],
  ],
});
