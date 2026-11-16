LESSONS.push({
  id: 'option',
  title: 'Option instead of None',
  summary: 'A value that might be missing, and the compiler making you handle the missing case.',
  intro: `
    <p>In Python any variable can be <code>None</code>, and you only find out when the program runs and something
    crashes. Rust puts "maybe missing" into the <b>type</b>: <code>Option&lt;i32&gt;</code> is either
    <code>Some(3)</code> or <code>None</code>.</p>
    <p><code>Option</code> is just an enum with two variants, like the ones in lesson 10. That is why you handle it with
    <code>match</code>, and why the compiler knows when you forgot the <code>None</code> case. An
    <code>Option&lt;i32&gt;</code> is <b>not</b> an <code>i32</code>: you cannot add to it or print it as a number until
    you say what should happen when it is empty.</p>`,
  examples: [
    {
      title: 'Optional[int] and Option<i32>',
      text: `<p>A function that sometimes has nothing to return. In Python the hint is <code>Optional[int]</code>, but
      nothing stops you from ignoring it. In Rust the return type is <code>Option&lt;i32&gt;</code> and the value is
      built with <code>Some(...)</code> or <code>None</code>.</p>`,
      py: code`
        from typing import Optional

        def half(n: int) -> Optional[int]:
            if n % 2 == 0:
                return n // 2
            return None

        for n in [8, 7]:
            h = half(n)
            if h is None:
                print(f"{n} is odd")
            else:
                print(f"half of {n} is {h}")
      `,
      rs: code`
        fn half(n: i32) -> Option<i32> {
            if n % 2 == 0 {
                Some(n / 2)
            } else {
                None
            }
        }

        fn main() {
            for n in [8, 7] {
                match half(n) {
                    Some(h) => println!("half of {n} is {h}"),
                    None => println!("{n} is odd"),
                }
            }
        }
      `,
      out: code`
        half of 8 is 4
        7 is odd
      `,
      links: [
        [1, 3, '<code>Option&lt;i32&gt;</code> is the type hint <code>Optional[int]</code>. It is part of the signature, so the compiler remembers it.'],
        [3, 5, '<code>Some(value)</code> wraps a real value. This is the arm that has something to give back.'],
        [5, 6, '<code>None</code> is the same idea as Python\'s <code>None</code>, but it only fits where the type says <code>Option</code>.'],
        [11, [9, 10], '<code>match</code> is the <code>if</code>/<code>else</code> on <code>None</code>. Both variants must be handled, and the compiler checks it.'],
        [12, [12, 13], 'The <code>Some(h)</code> pattern only fits when there is a value, and <code>h</code> is that value. No extra check is needed here.'],
        [13, [10, 11], 'The <code>None</code> arm is the missing case. In Python it is the <code>if h is None</code> branch.'],
      ],
    },
    {
      title: 'Python finds out at run time, Rust does not',
      text: `<p>The Python function returns <code>None</code> for an odd number, and the next line adds <code>1</code> to
      it. Python only sees the problem while running, and stops with a <code>TypeError</code>.</p>
      <p>The Rust version does not compile until you say what to do with <code>None</code>. Here the code says "use 0".
      <code>unwrap_or</code> is the same idea as <code>dict.get(key, default)</code> or <code>x or default</code>: take
      the value if there is one, otherwise use the default.</p>`,
      py: code`
        def half(n):
            if n % 2 == 0:
                return n // 2
            return None

        n = 7
        print(half(n) + 1)
      `,
      rs: code`
        fn half(n: i32) -> Option<i32> {
            if n % 2 == 0 {
                Some(n / 2)
            } else {
                None
            }
        }

        fn main() {
            let n = 7;
            let h = half(n).unwrap_or(0);
            println!("{}", h + 1);
        }
      `,
      out: '1',
      pyError: "TypeError: unsupported operand type(s) for +: 'NoneType' and 'int'",
      pyFix: code`
        def half(n):
            if n % 2 == 0:
                return n // 2
            return None

        n = 7
        h = half(n)
        print((h if h is not None else 0) + 1)
      `,
      links: [
        [1, 1, 'The signature is what Python lacks here: <code>Option&lt;i32&gt;</code> says the result may be missing.'],
        [11, 7, '<code>unwrap_or(0)</code> turns the <code>Option</code> into a plain number. <code>Some(x)</code> becomes <code>x</code>, <code>None</code> becomes <code>0</code>.'],
        [12, 7, 'Only now is <code>h</code> an <code>i32</code>, so <code>h + 1</code> is allowed. The Python line tries it while <code>h</code> may be <code>None</code>.'],
      ],
    },
    {
      title: 'The short ways: if let, is_some, map',
      text: `<p>Not every case needs a full <code>match</code>. <code>if let Some(x) = ...</code> handles just the value
      case and does nothing otherwise, like a plain <code>if x is not None</code>.</p>
      <p><code>.is_some()</code> and <code>.is_none()</code> give a <code>bool</code> (they are opposites).
      <code>.map(...)</code> runs your closure on the value only when there is one, and leaves <code>None</code> alone.</p>`,
      py: code`
        maybe = 7
        nothing = None

        if maybe is not None:
            print(f"got {maybe}")

        if maybe is not None:
            print("maybe has a value")
        else:
            print("maybe is empty")

        doubled = nothing * 2 if nothing is not None else None
        print(f"doubled: {doubled}")
        print(f"or zero: {doubled if doubled is not None else 0}")
      `,
      rs: code`
        fn main() {
            let maybe = Some(7);
            let nothing: Option<i32> = None;

            if let Some(x) = maybe {
                println!("got {x}");
            }

            if maybe.is_some() {
                println!("maybe has a value");
            } else {
                println!("maybe is empty");
            }

            let doubled = nothing.map(|x| x * 2);
            println!("doubled: {doubled:?}");
            println!("or zero: {}", doubled.unwrap_or(0));
        }
      `,
      out: code`
        got 7
        maybe has a value
        doubled: None
        or zero: 0
      `,
      links: [
        [5, [4, 5], '<code>if let</code> is a <code>match</code> with one arm. If the value is not <code>Some</code>, nothing happens and the code after the block continues.'],
        [9, [7, 8], '<code>is_some()</code> returns <code>true</code> when there is a value. It reads as "is not None".'],
        [11, [9, 10], 'A plain <code>if</code> on a <code>bool</code>, so the <code>else</code> branch can handle the empty case, like Python\'s <code>else</code>.'],
        [15, 12, '<code>map</code> changes the value inside <code>Some</code> and keeps <code>None</code> as <code>None</code>. It is the <code>x * 2 if ... else None</code> line.'],
        [16, 13, '<code>{doubled:?}</code> prints the whole <code>Option</code>, so an empty one shows as <code>None</code>. <code>:?</code> is the debug format from lesson 3.'],
        [17, 14, '<code>unwrap_or(0)</code> finishes the job: a number or the default.'],
      ],
    },
    {
      title: '? means "return None now"',
      text: `<p>Inside a function that returns <code>Option</code>, a <code>?</code> after a value means: if this is
      <code>None</code>, return <code>None</code> from the whole function right away. It replaces the early
      <code>return None</code> checks that clutter Python code.</p>
      <p><code>let ... else</code> is the other new shape. Read it as "get the value out, or run this block", and that
      block must leave the function. Lesson 12 covers <code>?</code> in more depth.</p>`,
      py: code`
        def second_word(text):
            parts = text.split()
            if len(parts) < 2:
                return None
            return parts[1]

        word = second_word("rust is fun")
        if word is None:
            print("too short")
        else:
            print(word)
      `,
      rs: code`
        fn second_word(text: &str) -> Option<&str> {
            let mut parts = text.split_whitespace();
            parts.next()?;
            parts.next()
        }

        fn main() {
            let Some(word) = second_word("rust is fun") else {
                println!("too short");
                return;
            };
            println!("{word}");
        }
      `,
      out: 'is',
      links: [
        [2, 2, 'An iterator over the words, like <code>text.split()</code>. It gives them one at a time.'],
        [3, [3, 4], 'The <code>?</code> says: if <code>next()</code> is <code>None</code>, return <code>None</code> from this function now. That is exactly the early <code>return None</code>.'],
        [4, 5, 'The last expression is the return value, so this hands back the second word, or <code>None</code> if the text had only one word.'],
        [8, [7, 8], '<code>let Some(word) = ... else { ... }</code>: if the call gave <code>None</code>, run the <code>else</code> block, which must exit the function.'],
        [12, [10, 11], 'After the <code>let</code>, <code>word</code> is a real <code>&amp;str</code>, not an <code>Option</code>. The missing case cannot be reached here.'],
      ],
    },
    {
      title: 'Where you meet Option',
      text: `<p>Option shows up in the standard library wherever Python would return <code>None</code>, <code>-1</code> or
      raise an <code>IndexError</code>. Three common places: <code>Vec::get</code>, <code>max</code>, and
      <code>str::find</code>.</p>`,
      py: code`
        scores = [72, 91, 64]

        if len(scores) > 9:
            print(f"tenth score: {scores[9]}")
        else:
            print("no tenth score")

        print(f"best: {max(scores)}")

        text = "ferris the crab"
        if "the" in text:
            print(f"found at {text.find('the')}")
        else:
            print("not found")
      `,
      rs: code`
        fn main() {
            let scores = vec![72, 91, 64];
            let tenth = scores.get(9);

            match tenth {
                Some(s) => println!("tenth score: {s}"),
                None => println!("no tenth score"),
            }

            let best = scores.iter().max();
            println!("best: {}", best.unwrap_or(&0));

            let text = "ferris the crab";
            match text.find("the") {
                Some(i) => println!("found at {i}"),
                None => println!("not found"),
            }
        }
      `,
      out: code`
        no tenth score
        best: 91
        found at 7
      `,
      links: [
        [3, 3, '<code>get</code> returns <code>Option&lt;&amp;i32&gt;</code> instead of raising <code>IndexError</code>. A missing index is a normal value, not a crash.'],
        [5, 3, 'So the code has to deal with the empty case, and here it says "no tenth score".'],
        [10, 8, '<code>max</code> returns an <code>Option</code> too, because an empty list has no best value.'],
        [11, 8, 'The value inside is a reference, so the default is written <code>&amp;0</code>. Python\'s <code>max</code> raises on an empty list instead.'],
        [14, [11, 12], '<code>find</code> gives <code>Some(index)</code> or <code>None</code>. Python gives <code>-1</code>, which is easy to forget to check.'],
      ],
    },
  ],
  quiz: [
    {
      type: 'output',
      q: 'What does this print?',
      code: code`
        fn main() {
            let a: Option<i32> = Some(3);
            let b: Option<i32> = None;
            println!("{}", a.unwrap_or(10));
            println!("{}", b.unwrap_or(10));
        }
      `,
      options: ['3\n10', '3\n0', '10\n10', '3\nNone'],
      answer: 0,
      explain: '<code>unwrap_or</code> returns the value inside <code>Some</code>, and the default only for <code>None</code>. So <code>a</code> gives 3 and <code>b</code> gives 10.',
    },
    {
      type: 'output',
      q: 'What does this print?',
      code: code`
        fn main() {
            let v = vec![5, 6, 7];
            let x = v.get(1).map(|n| n * 10).unwrap_or(0);
            println!("{x}");
        }
      `,
      options: ['60', '6', '0', '50'],
      answer: 0,
      explain: '<code>v.get(1)</code> is <code>Some(&amp;6)</code>. <code>map</code> multiplies it by 10, giving <code>Some(60)</code>. <code>unwrap_or</code> then takes the 60 out. If the index was missing, the answer would be 0.',
    },
    {
      type: 'compiles',
      q: 'Does this compile?',
      code: code`
        fn main() {
            let x: Option<i32> = Some(5);
            println!("{}", x + 1);
        }
      `,
      answer: false,
      explain: 'No. <code>Option&lt;i32&gt;</code> is not a number, so <code>+</code> is rejected with <code>error[E0369]: cannot add {integer} to Option&lt;i32&gt;</code>. Write <code>x.unwrap_or(0) + 1</code> or match on it.',
    },
    {
      type: 'compiles',
      q: 'And this one?',
      code: code`
        fn main() {
            let names = vec!["ada", "linus"];
            let name = names.get(1).unwrap_or(&"nobody");
            println!("{name}");
        }
      `,
      answer: true,
      explain: 'Yes, and it prints <code>linus</code>. <code>get</code> returns <code>Option&lt;&amp;&amp;str&gt;</code>, so the default has the same shape: a reference to a string literal.',
    },
    {
      type: 'choice',
      q: 'Which Rust method plays the role of <code>d.get(key, 0)</code> in Python?',
      options: [
        '<code>.unwrap_or(0)</code> — take the value, or this default when there is none.',
        '<code>.unwrap()</code> — take the value, or crash.',
        '<code>.expect("0")</code> — take the value, or crash with a message.',
        '<code>.is_some()</code> — gives a <code>bool</code>, not a value.',
      ],
      answer: 0,
      explain: '<code>unwrap_or</code> is the one that supplies a fallback. <code>unwrap()</code> and <code>expect("...")</code> crash on <code>None</code>; they are for values that truly must be there.',
    },
  ],
  exercise: {
    task: `<p>Only apples and pears are in the stock. Press <b>Run</b>: the program crashes, because
      <code>get</code> gave <code>None</code> and <code>unwrap</code> does not accept that.</p>
      <p>Change <b>one line</b> so a missing item counts as <code>0</code>.</p>`,
    starter: code`
      use std::collections::HashMap;

      fn main() {
          let mut stock: HashMap<&str, i32> = HashMap::new();
          stock.insert("apples", 12);
          stock.insert("pears", 4);

          let plums = *stock.get("plums").unwrap();
          println!("plums: {plums}");
      }
    `,
    solution: code`
      use std::collections::HashMap;

      fn main() {
          let mut stock: HashMap<&str, i32> = HashMap::new();
          stock.insert("apples", 12);
          stock.insert("pears", 4);

          let plums = *stock.get("plums").unwrap_or(&0);
          println!("plums: {plums}");
      }
    `,
    expected: code`
      plums: 0
    `,
    hint: 'There is a version of <code>unwrap</code> that takes a default: <code>unwrap_or(...)</code>. The value inside is a reference, so the default is written <code>&amp;0</code>.',
  },
  cheat: [
    ['x: Optional[int] = None', 'let x: Option<i32> = None;'],
    ['x = 5  # may be None later', 'let x = Some(5);'],
    ['if x is not None:', 'if let Some(v) = x {'],
    ['if x is None:', 'if x.is_none() {'],
    ['if x is not None:', 'if x.is_some() {'],
    ['d.get(key, default)', 'map.get(&key).copied().unwrap_or(default)'],
    ['x or 0', 'x.unwrap_or(0)'],
    ['x + 1 if x is not None else None', 'x.map(|v| v + 1)'],
    ['if x is None:\n    return None', 'let v = x?;'],
    ['assert x is not None  # crashes', 'x.unwrap()  // crashes'],
    ['assert x is not None, "no user"', 'x.expect("no user")  // crashes'],
    ['match x:\n    case None: ...', 'match x {\n    Some(v) => ...,\n    None => ...,\n}'],
  ],
});
