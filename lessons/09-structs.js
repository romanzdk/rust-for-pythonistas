LESSONS.push({
  id: 'structs',
  title: 'Structs and impl',
  summary: 'A struct plus an impl block is a class: fields, a constructor and methods.',
  intro: `
    <p>A Python class keeps data and behaviour in one place. Rust splits it in two: the <b>data</b> is a
    <code>struct</code>, and the <b>functions</b> on it live in an <code>impl</code> block. Read them as one thing:
    "here is what a point is, and here is what you can do with it".</p>
    <p>The first argument of a function inside <code>impl</code> tells you which kind it is:</p>
    <ul>
      <li><code>&amp;self</code> is a method that only <b>reads</b> the struct. Python's normal <code>self</code>.</li>
      <li><code>&amp;mut self</code> is a method that <b>changes</b> the struct. The variable you call it on must be
      declared <code>let mut</code>.</li>
      <li>No <code>self</code> at all is an <b>associated function</b>, like a <code>@staticmethod</code> or a second
      constructor. You call it with <code>Type::name()</code>.</li>
    </ul>
    <p>Fields are read with a dot, the same as Python: <code>p.x</code>. There is no inheritance in Rust. Shared
    behaviour comes from traits, in lesson 14.</p>`,
  examples: [
    {
      title: 'A dataclass becomes a struct and an impl',
      text: `<p>A dataclass gives you <code>__init__</code>, field access and methods for free. In Rust you write the
      fields once, then a plain function called <code>new</code> that builds one. Hover the marked lines.</p>`,
      py: code`
        from dataclasses import dataclass

        @dataclass
        class Point:
            x: int
            y: int

            def total(self):
                return self.x + self.y

        p = Point(3, 4)
        print(p.x, p.y)
        print(p.total())
      `,
      rs: code`
        struct Point {
            x: i32,
            y: i32,
        }

        impl Point {
            fn new(x: i32, y: i32) -> Self {
                Point { x, y }
            }

            fn total(&self) -> i32 {
                self.x + self.y
            }
        }

        fn main() {
            let p = Point::new(3, 4);
            println!("{} {}", p.x, p.y);
            println!("{}", p.total());
        }
      `,
      out: code`
        3 4
        7
      `,
      links: [
        [1, [4, 5, 6], 'A <code>struct</code> lists the fields and their types. This is the data half of the class. <code>pub</code> in front would make it visible to other files (modules, lesson 2).'],
        [6, 8, 'Everything you can <i>do</i> with a <code>Point</code> lives in an <code>impl</code> block. In Python these functions sit inside the class body.'],
        [7, 3, 'Rust has no automatic constructor, so you write a function called <code>new</code>. <code>Self</code> means "the type in this <code>impl</code> block", here <code>Point</code>. It plays the part of <code>__init__</code> from <code>@dataclass</code>.'],
        [8, null, '<code>Point { x, y }</code> builds the value. <code>x</code> and <code>y</code> are short for <code>x: x, y: y</code>: the argument fills the field with the same name.'],
        [11, 8, '<code>fn total(&amp;self) -&gt; i32</code> is <code>def total(self)</code> with a return type. <code>&amp;self</code> means "I read the struct but do not take it".'],
        [12, 9, '<code>self.x</code> and <code>self.y</code> read the fields, just like Python.'],
        [17, 11, '<code>Point::new(3, 4)</code> is <code>Point(3, 4)</code>. The <code>::</code> means "the function <code>new</code> that belongs to <code>Point</code>".'],
        [18, 12, 'Field access is a dot, the same in both languages.'],
        [19, 13, 'Calling a method also looks the same.'],
      ],
    },
    {
      title: 'A method that changes the struct needs &mut self',
      text: `<p><code>&amp;mut self</code> is the "this method writes to the struct" marker. You will see it in most real
      code, and it has a second effect: the variable you call it on must also be <code>mut</code>.</p>`,
      py: code`
        class Counter:
            def __init__(self):
                self.n = 0

            def add(self, k):
                self.n += k

        c = Counter()
        c.add(2)
        c.add(5)
        print(c.n)
      `,
      rs: code`
        struct Counter {
            n: i32,
        }

        impl Counter {
            fn new() -> Self {
                Counter { n: 0 }
            }

            fn add(&mut self, k: i32) {
                self.n += k;
            }
        }

        fn main() {
            let mut c = Counter::new();
            c.add(2);
            c.add(5);
            println!("{}", c.n);
        }
      `,
      out: '7',
      links: [
        [1, 1, 'The struct, then its <code>impl</code>. Same shape as the previous example.'],
        [6, 2, '<code>new</code> takes no arguments here and fills in <code>n: 0</code>. It is the <code>__init__</code>.'],
        [10, 5, '<code>&amp;mut self</code> says this method changes the struct. Python has no marker for this: any method can write to <code>self</code>.'],
        [11, 6, '<code>self.n += k</code> works like <code>self.n += k</code> in Python.'],
        [16, 8, '<code>let mut c</code>: a variable must be <code>mut</code> before a <code>&amp;mut self</code> method can be called on it. This is the mistake the compiler catches most often when you edit Rust.'],
        [19, 11, 'Field access again.'],
      ],
    },
    {
      title: '#[derive] gives == and copying',
      text: `<p>A dataclass writes <code>__eq__</code> and <code>__repr__</code> for you. In Rust you ask for that behaviour
      with <code>#[derive(...)]</code> above the struct. Each name in the list adds one thing, and nothing else about the
      struct changes. Without the derive, <code>==</code> on two structs does not compile.</p>`,
      py: code`
        from dataclasses import dataclass
        import copy

        @dataclass
        class Tag:
            name: str
            count: int

        a = Tag("hot", 2)
        b = copy.copy(a)
        print("same" if a == b else "different")
        c = Tag("cold", 5)
        print("same" if a == c else "different")
      `,
      rs: code`
        #[derive(Debug, Clone, PartialEq)]
        struct Tag {
            name: String,
            count: i32,
        }

        fn main() {
            let a = Tag { name: String::from("hot"), count: 2 };
            let b = a.clone();
            println!("{}", if a == b { "same" } else { "different" });
            let c = Tag { name: String::from("cold"), count: 5 };
            println!("{}", if a == c { "same" } else { "different" });
        }
      `,
      out: code`
        same
        different
      `,
      links: [
        [1, [4, 5], 'This one line replaces several dataclass features. <code>PartialEq</code> gives <code>==</code> like <code>__eq__</code>. <code>Clone</code> gives <code>.clone()</code> like <code>copy.copy()</code>. <code>Debug</code> gives <code>println!("{:?}", value)</code>, which is like <code>repr()</code>; quiz 3 shows it.'],
        [8, 9, 'A struct value is written with its field names. <code>String::from("hot")</code> makes an owned string, because <code>String</code> is not a literal (lesson 4).'],
        [9, 10, '<code>a.clone()</code> makes a second value with the same fields. Without <code>Clone</code> this line does not compile, and plain <code>let b = a;</code> would move the value instead of copying it (lesson 13).'],
        [10, 11, '<code>a == b</code> compares field by field, thanks to <code>PartialEq</code>. <code>if</code> can produce a value in Rust, so it can sit inside <code>println!</code>.'],
        [11, 12, 'A new value with different field values. Rust has no <code>replace()</code> for dataclasses: you write the value you want.'],
        [12, 13, 'The comparison is false here, so the second <code>if</code> picks "different".'],
      ],
    },
    {
      title: 'A tuple struct holds one unnamed field',
      text: `<p>When a type is just one value with a name, Rust often uses a <b>tuple struct</b>: a one-line replacement
      for a class with a single attribute. The field has no name, so you read it with <code>.0</code>.</p>`,
      py: code`
        class Meters:
            def __init__(self, value):
                self.value = value

            def to_feet(self):
                return self.value * 3.281

        d = Meters(100)
        print(f"{d.to_feet():.1f}")
      `,
      rs: code`
        struct Meters(f64);

        impl Meters {
            fn to_feet(&self) -> f64 {
                self.0 * 3.281
            }
        }

        fn main() {
            let d = Meters(100.0);
            println!("{:.1}", d.to_feet());
        }
      `,
      out: '328.1',
      links: [
        [1, 1, 'A tuple struct: the type name and one unnamed field. The <code>;</code> at the end is easy to miss. It is a normal struct in every other way.'],
        [4, 5, 'Methods are written the same way as for a normal struct.'],
        [5, 6, '<code>self.0</code> is the first (and only) field. It is <code>self.value</code> in the Python version.'],
        [10, 8, '<code>Meters(100.0)</code> builds it, like <code>Meters(100)</code>. The number needs a decimal point to be an <code>f64</code>, not an <code>i32</code> (lesson 4).'],
        [11, 9, '<code>{:.1}</code> prints one decimal place, the same as <code>:.1f</code> in an f-string.'],
      ],
    },
    {
      title: 'No self: an associated function',
      text: `<p>A function in an <code>impl</code> block with no <code>self</code> belongs to the type, not to a value. It is
      how Rust writes a <code>@classmethod</code> or a second constructor. You call it with <code>Type::name()</code>.</p>`,
      py: code`
        class Rectangle:
            def __init__(self, width, height):
                self.width = width
                self.height = height

            @classmethod
            def square(cls, size):
                return cls(size, size)

            def area(self):
                return self.width * self.height

        r = Rectangle.square(3)
        print(r.width, r.height)
        print(r.area())
      `,
      rs: code`
        struct Rectangle {
            width: u32,
            height: u32,
        }

        impl Rectangle {
            fn square(size: u32) -> Self {
                Rectangle { width: size, height: size }
            }

            fn area(&self) -> u32 {
                self.width * self.height
            }
        }

        fn main() {
            let r = Rectangle::square(3);
            println!("{} {}", r.width, r.height);
            println!("{}", r.area());
        }
      `,
      out: code`
        3 3
        9
      `,
      links: [
        [1, 1, 'The <code>struct</code> holds the data. <code>pub</code> here would make the type usable from other files (lesson 2).'],
        [6, 1, 'Both functions live in one <code>impl</code> block.'],
        [7, [6, 7], 'No <code>self</code> in the arguments, so this is an associated function: it is called on the type, not on a value. <code>@classmethod</code> in Python.'],
        [8, 8, '<code>Self</code> is the return type, and <code>Rectangle { ... }</code> is the value it returns. <code>cls(size, size)</code> does the same job.'],
        [11, 10, '<code>area</code> does take <code>&amp;self</code>, so it is a normal method and is called with a dot.'],
        [17, 13, '<code>Rectangle::square(3)</code> is <code>Rectangle.square(3)</code>. The double colon is for functions that belong to a type.'],
        [19, 15, '<code>r.area()</code> is a method call on a value, so it uses a dot.'],
      ],
    },
  ],
  quiz: [
    {
      type: 'output',
      q: 'What does this print?',
      code: code`
        struct Piggy {
            coins: i32,
        }

        impl Piggy {
            fn add(&mut self, n: i32) {
                self.coins += n;
            }
        }

        fn main() {
            let mut p = Piggy { coins: 10 };
            p.add(5);
            p.add(-3);
            println!("{}", p.coins);
        }
      `,
      options: ['12', '15', '7', '8'],
      answer: 0,
      explain: '<code>coins</code> starts at 10. <code>add(5)</code> makes it 15 and <code>add(-3)</code> makes it 12. <code>add</code> needs <code>&amp;mut self</code> to change the field, and <code>p</code> is <code>let mut</code>, so the calls are allowed.',
    },
    {
      type: 'compiles',
      q: 'Does this compile?',
      code: code`
        struct Counter {
            n: i32,
        }

        impl Counter {
            fn bump(&mut self) {
                self.n += 1;
            }
        }

        fn main() {
            let c = Counter { n: 0 };
            c.bump();
            println!("{}", c.n);
        }
      `,
      answer: false,
      explain: 'The method is fine; the caller is not. <code>bump</code> takes <code>&amp;mut self</code>, so it needs to borrow <code>c</code> mutably, and <code>c</code> is not <code>mut</code>. The compiler says "cannot borrow <code>c</code> as mutable, as it is not declared as mutable" and suggests <code>let mut c</code>.',
    },
    {
      type: 'compiles',
      q: 'And this one?',
      code: code`
        #[derive(Debug)]
        struct Tag {
            count: i32,
        }

        fn main() {
            let t = Tag { count: 2 };
            println!("{:?}", t);
        }
      `,
      answer: true,
      explain: '<code>#[derive(Debug)]</code> is what makes <code>{:?}</code> possible. Remove the derive and the same line fails with "Tag doesn\'t implement <code>Debug</code>". The derive line is easy to overlook above a struct.',
    },
    {
      type: 'choice',
      q: 'What does <code>Point::new(1, 2)</code> tell you?',
      options: [
        '<code>new</code> is a function that belongs to <code>Point</code> and has no <code>self</code>, so it is a constructor. <code>::</code> is how you call those, like <code>@classmethod</code>.',
        'It creates a module called <code>Point</code> and runs <code>new</code> inside it.',
        'It makes a copy of an existing point at 1, 2.',
        'It calls the method <code>new</code> on the value <code>Point</code>, which is the same as <code>Point.new()</code> in Python.',
      ],
      answer: 0,
      explain: 'The <code>::</code> form always means "a function or constant that belongs to this type". A method call on a value uses a dot: <code>p.total()</code>. So when you see <code>::</code>, look in the <code>impl</code> block for a function without <code>self</code>.',
    },
    {
      type: 'choice',
      q: 'You see <code>fn clear(&amp;mut self)</code> in an <code>impl</code>. What do you know about it?',
      options: [
        'It changes the struct, and the variable it is called on must be declared with <code>let mut</code>.',
        'It only reads the struct, so it can be called on any variable.',
        'It is an associated function, so it is called as <code>Type::clear()</code>.',
        'It returns a new copy of the struct and leaves the old one alone.',
      ],
      answer: 0,
      explain: '<code>&amp;mut self</code> means the method borrows the struct mutably, so it may write to fields. The value must be <code>let mut</code> at the call site (quiz 2). A method that only reads takes <code>&amp;self</code>, and one with no <code>self</code> is called with <code>::</code>.',
    },
  ],
  exercise: {
    task: `<p>This should print <code>1</code>, but it does not compile. <code>bump</code> changes the counter, so it needs
      permission to change it. Fix the method, then press <b>Run</b>.</p>`,
    starter: code`
      struct Counter {
          n: i32,
      }

      impl Counter {
          fn bump(&self) {
              self.n += 1;
          }
      }

      fn main() {
          let mut c = Counter { n: 0 };
          c.bump();
          println!("{}", c.n);
      }
    `,
    solution: code`
      struct Counter {
          n: i32,
      }

      impl Counter {
          fn bump(&mut self) {
              self.n += 1;
          }
      }

      fn main() {
          let mut c = Counter { n: 0 };
          c.bump();
          println!("{}", c.n);
      }
    `,
    expected: '1',
    hint: 'The body writes to <code>self.n</code>, so the method needs <code>&amp;mut self</code> instead of <code>&amp;self</code>.',
  },
  breaks: [
    `No inheritance. A struct can't extend another struct. Share behavior with traits (lesson 14), or put one struct inside
      another as a field.`,
    `No new fields at run time. <code>p.color = "red"</code> doesn't compile unless <code>color</code> is declared in the struct.
      Every field is listed up front, with its type.`,
    `<code>new</code> is a normal function, not a special method like <code>__init__</code>. You can skip it and write
      <code>Point { x: 1, y: 2 }</code>, or have several constructors with different names.`,
    `<code>self</code> says how a method uses the value: <code>&amp;self</code> reads it, <code>&amp;mut self</code> changes it, and
      plain <code>self</code> takes it over. Python's <code>self</code> is always the same.`,
    `Nothing comes for free. A dataclass gets <code>__repr__</code> and <code>__eq__</code> automatically. A struct gets them only
      when you add <code>#[derive(Debug, PartialEq)]</code>.`,
  ],
  translate: {
    py: code`
      from dataclasses import dataclass


      @dataclass
      class Account:
          owner: str
          balance: int

          def deposit(self, amount: int) -> None:
              self.balance += amount

          def summary(self) -> str:
              return f"{self.owner}: {self.balance}"


      acc = Account("Ada", 100)
      acc.deposit(50)
      print(acc.summary())
    `,
    starter: code`
      struct Account {
      }

      fn main() {
      }
    `,
    solution: code`
      struct Account {
          owner: String,
          balance: i32,
      }

      impl Account {
          fn new(owner: &str, balance: i32) -> Account {
              Account { owner: String::from(owner), balance }
          }

          fn deposit(&mut self, amount: i32) {
              self.balance += amount;
          }

          fn summary(&self) -> String {
              format!("{}: {}", self.owner, self.balance)
          }
      }

      fn main() {
          let mut acc = Account::new("Ada", 100);
          acc.deposit(50);
          println!("{}", acc.summary());
      }
    `,
    expected: 'Ada: 150',
    hint: `Fields go in the <code>struct</code>, methods in <code>impl Account</code>. <code>deposit</code> changes the account,
      so it takes <code>&amp;mut self</code>, and <code>acc</code> must be <code>let mut</code>.`,
  },
  cheat: [
    ['class Point:\n    def __init__(self, x, y):\n        self.x = x\n        self.y = y', 'struct Point {\n    x: i32,\n    y: i32,\n}'],
    ['p = Point(1, 2)', 'let p = Point::new(1, 2);'],
    ['def total(self):', 'fn total(&self) -> i32 {'],
    ['def add(self, k):\n    self.n += k', 'fn add(&mut self, k: i32) {\n    self.n += k;\n}'],
    ['p = Counter()\np.add(1)  # changes p', 'let mut p = Counter::new();\np.add(1);'],
    ['@staticmethod\n@classmethod', 'fn origin() -> Self {  // no self, call with Type::origin()'],
    ['self.x', 'self.x'],
    ['print(repr(p))', '#[derive(Debug)] + println!("{:?}", p);'],
    ['a == b', '#[derive(PartialEq)] + a == b'],
    ['copy.copy(p)', 'p.clone()  // needs #[derive(Clone)]'],
    ['class Meters:\n    self.value = v', 'struct Meters(f64);  // read with .0'],
    ['class Point:  # importable from other files', 'pub struct Point {  // visible to other files'],
  ],
});
