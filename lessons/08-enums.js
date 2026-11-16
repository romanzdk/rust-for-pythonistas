LESSONS.push({
  id: 'enums',
  title: 'Enums and match',
  summary: 'A type with a few named variants, some carrying data, and the match that must handle all of them.',
  intro: `
    <p>A Python <code>Enum</code> is a set of names. A Rust <b>enum</b> is also a set of names, but each name (each
    <b>variant</b>) can carry data of its own. One Rust enum can therefore replace a small group of related classes.</p>
    <p>To read an enum you need <code>match</code>. It is Python's <code>if</code>/<code>elif</code> chain or the newer
    <code>match</code>/<code>case</code>, with one extra rule: the compiler checks that you handled <b>every</b> variant.
    Miss one and the program does not build. That check is the main reason Rust code has so many <code>match</code> blocks.</p>`,
  examples: [
    {
      title: 'A Python Enum and a Rust enum',
      text: `<p>The simplest kind: variants with no data at all. Names inside an enum are written in
      <code>UpperCamelCase</code> in Rust, not <code>UPPER_CASE</code>.</p>`,
      py: code`
        from enum import Enum

        class Status(Enum):
            OPEN = "open"
            CLOSED = "closed"

        status = Status.OPEN
        if status is Status.OPEN:
            print("The ticket is open")
        else:
            print("The ticket is closed")
      `,
      rs: code`
        enum Status {
            Open,
            Closed,
        }

        fn main() {
            let status = Status::Open;
            match status {
                Status::Open => println!("The ticket is open"),
                Status::Closed => println!("The ticket is closed"),
            }
        }
      `,
      out: code`
        The ticket is open
      `,
      links: [
        [1, 3, 'One enum type, like <code>class Status(Enum)</code>. The variants are listed inside the braces.'],
        [2, 4, '<code>Open</code> is a variant with no data. Python needs a value (<code>OPEN = "open"</code>); Rust does not, because the variant name is the whole value.'],
        [7, 7, '<code>Status::Open</code> builds a value of that variant. Read <code>::</code> as a dot that reaches inside a type: Python writes <code>Status.OPEN</code>.'],
        [8, [8, 10], '<code>match</code> takes a value and runs the arm whose pattern fits. It works like <code>if</code>/<code>else</code> here: exactly one arm runs, there is no fall-through.'],
        [9, [8, 9], 'One arm is a pattern, then <code>=&gt;</code>, then the code that runs for it. Arms are separated by commas, and the last one has a comma too.'],
        [10, [10, 11], 'The second arm. Both variants are now covered, so this <code>match</code> is <b>exhaustive</b>.'],
      ],
    },
    {
      title: 'Variants can carry data',
      text: `<p>This is the big difference from a Python <code>Enum</code>. <code>Circle(f64)</code> carries one number,
      like a dataclass with one field. <code>Rect { w: f64, h: f64 }</code> carries named fields, like a dataclass with
      two. One enum holds both, and a <code>Vec</code> of that enum holds a mix of them.</p>
      <p>In Python you would write two classes and ask <code>isinstance</code>. In Rust you <code>match</code> and the
      pattern pulls the data out.</p>`,
      py: code`
        from dataclasses import dataclass

        @dataclass
        class Circle:
            radius: float

        @dataclass
        class Rect:
            w: float
            h: float

        def area(shape):
            if isinstance(shape, Circle):
                return 3.14159 * shape.radius ** 2
            return shape.w * shape.h

        for s in [Circle(1.0), Rect(3.0, 4.0)]:
            print(f"{area(s):.2f}")
      `,
      rs: code`
        enum Shape {
            Circle(f64),
            Rect { w: f64, h: f64 },
        }

        fn area(shape: &Shape) -> f64 {
            match shape {
                Shape::Circle(r) => 3.14159 * r * r,
                Shape::Rect { w, h } => w * h,
            }
        }

        fn main() {
            let shapes = vec![Shape::Circle(1.0), Shape::Rect { w: 3.0, h: 4.0 }];
            for s in &shapes {
                println!("{:.2}", area(s));
            }
        }
      `,
      out: code`
        3.14
        12.00
      `,
      links: [
        [1, [4, 8], 'One type for shapes, where Python has one class per shape.'],
        [2, [3, 4, 5], 'A <b>tuple variant</b>: it holds the values written in the brackets, in order. Here one <code>f64</code>, the radius.'],
        [3, [7, 8, 9], 'A <b>struct variant</b>: named fields, like a dataclass. Both kinds can live in the same enum.'],
        [6, 12, '<code>&amp;Shape</code> means the data is borrowed, not moved. Read <code>&amp;</code> as "borrowed"; lesson 11 explains it.'],
        [7, 13, '<code>match</code> on the shape: one arm per variant.'],
        [8, [13, 14], 'The pattern <code>Shape::Circle(r)</code> only fits a circle, and <code>r</code> is the number inside it. That replaces <code>isinstance</code> plus <code>shape.radius</code>.'],
        [9, 15, 'The fields are pulled out by name. <code>w</code> and <code>h</code> are new local variables, so no <code>shape.</code> is needed.'],
        [14, [17, 18], 'A <code>Vec</code> of one enum type, holding different variants. Python needs a list of objects of different classes.'],
        [15, 17, '<code>&amp;shapes</code> borrows each shape instead of moving it out of the list.'],
      ],
    },
    {
      title: 'match is an expression: guards, | and ranges',
      text: `<p>Python 3.10 added <code>match</code>/<code>case</code>, and Rust's <code>match</code> reads almost the same.
      Two differences to notice. First, a Rust <code>match</code> <b>returns a value</b>, so it can sit on the right of a
      <code>let</code>; the Python side has to <code>return</code> from a function instead. Second, the compiler checks
      that the arms cover everything.</p>`,
      py: code`
        def describe(n):
            match n:
                case 0:
                    return "zero"
                case 1 | 2:
                    return "one or two"
                case 3 | 4 | 5 | 6 | 7 | 8 | 9:
                    return "three to nine"
                case n if n < 0:
                    return "negative"
                case _:
                    return "large"

        for n in [0, 2, 5, -5, 42]:
            print(f"{n}: {describe(n)}")
      `,
      rs: code`
        fn main() {
            for n in [0, 2, 5, -5, 42] {
                let label = match n {
                    0 => "zero",
                    1 | 2 => "one or two",
                    3..=9 => "three to nine",
                    n if n < 0 => "negative",
                    _ => "large",
                };
                println!("{n}: {label}");
            }
        }
      `,
      out: code`
        0: zero
        2: one or two
        5: three to nine
        -5: negative
        42: large
      `,
      links: [
        [3, [1, 2], 'The <code>match</code> is the value of the <code>let</code>. Whatever arm runs, its value becomes <code>label</code>. Python needs a function with <code>return</code> for the same thing.'],
        [4, [3, 4], 'Compared with an exact value. In Python this is <code>case 0:</code>.'],
        [5, [5, 6], '<code>|</code> means "either pattern", like <code>case 1 | 2</code>.'],
        [6, [7], '<code>3..=9</code> is a range that includes both ends, like Python\'s <code>range(3, 10)</code>. Python has no range pattern, so it spells the numbers out with <code>|</code>.'],
        [7, [9, 10], 'A <b>guard</b>: <code>if</code> after the pattern. The arm only runs when the pattern fits and the condition is true.'],
        [8, [11, 12], '<code>_</code> fits anything and takes no value, like <code>case _</code>. Without it, the compiler would complain that some numbers are not covered.'],
        [9, null, 'The semicolon closes the <code>let</code>. The label is a <code>&amp;str</code>, because all arms return string literals.'],
      ],
    },
    {
      title: 'Miss one variant and it does not compile',
      text: `<p>In Python, forgetting a case is silent: a yellow light would simply print nothing. Rust counts the variants and refuses to build the program. The error <code>E0004</code> is one you
      will meet often; the fix is a missing arm, or <code>_</code> if any other value is fine.</p>`,
      py: code`
        from enum import Enum

        class TrafficLight(Enum):
            RED = "red"
            YELLOW = "yellow"
            GREEN = "green"

        light = TrafficLight.GREEN
        if light is TrafficLight.RED:
            print("stop")
        elif light is TrafficLight.GREEN:
            print("go")
      `,
      rs: code`
        enum TrafficLight {
            Red,
            Yellow,
            Green,
        }

        fn main() {
            let light = TrafficLight::Green;
            match light {
                TrafficLight::Red => println!("stop"),
                TrafficLight::Green => println!("go"),
            }
        }
      `,
      out: 'go',
      rsError: 'error[E0004]: non-exhaustive patterns: `TrafficLight::Yellow` not covered',
      links: [
        [1, 3, 'Three variants, so the compiler expects three options to be handled.'],
        [3, 4, '<code>Yellow</code> exists as a value, but no arm below mentions it.'],
        [9, [9, 10], 'The match starts. The compiler reads every arm before it builds anything.'],
        [11, [11, 12], 'Green is handled. Python is happy without a Yellow branch, but Rust is not: the value could be <code>TrafficLight::Yellow</code>.'],
      ],
    },
    {
      title: 'Methods on an enum',
      text: `<p>An enum can have an <code>impl</code> block, just like a struct (lesson 7). The method usually matches on
      <code>self</code> and turns the variant into a number or a string. This is the closest thing to a Python
      <code>Enum</code> whose members have a value.</p>`,
      py: code`
        from enum import Enum

        class Coin(Enum):
            PENNY = 1
            NICKEL = 5
            DIME = 10
            QUARTER = 25

            @property
            def cents(self):
                return self.value

        coins = [Coin.PENNY, Coin.QUARTER, Coin.QUARTER]
        print(sum(c.cents for c in coins))
      `,
      rs: code`
        enum Coin {
            Penny,
            Nickel,
            Dime,
            Quarter,
        }

        impl Coin {
            fn cents(&self) -> u32 {
                match self {
                    Coin::Penny => 1,
                    Coin::Nickel => 5,
                    Coin::Dime => 10,
                    Coin::Quarter => 25,
                }
            }
        }

        fn main() {
            let coins = vec![Coin::Penny, Coin::Quarter, Coin::Quarter];
            let total: u32 = coins.iter().map(|c| c.cents()).sum();
            println!("{total}");
        }
      `,
      out: '51',
      links: [
        [8, [9, 10], '<code>impl</code> adds methods to the enum. In Python they are written inside the class body.'],
        [9, [10, 11], '<code>&amp;self</code> is the coin the method is called on, borrowed. <code>-&gt; u32</code> says it returns an unsigned number.'],
        [10, [10, 11], 'The <code>match</code> on <code>self</code> is the whole body, so its value is the return value. Python returns <code>self.value</code> instead.'],
        [11, null, 'A pattern with no data. The number on the right is what this variant is worth.'],
        [20, 13, 'A <code>Vec</code> of coins, like the Python list.'],
        [21, 14, '<code>map</code> calls <code>cents</code> on each coin and <code>sum</code> adds them up (lesson 6). The <code>: u32</code> is needed because <code>sum</code> can produce several number types, and here it must match <code>cents</code>.'],
      ],
    },
  ],
  quiz: [
    {
      type: 'output',
      q: 'What does this print?',
      code: code`
        enum Msg {
            Quit,
            Move { x: i32, y: i32 },
        }

        fn main() {
            let m = Msg::Move { x: 3, y: 4 };
            match m {
                Msg::Quit => println!("bye"),
                Msg::Move { x, y } => println!("{}", x + y),
            }
        }
      `,
      options: ['7', '34', '3\n4', 'bye'],
      answer: 0,
      explain: '<code>m</code> is the <code>Move</code> variant, so the second arm runs. Its pattern pulls out <code>x = 3</code> and <code>y = 4</code>, and the arm prints their sum.',
    },
    {
      type: 'output',
      q: 'What does this print?',
      code: code`
        enum Light {
            On,
            Off,
        }

        fn main() {
            let lights = vec![Light::On, Light::Off, Light::On];
            let mut count = 0;
            for l in &lights {
                match l {
                    Light::On => count += 1,
                    _ => {}
                }
            }
            println!("{count}");
        }
      `,
      options: ['2', '3', '1', '0'],
      answer: 0,
      explain: 'The loop visits three values. Two of them are <code>Light::On</code>, so <code>count</code> goes up twice. The <code>_</code> arm does nothing, and it is what makes the match exhaustive.',
    },
    {
      type: 'compiles',
      q: 'Does this compile?',
      code: code`
        enum Color {
            Red,
            Green,
        }

        fn main() {
            let c = Color::Green;
            match c {
                Color::Red => println!("warm"),
            }
        }
      `,
      answer: false,
      explain: 'No. The match only handles <code>Color::Red</code>, so the compiler reports <code>error[E0004]: non-exhaustive patterns: `Color::Green` not covered</code>. Add <code>Color::Green => ...</code> or a <code>_</code> arm.',
    },
    {
      type: 'compiles',
      q: 'And this one?',
      code: code`
        enum Color {
            Red,
            Green,
        }

        fn main() {
            let c = Color::Green;
            let name = match c {
                Color::Red => "red",
                other => "not red",
            };
            println!("{name}");
        }
      `,
      answer: true,
      explain: 'Yes. A plain name like <code>other</code> is a pattern that fits anything, so the match is exhaustive. It also binds the value, which is more than <code>_</code> does. Here it prints <code>not red</code>.',
    },
    {
      type: 'choice',
      q: 'Why does the compiler reject a <code>match</code> that misses one variant?',
      options: [
        'The compiler knows every variant of the enum and checks that each one is handled before the program can run.',
        'Because a missed arm would fall through to the next arm at run time.',
        'Because every <code>match</code> needs a <code>_</code> arm.',
        'Because the enum has no default value to use.',
      ],
      answer: 0,
      explain: 'The set of variants is fixed and known when the code is compiled, so the compiler can prove a case is missing. That is why adding a variant later shows you every <code>match</code> that now needs a new arm.',
    },
  ],
  exercise: {
    task: `<p>This doesn't compile: the <code>match</code> does not cover every direction. Press <b>Run</b> to see the
      error, then add the <b>two missing arms</b>. <code>East</code> should print <code>right</code> and <code>West</code>
      should print <code>left</code>.</p>`,
    starter: code`
      enum Direction {
          North,
          South,
          East,
          West,
      }

      fn main() {
          let d = Direction::East;
          match d {
              Direction::North => println!("up"),
              Direction::South => println!("down"),
          }
      }
    `,
    solution: code`
      enum Direction {
          North,
          South,
          East,
          West,
      }

      fn main() {
          let d = Direction::East;
          match d {
              Direction::North => println!("up"),
              Direction::South => println!("down"),
              Direction::East => println!("right"),
              Direction::West => println!("left"),
          }
      }
    `,
    expected: code`
      right
    `,
    hint: 'The error names the variants that are not covered. Copy the shape of the arms that are already there: <code>Direction::East =&gt; println!(...)</code>.',
  },
  cheat: [
    ['class Status(Enum):\n    OPEN = "open"', 'enum Status {\n    Open,\n}'],
    ['Status.OPEN', 'Status::Open'],
    ['Status.OPEN.name  # "OPEN"', 'match status { Status::Open => "Open", ... }'],
    ['match x:\n    case 1:', 'match x {\n    1 => ...'],
    ['case 0:', '0 => ...'],
    ['case 1 | 2:', '1 | 2 => ...'],
    ['case 3 | 4 | 5 | 6 | 7 | 8 | 9:', '3..=9 => ...'],
    ['case n if n < 0:', 'n if n < 0 => ...'],
    ['case _:', '_ => ...'],
    ['isinstance(s, Circle)', 'Shape::Circle(r) => ...'],
    ['result = describe(x)', 'let result = match x { ... };'],
    ['def cents(self):  # in the Enum class', 'impl Coin {\n    fn cents(&self) -> u32 { ... }\n}'],
  ],
});
