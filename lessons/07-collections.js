LESSONS.push({
  id: 'collections',
  title: 'Vec and HashMap',
  summary: 'A list is a Vec, a dict is a HashMap, plus slices, tuples, and why dict order is random.',
  intro: `
    <p>A Python list is a <code>Vec</code> in Rust (short for vector). You write <code>vec![1, 2, 3]</code> for a
    literal, and every item has the same type. A Python dict is a <code>HashMap</code>. Both grow and shrink while the
    program runs, so both need <code>mut</code> before you can add to them.</p>
    <p>One difference that bites people: a <code>HashMap</code> has no order. Python dicts keep insertion order; a
    Rust <code>HashMap</code> does not, and the order can change from run to run. So never print a table by looping over
    a <code>HashMap</code>. Sort the keys first, or use a <code>BTreeMap</code>, which keeps its keys sorted.</p>
    <p>You will see <code>&amp;</code> a lot here. Read it as "borrowed: look at it, do not take it." Lesson 13 explains
    the rule behind it; for now, seeing <code>&amp;</code> means the data stays where it is.</p>`,
  examples: [
    {
      title: 'A list is a Vec',
      text: `<p>The four things you do with a list all have a Rust version. Note that <code>len</code> and
      <code>sort</code> are method calls here, so the list comes first.</p>`,
      py: code`
        nums = [3, 1, 2]
        nums.append(4)
        print(len(nums))
        print(nums[0])
        nums.sort()
        print(nums)
      `,
      rs: code`
        fn main() {
            let mut nums = vec![3, 1, 2];
            nums.push(4);
            println!("{}", nums.len());
            println!("{}", nums[0]);
            nums.sort();
            println!("{:?}", nums);
        }
      `,
      out: code`
        4
        3
        [1, 2, 3, 4]
      `,
      links: [
        [2, 1, '<code>vec!</code> makes a <code>Vec</code>, like a list literal. <code>mut</code> is there because the next line adds to it.'],
        [3, 2, '<code>push</code> is <code>append</code>.'],
        [4, 3, '<code>len</code> and <code>sort</code> are methods, so it is <code>nums.len()</code>, not <code>len(nums)</code>.'],
        [5, 4, 'Indexing looks the same and starts at 0. An index past the end stops the program, see the next example.'],
        [6, 5, '<code>sort</code> sorts in place and needs <code>mut</code>, because it changes the Vec.'],
        [7, 6, '<code>{:?}</code> is the debug format. For a Vec it prints <code>[1, 2, 3, 4]</code>, the same text as the Python list repr.'],
      ],
    },
    {
      title: 'Building a Vec with Vec::new()',
      text: `<p><code>Vec::new()</code> is <code>[]</code>. Rust needs to be told what will go in it, which is what the
      <code>: Vec&lt;i32&gt;</code> is for: "a Vec of <code>i32</code>". Reading it out loud helps:
      <code>Vec&lt;String&gt;</code> is a list of strings.</p>`,
      py: code`
        squares = []
        for n in range(1, 6):
            squares.append(n * n)
        print(squares)
        total = 0
        for n in squares:
            total += n
        print(total)
        if 25 in squares:
            print("yes")
      `,
      rs: code`
        fn main() {
            let mut squares: Vec<i32> = Vec::new();
            for n in 1..=5 {
                squares.push(n * n);
            }
            println!("{squares:?}");
            let mut total = 0;
            for n in &squares {
                total += n;
            }
            println!("{total}");
            if squares.contains(&25) {
                println!("yes");
            }
        }
      `,
      out: code`
        [1, 4, 9, 16, 25]
        55
        yes
      `,
      links: [
        [2, 1, 'An empty Vec. The type is written because Rust cannot guess it from an empty list.'],
        [3, 2, '<code>1..=5</code> is <code>range(1, 6)</code>: 1 up to and including 5.'],
        [4, 3, '<code>push</code> is <code>append</code>, so <code>mut</code> is needed.'],
        [6, 4, '<code>{squares:?}</code> is a shorter way to write <code>{:?}</code> with the name inside.'],
        [8, 6, '<code>&amp;squares</code> borrows the Vec instead of taking it. Read it as "look at each item, do not take it". Inside the loop, <code>n</code> is a reference to an <code>i32</code>, and <code>total += n</code> still works.'],
        [9, 7, '<code>+=</code> on a reference and a number is allowed here, so no <code>*</code> is needed.'],
        [12, 9, '<code>contains</code> is <code>in</code>. It wants a reference to the value, because it only looks at it.'],
        [13, 10, 'Printing inside the <code>if</code>, same as Python.'],
      ],
    },
    {
      title: 'Slices and indexing',
      text: `<p>A slice <code>&amp;temps[1..3]</code> is <code>temps[1:3]</code>: it starts at 1 and stops before 3. The
      <code>&amp;</code> means <code>middle</code> points into <code>temps</code> instead of copying it, so it stays
      cheap for big lists.</p>
      <p>Indexing a Vec past its end is not a catchable exception. It <b>panics</b> and the program stops right there.
      Python raises <code>IndexError</code> and you can catch it. If an index might be too big, Rust has
      <code>temps.get(9)</code>, which gives <code>Some(value)</code> or <code>None</code> instead of crashing.
      <code>Option</code> is lesson 11.</p>`,
      py: code`
        temps = [12, 15, 9, 21]
        print(temps[1:3])
        print(temps[0])
        print(len(temps))
      `,
      rs: code`
        fn main() {
            let temps = vec![12, 15, 9, 21];
            let middle = &temps[1..3];
            println!("{middle:?}");
            println!("{}", temps[0]);
            println!("{}", temps.len());
        }
      `,
      out: code`
        [15, 9]
        12
        4
      `,
      links: [
        [2, 1, 'No <code>mut</code>, because nothing here changes the Vec.'],
        [3, 2, 'A slice, written <code>1..3</code> where Python writes <code>1:3</code>. The <code>&amp;</code> makes it a view of the data, not a copy.'],
        [4, 2, 'A slice prints like a list.'],
        [5, 3, 'Plain indexing, as in Python.'],
        [6, 4, 'The length, as a method.'],
      ],
    },
    {
      title: 'A dict is a HashMap',
      text: `<p><code>HashMap</code> lives in the standard library, so the file starts with a <code>use</code> line. It plays
      the role of <code>from collections import ...</code> in Python.</p>`,
      py: code`
        ages = {"ada": 36, "bob": 41}
        ages["cy"] = 29
        print(len(ages))
        print(ages["bob"])
        if "ada" in ages:
            print("has ada")
        del ages["bob"]
        print(len(ages))
      `,
      rs: code`
        use std::collections::HashMap;

        fn main() {
            let mut ages: HashMap<&str, i32> = HashMap::new();
            ages.insert("ada", 36);
            ages.insert("bob", 41);
            ages.insert("cy", 29);
            println!("{}", ages.len());
            println!("{}", ages["bob"]);
            if ages.contains_key("ada") {
                println!("has ada");
            }
            ages.remove("bob");
            println!("{}", ages.len());
        }
      `,
      out: code`
        3
        41
        has ada
        2
      `,
      links: [
        [1, null, 'Bringing <code>HashMap</code> into scope. Every map example in Rust starts with a line like this.'],
        [4, 1, '<code>HashMap&lt;&amp;str, i32&gt;</code> says: text keys, integer values. <code>HashMap::new()</code> makes an empty dict.'],
        [5, 2, '<code>insert</code> is <code>d[key] = value</code>. It needs <code>mut</code>, and it replaces the old value if the key was already there.'],
        [8, 3, 'The number of pairs, as a method.'],
        [9, 4, 'Square brackets give the value too, but here a missing key panics instead of raising <code>KeyError</code>.'],
        [10, 5, '<code>contains_key</code> is <code>in</code>.'],
        [13, 7, '<code>remove</code> is <code>del</code>.'],
        [14, 8, 'Counted after the removal.'],
      ],
    },
    {
      title: 'Counting words, and why map order is random',
      text: `<p>Counting items is the most common map job, so Rust gives it one line:
      <code>*counts.entry(word).or_insert(0) += 1</code>. It does what
      <code>counts[word] = counts.get(word, 0) + 1</code> does in Python, or what <code>Counter</code> does.</p>
      <p>This example uses <code>BTreeMap</code>, the sorted cousin of <code>HashMap</code>. Both count the same way. The
      difference is printing: a <code>HashMap</code> hands its keys out in a different order on every run, so the same
      table would look different each time. A <code>BTreeMap</code> always goes from smaller key to bigger key, which is
      what <code>sorted(counts)</code> gives you in Python. If you must print a plain <code>HashMap</code>, sort the keys
      first.</p>
      <p>When you loop over a map you get a <b>tuple</b> per pair: <code>(key, value)</code>. A Rust tuple is a small
      fixed group of values, written <code>(1, "a")</code>, like a Python tuple. You reach the parts with
      <code>.0</code> and <code>.1</code>, or unpack them in the loop as below.</p>`,
      py: code`
        from collections import Counter

        words = ["red", "blue", "red", "green", "red"]
        counts = Counter(words)
        print(len(counts))
        for w in sorted(counts):
            print(f"{w}: {counts[w]}")
      `,
      rs: code`
        use std::collections::BTreeMap;

        fn main() {
            let words = vec!["red", "blue", "red", "green", "red"];
            let mut counts: BTreeMap<&str, i32> = BTreeMap::new();
            for w in &words {
                *counts.entry(*w).or_insert(0) += 1;
            }
            println!("{}", counts.len());
            for (w, n) in &counts {
                println!("{w}: {n}");
            }
        }
      `,
      out: code`
        3
        blue: 1
        green: 1
        red: 3
      `,
      links: [
        [1, null, '<code>BTreeMap</code> has the same methods as <code>HashMap</code>, but it keeps the keys sorted.'],
        [4, 3, 'A Vec of text.'],
        [5, 4, 'An empty counting map: text keys, integer values.'],
        [6, null, 'Borrowing the words with <code>&amp;</code>, so the Vec is still usable afterwards.'],
        [7, 4, 'One line for <code>Counter</code>. <code>entry</code> finds the slot for this word (and creates it if new), <code>or_insert(0)</code> puts 0 there when it is new, and <code>+= 1</code> adds one. The <code>*</code> is there because <code>entry</code> hands out a reference to the number, and <code>*</code> means "the number it points at".'],
        [9, 5, 'How many different words.'],
        [10, 6, 'Each round gives the pair <code>(w, n)</code>: the word and its count. Rust unpacks it right in the loop, so <code>w</code> is the key and <code>n</code> the value.'],
        [11, 7, 'The <code>BTreeMap</code> goes in sorted key order, so this print is the same on every run.'],
      ],
    },
  ],
  quiz: [
    {
      type: 'output',
      q: 'What does this print?',
      code: code`
        fn main() {
            let mut v = vec![5, 3, 9];
            v.push(1);
            v.sort();
            println!("{:?}", v);
        }
      `,
      options: ['[1, 3, 5, 9]', '[5, 3, 9, 1]', '[1, 3, 5]', '[9, 5, 3, 1]'],
      answer: 0,
      explain: '<code>push</code> adds 1 at the end, so the Vec is 5, 3, 9, 1. Then <code>sort()</code> puts it in order. In Python, <code>v.append(1)</code> followed by <code>v.sort()</code> gives the same <code>[1, 3, 5, 9]</code>.',
    },
    {
      type: 'compiles',
      q: 'Does this compile?',
      code: code`
        fn main() {
            let v = vec![1, 2, 3];
            v.push(4);
            println!("{:?}", v);
        }
      `,
      answer: false,
      explain: 'No. <code>push</code> changes the Vec, so <code>v</code> must be <code>let mut v</code>. rustc says "cannot borrow <code>v</code> as mutable, as it is not declared as mutable" (error E0596).',
    },
    {
      type: 'output',
      q: 'What does this print?',
      code: code`
        use std::collections::HashMap;

        fn main() {
            let mut m: HashMap<&str, i32> = HashMap::new();
            m.insert("a", 1);
            m.insert("a", 2);
            println!("{}", m.len());
            println!("{}", m["a"]);
        }
      `,
      options: ['1\n2', '2\n3', '1\n1', '2\n2'],
      answer: 0,
      explain: 'The same key twice does not make a second pair. The second <code>insert</code> replaces the value, so the map has one pair and the value is 2.',
    },
    {
      type: 'output',
      q: 'What does this print?',
      code: code`
        fn main() {
            let v = vec![10, 20, 30, 40];
            println!("{:?}", &v[1..3]);
        }
      `,
      options: ['[20, 30]', '[10, 20, 30]', '[20, 30, 40]', '[30, 40]'],
      answer: 0,
      explain: 'The slice starts at index 1 (the 20) and stops before index 3 (the 40), so it holds 20 and 30. It is the same as <code>v[1:3]</code> in Python.',
    },
    {
      type: 'choice',
      q: 'You count words in a <code>HashMap</code> and then print them with <code>for (w, n) in &amp;counts { println!(&quot;{w}: {n}&quot;); }</code>. What do you get?',
      options: [
        'The right counts, but the order can change from run to run',
        'The right counts, always in the order the words first appeared',
        'The right counts, always sorted by word',
        'A compile error, because a HashMap cannot be looped over',
      ],
      answer: 0,
      explain: 'A <code>HashMap</code> has no order and even rearranges itself between runs, so the output is different each time. That makes it hard to test and hard to read. Sort the keys, or use a <code>BTreeMap</code> when the output has to be stable.',
    },
  ],
  exercise: {
    task: `<p>This counts how often "red" appears, but it always says 1: every round overwrites the old count with
      <code>insert</code>. Change the line inside the loop so the count goes up. The output should say 3.</p>`,
    starter: code`
      use std::collections::HashMap;

      fn main() {
          let words = vec!["red", "blue", "red", "green", "red"];
          let mut counts: HashMap<&str, i32> = HashMap::new();
          for w in &words {
              counts.insert(*w, 1);
          }
          println!("red appears {} times", counts["red"]);
      }
    `,
    solution: code`
      use std::collections::HashMap;

      fn main() {
          let words = vec!["red", "blue", "red", "green", "red"];
          let mut counts: HashMap<&str, i32> = HashMap::new();
          for w in &words {
              *counts.entry(*w).or_insert(0) += 1;
          }
          println!("red appears {} times", counts["red"]);
      }
    `,
    expected: 'red appears 3 times',
    hint: '<code>insert</code> throws the old value away. <code>entry(*w).or_insert(0)</code> hands you a reference to the value that is already there, or puts 0 there if this word is new. Put a <code>*</code> in front and use <code>+= 1</code>.',
  },
  cheat: [
    ['nums = [1, 2, 3]', 'let nums = vec![1, 2, 3];'],
    ['nums = []', 'let mut nums: Vec<i32> = Vec::new();'],
    ['nums.append(4)', 'nums.push(4);'],
    ['len(nums)', 'nums.len()'],
    ['nums.sort()', 'nums.sort();'],
    ['nums[1:3]', '&nums[1..3]'],
    ['x in nums', 'nums.contains(&x)'],
    ['for x in nums:', 'for x in &nums {'],
    ['d["a"] = 1', 'd.insert("a", 1);'],
    ['d.get("a")', 'd.get("a")  // Some(v) or None'],
    ['del d["a"]', 'd.remove("a");'],
    ['Counter(xs)', '*counts.entry(x).or_insert(0) += 1;'],
  ],
});
