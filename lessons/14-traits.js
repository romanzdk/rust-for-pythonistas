LESSONS.push({
  id: 'traits',
  title: 'Traits instead of duck typing',
  summary: 'trait, impl, default methods, generic bounds, Display and derive.',
  intro: `
    <p>In Python you often do not say what a function needs. You just call <code>item.describe()</code> and trust
    that the object has that method. That is duck typing: if it walks like a duck, it is a duck. A
    <code>typing.Protocol</code> or an <code>abc.ABC</code> writes the expectation down, but Python checks it at run
    time, or only in a type checker.</p>
    <p>Rust makes it a rule. A <b>trait</b> is a named list of methods, and a type can only be used where the trait is
    required if the compiler can see the matching <code>impl</code>. Four shapes to recognise:</p>
    <ul>
      <li><code>trait X { ... }</code>: the list of methods. Read it as a Protocol or an ABC.</li>
      <li><code>impl X for Y { ... }</code>: Y provides them. Read it as "Y can do X".</li>
      <li><code>T: X</code> or <code>impl X</code> in a function: "any type that does X".</li>
      <li><code>Box&lt;dyn X&gt;</code>: one value of some type that does X, where the exact type is only known at
        run time.</li>
    </ul>
    <p>Many traits you already use have Python dunder twins: <code>Display</code> is <code>__str__</code>,
    <code>Debug</code> is <code>__repr__</code>, <code>PartialEq</code> is <code>__eq__</code>,
    <code>Clone</code> is a copy, and <code>Add</code> is <code>__add__</code>.</p>`,
  examples: [
    {
      title: 'From duck typing to a trait',
      text: `<p>Two different types, one shared method. Python trusts that the method is there. Rust says it out loud
      with a trait, and then each type implements it.</p>`,
      py: code`
        class Dog:
            def __init__(self, name):
                self.name = name

            def describe(self):
                return f"{self.name} is a dog"

        class Robot:
            def __init__(self, name):
                self.name = name

            def describe(self):
                return f"{self.name} is a robot"

        for thing in [Dog("Rex"), Robot("R2")]:
            print(thing.describe())
      `,
      rs: code`
        trait Describe {
            fn describe(&self) -> String;
        }

        struct Dog {
            name: String,
        }

        impl Describe for Dog {
            fn describe(&self) -> String {
                format!("{} is a dog", self.name)
            }
        }

        struct Robot {
            name: String,
        }

        impl Describe for Robot {
            fn describe(&self) -> String {
                format!("{} is a robot", self.name)
            }
        }

        fn main() {
            let dog = Dog { name: String::from("Rex") };
            let robot = Robot { name: String::from("R2") };
            println!("{}", dog.describe());
            println!("{}", robot.describe());
        }
      `,
      out: code`
        Rex is a dog
        R2 is a robot
      `,
      links: [
        [1, null, 'A trait is a named list of methods. Think <code>typing.Protocol</code> or <code>abc.ABC</code>, but checked by the compiler.'],
        [2, null, 'Only the signature, ending in <code>;</code>. There is no body here: each type has to write its own. <code>&amp;self</code> is the instance, the <code>self</code> of Python.'],
        [5, 1, 'An ordinary struct, as in lesson 9: just the data.'],
        [9, null, '<code>impl Describe for Dog</code> is the promise "Dog can do Describe". Without this block, Dog cannot be used where a Describe is needed.'],
        [10, 5, 'The body of the method. <code>&amp;self</code> borrows the instance, so <code>self.name</code> is readable and nothing is moved.'],
        [15, 8, 'A second, unrelated type. It shares no base class with Dog, only the trait.'],
        [19, 12, 'The same trait, implemented again. This is where Rust differs from inheritance: no parent class, just the method list.'],
        [28, 16, 'Calling a trait method looks exactly like calling a Python method. The difference is that the compiler checked it already.'],
      ],
    },
    {
      title: 'Default methods are like methods on a base class',
      text: `<p>A trait can give a method a body. Then a type only has to supply the other methods and gets this one for
      free. It is the same idea as a method on a Python base class, and a type can override it, just like a
      subclass.</p>`,
      py: code`
        class Named:
            def label(self):
                return "thing"

            def describe(self):
                return f"{self.label()} is ready"

        class Dog(Named):
            def __init__(self, name):
                self._name = name

            def label(self):
                return self._name

        class Robot(Named):
            def __init__(self, name):
                self._name = name

            def label(self):
                return self._name

            def describe(self):
                return f"{self.label()} beeps"

        for thing in [Dog("Rex"), Robot("R2")]:
            print(thing.describe())
      `,
      rs: code`
        trait Describe {
            fn label(&self) -> String;

            fn describe(&self) -> String {
                format!("{} is ready", self.label())
            }
        }

        struct Dog {
            name: String,
        }

        impl Describe for Dog {
            fn label(&self) -> String {
                self.name.clone()
            }
        }

        struct Robot {
            name: String,
        }

        impl Describe for Robot {
            fn label(&self) -> String {
                self.name.clone()
            }

            fn describe(&self) -> String {
                format!("{} beeps", self.label())
            }
        }

        fn main() {
            let dog = Dog { name: String::from("Rex") };
            let robot = Robot { name: String::from("R2") };
            println!("{}", dog.describe());
            println!("{}", robot.describe());
        }
      `,
      out: code`
        Rex is ready
        R2 beeps
      `,
      links: [
        [2, 2, 'A required method: every type must provide it.'],
        [4, 5, 'A method with a body inside the trait, so it is shared by all types. A Python base class method.'],
        [5, null, 'It calls <code>self.label()</code>, the method the concrete type supplies. The trait can rely on its own requirements.'],
        [13, 8, 'Dog provides only <code>label</code>, so it gets the default <code>describe</code>.'],
        [15, 13, '<code>clone()</code> makes a copy of the String so it can be returned. The field itself stays in the struct.'],
        [23, 15, 'Robot also provides <code>label</code>...'],
        [28, 22, '...and overrides <code>describe</code>. Same method name, own body: the override wins.'],
        [36, 25, 'Both types are used the same way, and each prints its own line.'],
      ],
    },
    {
      title: 'Anything that implements Describe',
      text: `<p>A function that takes <code>&amp;impl Describe</code> or <code>T: Describe</code> accepts any type that has
      the trait. That is the Rust version of a Python type hint. Python hopes, Rust checks. The
      <code>where</code> form says the same thing below the signature, which keeps long bounds readable.</p>`,
      py: code`
        from typing import Protocol

        class Describe(Protocol):
            def describe(self) -> str: ...

        def show(item: Describe) -> None:
            print(item.describe())

        def announce(item: Describe) -> None:
            print(item.describe())

        def pair(a: Describe, b: Describe) -> None:
            print(f"{a.describe()} and {b.describe()}")

        class Dog:
            def __init__(self, name):
                self.name = name

            def describe(self):
                return f"dog {self.name}"

        class Robot:
            def __init__(self, name):
                self.name = name

            def describe(self):
                return f"robot {self.name}"

        show(Dog("Rex"))
        announce(Robot("R2"))
        pair(Dog("Rex"), Robot("R2"))
      `,
      rs: code`
        trait Describe {
            fn describe(&self) -> String;
        }

        struct Dog {
            name: String,
        }

        impl Describe for Dog {
            fn describe(&self) -> String {
                format!("dog {}", self.name)
            }
        }

        struct Robot {
            name: String,
        }

        impl Describe for Robot {
            fn describe(&self) -> String {
                format!("robot {}", self.name)
            }
        }

        fn show<T: Describe>(item: &T) {
            println!("{}", item.describe());
        }

        fn announce(item: &impl Describe) {
            println!("{}", item.describe());
        }

        fn pair<T, U>(a: &T, b: &U)
        where
            T: Describe,
            U: Describe,
        {
            println!("{} and {}", a.describe(), b.describe());
        }

        fn main() {
            let dog = Dog { name: String::from("Rex") };
            let robot = Robot { name: String::from("R2") };
            show(&dog);
            announce(&robot);
            pair(&dog, &robot);
        }
      `,
      out: code`
        dog Rex
        robot R2
        dog Rex and robot R2
      `,
      links: [
        [1, 3, 'The trait plays the role of the <code>Protocol</code> class.'],
        [25, 6, '<code>&lt;T: Describe&gt;</code> means: T is whatever type the caller passes, as long as it implements Describe. The Python hint says the same, but only a type checker looks at it.'],
        [26, 7, 'Inside the function, <code>item</code> is known to have <code>describe()</code>, so this line is safe.'],
        [29, 9, 'The short form. <code>&amp;impl Describe</code> means "a borrowed value of any type that implements Describe". Same meaning, less typing, one type per parameter.'],
        [33, 12, 'A <code>where</code> clause moves the bounds below the signature. Read the block as "T and U must implement Describe".'],
        [38, 13, 'Two different types can be passed because T and U are separate.'],
        [44, 29, 'Dog implements the trait, so this call is allowed. With a type that does not, the compiler stops here.'],
      ],
    },
    {
      title: 'Display, Debug and derive',
      text: `<p><code>{}</code> in <code>println!</code> uses the <code>Display</code> trait, which is Python's
      <code>__str__</code>. <code>{:?}</code> uses <code>Debug</code>, which is <code>__repr__</code>. You write
      <code>Display</code> by hand; <code>Debug</code>, <code>Clone</code> and <code>PartialEq</code> can be generated
      by <code>#[derive(...)]</code>, as you saw in lesson 9.</p>`,
      py: code`
        import copy

        class Point:
            def __init__(self, x, y):
                self.x = x
                self.y = y

            def __str__(self):
                return f"({self.x}, {self.y})"

            def __repr__(self):
                return f"Point {{ x: {self.x}, y: {self.y} }}"

            def __eq__(self, other):
                return (self.x, self.y) == (other.x, other.y)

        a = Point(1, 2)
        b = copy.copy(a)
        print(a)
        print(repr(a))
        print(str(a == b).lower())
      `,
      rs: code`
        use std::fmt;

        #[derive(Debug, Clone, PartialEq)]
        struct Point {
            x: i32,
            y: i32,
        }

        impl fmt::Display for Point {
            fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
                write!(f, "({}, {})", self.x, self.y)
            }
        }

        fn main() {
            let a = Point { x: 1, y: 2 };
            let b = a.clone();
            println!("{a}");
            println!("{a:?}");
            println!("{}", a == b);
        }
      `,
      out: code`
        (1, 2)
        Point { x: 1, y: 2 }
        true
      `,
      links: [
        [1, null, 'Brings the <code>fmt</code> module into scope so the next lines can name <code>fmt::Display</code>.'],
        [3, [11, 12, 14], '<code>#[derive(...)]</code> asks the compiler to write the impls for you: <code>Debug</code> for <code>{:?}</code>, <code>Clone</code> for <code>a.clone()</code>, <code>PartialEq</code> for <code>==</code>. These are the <code>__repr__</code>, copy and <code>__eq__</code> of the type.'],
        [9, 8, '<code>impl fmt::Display for Point</code> is <code>__str__</code>: it is what <code>{}</code> calls.'],
        [10, null, 'The signature is fixed by the trait: you get the formatter <code>f</code> and must return a <code>fmt::Result</code>.'],
        [11, 9, '<code>write!(f, ...)</code> puts text into that formatter. It is <code>return</code> with the format string, without a newline.'],
        [17, 18, '<code>clone()</code> is <code>copy.copy</code> here: a new value, not a second name for the same one.'],
        [18, 19, 'Plain <code>{}</code> asks for Display, so you see <code>(1, 2)</code>.'],
        [19, 20, '<code>{:?}</code> asks for Debug, the <code>repr</code> shape.'],
        [20, 21, '<code>==</code> calls <code>PartialEq</code>, which compares the fields.'],
      ],
    },
    {
      title: 'A list of mixed types, and the + operator',
      text: `<p>A <code>Vec</code> holds values of one type. To hold a mix, use <code>Vec&lt;Box&lt;dyn Shape&gt;&gt;</code>:
      many boxes, each holding some type that implements <code>Shape</code>. The method is chosen at run time. In
      Python you just put the objects in a list.</p>
      <p>The last part shows a trait you have been using all along without knowing: <code>+</code> on your own type is
      the <code>Add</code> trait, which is <code>__add__</code>.</p>`,
      py: code`
        class Circle:
            def __init__(self, r):
                self.r = r

            def area(self):
                return 3.14 * self.r * self.r

        class Square:
            def __init__(self, side):
                self.side = side

            def area(self):
                return self.side * self.side

        class Point:
            def __init__(self, x, y):
                self.x = x
                self.y = y

            def __add__(self, other):
                return Point(self.x + other.x, self.y + other.y)

            def __repr__(self):
                return f"Point {{ x: {self.x}, y: {self.y} }}"

        shapes = [Circle(1.0), Square(2.0)]
        for s in shapes:
            print(f"{s.area():.2f}")
        p = Point(1, 2) + Point(10, 20)
        print(repr(p))
      `,
      rs: code`
        use std::ops::Add;

        trait Shape {
            fn area(&self) -> f64;
        }

        struct Circle {
            r: f64,
        }

        struct Square {
            side: f64,
        }

        impl Shape for Circle {
            fn area(&self) -> f64 {
                3.14 * self.r * self.r
            }
        }

        impl Shape for Square {
            fn area(&self) -> f64 {
                self.side * self.side
            }
        }

        #[derive(Debug, Clone, Copy, PartialEq)]
        struct Point {
            x: i32,
            y: i32,
        }

        impl Add for Point {
            type Output = Point;

            fn add(self, other: Point) -> Point {
                Point { x: self.x + other.x, y: self.y + other.y }
            }
        }

        fn main() {
            let shapes: Vec<Box<dyn Shape>> = vec![
                Box::new(Circle { r: 1.0 }),
                Box::new(Square { side: 2.0 }),
            ];
            for s in &shapes {
                println!("{:.2}", s.area());
            }
            let p = Point { x: 1, y: 2 } + Point { x: 10, y: 20 };
            println!("{p:?}");
        }
      `,
      out: code`
        3.14
        4.00
        Point { x: 11, y: 22 }
      `,
      links: [
        [1, 20, '<code>use std::ops::Add</code> makes the <code>Add</code> trait nameable. That trait is what <code>__add__</code> is in Python.'],
        [3, null, 'A trait with one required method, <code>area</code>.'],
        [15, 1, 'Circle implements it. No base class is involved.'],
        [27, null, '<code>Copy</code> is derived too, so the point can be passed to <code>+</code> without being moved away.'],
        [33, 20, '<code>impl Add for Point</code> is how you give a type <code>__add__</code>.'],
        [34, null, '<code>type Output</code> says what the <code>+</code> produces: here another Point.'],
        [36, 21, 'This is the method behind the <code>+</code> sign.'],
        [42, 26, '<code>Vec&lt;Box&lt;dyn Shape&gt;&gt;</code> is a list that may hold any type with <code>Shape</code>. <code>dyn</code> means the concrete type is only known at run time.'],
        [46, 27, 'Iterating with <code>&amp;</code> borrows each box; nothing is moved out of the vector (lesson 13).'],
        [47, 28, '<code>s.area()</code> runs the implementation that belongs to the real type inside the box.'],
        [49, 29, 'Two Point values and a <code>+</code>: this calls <code>Add::add</code>.'],
        [50, 30, '<code>{p:?}</code> prints with Debug, the same shape as the Python <code>repr</code>.'],
      ],
    },
  ],
  quiz: [
    {
      type: 'output',
      q: 'What does this print?',
      code: code`
        trait Greet {
            fn name(&self) -> String;

            fn greet(&self) -> String {
                format!("Hello, {}!", self.name())
            }
        }

        struct Cat;

        impl Greet for Cat {
            fn name(&self) -> String {
                String::from("Tom")
            }
        }

        fn main() {
            println!("{}", Cat.greet());
        }
      `,
      options: ['Hello, Tom!', 'Hello, !', 'Hello, name!', 'It does not compile'],
      answer: 0,
      explain: 'Cat only writes <code>name</code>, so <code>greet</code> comes from the trait default. It builds "Hello, " plus the name Tom. <code>struct Cat;</code> is a struct with no fields, which is why <code>Cat</code> alone is already a value.',
    },
    {
      type: 'compiles',
      q: 'Does this compile?',
      code: code`
        trait Describe {
            fn describe(&self) -> String;
        }

        struct Rock;

        fn show<T: Describe>(item: &T) {
            println!("{}", item.describe());
        }

        fn main() {
            show(&Rock);
        }
      `,
      answer: false,
      explain: '<code>Rock</code> never implements <code>Describe</code>, so it cannot be passed to <code>show</code>. The compiler reports E0277, "the trait bound <code>Rock: Describe</code> is not satisfied", and suggests adding an <code>impl</code>.',
    },
    {
      type: 'compiles',
      q: 'And this one?',
      code: code`
        trait Describe {
            fn describe(&self) -> String;
        }

        struct Rock;

        impl Describe for Rock {
            fn describe(&self) -> String {
                String::from("just a rock")
            }
        }

        fn show<T: Describe>(item: &T) {
            println!("{}", item.describe());
        }

        fn main() {
            show(&Rock);
        }
      `,
      answer: true,
      explain: 'Now the <code>impl Describe for Rock</code> block exists, so Rock satisfies the bound and <code>show</code> is allowed. This is the fix for the previous question: the type must opt in with an impl.',
    },
    {
      type: 'output',
      q: 'What does this print?',
      code: code`
        use std::fmt;

        struct Temp {
            c: i32,
        }

        impl fmt::Display for Temp {
            fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
                write!(f, "{}C", self.c)
            }
        }

        fn main() {
            let t = Temp { c: 21 };
            println!("{t}");
        }
      `,
      options: ['21C', 'Temp { c: 21 }', '21', 'It does not compile'],
      answer: 0,
      explain: 'Plain <code>{t}</code> uses <code>Display</code>, and this impl writes the number followed by C. The Debug shape <code>Temp { c: 21 }</code> would only appear with <code>{t:?}</code>, and this type does not derive Debug anyway.',
    },
    {
      type: 'choice',
      q: 'In <code>fn show&lt;T: Describe&gt;(item: &amp;T)</code>, what does <code>T: Describe</code> mean?',
      options: [
        'T can be any type, as long as it implements <code>Describe</code>. The compiler checks it at each call.',
        'T is a variable of the trait type, like a base class instance.',
        'T must be exactly the type <code>Describe</code>.',
        'The function returns something that implements <code>Describe</code>.',
      ],
      answer: 0,
      explain: 'It is a bound: a promise the caller must keep, checked while compiling. Read it as "for any T that implements Describe". <code>&amp;impl Describe</code> is the shorter way to write the same thing for one parameter.',
    },
  ],
  exercise: {
    task: `<p>The trait promises a method called <code>describe</code>, but the <code>impl</code> for
      <code>Robot</code> is empty, so this does not compile. Press <b>Run</b> to see the error. Add the missing
      method so it prints the robot's name.</p>`,
    starter: code`
      trait Describe {
          fn describe(&self) -> String;
      }

      struct Robot {
          name: String,
      }

      impl Describe for Robot {}

      fn main() {
          let robot = Robot { name: String::from("R2") };
          println!("{}", robot.describe());
      }
    `,
    solution: code`
      trait Describe {
          fn describe(&self) -> String;
      }

      struct Robot {
          name: String,
      }

      impl Describe for Robot {
          fn describe(&self) -> String {
              format!("I am {}", self.name)
          }
      }

      fn main() {
          let robot = Robot { name: String::from("R2") };
          println!("{}", robot.describe());
      }
    `,
    expected: code`
      I am R2
    `,
    hint: 'Inside the impl block, write the method exactly as the trait asks: fn describe(&amp;self) -> String { ... }. Return format!("I am {}", self.name).',
  },
  breaks: [
    `Duck typing is checked at compile time. A function that takes <code>&amp;impl Describe</code> only accepts types that say
      <code>impl Describe for ...</code>. Having a method with the right name is not enough.`,
    `Traits have methods, not fields. A default method can't read <code>self.name</code>; it can only call other methods of the
      trait. The data lives in the struct.`,
    `Dunder methods become traits, and you opt in to each one. <code>__str__</code> is <code>Display</code>, <code>__eq__</code> is
      <code>PartialEq</code>, <code>__add__</code> is <code>Add</code>. Nothing is there until you implement or derive it.`,
    `A list of mixed types needs a box. <code>[Circle(), Square()]</code> just works in Python. In Rust it is a
      <code>Vec&lt;Box&lt;dyn Shape&gt;&gt;</code>, because a <code>Vec</code> holds one type.`,
    `You can add your own trait to a type you didn't write, like <code>impl Describe for i32</code>. That's like adding a method
      to Python's <code>int</code>, which Python doesn't allow.`,
  ],
  translate: {
    py: code`
      class Dog:
          def speak(self) -> str:
              return "Woof"


      class Cat:
          def speak(self) -> str:
              return "Meow"


      def chorus(animal, times: int) -> str:
          return " ".join([animal.speak()] * times)


      print(chorus(Dog(), 2))
      print(chorus(Cat(), 3))
    `,
    starter: code`
      trait Speak {
          fn speak(&self) -> String;
      }

      fn main() {
      }
    `,
    solution: code`
      trait Speak {
          fn speak(&self) -> String;
      }

      struct Dog;
      struct Cat;

      impl Speak for Dog {
          fn speak(&self) -> String {
              String::from("Woof")
          }
      }

      impl Speak for Cat {
          fn speak(&self) -> String {
              String::from("Meow")
          }
      }

      fn chorus(animal: &impl Speak, times: usize) -> String {
          vec![animal.speak(); times].join(" ")
      }

      fn main() {
          println!("{}", chorus(&Dog, 2));
          println!("{}", chorus(&Cat, 3));
      }
    `,
    expected: code`
      Woof Woof
      Meow Meow Meow
    `,
    hint: `Make <code>struct Dog;</code> and <code>struct Cat;</code>, and <code>impl Speak for</code> each. <code>chorus</code>
      takes <code>&amp;impl Speak</code>. <code>vec![x; n]</code> is Python's <code>[x] * n</code>, and a <code>Vec</code> of
      strings has <code>.join(" ")</code>.`,
  },
  cheat: [
    ['class Dog:  # duck typing', 'impl Describe for Dog { fn describe(&self) -> String { ... } }'],
    ['class Describe(Protocol): ...', 'trait Describe { fn describe(&self) -> String; }'],
    ['def show(item: Describe):', 'fn show(item: &impl Describe)'],
    ['def show[T: Describe](item: T):', 'fn show<T: Describe>(item: &T)'],
    ['class Base:\n    def describe(self):\n        return "base"', 'trait Describe {\n    fn describe(&self) -> String {\n        String::from("base")\n    }\n}'],
    ['def __str__(self): ...', 'impl std::fmt::Display for X { fn fmt(...) -> std::fmt::Result }'],
    ['def __repr__(self): ...', '#[derive(Debug)]  // print with {:?}'],
    ['def __eq__(self, other): ...', '#[derive(PartialEq)]  // a == b'],
    ['copy.copy(x)', 'x.clone()  // needs #[derive(Clone)]'],
    ['hasattr(x, "describe")', 'T: Describe  // checked at compile time'],
    ['items = [Circle(), Square()]', 'let items: Vec<Box<dyn Shape>> = ...;'],
    ['def __add__(self, other): ...', 'impl std::ops::Add for X { type Output = X; ... }'],
  ],
});
