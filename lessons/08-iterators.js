LESSONS.push({
  id: 'iterators',
  title: 'Iterators and closures',
  summary: 'List comprehensions become chains of .iter(), .filter(), .map() and .collect().',
  intro: `
    <p>In Python you turn a list into a new list with a comprehension. Rust uses a <b>chain of calls</b> for the same
    job. Read the chain top to bottom, like a pipeline:</p>
    <p><code>xs.iter().filter(|x| **x &gt; 0).map(|x| *x * 2).collect::&lt;Vec&lt;_&gt;&gt;()</code></p>
    <p>That means "take the items, keep some, change them, build a new list". Each call is small, and the result of one
    call feeds the next one. Three things to know before you read the examples:</p>
    <ul>
      <li><code>.iter()</code> walks over a <code>Vec</code> but hands out <b>references</b> to the items, not the
      items themselves. That is why you see <code>*x</code>, <code>&amp;x</code> and <code>|&amp;x|</code> below.
      Read <code>&amp;</code> as "borrowed" (lesson 13). One <code>*</code> gets you the value behind a reference.</li>
      <li><code>|x| x * 2</code> is a <b>closure</b>: Python's <code>lambda x: x * 2</code>.</li>
      <li>A chain is <b>lazy</b>, like a generator: nothing runs until something asks for a value. <code>.collect()</code>,
      <code>.sum()</code> or a <code>for</code> loop asks for them.</li>
    </ul>
    <p>You will also meet <code>.into_iter()</code>. It hands out the items themselves and uses up the <code>Vec</code>
    (lesson 13). <code>.iter()</code> is the one you will read most.</p>`,
  examples: [
    {
      title: 'A comprehension becomes a chain',
      text: `<p>The Python comprehension does three things in one line: loop, keep, change. In Rust each of those is a
      separate call, and the type of <code>collect</code> is written on the left. Hover the marked lines.</p>`,
      py: code`
        numbers = [3, -1, 4, -2, 5]
        doubled = [x * 2 for x in numbers if x > 0]
        print(doubled)
      `,
      rs: code`
        fn main() {
            let numbers = vec![3, -1, 4, -2, 5];
            let doubled: Vec<i32> = numbers
                .iter()
                .filter(|x| **x > 0)
                .map(|x| *x * 2)
                .collect();
            println!("{:?}", doubled);
        }
      `,
      out: code`
        [6, 8, 10]
      `,
      links: [
        [2, 1, '<code>vec![...]</code> builds the list, like <code>[3, -1, 4, -2, 5]</code>.'],
        [3, 2, 'The type on the left says what <code>collect</code> must build: a <code>Vec</code> of <code>i32</code>. Without it, Rust cannot guess what you want, and the code does not compile (see quiz 2). The other way is to write the type on the call: <code>.collect::&lt;Vec&lt;_&gt;&gt;()</code>. That <code>::&lt;...&gt;</code> is called the turbofish, and <code>_</code> means "work out the inner type for me".'],
        [4, 2, '<code>.iter()</code> is the <code>for x in numbers</code> part. It hands out references, so each item is an <code>&amp;i32</code> and not an <code>i32</code>.'],
        [5, 2, '<code>.filter()</code> is the <code>if x &gt; 0</code> at the end of the comprehension: keep the items where the closure returns true. <code>filter</code> passes a reference <i>to</i> the item, and the item is already a reference, so <code>x</code> is <code>&amp;&amp;i32</code>. That is why there are two stars.'],
        [6, 2, '<code>.map()</code> is the <code>x * 2</code> part: change each item. Here <code>x</code> is <code>&amp;i32</code>, so one <code>*x</code> gives the number.'],
        [7, 2, '<code>.collect()</code> runs the whole chain and builds the <code>Vec</code>. Nothing above this line has run yet.'],
        [8, 3, '<code>println!("{:?}", doubled)</code> prints a list, the same as <code>print(doubled)</code>.'],
      ],
    },
    {
      title: 'sum, max, min and count',
      text: `<p>Some chains end in a number instead of a list. <code>collect</code> is then not needed, but <code>sum</code>
      still needs to know what kind of number to make.</p>`,
      py: code`
        scores = [7, 12, 4]
        print(sum(scores), max(scores), min(scores))
        print(len([s for s in scores if s > 5]))
      `,
      rs: code`
        fn main() {
            let scores = vec![7, 12, 4];
            let total: i32 = scores.iter().sum();
            let top = scores.iter().max().unwrap();
            let low = scores.iter().min().unwrap();
            println!("{total} {top} {low}");
            let big = scores.iter().filter(|s| **s > 5).count();
            println!("{big}");
        }
      `,
      out: code`
        23 12 4
        2
      `,
      links: [
        [3, 2, '<code>sum()</code> adds up the whole chain, like <code>sum(scores)</code>. It needs to know which number type to add: <code>i32</code> here. For a <code>Vec&lt;f64&gt;</code> you would write <code>f64</code> and get a float.'],
        [4, 2, '<code>max()</code> returns an <code>Option</code>, because a list can be empty and then there is no maximum. <code>Some(12)</code> here. <code>unwrap()</code> takes the value out; lesson 11 covers Option.'],
        [5, 2, '<code>min()</code> works the same way and also returns an <code>Option</code>.'],
        [7, 3, '<code>count()</code> counts the items the chain keeps, like <code>len([...])</code> or <code>sum(1 for ...)</code> in Python.'],
      ],
    },
    {
      title: 'enumerate and zip inside a for loop',
      text: `<p><code>enumerate</code> and <code>zip</code> exist in Rust with the same names and the same meaning. Here the
      chain ends in a <code>for</code> loop instead of <code>collect</code>, so no <code>Vec</code> is built.</p>`,
      py: code`
        names = ["ada", "bob"]
        ages = [36, 41]
        for i, (name, age) in enumerate(zip(names, ages), start=1):
            print(f"{i}. {name} is {age}")
      `,
      rs: code`
        fn main() {
            let names = vec!["ada", "bob"];
            let ages = vec![36, 41];
            for (i, (name, age)) in names.iter().zip(ages.iter()).enumerate() {
                println!("{}. {} is {}", i + 1, name, age);
            }
        }
      `,
      out: code`
        1. ada is 36
        2. bob is 41
      `,
      links: [
        [2, 1, 'A <code>Vec</code> of <code>&amp;str</code>: text literals, lesson 4.'],
        [4, 3, '<code>zip</code> walks two lists together and <code>enumerate</code> adds the index, exactly like Python. The <code>for</code> loop pulls one item at a time, so there is no <code>collect</code> here.'],
        [5, 4, '<code>i</code> starts at 0, so <code>i + 1</code> is Python\'s <code>start=1</code>. <code>name</code> and <code>age</code> are references, but the placeholders print them without a <code>*</code>.'],
      ],
    },
    {
      title: 'Nothing runs until you ask',
      text: `<p>A chain is lazy. Building it costs nothing; the closures run when <code>collect</code> asks for the items.
      The same is true of a Python generator. A closure with braces can hold several lines, like a function body.</p>`,
      py: code`
        def double(x):
            print(f"doubling {x}")
            return x * 2

        chain = (double(x) for x in [1, 2, 3])
        print("chain made")
        print(list(chain))
      `,
      rs: code`
        fn main() {
            let numbers = vec![1, 2, 3];
            let chain = numbers.iter().map(|x| {
                println!("doubling {x}");
                *x * 2
            });
            println!("chain made");
            let values: Vec<i32> = chain.collect();
            println!("{:?}", values);
        }
      `,
      out: code`
        chain made
        doubling 1
        doubling 2
        doubling 3
        [2, 4, 6]
      `,
      links: [
        [3, 5, 'This only <i>builds</i> the chain. The closure has not run yet, so nothing is printed here.'],
        [5, 3, 'The last line of the closure is its value, like <code>return x * 2</code>. No <code>return</code> and no semicolon.'],
        [8, 7, '<code>collect()</code> asks for the items, so the closure runs now. Python does the same when <code>list()</code> walks the generator.'],
      ],
    },
    {
      title: 'any, all and rev',
      text: `<p><code>any</code> and <code>all</code> answer a yes/no question about a whole list and stop as soon as they
      know the answer. <code>rev</code> walks a chain backwards. Neither builds a new list.</p>`,
      py: code`
        words = ["a", "bb", "ccc"]
        if any(len(w) > 2 for w in words):
            print("has a long word")
        if all(len(w) > 0 for w in words):
            print("no empty words")
        for w in reversed(words):
            print(w)
      `,
      rs: code`
        fn main() {
            let words = vec!["a", "bb", "ccc"];
            if words.iter().any(|w| w.len() > 2) {
                println!("has a long word");
            }
            if words.iter().all(|w| !w.is_empty()) {
                println!("no empty words");
            }
            for w in words.iter().rev() {
                println!("{w}");
            }
        }
      `,
      out: code`
        has a long word
        no empty words
        ccc
        bb
        a
      `,
      links: [
        [3, 2, '<code>any()</code> is Python\'s <code>any()</code>: true as soon as one item matches, and it stops looking there. <code>w</code> is <code>&amp;&amp;str</code>; <code>.len()</code> works through the references.'],
        [6, 4, '<code>all()</code> is Python\'s <code>all()</code>: true only if every item matches.'],
        [9, 6, '<code>rev()</code> walks the same list from the end. It does not change the <code>Vec</code> and it is still lazy: the loop asks for one item at a time.'],
      ],
    },
  ],
  quiz: [
    {
      type: 'output',
      q: 'What does this print?',
      code: code`
        fn main() {
            let xs = vec![1, 2, 3, 4];
            let ys: Vec<i32> = xs.iter().filter(|&x| x % 2 == 0).map(|x| x + 10).collect();
            println!("{:?}", ys);
        }
      `,
      options: ['[12, 14]', '[2, 4]', '[13, 15]', '[11, 12, 13, 14]'],
      answer: 0,
      explain: '<code>|&amp;x|</code> unpacks one reference, so <code>x</code> is <code>&amp;i32</code> and the pattern is a short way to skip a star. <code>filter</code> keeps the even numbers (2 and 4), then <code>map</code> adds 10 to each: 12 and 14.',
    },
    {
      type: 'compiles',
      q: 'Does this compile?',
      code: code`
        fn main() {
            let xs = vec![1, 2, 3];
            let ys = xs.iter().map(|x| x * 2).collect();
            println!("{:?}", ys);
        }
      `,
      answer: false,
      explain: '<code>collect</code> can build a <code>Vec</code>, a <code>String</code>, a <code>HashMap</code> and more, so it needs to be told which one. Nothing here says what <code>ys</code> should be, and Rust refuses to guess. Write <code>let ys: Vec&lt;i32&gt; = ...</code> or <code>.collect::&lt;Vec&lt;_&gt;&gt;()</code>.',
    },
    {
      type: 'compiles',
      q: 'And this one?',
      code: code`
        fn main() {
            let xs = vec![4, 8];
            let total: i32 = xs.iter().sum();
            let n = xs.iter().count();
            println!("{total} {n}");
        }
      `,
      answer: true,
      explain: '<code>sum</code> needs to know which number type to add, and the <code>: i32</code> says so. <code>count</code> always returns a <code>usize</code>, so it needs nothing. The chain ends in a number, so there is no <code>collect</code>.',
    },
    {
      type: 'choice',
      q: 'In <code>.filter(|x| **x &gt; 0)</code>, why are there two stars?',
      code: code`
        fn main() {
            let xs = vec![3, -1, 4];
            let kept = xs.iter().filter(|x| **x > 0).count();
            println!("{kept}");
        }
      `,
      options: [
        '<code>iter()</code> gives a reference to each item, and <code>filter</code> passes a reference to that, so <code>x</code> is <code>&amp;&amp;i32</code>. Each <code>*</code> steps through one reference.',
        'One star belongs to the closure and one to the vector.',
        'The first star is a typo. One star would mean the same thing.',
        'The stars make a copy of each number, and the copy is what gets compared.',
      ],
      answer: 0,
      explain: 'You can also write <code>.filter(|&amp;x| *x &gt; 0)</code>. The pattern <code>&amp;x</code> unpacks the outer reference, so only one star is left. Both lines mean "compare the number behind the references with 0".',
    },
    {
      type: 'output',
      q: 'What does this print?',
      code: code`
        fn main() {
            let a = vec![1, 2];
            let b = vec![10, 20];
            for (x, y) in a.iter().zip(b.iter()).rev() {
                println!("{x} {y}");
            }
        }
      `,
      options: ['2 20\n1 10', '1 10\n2 20', '2 10\n1 20', '1 20\n2 10'],
      answer: 0,
      explain: '<code>zip</code> makes the pairs (1, 10) and (2, 20). <code>rev</code> then walks the pairs from the end, so the pair (2, 20) comes out first. The items inside a pair keep their order.',
    },
  ],
  exercise: {
    task: `<p>This should print the cheap prices, but it does not compile. <code>collect</code> has to know what kind of
      collection to build. Tell it, then press <b>Run</b>. Two ways work: a type after the name, or the turbofish.</p>`,
    starter: code`
      fn main() {
          let prices = vec![100, 250, 80, 400];
          let cheap = prices.iter().filter(|p| **p < 200).map(|p| *p).collect();
          println!("{:?}", cheap);
      }
    `,
    solution: code`
      fn main() {
          let prices = vec![100, 250, 80, 400];
          let cheap: Vec<i32> = prices.iter().filter(|p| **p < 200).map(|p| *p).collect();
          println!("{:?}", cheap);
      }
    `,
    expected: code`
      [100, 80]
    `,
    hint: 'Write the type before the value: <code>let cheap: Vec&lt;i32&gt; = ...</code>. The other way is to name the type on the call itself: <code>.collect::&lt;Vec&lt;_&gt;&gt;()</code>. The <code>::&lt;...&gt;</code> is called the turbofish, and the <code>_</code> means "you work out the inner type".',
  },
  breaks: [
    `A chain does nothing until you consume it. <code>xs.iter().map(...)</code> on its own runs no code (the compiler warns
      you). A list comprehension runs right away; a Rust chain is more like a generator expression.`,
    `<code>.iter()</code> hands out references. That's why closures see <code>&amp;x</code>, or even <code>&amp;&amp;x</code>
      inside <code>filter</code>, and you write <code>*x</code> or <code>**x</code>. Python always hands you the value.`,
    `<code>collect()</code> has to be told what to build. In Python the brackets say it: <code>[...]</code> or <code>{...}</code>.
      In Rust you write the type: <code>Vec&lt;_&gt;</code>, <code>HashMap&lt;_, _&gt;</code> or <code>String</code>.`,
    `A closure that changes a variable from outside needs that variable to be <code>mut</code>, and the closure too:
      <code>let mut add = |x| total += x;</code>. Python needs <code>nonlocal</code> for the same thing.`,
  ],
  translate: {
    py: code`
      words = ["apple", "kiwi", "banana", "fig"]
      lengths = [len(w) for w in words]
      long_words = [w for w in words if len(w) > 4]
      print(lengths)
      print(", ".join(long_words))
      print(sum(lengths))
    `,
    starter: code`
      fn main() {
          let words = vec!["apple", "kiwi", "banana", "fig"];
      }
    `,
    solution: code`
      fn main() {
          let words = vec!["apple", "kiwi", "banana", "fig"];
          let lengths: Vec<usize> = words.iter().map(|w| w.len()).collect();
          let long_words: Vec<&str> = words.iter().filter(|w| w.len() > 4).copied().collect();
          println!("{:?}", lengths);
          println!("{}", long_words.join(", "));
          let total: usize = lengths.iter().sum();
          println!("{total}");
      }
    `,
    expected: code`
      [5, 4, 6, 3]
      apple, banana
      18
    `,
    hint: `Each comprehension is a <code>.iter()</code> chain ending in <code>.collect()</code>. <code>.iter()</code> hands out
      references, so add <code>.copied()</code> before <code>collect()</code> to get plain <code>&amp;str</code> values; then
      <code>long_words.join(", ")</code> works like Python's <code>", ".join(...)</code>. <code>sum</code> needs a type:
      <code>let total: usize = ...</code>.`,
  },
  cheat: [
    ['[x * 2 for x in xs]', 'xs.iter().map(|x| x * 2).collect::<Vec<_>>()'],
    ['[x for x in xs if x > 0]', 'xs.iter().filter(|x| **x > 0).collect::<Vec<_>>()'],
    ['lambda x: x * 2', '|x| x * 2'],
    ['def f(x):\n    print(x)\n    return x * 2', '|x| {\n    println!("{x}");\n    x * 2\n}'],
    ['sum(xs)', 'let total: i32 = xs.iter().sum();'],
    ['max(xs), min(xs)', 'xs.iter().max(), xs.iter().min()  // Option, lesson 11'],
    ['sum(1 for x in xs if x > 0)', 'xs.iter().filter(|x| **x > 0).count()'],
    ['for i, x in enumerate(xs):', 'for (i, x) in xs.iter().enumerate() {'],
    ['for x, y in zip(a, b):', 'for (x, y) in a.iter().zip(b.iter()) {'],
    ['any(x > 0 for x in xs)', 'xs.iter().any(|x| *x > 0)'],
    ['all(x > 0 for x in xs)', 'xs.iter().all(|x| *x > 0)'],
    ['reversed(xs)', 'xs.iter().rev()'],
  ],
});
