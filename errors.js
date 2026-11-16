// The error index (#/errors). Each `rs` must fail with `message`; each `fix` must run and print `out` (checked).
window.ERRORS = [
  {
    code: 'E0308',
    message: 'mismatched types',
    lesson: 'compiler-errors',
    python: 'A <code>TypeError</code> at run time, if that line ever runs.',
    why: 'A value has a different type than the code says. Rust never converts types for you.',
    rs: code`
      fn main() {
          let age: i32 = "36";
          println!("{age}");
      }
    `,
    fix: code`
      fn main() {
          let age: i32 = "36".parse().unwrap();
          println!("{age}");
      }
    `,
    out: '36',
  },
  {
    code: 'E0425',
    message: 'cannot find value `totl` in this scope',
    lesson: 'compiler-errors',
    python: '<code>NameError: name \'totl\' is not defined</code>, at run time.',
    why: 'A name that doesn\'t exist here: often a typo, or a variable from another block that already ended.',
    rs: code`
      fn main() {
          let total = 10;
          println!("{}", totl);
      }
    `,
    fix: code`
      fn main() {
          let total = 10;
          println!("{}", total);
      }
    `,
    out: '10',
  },
  {
    code: 'E0599',
    message: 'no method named `upper` found for struct `String` in the current scope',
    lesson: 'compiler-errors',
    python: '<code>AttributeError: \'str\' object has no attribute ...</code>',
    why: 'The type has no method with that name. Python names often differ in Rust: <code>upper</code> is <code>to_uppercase</code>. Sometimes the method exists but needs a <code>use</code> for its trait.',
    rs: code`
      fn main() {
          let name = String::from("ada");
          println!("{}", name.upper());
      }
    `,
    fix: code`
      fn main() {
          let name = String::from("ada");
          println!("{}", name.to_uppercase());
      }
    `,
    out: 'ADA',
  },
  {
    code: 'E0384',
    message: 'cannot assign twice to immutable variable `count`',
    lesson: 'basics',
    python: 'No equivalent: Python lets you reassign any name.',
    why: 'Variables can\'t change unless they are declared with <code>let mut</code>.',
    rs: code`
      fn main() {
          let count = 0;
          count += 1;
          println!("{count}");
      }
    `,
    fix: code`
      fn main() {
          let mut count = 0;
          count += 1;
          println!("{count}");
      }
    `,
    out: '1',
  },
  {
    code: 'E0596',
    message: 'cannot borrow `names` as mutable, as it is not declared as mutable',
    lesson: 'ownership',
    python: 'No equivalent: any Python list can be changed.',
    why: 'A method that changes the value (like <code>push</code>) needs the variable to be <code>let mut</code>, or a <code>&amp;mut</code> borrow.',
    rs: code`
      fn main() {
          let names = Vec::new();
          names.push("ada");
          println!("{:?}", names);
      }
    `,
    fix: code`
      fn main() {
          let mut names = Vec::new();
          names.push("ada");
          println!("{:?}", names);
      }
    `,
    out: '["ada"]',
  },
  {
    code: 'E0382',
    message: 'borrow of moved value: `a`',
    lesson: 'ownership',
    python: 'No error: <code>b = a</code> gives the same list a second name.',
    why: 'The value moved to a new owner, and the old name can\'t be used any more. Borrow with <code>&amp;</code> or copy with <code>.clone()</code>. Look at the line where it moved, not only where it is used.',
    rs: code`
      fn main() {
          let a = vec![1, 2, 3];
          let b = a;
          println!("{:?} {:?}", a, b);
      }
    `,
    fix: code`
      fn main() {
          let a = vec![1, 2, 3];
          let b = a.clone();
          println!("{:?} {:?}", a, b);
      }
    `,
    out: '[1, 2, 3] [1, 2, 3]',
  },
  {
    code: 'E0502',
    message: 'cannot borrow `nums` as mutable because it is also borrowed as immutable',
    lesson: 'ownership',
    python: 'Changing a list while looping over it gives surprising results; for a dict it is <code>RuntimeError: dictionary changed size during iteration</code>.',
    why: 'Something is reading the value (here the loop) while something else wants to change it. Many readers or one writer, never both.',
    rs: code`
      fn main() {
          let mut nums = vec![1, 2, 3];
          for n in &nums {
              if *n == 2 {
                  nums.push(4);
              }
          }
          println!("{:?}", nums);
      }
    `,
    fix: code`
      fn main() {
          let mut nums = vec![1, 2, 3];
          for n in nums.clone() {
              if n == 2 {
                  nums.push(4);
              }
          }
          println!("{:?}", nums);
      }
    `,
    out: '[1, 2, 3, 4]',
  },
  {
    code: 'E0499',
    message: 'cannot borrow `s` as mutable more than once at a time',
    lesson: 'ownership',
    python: 'No equivalent: any number of names can change the same object.',
    why: 'Two <code>&amp;mut</code> borrows of the same value are alive at once. Finish using the first before you make the second.',
    rs: code`
      fn main() {
          let mut s = String::from("a");
          let r1 = &mut s;
          let r2 = &mut s;
          r1.push('b');
          r2.push('c');
          println!("{s}");
      }
    `,
    fix: code`
      fn main() {
          let mut s = String::from("a");
          let r1 = &mut s;
          r1.push('b');
          let r2 = &mut s;
          r2.push('c');
          println!("{s}");
      }
    `,
    out: 'abc',
  },
  {
    code: 'E0507',
    message: 'cannot move out of index of `Vec<String>`',
    lesson: 'ownership',
    python: 'No error: <code>first = names[0]</code> is one more reference to the same string.',
    why: 'Taking a <code>String</code> out of a <code>Vec</code> by index would leave a hole. Borrow it with <code>&amp;names[0]</code>, or copy it with <code>.clone()</code>.',
    rs: code`
      fn main() {
          let names = vec![String::from("ada"), String::from("bob")];
          let first = names[0];
          println!("{first}");
      }
    `,
    fix: code`
      fn main() {
          let names = vec![String::from("ada"), String::from("bob")];
          let first = &names[0];
          println!("{first}");
      }
    `,
    out: 'ada',
  },
  {
    code: 'E0004',
    message: 'non-exhaustive patterns: `Light::Yellow` not covered',
    lesson: 'enums',
    python: 'No error: a <code>match</code> with no matching <code>case</code> silently does nothing.',
    why: 'A <code>match</code> must handle every variant. Add the missing arm, or a <code>_ =&gt;</code> arm for "everything else".',
    rs: code`
      enum Light {
          Red,
          Yellow,
          Green,
      }

      fn main() {
          let light = Light::Green;
          let action = match light {
              Light::Red => "stop",
              Light::Green => "go",
          };
          println!("{action}");
      }
    `,
    fix: code`
      enum Light {
          Red,
          Yellow,
          Green,
      }

      fn main() {
          let light = Light::Green;
          let action = match light {
              Light::Red => "stop",
              Light::Yellow => "wait",
              Light::Green => "go",
          };
          println!("{action}");
      }
    `,
    out: 'go',
  },
  {
    code: 'E0277',
    message: '`Point` doesn\'t implement `std::fmt::Display`',
    lesson: 'traits',
    python: 'No error: <code>print(p)</code> falls back to something like <code>&lt;Point object at 0x...&gt;</code>.',
    why: 'A trait the code needs is missing. Here <code>{}</code> needs <code>Display</code>. For debugging, derive <code>Debug</code> and print with <code>{:?}</code>. The same error code covers any missing trait, such as <code>Send</code> for threads.',
    rs: code`
      struct Point {
          x: i32,
          y: i32,
      }

      fn main() {
          let p = Point { x: 1, y: 2 };
          println!("{}", p);
      }
    `,
    fix: code`
      #[derive(Debug)]
      struct Point {
          x: i32,
          y: i32,
      }

      fn main() {
          let p = Point { x: 1, y: 2 };
          println!("{:?}", p);
      }
    `,
    out: 'Point { x: 1, y: 2 }',
  },
  {
    code: 'E0369',
    message: 'binary operation `==` cannot be applied to type `Point`',
    lesson: 'structs',
    python: 'No error, but a surprise: without <code>__eq__</code>, <code>==</code> compares identity, so two equal-looking objects are not equal.',
    why: 'The type doesn\'t support that operator. Add <code>#[derive(PartialEq)]</code> for <code>==</code>, or implement the operator trait.',
    rs: code`
      struct Point {
          x: i32,
          y: i32,
      }

      fn main() {
          let a = Point { x: 1, y: 2 };
          let b = Point { x: 1, y: 2 };
          println!("{}", a == b);
      }
    `,
    fix: code`
      #[derive(PartialEq)]
      struct Point {
          x: i32,
          y: i32,
      }

      fn main() {
          let a = Point { x: 1, y: 2 };
          let b = Point { x: 1, y: 2 };
          println!("{}", a == b);
      }
    `,
    out: 'true',
  },
  {
    code: 'E0609',
    message: 'no field `email` on type `User`',
    lesson: 'structs',
    python: '<code>AttributeError: \'User\' object has no attribute \'email\'</code>, at run time.',
    why: 'The struct has no field with that name. Every field is declared up front in the <code>struct</code>.',
    rs: code`
      struct User {
          name: String,
      }

      fn main() {
          let user = User { name: String::from("ada") };
          println!("{}", user.email);
      }
    `,
    fix: code`
      struct User {
          name: String,
      }

      fn main() {
          let user = User { name: String::from("ada") };
          println!("{}", user.name);
      }
    `,
    out: 'ada',
  },
  {
    code: 'E0061',
    message: 'this function takes 2 arguments but 1 argument was supplied',
    lesson: 'functions',
    python: '<code>TypeError: add() missing 1 required positional argument: \'b\'</code>',
    why: 'A call passes the wrong number of arguments. Rust has no default values, so every parameter must be passed.',
    rs: code`
      fn add(a: i32, b: i32) -> i32 {
          a + b
      }

      fn main() {
          println!("{}", add(1));
      }
    `,
    fix: code`
      fn add(a: i32, b: i32) -> i32 {
          a + b
      }

      fn main() {
          println!("{}", add(1, 2));
      }
    `,
    out: '3',
  },
  {
    code: 'E0433',
    message: 'cannot find type `HashMap` in this scope',
    lesson: 'collections',
    python: '<code>NameError: name \'HashMap\' is not defined</code>: a missing import.',
    why: 'A type or module isn\'t in scope. Usually a <code>use</code> line is missing; the <code>help:</code> line often names it.',
    rs: code`
      fn main() {
          let mut ages = HashMap::new();
          ages.insert("ada", 36);
          println!("{}", ages["ada"]);
      }
    `,
    fix: code`
      use std::collections::HashMap;

      fn main() {
          let mut ages = HashMap::new();
          ages.insert("ada", 36);
          println!("{}", ages["ada"]);
      }
    `,
    out: '36',
  },
  {
    code: 'E0603',
    message: 'function `greet` is private',
    lesson: 'first-app',
    python: 'No error: a leading <code>_</code> is only a convention.',
    why: 'The item is private to its module. Add <code>pub</code> where it is defined.',
    rs: code`
      mod greeting {
          fn greet(name: &str) -> String {
              format!("Hello, {name}!")
          }
      }

      fn main() {
          println!("{}", greeting::greet("Ada"));
      }
    `,
    fix: code`
      mod greeting {
          pub fn greet(name: &str) -> String {
              format!("Hello, {name}!")
          }
      }

      fn main() {
          println!("{}", greeting::greet("Ada"));
      }
    `,
    out: 'Hello, Ada!',
  },
  {
    code: 'E0283',
    message: 'type annotations needed',
    lesson: 'iterators',
    python: 'No equivalent: a list comprehension\'s brackets say what to build.',
    why: 'The compiler can\'t work out a type, most often what <code>collect()</code> or <code>parse()</code> should produce. Write it: <code>let nums: Vec&lt;i32&gt; = ...</code>. Error E0282 says the same thing in other places.',
    rs: code`
      fn main() {
          let nums = "1 2 3".split(' ').map(|s| s.parse::<i32>().unwrap()).collect();
          println!("{:?}", nums);
      }
    `,
    fix: code`
      fn main() {
          let nums: Vec<i32> = "1 2 3".split(' ').map(|s| s.parse::<i32>().unwrap()).collect();
          println!("{:?}", nums);
      }
    `,
    out: '[1, 2, 3]',
  },
  {
    code: 'E0106',
    message: 'missing lifetime specifier',
    lesson: 'real-code',
    python: 'No equivalent.',
    why: 'A function returns a reference, and the compiler can\'t tell which input it points into. Name it with a lifetime like <code>\'a</code>; the <code>help:</code> line shows where.',
    rs: code`
      fn longest(a: &str, b: &str) -> &str {
          if a.len() >= b.len() { a } else { b }
      }

      fn main() {
          println!("{}", longest("ab", "c"));
      }
    `,
    fix: code`
      fn longest<'a>(a: &'a str, b: &'a str) -> &'a str {
          if a.len() >= b.len() { a } else { b }
      }

      fn main() {
          println!("{}", longest("ab", "c"));
      }
    `,
    out: 'ab',
  },
  {
    code: 'E0597',
    message: '`name` does not live long enough',
    lesson: 'real-code',
    python: 'No equivalent: Python keeps an object alive as long as anything refers to it.',
    why: 'A reference is still used after the value it points to was freed at its <code>}</code>. Keep the value alive longer, or store an owned copy instead of a reference.',
    rs: code`
      fn main() {
          let r;
          {
              let name = String::from("ada");
              r = &name;
          }
          println!("{r}");
      }
    `,
    fix: code`
      fn main() {
          let name = String::from("ada");
          let r = &name;
          println!("{r}");
      }
    `,
    out: 'ada',
  },
  {
    code: 'E0373',
    message: 'closure may outlive the current function, but it borrows `name`, which is owned by the current function',
    lesson: 'threads',
    python: 'No equivalent: Python threads can use any variable.',
    why: 'A thread (or a stored closure) might run after the function ends, so it can\'t borrow local variables. Add <code>move</code> so it owns them.',
    rs: code`
      use std::thread;

      fn main() {
          let name = String::from("ada");
          let h = thread::spawn(|| println!("{name}"));
          h.join().unwrap();
      }
    `,
    fix: code`
      use std::thread;

      fn main() {
          let name = String::from("ada");
          let h = thread::spawn(move || println!("{name}"));
          h.join().unwrap();
      }
    `,
    out: 'ada',
  },
];
