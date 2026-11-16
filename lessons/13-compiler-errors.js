LESSONS.push({
  id: 'compiler-errors',
  title: 'Reading compiler errors',
  summary: 'How to read a rustc error from top to bottom and let its help: lines tell you the fix.',
  intro: `
    <p>Python finds most mistakes <b>while the program runs</b>, and only on lines that actually run. Rust finds them
    <b>before</b> the program runs. That's why you'll spend more time reading compiler errors than reading
    crashes. The good news: Rust's errors are some of the most helpful of any language, and they often include the fix.</p>
    <p>Every error has the same shape. Read it from the top:</p>
    <ol>
      <li><code>error[E0308]: mismatched types</code>: <b>what</b> went wrong, plus a code you can look up.</li>
      <li><code>--&gt; src/main.rs:2:20</code>: <b>where</b> (file, line, column).</li>
      <li>The code itself, with <code>^^^^</code> under the exact problem and <code>----</code> under related places, each with a short label.</li>
      <li><code>help:</code> lines: a suggested fix. Lines starting with <code>+</code> show code to add, and lines starting with <code>-</code> show code to remove, like a diff.</li>
      <li><code>rustc --explain E0308</code> prints a longer explanation with examples.</li>
    </ol>
    <p>One golden rule: <b>fix the first error first</b>. Later errors are often side effects of the first one.</p>`,
  examples: [
    {
      title: 'Anatomy: mismatched types',
      text: `<p>Python type hints are not checked when the program runs, so the mistake only shows up later as a
      <code>TypeError</code>. Rust checks types before running. The <code>^^^^</code> marks the wrong value and the
      <code>---</code> marks the place that set the expectation.</p>`,
      py: code`
        age: int = "42"
        print(age + 1)
      `,
      rs: code`
        fn main() {
            let age: u32 = "42";
            println!("{}", age + 1);
        }
      `,
      pyError: 'TypeError: can only concatenate str (not "int") to str',
      pyFix: code`
        age: int = int("42")
        print(age + 1)
      `,
      rsFix: code`
        fn main() {
            let age: u32 = "42".parse().unwrap();
            println!("{}", age + 1);
        }
      `,
      fixOut: '43',
      rsError: code`
        error[E0308]: mismatched types
         --> src/main.rs:2:20
          |
        2 |     let age: u32 = "42";
          |              ---   ^^^^ expected \`u32\`, found \`&str\`
          |              |
          |              expected due to this
      `,
      links: [
        [2, 1, 'The annotation <code>u32</code> is the "expected due to this" part. The string <code>"42"</code> is what was "found". Fix: write <code>42</code>, or convert with <code>"42".parse().unwrap()</code>.'],
      ],
    },
    {
      title: 'A typo on a line that rarely runs',
      text: `<p>The Python script runs fine. The bug is hiding in the <code>admin</code> branch and will crash with
      <code>NameError</code> on the day an admin logs in. Rust checks every line, including ones that don't run today.
      The <code>help:</code> block is a diff: <code>-</code> is the current line, <code>+</code> is the suggested one.</p>`,
      py: code`
        def greet(name):
            if name == "admin":
                print(f"Welcome back, {nmae}")
            else:
                print(f"Hello, {name}")

        greet("ann")
      `,
      rs: code`
        fn greet(name: &str) {
            if name == "admin" {
                println!("Welcome back, {nmae}");
            } else {
                println!("Hello, {name}");
            }
        }

        fn main() {
            greet("ann");
        }
      `,
      out: 'Hello, ann',
      rsFix: code`
        fn greet(name: &str) {
            if name == "admin" {
                println!("Welcome back, {name}");
            } else {
                println!("Hello, {name}");
            }
        }

        fn main() {
            greet("ann");
        }
      `,
      rsError: code`
        error[E0425]: cannot find value \`nmae\` in this scope
         --> src/main.rs:3:34
          |
        3 |         println!("Welcome back, {nmae}");
          |                                  ^^^^
          |
        help: a local variable with a similar name exists
          |
        3 -         println!("Welcome back, {nmae}");
        3 +         println!("Welcome back, {name}");
          |
      `,
      links: [[3, 3, 'Same typo in both languages. Python only notices when this line runs. Rust refuses to build the program at all.']],
    },
    {
      title: 'A story in labels: use after move',
      text: `<p>Some errors point at several lines. Read the labels in line order and they tell a story: <i>"names has a type
      that is not Copy" → "value moved here" → "value borrowed here after move"</i>. The <code>help:</code> shows the
      fix with <code>++++++++</code> under the added characters. (Lesson 11 covers moves.)</p>`,
      py: code`
        names = ["Ann", "Bob"]
        backup = names
        print(f"{len(names)} names")
        print(backup)
      `,
      rs: code`
        fn main() {
            let names = vec!["Ann", "Bob"];
            let backup = names;
            println!("{} names", names.len());
            println!("{:?}", backup);
        }
      `,
      out: code`
        2 names
        ['Ann', 'Bob']
      `,
      rsFix: code`
        fn main() {
            let names = vec!["Ann", "Bob"];
            let backup = names.clone();
            println!("{} names", names.len());
            println!("{:?}", backup);
        }
      `,
      fixOut: code`
        2 names
        ["Ann", "Bob"]
      `,
      rsError: code`
        error[E0382]: borrow of moved value: \`names\`
         --> src/main.rs:4:26
          |
        2 |     let names = vec!["Ann", "Bob"];
          |         ----- move occurs because \`names\` has type \`Vec<&str>\`, which does not implement the \`Copy\` trait
        3 |     let backup = names;
          |                  ----- value moved here
        4 |     println!("{} names", names.len());
          |                          ^^^^^ value borrowed here after move
          |
        help: consider cloning the value if the performance cost is acceptable
          |
        3 |     let backup = names.clone();
          |                       ++++++++
      `,
      links: [
        [2, 1, 'Label 1: the type <code>Vec&lt;&amp;str&gt;</code> is not <code>Copy</code>, so assigning it moves it.'],
        [3, 2, 'Label 2: "value moved here".'],
        [4, 3, 'The <code>^^^^^</code> marks the actual error: using <code>names</code> after it moved.'],
      ],
    },
    {
      title: 'The help: line is often the whole fix',
      text: `<p>Python lists can always be changed. In Rust you must say <code>mut</code> (lesson 1). The <code>+++</code> under
      <code>mut</code> means "add exactly these characters here". Many everyday errors are fixed by doing what
      <code>help:</code> says.</p>`,
      py: code`
        names = []
        names.append("Ann")
        print(names)
      `,
      rs: code`
        fn main() {
            let names = Vec::new();
            names.push("Ann");
            println!("{:?}", names);
        }
      `,
      out: `['Ann']`,
      rsFix: code`
        fn main() {
            let mut names = Vec::new();
            names.push("Ann");
            println!("{:?}", names);
        }
      `,
      fixOut: '["Ann"]',
      rsError: code`
        error[E0596]: cannot borrow \`names\` as mutable, as it is not declared as mutable
         --> src/main.rs:3:5
          |
        3 |     names.push("Ann");
          |     ^^^^^ cannot borrow as mutable
          |
        help: consider changing this to be mutable
          |
        2 |     let mut names = Vec::new();
          |         +++
      `,
      links: [
        [2, 1, 'The fix goes here (<code>let mut names</code>), even though the error points at line 3.'],
        [3, 2, '<code>push</code> changes the vector, so it needs a <code>&amp;mut</code> borrow.'],
      ],
    },
    {
      title: 'Wrong method name',
      text: `<p>Python's <code>AttributeError</code> becomes Rust's E0599. The compiler knows every method that exists
      on the type and suggests the closest match.</p>`,
      py: code`
        words = ["a", "b"]
        n = words.length()
        print(n)
      `,
      rs: code`
        fn main() {
            let words = vec!["a", "b"];
            let n = words.length();
            println!("{n}");
        }
      `,
      pyError: `AttributeError: 'list' object has no attribute 'length'`,
      pyFix: code`
        words = ["a", "b"]
        n = len(words)
        print(n)
      `,
      rsFix: code`
        fn main() {
            let words = vec!["a", "b"];
            let n = words.len();
            println!("{n}");
        }
      `,
      fixOut: '2',
      rsError: code`
        error[E0599]: no method named \`length\` found for struct \`Vec<&str>\` in the current scope
         --> src/main.rs:3:19
          |
        3 |     let n = words.length();
          |                   ^^^^^^
          |
        help: you might have meant to use \`len\`
          |
        3 -     let n = words.length();
        3 +     let n = words.len();
          |
      `,
      links: [[3, 2, 'The error names the type (<code>Vec&lt;&amp;str&gt;</code>), which is handy when you are not sure what a variable is.']],
    },
  ],
  quiz: [
    {
      type: 'choice',
      q: 'Where is the problem?',
      code: code`
        error[E0425]: cannot find value \`totl\` in this scope
          --> src/report.rs:14:9
      `,
      lang: 'plaintext',
      options: ['File <code>src/report.rs</code>, line 14, column 9', 'Line 9, column 14', 'Error number 14 of 9', 'In <code>main.rs</code>'],
      answer: 0,
      explain: 'The <code>--&gt;</code> line is always <code>file:line:column</code>. Most editors can jump straight there.',
    },
    {
      type: 'choice',
      q: 'In a <code>help:</code> block, what does a line starting with <code>+</code> mean?',
      options: ['Code the compiler suggests adding', 'A second error', 'A line that compiled fine', 'A warning you can ignore'],
      answer: 0,
      explain: 'Help blocks are diffs: <code>-</code> is what you wrote, <code>+</code> is the suggestion. <code>+++</code> under a line marks the exact characters to insert.',
    },
    {
      type: 'choice',
      q: 'The build shows 7 errors. Where do you start?',
      options: ['With the first one; later ones are often caused by it', 'With the last one', 'With the shortest one', 'Delete the file and start again'],
      answer: 0,
      explain: 'One mistake, like a wrong type, can cause several follow-up errors. Fix the first one, build again, and repeat. Often the count drops by more than one.',
    },
    {
      type: 'compiles',
      q: 'Does this compile? (Careful: think about which values move.)',
      code: code`
        fn main() {
            let words = vec!["hi", "there"];
            let first = words[0];
            let all = words;
            println!("{first} {}", all.len());
        }
      `,
      answer: true,
      explain: '<code>words[0]</code> is a <code>&amp;str</code>, a small value that is copied, so <code>first</code> has its own copy. Then <code>words</code> moves into <code>all</code>, and <code>words</code> is never used again. No error.',
    },
    {
      type: 'choice',
      q: 'Which error do you expect here?',
      code: code`
        fn main() {
            let total = 0;
            for n in [1, 2, 3] {
                total += n;
            }
            println!("{total}");
        }
      `,
      options: [
        '<code>E0384</code>: cannot assign twice to immutable variable',
        '<code>E0382</code>: borrow of moved value',
        '<code>E0599</code>: no method named ... found',
        'No error',
      ],
      answer: 0,
      rsError: 'error[E0384]',
      explain: '<code>total</code> is not <code>mut</code> (lesson 1). The help line will suggest <code>let mut total = 0;</code>.',
    },
  ],
  exercise: {
    task: `<p>This program has <b>two</b> errors. Press <b>Run</b>, read the first error, apply its <code>help:</code> suggestion,
      and run again. Repeat until it prints the expected output.</p>`,
    starter: code`
      fn main() {
          let prices = vec![4, 8, 15];
          prices.push(16);
          let total: i32 = prices.iter().sum();
          println!("{} items, total {total}", prices.lenght());
      }
    `,
    solution: code`
      fn main() {
          let mut prices = vec![4, 8, 15];
          prices.push(16);
          let total: i32 = prices.iter().sum();
          println!("{} items, total {total}", prices.len());
      }
    `,
    expected: '4 items, total 43',
    hint: 'One error wants a <code>mut</code>. The other is a misspelled method name, and the help line shows the right one.',
  },
  cheat: [
    ['TypeError  # at run time', 'error[E0308]: mismatched types'],
    ['NameError  # at run time', 'error[E0425]: cannot find value'],
    ['AttributeError  # at run time', 'error[E0599]: no method named ... found'],
    ['x = 1\nx = 2  # always allowed', 'error[E0384]: cannot assign twice to immutable variable'],
    ['items.append(x)  # always allowed', 'error[E0596]: cannot borrow as mutable'],
    ['b = a  # shares the list', 'error[E0382]: borrow of moved value'],
    ['# change a list while looping over it', 'error[E0502]: cannot borrow as mutable because it is also borrowed as immutable'],
    ['match x:  # no case _ is fine', 'error[E0004]: non-exhaustive patterns'],
    ['# duck typing fails at call time', 'error[E0277]: the trait bound ... is not satisfied'],
    ['mypy app.py', 'cargo check  // fast: errors only, no build'],
    ['help(thing)', 'rustc --explain E0382'],
  ],
});
