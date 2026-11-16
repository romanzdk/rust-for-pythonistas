LESSONS.push({
  id: 'types',
  title: 'Numbers and strings',
  summary: 'Fixed-size numbers, casts with as, and the two string types.',
  intro: `
    <p>Python has one integer type, <code>int</code>, and one float type, <code>float</code>. Both grow as big as you
    need, and you rarely think about them. Rust has a menu of number types instead, each with a fixed size in bits, and
    the compiler has to know which one you mean before the program runs.</p>
    <p>The good part: a fixed size means you can tell the range and the memory cost from the name alone. The types you
    will meet most:</p>
    <ul>
      <li><code>i32</code>, <code>i64</code>: whole numbers that can be negative. <code>i32</code> is the default for
      a whole number with no annotation.</li>
      <li><code>u8</code>, <code>u32</code>, <code>usize</code>: whole numbers that cannot be negative.
      <code>usize</code> is the type of lengths and indexes.</li>
      <li><code>f64</code>: a float in 64 bits. Python's <code>float</code> is the same thing. Prefer <code>f64</code>
      over <code>f32</code> unless you have a reason.</li>
    </ul>
    <p>Strings also come in two types, and telling them apart is the main skill here: <code>&amp;str</code> is a
    borrowed view of text that already exists, and <code>String</code> is owned text you can grow.</p>`,
  examples: [
    {
      title: 'A number type for every job',
      text: `<p>The same values as Python, each with a Rust type. The type goes after the name with a colon, like a
      Python type hint, except here it decides what the value <i>is</i>: an <code>i64</code> holds numbers an
      <code>i32</code> cannot.</p>
      <p>Two small differences. <code>bool</code> values are <code>true</code> and <code>false</code>, always lowercase
      (Python writes <code>True</code> and <code>False</code>). A <code>char</code> is one character in <b>single</b>
      quotes: <code>'x'</code>. Rust strings always use double quotes, so <code>"x"</code> is a string and
      <code>'x'</code> is a char.</p>
      <p>A fixed size also means a limit. An <code>i32</code> stops at about 2.1 billion. In debug mode (the
      Playground's default, and <code>cargo run</code>'s default) going past that limit <b>panics</b>, which is Rust's
      word for "crashes with an error". Python would just keep counting.</p>`,
      py: code`
        count = 3
        big = 9_000_000_000
        ratio = 0.5
        letter = "x"
        print(count, big, ratio)
        print(letter)
      `,
      rs: code`
        fn main() {
            let count: i32 = 3;
            let big: i64 = 9_000_000_000;
            let ratio: f64 = 0.5;
            let letter: char = 'x';
            println!("{count} {big} {ratio}");
            println!("{letter}");
        }
      `,
      out: code`
        3 9000000000 0.5
        x
      `,
      links: [
        [1, null, '<code>fn main()</code> is where the program starts, as in lesson 3.'],
        [2, 1, '<code>i32</code> is a whole number in 32 bits. Without a type, Rust would still pick <code>i32</code> for a whole number.'],
        [3, 2, '<code>i64</code> is twice as wide, so it can hold this number. Python needed no decision here; in Rust the type is part of the value.'],
        [4, 3, '<code>f64</code> is the float type, and it plays the role of Python <code>float</code>.'],
        [5, 4, 'A <code>char</code> is one character in single quotes. In Python this is a one-character string, and you would write <code>"x"</code>.'],
        [6, 5, 'A placeholder can print any number type. Spaces between values on the Rust side are written by hand; <code>print</code> in Python adds them.'],
        [7, 6, 'A <code>{letter}</code> placeholder prints the char.'],
      ],
    },
    {
      title: 'Integer division, and the negative surprise',
      text: `<p>In Python <code>/</code> always gives a float, and <code>//</code> divides and rounds <b>down</b>. In Rust
      there is only <code>/</code>, and the types decide what it does: two floats give a float, two integers give an
      integer.</p>
      <p>Here is the trap. Rust does not round down, it cuts off the decimal part:</p>
      <ul>
        <li><code>7 / 2</code> is <code>3</code> in both languages.</li>
        <li><code>-7 / 2</code> is <code>-3</code> in Rust, but <code>-7 // 2</code> is <code>-4</code> in Python.</li>
      </ul>
      <p>For positive numbers you will not notice. For negative ones Rust moves toward zero and Python moves down. So
      Rust's <code>/</code> is Python's <code>//</code> only while the signs match. If you need Python's floor
      division, look for a helper in the code; plain <code>/</code> does not do it.</p>`,
      py: code`
        print(7 / 2)
        print(7 // 2)
      `,
      rs: code`
        fn main() {
            println!("{}", 7.0 / 2.0);
            println!("{}", 7 / 2);
        }
      `,
      out: code`
        3.5
        3
      `,
      links: [
        [1, 1, '<code>7.0 / 2.0</code> is the Python <code>7 / 2</code>: floats in, float out.'],
        [2, 2, 'Two <code>i32</code> values divided give an <code>i32</code>, like <code>7 // 2</code>. The difference appears only with negative numbers.'],
      ],
    },
    {
      title: 'as: changing a number type',
      text: `<p>Rust never converts between number types by itself. Even <code>7 / 2.0</code> is a compile error when 7 is
      an <code>i32</code>. You convert with <code>as</code>, which you can read as "treat this value as the type that
      follows".</p>
      <p><code>as</code> is not always like <code>float()</code> or <code>int()</code>. When a float becomes an integer,
      <code>as</code> cuts off the decimal part and never rounds: <code>19.9 as i32</code> is 19. And a cast that does
      not fit, like <code>300 as u8</code>, wraps around instead of raising an error. Use <code>as</code> when you know
      the value fits.</p>`,
      py: code`
        a = 7
        b = 2
        ratio = a / b
        total = 19.0
        rounded = int(total)
        print(ratio)
        print(rounded)
      `,
      rs: code`
        fn main() {
            let a: i32 = 7;
            let b: i32 = 2;
            let ratio = a as f64 / b as f64;
            let total: f64 = 19.0;
            let rounded = total as i32;
            println!("{ratio}");
            println!("{rounded}");
        }
      `,
      out: code`
        3.5
        19
      `,
      links: [
        [2, 1, '<code>a</code> is an <code>i32</code>.'],
        [3, 2, '<code>b</code> is too. A plain <code>a / b</code> would give 3, because two integers divide as integers.'],
        [4, [1, 2, 3], '<code>a as f64</code> is the Python <code>float(a)</code>, and <code>/</code> on two floats is the Python <code>/</code>. Both sides are cast so the division is a float division.'],
        [6, 5, '<code>total as i32</code> is the Python <code>int(total)</code>, except it never raises and never rounds.'],
      ],
    },
    {
      title: '&str is borrowed, String is owned',
      text: `<p>A literal like <code>"Ferris"</code> has type <code>&amp;str</code>: a <b>borrowed</b> view of text that
      is already stored inside the program. For now, read <code>&amp;</code> as "borrowed: look at it, don't take it".
      Lesson 13 explains what the compiler does with that.</p>
      <p>You cannot grow a <code>&amp;str</code>. When you need to build or change text, use <code>String</code>: owned
      text that can grow. <code>String::from("hi")</code>, <code>"hi".to_string()</code> and
      <code>format!("Hi {name}")</code> all make one. <code>push_str</code> adds text and <code>push</code> adds a
      single <code>char</code>.</p>
      <p>In function signatures, <code>&amp;str</code> means "I only read this", and <code>String</code> means "I may
      keep or change it". <code>&amp;str</code> is the type you see most in parameters.</p>`,
      py: code`
        name = "Ferris"
        message = f"Hello, {name}!"
        message += " Welcome."
        print(message)
        print(len(message))
      `,
      rs: code`
        fn main() {
            let name: &str = "Ferris";
            let mut message = format!("Hello, {name}!");
            message.push_str(" Welcome.");
            println!("{message}");
            println!("{}", message.len());
        }
      `,
      out: code`
        Hello, Ferris! Welcome.
        23
      `,
      links: [
        [2, 1, 'The type of a string literal is <code>&amp;str</code>. The <code>&amp;</code> says it is borrowed, not owned.'],
        [3, 2, '<code>format!</code> builds a new <code>String</code>, the role of the Python f-string. It is also why <code>message</code> needs <code>mut</code>: it will grow.'],
        [4, 3, '<code>push_str</code> adds text to the end, like <code>+=</code> on a Python string. Rust has to change the string in place, so it must be <code>mut</code>.'],
        [6, 5, '<code>.len()</code> works on both string types. Here the text is plain ASCII, so the number matches Python. The next example shows where it does not.'],
      ],
    },
    {
      title: 'len is bytes, chars are characters',
      text: `<p>This is a real gotcha. <code>.len()</code> on a string counts <b>bytes</b>, not characters. Python's
      <code>len()</code> counts characters, so the two disagree as soon as the text is not plain ASCII. The letter
      <code>é</code> takes two bytes in UTF-8, so <code>"héllo".len()</code> is 6 in Rust and 5 in Python.</p>
      <p>To count characters in Rust, ask for the characters and count them: <code>.chars().count()</code>. That is the
      Python <code>len()</code>. Other string methods have direct Python matches: <code>.to_uppercase()</code> is
      <code>.upper()</code>, <code>.trim()</code> is <code>.strip()</code>, <code>.contains(x)</code> is
      <code>x in s</code>, and <code>.split(x)</code> is <code>s.split(x)</code> but gives an iterator, which lesson 8
      covers.</p>`,
      py: code`
        word = "  héllo  ".strip()
        print(len(word.encode()))
        print(len(word))
        print(word.upper())
        print(word.count("l"))
      `,
      rs: code`
        fn main() {
            let word = "  héllo  ".trim();
            println!("{}", word.len());
            println!("{}", word.chars().count());
            println!("{}", word.to_uppercase());
            println!("{}", word.matches('l').count());
        }
      `,
      out: code`
        6
        5
        HÉLLO
        2
      `,
      links: [
        [2, 1, '<code>trim()</code> is <code>strip()</code>: it removes spaces at both ends and gives a <code>&amp;str</code> view of the same text.'],
        [3, 2, '<code>len()</code> is bytes. <code>word.encode()</code> in the Python version shows how many bytes Python sees.'],
        [4, 3, '<code>chars().count()</code> is the Python <code>len()</code>: it walks the characters and counts them.'],
        [5, 4, '<code>to_uppercase()</code> is <code>upper()</code>. It returns a new <code>String</code> because the new text may be longer than the old one.'],
        [6, 5, '<code>matches(\'l\').count()</code> counts the pieces that match, so it is <code>count("l")</code> here. <code>matches</code> takes a char in single quotes.'],
      ],
    },
  ],
  quiz: [
    {
      type: 'output',
      q: 'What does this print?',
      code: code`
        fn main() {
            println!("{}", -7 / 2);
        }
      `,
      options: ['-3', '-4', '-3.5', '3'],
      answer: 0,
      explain: 'Two integers divide as integers, and Rust cuts toward zero, so -3.5 becomes <code>-3</code>. Python\'s <code>-7 // 2</code> rounds down and gives <code>-4</code>.',
    },
    {
      type: 'output',
      q: 'What does this print?',
      code: code`
        fn main() {
            let s = "héllo";
            println!("{} {}", s.len(), s.chars().count());
        }
      `,
      options: ['6 5', '5 5', '6 6', '5 6'],
      answer: 0,
      explain: '<code>len()</code> counts bytes and <code>é</code> is two bytes, so 6. <code>chars().count()</code> counts characters, so 5, which is what Python\'s <code>len()</code> gives.',
    },
    {
      type: 'compiles',
      q: 'Does this compile?',
      code: code`
        fn main() {
            let a: i32 = 7;
            let b: f64 = 2.0;
            println!("{}", a / b);
        }
      `,
      answer: false,
      explain: 'Rust never mixes number types on its own. The error is E0277, "cannot divide <code>i32</code> by <code>f64</code>". Cast one side and it works: <code>a as f64 / b</code>.',
    },
    {
      type: 'compiles',
      q: 'And this one?',
      code: code`
        fn main() {
            let letter: char = "A";
            println!("{letter}");
        }
      `,
      answer: false,
      explain: 'A <code>char</code> needs single quotes: <code>\'A\'</code>. With double quotes <code>"A"</code> you made a string, and a string is not a char (E0308).',
    },
    {
      type: 'choice',
      q: 'A Rust <code>i32</code> holds 32 bits. In debug mode, what happens when a value goes one past its maximum?',
      options: [
        'The program panics with "attempt to add with overflow"',
        'The number grows, like a Python int',
        'It silently becomes a float',
        'The compiler rounds it to zero',
      ],
      answer: 0,
      explain: 'Debug builds check the limit and panic (crash) so the bug is found. Release builds wrap around instead, silently. Python has no such limit. This is why some Rust code uses a wider type like <code>i64</code> when numbers can get large.',
    },
  ],
  exercise: {
    task: `<p>The average here comes out as a whole number and loses the <code>.5</code>. Change the calculation so it
      prints the real average. You only need to edit <b>one line</b>. One way is to cast both numbers with
      <code>as f64</code>, as in the third example.</p>`,
    starter: code`
      fn main() {
          let total = 18;
          let count = 4;
          let average = total / count;
          println!("average: {average}");
      }
    `,
    solution: code`
      fn main() {
          let total = 18;
          let count = 4;
          let average = total as f64 / count as f64;
          println!("average: {average}");
      }
    `,
    expected: code`
      average: 4.5
    `,
    hint: 'Two integers divided give an integer, so 18 / 4 is 4. Turn both into <code>f64</code> with <code>as</code> before you divide.',
  },
  breaks: [
    `Integers have a fixed size and can overflow. Python's <code>int</code> grows as big as it needs. A <code>u8</code> holds 0 to
      255: going past that panics in a debug build and silently wraps around in a release build.`,
    `Number types don't mix. <code>2 * 1.5</code> just works in Python. In Rust, multiplying an <code>i32</code> by an
      <code>f64</code> doesn't compile until you convert one of them with <code>as</code>.`,
    `<code>as</code> never fails, even when the value doesn't fit: if <code>n</code> is 300, <code>n as u8</code> quietly gives 44.
      Python numbers have no such limit, so they never lose digits like this.`,
    `You can't index a string by position. <code>s[0]</code> doesn't compile, because a Rust string is UTF-8 bytes and one
      character can take several bytes. Use <code>s.chars().next()</code> or <code>s.chars().nth(i)</code>.`,
    `There are two string types. Python has one <code>str</code>. Rust has <code>String</code> (owned, can grow) and
      <code>&amp;str</code> (a borrowed view).`,
  ],
  translate: {
    py: code`
      price = 19.99
      qty = 3
      total = price * qty
      print(f"total: {total:.2f}")

      name = "  Ada Lovelace  "
      print(name.strip().upper())
      print(len("héllo"))
    `,
    starter: code`
      fn main() {
          let price: f64 = 19.99;
      }
    `,
    solution: code`
      fn main() {
          let price: f64 = 19.99;
          let qty: i32 = 3;
          let total = price * qty as f64;
          println!("total: {total:.2}");

          let name = "  Ada Lovelace  ";
          println!("{}", name.trim().to_uppercase());
          println!("{}", "héllo".chars().count());
      }
    `,
    expected: code`
      total: 59.97
      ADA LOVELACE
      5
    `,
    hint: `Multiply with <code>price * qty as f64</code>. <code>{total:.2}</code> rounds to 2 places, like <code>:.2f</code>. On the
      last line, <code>"héllo".len()</code> is 6 (bytes): count characters with <code>.chars().count()</code>.`,
  },
  cheat: [
    ['x = 5  ·  ratio = 0.5', 'let x: i32 = 5;  ·  let ratio: f64 = 0.5;'],
    ['n = 200   # 0..255', 'let n: u8 = 200;'],
    ['big = 10_000_000_000', 'let big: i64 = 10_000_000_000;'],
    ['i = len(items)   # index type', 'let i: usize = items.len();'],
    ['7 / 2  # 3.5  ·  7 // 2  # 3', '7.0 / 2.0  ·  7 / 2   // 3, cuts toward zero'],
    ['float(x)  ·  int(x)', 'x as f64  ·  x as i32'],
    ['len(s)   # characters', 's.len()   // bytes  ·  s.chars().count()'],
    ['s.upper()  ·  s.strip()', 's.to_uppercase()  ·  s.trim()'],
    ['sub in s  ·  s.split(",")', "s.contains(sub)  ·  s.split(',')"],
    ['f"{a}!"  ·  s += "!"', 'format!("{a}!")  ·  s.push_str("!")'],
    ['s = "hi"', 'let s: &str = "hi";   // borrowed view  ·  let mut s = String::from("hi");   // owned'],
    ['True  ·  c = "x"', "true  ·  let c: char = 'x';"],
  ],
});
