LESSONS.push({
  id: 'ownership',
  title: 'Ownership and borrowing',
  summary: 'Move, &, &mut and .clone(): the rules behind most Rust errors, explained with Python lists.',
  intro: `
    <p>In Python a variable is a <b>label</b> on an object. Many labels can point at the same list, and a garbage
    collector frees the list when no label points at it any more.</p>
    <p>Rust has no garbage collector. Instead, every value has <b>exactly one owner</b>. When the owner goes away
    (at its closing <code>}</code>), the value is freed. To use a value without owning it, you <b>borrow</b> it.
    For reading code, four signs are enough:</p>
    <ul>
      <li><code>let b = a;</code> or <code>f(a)</code> <b>moves</b> a <code>Vec</code> or <code>String</code>. The new owner takes it, and <code>a</code> can no longer be used.
        Small values like numbers, <code>bool</code> and <code>char</code> are simply copied instead.</li>
      <li><code>&amp;a</code> <b>borrows to read</b>: "you may look at it". Many readers at once are fine.</li>
      <li><code>&amp;mut a</code> <b>borrows to change</b>: "you may change it". Only one at a time, and nobody else may read meanwhile.</li>
      <li><code>a.clone()</code> makes a real, separate copy.</li>
    </ul>
    <p>When you see <code>&amp;</code> in earlier lessons, like <code>&amp;str</code>, <code>&amp;self</code> or <code>for x in &amp;v</code>, it is this kind of borrowing.</p>`,
  examples: [
    {
      title: 'Two names for one list vs a move',
      text: `<p>In Python, <code>b = a</code> gives the same list a second name, so changing <code>b</code> also changes <code>a</code>.
      This surprises many people. In Rust, <code>let b = a;</code> <b>moves</b> the vector: <code>b</code> is the
      new owner and <code>a</code> becomes unusable. The compiler stops you from using it.</p>`,
      py: code`
        a = [1, 2, 3]
        b = a
        b.append(4)
        print(a)
      `,
      rs: code`
        fn main() {
            let a = vec![1, 2, 3];
            let mut b = a;
            b.push(4);
            println!("{:?}", a);
        }
      `,
      out: '[1, 2, 3, 4]',
      rsError: 'error[E0382]: borrow of moved value: `a`',
      links: [
        [2, 1, '<code>a</code> owns the vector.'],
        [3, 2, 'Ownership <b>moves</b> to <code>b</code>. From here on, <code>a</code> is empty and the compiler will not let you use it.'],
        [5, 4, 'Using <code>a</code> after the move is error E0382. Python prints <code>[1, 2, 3, 4]</code>, which is often a hidden bug.'],
      ],
    },
    {
      title: 'Want a copy? Say .clone()',
      text: `<p><code>.clone()</code> is like <code>list.copy()</code> or <code>copy.deepcopy()</code>. Copying can be expensive, so Rust
      makes you write it out. When reading code, every <code>.clone()</code> is a place where data gets copied.</p>`,
      py: code`
        a = [1, 2, 3]
        b = a.copy()
        b.append(4)
        print(a)
        print(b)
      `,
      rs: code`
        fn main() {
            let a = vec![1, 2, 3];
            let mut b = a.clone();
            b.push(4);
            println!("{:?}", a);
            println!("{:?}", b);
        }
      `,
      out: code`
        [1, 2, 3]
        [1, 2, 3, 4]
      `,
      links: [
        [3, 2, '<code>.clone()</code> gives <code>b</code> its own copy. <code>a</code> still owns the original.'],
        [5, 4, 'Both are usable: two separate owners, two separate vectors.'],
      ],
    },
    {
      title: 'Lending a value to a function: &',
      text: `<p>Passing a <code>Vec</code> to a function <i>moves</i> it into the function, and it is freed when the function ends.
      Usually you only want to <b>lend</b> it, so you put <code>&amp;</code> in the parameter type and at the call.
      <code>&amp;[i32]</code> means "a borrowed list of <code>i32</code>, read only". You will see it a lot in real code.</p>`,
      py: code`
        def total(numbers):
            return sum(numbers)

        prices = [3, 4, 5]
        print(total(prices))
        print(len(prices))
      `,
      rs: code`
        fn total(numbers: &[i32]) -> i32 {
            numbers.iter().sum()
        }

        fn main() {
            let prices = vec![3, 4, 5];
            println!("{}", total(&prices));
            println!("{}", prices.len());
        }
      `,
      out: code`
        12
        3
      `,
      links: [
        [1, 1, '<code>&amp;[i32]</code>: the function <b>borrows</b> a list of numbers. It can read it, but cannot change it or keep it.'],
        [2, 2, 'Read only, so summing is fine.'],
        [7, 5, '<code>&amp;prices</code> lends <code>prices</code> for this call. Ownership stays in <code>main</code>.'],
        [8, 6, 'Still ours, so we can keep using it. Without the <code>&amp;</code>, this line would be error E0382 ("value used after move").'],
      ],
    },
    {
      title: 'Letting a function change it: &mut',
      text: `<p>In Python, any function you pass a list to <i>might</i> change it, and you only know by reading the function.
      In Rust, the call itself tells you: <code>&amp;mut</code> means "this call may change it". This is one of the most
      useful signs when reading Rust.</p>`,
      py: code`
        def double_all(numbers):
            for i in range(len(numbers)):
                numbers[i] *= 2

        values = [1, 2, 3]
        double_all(values)
        print(values)
      `,
      rs: code`
        fn double_all(numbers: &mut Vec<i32>) {
            for n in numbers.iter_mut() {
                *n *= 2;
            }
        }

        fn main() {
            let mut values = vec![1, 2, 3];
            double_all(&mut values);
            println!("{:?}", values);
        }
      `,
      out: '[2, 4, 6]',
      links: [
        [1, 1, '<code>&amp;mut Vec&lt;i32&gt;</code>: the function borrows the vector <b>to change it</b>.'],
        [2, 2, '<code>.iter_mut()</code> hands out each item as a changeable reference.'],
        [3, 3, '<code>*n</code> means "the value behind the reference". Read <code>*n *= 2</code> as "double the number <code>n</code> points to".'],
        [8, 5, 'The variable itself must be <code>mut</code> before anyone can borrow it as <code>&amp;mut</code>.'],
        [9, 6, 'The call site says <code>&amp;mut</code>, so you know this line changes <code>values</code>.'],
      ],
    },
    {
      title: 'Readers or one writer, never both',
      text: `<p>The loop borrows <code>names</code> to read it. While that borrow is active, nobody may change
      <code>names</code>. Python allows changing a list while you loop over it. That is a classic source of skipped
      items and endless loops. Rust rejects it at compile time with error E0502. The usual fix is to collect the
      changes first and apply them after the loop.</p>`,
      py: code`
        names = ["Ann", "Bob"]
        for name in names:
            if name == "Ann":
                names.append("Cid")
        print(names)
      `,
      rs: code`
        fn main() {
            let mut names = vec![String::from("Ann"), String::from("Bob")];
            for name in &names {
                if name == "Ann" {
                    names.push(String::from("Cid"));
                }
            }
            println!("{:?}", names);
        }
      `,
      out: `['Ann', 'Bob', 'Cid']`,
      rsError: 'error[E0502]: cannot borrow `names` as mutable because it is also borrowed as immutable',
      links: [
        [3, 2, '<code>&amp;names</code>: the loop borrows the list to read it, until the loop ends.'],
        [5, 4, 'Changing it here needs a <code>&amp;mut</code> borrow while the read borrow is still active, so it is rejected.'],
      ],
    },
  ],
  quiz: [
    {
      type: 'compiles',
      q: 'Does this compile?',
      code: code`
        fn main() {
            let x = 5;
            let y = x;
            println!("{x} {y}");
        }
      `,
      answer: true,
      explain: 'Numbers are small and simply <b>copied</b>, not moved (they are <code>Copy</code> types). The same goes for <code>bool</code>, <code>char</code> and <code>f64</code>. Moves matter for things like <code>String</code> and <code>Vec</code>.',
    },
    {
      type: 'compiles',
      q: 'Does this compile?',
      code: code`
        fn shout(text: String) -> String {
            text.to_uppercase()
        }

        fn main() {
            let word = String::from("hi");
            let loud = shout(word);
            println!("{word} {loud}");
        }
      `,
      answer: false,
      explain: '<code>shout(word)</code> moves <code>word</code> into the function, so it cannot be printed afterwards (E0382). Fix it by borrowing: <code>fn shout(text: &amp;str)</code> and <code>shout(&amp;word)</code>, or pass <code>word.clone()</code>.',
    },
    {
      type: 'output',
      q: 'What does this print?',
      code: code`
        fn add_one(n: &mut i32) {
            *n += 1;
        }

        fn main() {
            let mut count = 1;
            add_one(&mut count);
            add_one(&mut count);
            println!("{count}");
        }
      `,
      options: ['3', '1', '2'],
      answer: 0,
      explain: 'Each call borrows <code>count</code> with <code>&amp;mut</code> and adds 1 to the value behind it (<code>*n</code>). 1 → 2 → 3.',
    },
    {
      type: 'choice',
      q: 'You see <code>fn save(report: &amp;Report)</code>. What can <code>save</code> do with the report?',
      options: [
        'Read it, but not change it or keep it',
        'Change it',
        'Take ownership and free it',
        'Nothing; <code>&amp;</code> means the argument is optional',
      ],
      answer: 0,
      explain: 'A plain <code>&amp;</code> is a read-only borrow. To change it, the type would be <code>&amp;mut Report</code>. To take it over, the type would be just <code>Report</code>.',
    },
    {
      type: 'choice',
      q: 'Without seeing the function bodies, which line can change <code>data</code>?',
      code: code`
        summarize(&data);
        normalize(&mut data);
        print_all(&data);
      `,
      options: ['<code>normalize(&amp;mut data)</code>', '<code>summarize(&amp;data)</code>', '<code>print_all(&amp;data)</code>', 'All three'],
      answer: 0,
      explain: 'Only a <code>&amp;mut</code> borrow allows changes, and the call site has to say so. In Python you would need to read all three functions to be sure.',
    },
  ],
  exercise: {
    task: `<p><code>count_words</code> takes ownership of <code>note</code>, so <code>main</code> can't print it afterwards.
      Make the function <b>borrow</b> the text instead. You need two small edits: the parameter type and the call.</p>`,
    starter: code`
      fn count_words(text: String) -> usize {
          text.split_whitespace().count()
      }

      fn main() {
          let note = String::from("borrow it, do not take it");
          let words = count_words(note);
          println!("{words} words in: {note}");
      }
    `,
    solution: code`
      fn count_words(text: &str) -> usize {
          text.split_whitespace().count()
      }

      fn main() {
          let note = String::from("borrow it, do not take it");
          let words = count_words(&note);
          println!("{words} words in: {note}");
      }
    `,
    expected: '6 words in: borrow it, do not take it',
    hint: 'Change the parameter to <code>text: &amp;str</code> (a borrowed string) and call it with <code>count_words(&amp;note)</code>.',
  },
  cheat: [
    ['b = a  # same list, two names', 'let b = a;  // moved: a is unusable now'],
    ['b = a.copy()', 'let b = a.clone();'],
    ['y = x  # int', 'let y = x;  // numbers are copied'],
    ['def f(items: list[int]): ...', 'fn f(items: &[i32]) { }'],
    ['def f(items: list[int]): ...  # changes it', 'fn f(items: &mut Vec<i32>) { }'],
    ['def f(name: str): ...', 'fn f(name: &str) { }'],
    ['f(items)  # might change it', 'f(&items)  // can only read'],
    ['f(items)  # changes it', 'f(&mut items)  // may change'],
    ['# (no equivalent: Python has no pointers)', '*n += 1;  // change the value behind a &mut'],
    ['# garbage collector frees later', '// freed at the owner\'s closing }'],
  ],
});
