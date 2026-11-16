LESSONS.push({
  id: 'control-flow',
  title: 'if, loops and ranges',
  summary: 'if needs a real bool, for i in 0..5 is range(5), while, and loop with a break value.',
  intro: `
    <p>Rust's <code>if</code> looks like Python's, with two differences: no parentheses around the condition, and the
    braces are always required. Rust also has no truthiness. The condition must be a real <code>bool</code>, so an
    empty string or the number 0 is not "false" to Rust. You compare instead: <code>n != 0</code>,
    <code>!text.is_empty()</code>.</p>
    <p>Loops are close to Python. <code>for i in 0..5</code> is <code>for i in range(5)</code>. The two dots make a
    <b>range</b>, and it stops before the last number. Write <code>0..=5</code> when you want the 5 included.
    <code>while</code> works as you expect. Rust also has <code>loop</code>, a loop with no condition, which you leave
    with <code>break</code>.</p>`,
  examples: [
    {
      title: 'if, else if, else',
      text: `<p>Read the Rust side for three things: no parentheses, braces instead of indentation, and
      <code>else if</code> where Python writes <code>elif</code>.</p>`,
      py: code`
        score = 72
        if score >= 90:
            print("A")
        elif score >= 70:
            print("B")
        else:
            print("C")
      `,
      rs: code`
        fn main() {
            let score = 72;
            if score >= 90 {
                println!("A");
            } else if score >= 70 {
                println!("B");
            } else {
                println!("C");
            }
        }
      `,
      out: 'B',
      links: [
        [1, null, '<code>fn main()</code> is where the program starts, as in lesson 3.'],
        [2, 1, '<code>let</code> makes the variable. Without <code>mut</code> it never changes.'],
        [3, 2, 'The condition sits in no parentheses, and it ends with <code>{</code>, not with a colon. The braces take the place of Python indentation.'],
        [4, 3, 'The body of the branch. Statements inside it end with <code>;</code>.'],
        [5, 4, '<code>else if</code> is the same as <code>elif</code>. The closing brace of the first branch comes before it.'],
        [7, 6, 'A plain <code>else</code>, same as Python. The last branch runs when nothing else matched.'],
      ],
    },
    {
      title: 'There is no truthiness',
      text: `<p>Python asks "is this value falsy?" Rust has no such question, so this does not compile. To say the same
      thing in Rust, ask a question that has a yes or no answer: <code>if !name.is_empty()</code>. The <code>!</code>
      is "not". For a number you write <code>if n != 0</code>, and for a list <code>if !items.is_empty()</code>.</p>`,
      py: code`
        name = ""
        if name:
            print("has a name")
        else:
            print("empty")
      `,
      rs: code`
        fn main() {
            let name = String::new();
            if name {
                println!("has a name");
            } else {
                println!("empty");
            }
        }
      `,
      out: 'empty',
      rsError: 'error[E0308]: mismatched types',
      rsFix: code`
        fn main() {
            let name = String::new();
            if !name.is_empty() {
                println!("has a name");
            } else {
                println!("empty");
            }
        }
      `,
      links: [
        [2, 1, '<code>String::new()</code> makes an empty string.'],
        [3, 2, 'The compiler stops here: <code>if</code> wants a <code>bool</code> and a <code>String</code> is not one. This is the truthiness rule, enforced.'],
        [5, 4, 'The <code>else</code> branch, as usual.'],
      ],
    },
    {
      title: 'for and ranges',
      text: `<p>One line per Python loop. <code>0..3</code> stops before 3, like <code>range(3)</code>.
      <code>3..=5</code> includes 5, like <code>range(3, 6)</code>. Ranges also have methods: <code>step_by</code> is
      the third argument of <code>range</code>, and <code>rev</code> counts down.</p>`,
      py: code`
        for i in range(3):
            print(i)
        for i in range(3, 6):
            print(i)
        for i in range(0, 10, 2):
            print(i)
        for i in range(4, 0, -1):
            print(i)
      `,
      rs: code`
        fn main() {
            for i in 0..3 {
                println!("{i}");
            }
            for i in 3..=5 {
                println!("{i}");
            }
            for i in (0..10).step_by(2) {
                println!("{i}");
            }
            for i in (1..=4).rev() {
                println!("{i}");
            }
        }
      `,
      out: code`
        0
        1
        2
        3
        4
        5
        0
        2
        4
        6
        8
        4
        3
        2
        1
      `,
      links: [
        [2, 1, '<code>0..3</code> is <code>range(3)</code>: 0, 1, 2. Two dots mean "up to, but not including".'],
        [3, 2, 'The loop body is a block, so <code>i</code> only exists inside the braces.'],
        [5, 3, '<code>3..=5</code> has three dots: the <code>=</code> means "and include the end". This is <code>range(3, 6)</code>.'],
        [8, 5, '<code>step_by(2)</code> is the step. The parentheses exist because <code>0..10</code> must be made first, then asked to step.'],
        [11, 7, '<code>rev()</code> runs the range backwards, which is <code>range(4, 0, -1)</code>.'],
      ],
    },
    {
      title: 'while and continue',
      text: `<p>This adds up the odd numbers below 10. <code>continue</code> jumps to the next round of the loop and
      skips the rest of the body, exactly like in Python.</p>`,
      py: code`
        n = 0
        total = 0
        while n < 10:
            n += 1
            if n % 2 == 0:
                continue
            total += n
        print(total)
      `,
      rs: code`
        fn main() {
            let mut n = 0;
            let mut total = 0;
            while n < 10 {
                n += 1;
                if n % 2 == 0 {
                    continue;
                }
                total += n;
            }
            println!("{total}");
        }
      `,
      out: '25',
      links: [
        [2, 1, '<code>mut</code>, because the loop changes <code>n</code>.'],
        [3, 2, 'The same for <code>total</code>.'],
        [4, 3, '<code>while</code> takes a condition and a block, no parentheses.'],
        [5, 4, '<code>n += 1</code> works like Python.'],
        [6, 5, 'This condition is already a comparison, so it is a real <code>bool</code>. That is why it compiles.'],
        [7, 6, '<code>continue;</code> skips to the next round. Same word, same meaning.'],
        [9, 7, 'Reached only for odd numbers.'],
        [11, 8, '<code>total</code> is an <code>i32</code>, like every number here.'],
      ],
    },
    {
      title: 'loop, and break with a value',
      text: `<p><code>loop</code> is <code>while True</code>. The useful part is that <code>break</code> can hand a value
      out, and that value becomes the value of the whole <code>loop</code>. Here the loop is assigned to
      <code>found</code>, which is why there is a <code>;</code> after its closing brace.</p>
      <p>You will also meet labels: <code>'outer: for i in 0..3 { ... break 'outer; }</code>. A label lets
      <code>break</code> leave both loops at once. Python has no direct equivalent.</p>`,
      py: code`
        n = 6
        steps = 0
        while True:
            if n % 2 == 0:
                n = n // 2
            elif n == 1:
                break
            else:
                n = 3 * n + 1
            steps += 1
        print(f"{n} after {steps} steps")
      `,
      rs: code`
        fn main() {
            let mut n = 6;
            let mut steps = 0;
            let found = loop {
                if n % 2 == 0 {
                    n = n / 2;
                } else if n == 1 {
                    break n;
                } else {
                    n = 3 * n + 1;
                }
                steps += 1;
            };
            println!("{found} after {steps} steps");
        }
      `,
      out: '1 after 8 steps',
      links: [
        [2, 1, 'A plain number.'],
        [3, 2, '<code>steps</code> counts the rounds, so it needs <code>mut</code>.'],
        [4, 3, '<code>loop</code> is <code>while True</code>. Because it can give a value back, it is put on the right of <code>let found =</code>.'],
        [6, 5, 'Integer division in Rust is <code>/</code>. Python uses <code>//</code> for the same thing.'],
        [8, 7, '<code>break n;</code> leaves the loop and hands <code>n</code> out as the loop value. That is what <code>found</code> becomes.'],
        [12, 10, 'One more round done.'],
        [13, null, 'The <code>;</code> ends the <code>let</code> statement. The loop above it is an expression.'],
        [14, 11, 'The placeholders work like an f-string.'],
      ],
    },
  ],
  quiz: [
    {
      type: 'output',
      q: 'What does this print?',
      code: code`
        fn main() {
            for i in (1..=6).step_by(2) {
                println!("{i}");
            }
        }
      `,
      options: ['1\n3\n5', '1\n3\n5\n6', '2\n4\n6', '1\n2\n3\n4\n5\n6'],
      answer: 0,
      explain: 'The range is 1 to 6 with both ends included, and each step jumps 2: 1, 3, 5. The next step would be 7, which is past 6, so the loop ends there.',
    },
    {
      type: 'compiles',
      q: 'Does this compile?',
      code: code`
        fn main() {
            let count = 3;
            if count {
                println!("some");
            }
        }
      `,
      answer: false,
      explain: 'No. <code>if</code> needs a <code>bool</code>, and <code>count</code> is an integer, so rustc says "expected <code>bool</code>, found integer" (error E0308). In Python the 3 would be truthy. In Rust you write <code>if count != 0</code>.',
    },
    {
      type: 'compiles',
      q: 'And this one?',
      code: code`
        fn main() {
            let name = String::from("Ada");
            if !name.is_empty() {
                println!("hello {name}");
            }
        }
      `,
      answer: true,
      explain: 'Yes. <code>is_empty()</code> returns a real <code>bool</code>, and <code>!</code> flips it. This is how you write the Python <code>if name:</code> check in Rust.',
    },
    {
      type: 'output',
      q: 'What does this print?',
      code: code`
        fn main() {
            let mut n = 0;
            let mut total = 0;
            while n < 6 {
                n += 1;
                if n % 2 == 0 {
                    continue;
                }
                total += n;
            }
            println!("{total}");
        }
      `,
      options: ['9', '12', '15', '6'],
      answer: 0,
      explain: '<code>continue</code> skips the even numbers, so only 1, 3 and 5 are added: 9. The loop still runs 6 times, but the last three rounds do not reach <code>total += n</code>.',
    },
    {
      type: 'choice',
      q: 'You see <code>let first = loop { if ok { break 7; } };</code>. What is <code>first</code>?',
      options: [
        'The number 7, because a <code>break</code> can hand a value out of a <code>loop</code>',
        'A true/false value saying whether <code>ok</code> was true',
        'Nothing: a <code>loop</code> never has a value',
        'It does not compile, because <code>break</code> cannot carry a value',
      ],
      answer: 0,
      explain: '<code>break value;</code> ends the loop and the loop hands that value back, so the whole <code>loop</code> acts like an expression. This is a common way to exit with a result. Python needs a variable plus a second assignment for the same thing.',
    },
  ],
  exercise: {
    task: `<p>This should print the 5 times table, from 5 × 1 to 5 × 5. It stops one line short. Change the range so
      the last line is there. You only need to touch one line.</p>`,
    starter: code`
      fn main() {
          for i in 1..5 {
              println!("5 x {i} = {}", 5 * i);
          }
      }
    `,
    solution: code`
      fn main() {
          for i in 1..=5 {
              println!("5 x {i} = {}", 5 * i);
          }
      }
    `,
    expected: code`
      5 x 1 = 5
      5 x 2 = 10
      5 x 3 = 15
      5 x 4 = 20
      5 x 5 = 25
    `,
    hint: 'Count the dots. Two dots (<code>..</code>) stop before the end number. Three dots (<code>..=</code>) include it.',
  },
  cheat: [
    ['if x > 0:', 'if x > 0 {'],
    ['elif x == 0:', '} else if x == 0 {'],
    ['else:', '} else {'],
    ['if items:', 'if !items.is_empty() {'],
    ['for i in range(5):', 'for i in 0..5 {'],
    ['for i in range(1, 6):', 'for i in 1..=5 {'],
    ['for i in range(0, 10, 2):', 'for i in (0..10).step_by(2) {'],
    ['for i in range(5, 0, -1):', 'for i in (1..=5).rev() {'],
    ['while n > 0:', 'while n > 0 {'],
    ['while True:', 'loop {'],
    ['break', 'break;'],
    ['continue', 'continue;'],
  ],
});
