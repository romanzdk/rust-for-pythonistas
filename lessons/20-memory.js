LESSONS.push({
  id: 'memory',
  part: 'Going deeper',
  title: 'Memory without a garbage collector',
  summary: 'How Python and Rust free memory: reference counting and gc vs owners and Drop, plus stack, heap and Box.',
  intro: `
    <p>Every program has to give memory back when it no longer needs it. Python and Rust both do this for you, in very
    different ways.</p>
    <ul>
      <li><b>CPython</b> keeps a <b>reference count</b> on every object. When the count drops to 0, the object is freed
        right away. Objects that point at each other in a circle never reach 0, so a separate <b>cycle collector</b> (the
        <code>gc</code> module) looks for them from time to time.</li>
      <li><b>Rust</b> has neither. Every value has one owner (lesson 13), and the compiler puts the "free it" step where
        the owner ends: at its closing <code>}</code>. Nothing runs in the background, and there is nothing to tune.</li>
    </ul>
    <p>You can watch it happen. Python calls <code>__del__</code> when it frees an object; Rust calls <code>drop</code> from
    the <code>Drop</code> trait. The examples use both to print a line when something is freed.</p>`,
  examples: [
    {
      title: 'Watching memory being freed',
      text: `<p>Both print the same thing, for different reasons. CPython frees an object the moment its reference count
      reaches 0. Rust frees a value at the <code>}</code> where its owner ends, decided when the program is compiled.
      The timing of <code>__del__</code> is a CPython detail (PyPy, for example, runs it later); the timing of
      <code>drop</code> is a Rust guarantee.</p>`,
      py: code`
        class Buffer:
            def __init__(self, name):
                self.name = name
                print(f"open {name}")

            def __del__(self):
                print(f"free {self.name}")


        def work():
            temp = Buffer("temp")
            print("working")


        big = Buffer("big")
        work()
        print("back from work")
        del big
        print("end")
      `,
      rs: code`
        struct Buffer {
            name: String,
        }

        impl Buffer {
            fn new(name: &str) -> Buffer {
                println!("open {name}");
                Buffer { name: String::from(name) }
            }
        }

        impl Drop for Buffer {
            fn drop(&mut self) {
                println!("free {}", self.name);
            }
        }

        fn work() {
            let _temp = Buffer::new("temp");
            println!("working");
        }

        fn main() {
            let big = Buffer::new("big");
            work();
            println!("back from work");
            drop(big);
            println!("end");
        }
      `,
      out: code`
        open big
        open temp
        working
        free temp
        back from work
        free big
        end
      `,
      links: [
        [12, 6, `<code>impl Drop</code> is Rust's <code>__del__</code>: code that runs right before the value is freed. Most types
          don't need one, because the memory is freed either way. It is here only so you can see when.`],
        [19, 11, `The leading <code>_</code> says "I won't use this name" and avoids a warning. The value still lives until the
          <code>}</code>.`],
        [21, 12, `Python frees <code>temp</code> when <code>work</code> returns, because its reference count drops to 0. Rust frees
          it at this <code>}</code>, because its owner ends here. Same moment, different reason.`],
        [27, 18, `<code>drop(big)</code> frees the value now, like <code>del big</code>. After it, <code>big</code> can't be used:
          the compiler checks.`],
      ],
    },
    {
      title: "Moving a Vec doesn't copy its items",
      text: `<p>A <code>Vec</code> has two parts: a small header on the <b>stack</b> (a pointer, the length and the capacity:
      24 bytes on a 64-bit machine) and the items on the <b>heap</b>. <code>let b = a;</code> copies only the small header
      and makes <code>b</code> the owner. The items stay where they are. <code>.clone()</code> asks for new heap memory and
      copies every item. <code>as_ptr()</code> gives the address of the items, so we can compare.</p>`,
      py: code`
        a = [1, 2, 3]
        b = a
        print("assign:", "same data" if b is a else "new data")
        c = b.copy()
        print("copy:", "same data" if c is b else "new data")
      `,
      rs: code`
        fn main() {
            let a = vec![1, 2, 3];
            let items = a.as_ptr();
            let b = a;
            println!("assign: {}", if b.as_ptr() == items { "same data" } else { "new data" });
            let c = b.clone();
            println!("copy: {}", if c.as_ptr() == b.as_ptr() { "same data" } else { "new data" });
        }
      `,
      out: code`
        assign: same data
        copy: new data
      `,
      links: [
        [3, null, `<code>as_ptr()</code> is the address of the items on the heap. You rarely need it; here it shows whether
          the items moved.`],
        [4, 2, `Python: a second name for the same list. Rust: the 24-byte header is copied to <code>b</code>, and
          <code>a</code> may not be used any more. The items stay put, so a move is cheap even for a huge <code>Vec</code>.`],
        [6, 4, `<code>.clone()</code> gets new heap memory and copies the items, like <code>.copy()</code>.`],
      ],
    },
    {
      title: 'Box: a value on the heap, with one owner',
      text: `<p>Rust must know the size of every value when it compiles. A node that contains the next node would contain
      itself forever, so it has no size. Python never has this problem, because every attribute is just a reference to an
      object somewhere on the heap. In Rust you ask for that with <code>Box</code>: a <code>Box&lt;Node&gt;</code> is a
      pointer (8 bytes) to a <code>Node</code> on the heap, and the box owns it. When the box is dropped, the node is freed
      too.</p>`,
      py: code`
        from dataclasses import dataclass


        @dataclass
        class Node:
            value: int
            next: "Node | None"


        items = Node(1, Node(2, Node(3, None)))
        total = 0
        node = items
        while node is not None:
            total += node.value
            node = node.next
        print(total)
      `,
      rs: code`
        struct Node {
            value: i32,
            next: Option<Node>,
        }

        fn main() {
            let items = Node {
                value: 1,
                next: Some(Node { value: 2, next: Some(Node { value: 3, next: None }) }),
            };
            let mut total = 0;
            let mut node = Some(&items);
            while let Some(n) = node {
                total += n.value;
                node = n.next.as_ref();
            }
            println!("{total}");
        }
      `,
      out: '6',
      rsError: code`
        error[E0072]: recursive type \`Node\` has infinite size
         --> src/main.rs:1:1
          |
        1 | struct Node {
          | ^^^^^^^^^^^
        2 |     value: i32,
        3 |     next: Option<Node>,
          |                  ---- recursive without indirection
          |
        help: insert some indirection (e.g., a \`Box\`, \`Rc\`, or \`&\`) to break the cycle
          |
        3 |     next: Option<Box<Node>>,
          |                  ++++    +
      `,
      rsFix: code`
        struct Node {
            value: i32,
            next: Option<Box<Node>>,
        }

        fn main() {
            let items = Node {
                value: 1,
                next: Some(Box::new(Node { value: 2, next: Some(Box::new(Node { value: 3, next: None })) })),
            };
            let mut total = 0;
            let mut node = Some(&items);
            while let Some(n) = node {
                total += n.value;
                node = n.next.as_deref();
            }
            println!("{total}");
        }
      `,
      fixNote: `<code>Box::new(...)</code> puts each node on the heap. Python does that for every object without asking; Rust
        only where you write <code>Box</code>. <code>as_deref()</code> turns an <code>Option&lt;Box&lt;Node&gt;&gt;</code> into an
        <code>Option&lt;&amp;Node&gt;</code>.`,
      links: [
        [3, 7, `<code>Option&lt;Node&gt;</code> would put a whole <code>Node</code> inside a <code>Node</code>, forever. The help
          line suggests <code>Option&lt;Box&lt;Node&gt;&gt;</code>: a pointer to a node on the heap, which is what every Python
          attribute already is.`],
        [12, 12, `A borrowed reference to the first node, like the name <code>node</code> in Python.`],
        [13, 13, `<code>while let</code> is <code>if let</code> (lesson 11) in a loop: keep going while <code>node</code> is
          <code>Some</code>.`],
        [15, 15, `Step to the next node, as a reference. Nothing is copied or freed while we walk the list.`],
      ],
    },
  ],
  quiz: [
    {
      type: 'output',
      q: 'What does this print?',
      code: code`
        struct Loud(i32);

        impl Drop for Loud {
            fn drop(&mut self) {
                println!("drop {}", self.0);
            }
        }

        fn main() {
            let _a = Loud(1);
            let _b = Loud(2);
            println!("end");
        }
      `,
      options: ['end\ndrop 1\ndrop 2', 'end\ndrop 2\ndrop 1', 'drop 1\ndrop 2\nend'],
      answer: 1,
      explain: `Values are dropped at the closing <code>}</code>, in <b>reverse</b> order: the last one created is freed first,
        so nothing is freed while a later value might still use it.`,
    },
    {
      type: 'output',
      q: 'And this one? Look closely at the two <code>let</code> lines.',
      code: code`
        struct Loud(i32);

        impl Drop for Loud {
            fn drop(&mut self) {
                println!("drop {}", self.0);
            }
        }

        fn main() {
            let _ = Loud(1);
            let _x = Loud(2);
            println!("end");
        }
      `,
      options: ['drop 1\nend\ndrop 2', 'end\ndrop 1\ndrop 2', 'end\ndrop 2\ndrop 1'],
      answer: 0,
      explain: `<code>let _ = ...</code> doesn't keep the value in any variable, so it is dropped at once.
        <code>let _x = ...</code> is a real variable that lives until the <code>}</code>. This matters for values like locks.`,
    },
    {
      type: 'compiles',
      q: 'Does this compile?',
      code: code`
        fn main() {
            let names = vec![String::from("ada")];
            drop(names);
            println!("{}", names.len());
        }
      `,
      answer: false,
      explain: `<code>drop(names)</code> moves <code>names</code> into <code>drop</code>, which frees it. Using it afterwards is
        error E0382, "borrow of moved value". In Python, <code>del names</code> and then <code>len(names)</code> is a
        <code>NameError</code> at run time.`,
    },
    {
      type: 'choice',
      q: 'When does Rust free the memory of a <code>Vec</code> that a local variable owns?',
      options: ['When a garbage collector runs', 'When its reference count reaches 0', 'At the closing <code>}</code> of the block that owns it', 'When the program ends'],
      answer: 2,
      explain: `The owner ends at its <code>}</code>, and the compiler puts the free right there. There is no reference count
        unless you ask for one with <code>Rc</code> (next lesson), and there is no garbage collector at all.`,
    },
    {
      type: 'choice',
      q: `Why does Rust need the <code>Box</code> in <code>struct Node { next: Option&lt;Box&lt;Node&gt;&gt; }</code>, when Python
        doesn't?`,
      options: [
        'Box makes the field optional',
        'Without it, a Node would contain a whole Node inside itself, so it would have no fixed size',
        'Box makes the code faster',
        'Box turns on garbage collection for that field',
      ],
      answer: 1,
      explain: `The compiler needs every type's size. A <code>Box</code> is always one pointer, whatever it points at. Python
        attributes are always references, so Python never has to ask.`,
    },
  ],
  exercise: {
    task: `<p><code>Lock</code> prints <code>unlock db</code> when it is dropped. Right now that happens at the end of
      <code>main</code>, after <code>done</code>. Make the lock go away right after <code>writing</code>, so the output
      matches. One new line is enough.</p>`,
    starter: code`
      struct Lock {
          name: String,
      }

      impl Drop for Lock {
          fn drop(&mut self) {
              println!("unlock {}", self.name);
          }
      }

      fn main() {
          let lock = Lock { name: String::from("db") };
          println!("writing");
          println!("done");
      }
    `,
    solution: code`
      struct Lock {
          name: String,
      }

      impl Drop for Lock {
          fn drop(&mut self) {
              println!("unlock {}", self.name);
          }
      }

      fn main() {
          let lock = Lock { name: String::from("db") };
          println!("writing");
          drop(lock);
          println!("done");
      }
    `,
    expected: code`
      writing
      unlock db
      done
    `,
    hint: `<code>drop(lock);</code> frees a value early, like <code>del lock</code>. Putting the lock and the writing inside their
      own <code>{ }</code> block works too.`,
  },
  breaks: [
    `<code>__del__</code> is not a promise. CPython runs it as soon as the reference count reaches 0, but objects in a cycle
      wait for <code>gc</code>, and other Pythons such as PyPy run it whenever their collector gets there. Rust's
      <code>drop</code> runs at the <code>}</code>, every time.`,
    `<code>let _ = value;</code> drops the value at once; <code>let _name = value;</code> keeps it until the <code>}</code>. In
      Python, <code>_</code> is an ordinary name.`,
    `No per-object overhead. A Rust <code>i32</code> is 4 bytes, and a struct is its fields side by side. Every Python object
      carries a reference count and a type pointer, so even the integer <code>1</code> takes 28 bytes in 64-bit CPython.`,
    `Leaks are allowed. Rust promises you never use memory after it is freed, not that everything gets freed:
      <code>Rc</code> cycles (next lesson) and <code>std::mem::forget</code> leak without any error.`,
    `You can't call <code>x.drop()</code> yourself; that is a compile error. Call <code>drop(x)</code>, which takes ownership,
      so <code>x</code> can't be used afterwards.`,
  ],
  translate: {
    py: code`
      class Connection:
          def __init__(self, name):
              self.name = name
              print(f"connect {name}")

          def __del__(self):
              print(f"close {self.name}")


      def query(name):
          conn = Connection(name)
          print(f"query {conn.name}")


      query("users")
      query("orders")
      print("all done")
    `,
    starter: code`
      struct Connection {
          name: String,
      }

      fn main() {
      }
    `,
    solution: code`
      struct Connection {
          name: String,
      }

      impl Connection {
          fn new(name: &str) -> Connection {
              println!("connect {name}");
              Connection { name: String::from(name) }
          }
      }

      impl Drop for Connection {
          fn drop(&mut self) {
              println!("close {}", self.name);
          }
      }

      fn query(name: &str) {
          let conn = Connection::new(name);
          println!("query {}", conn.name);
      }

      fn main() {
          query("users");
          query("orders");
          println!("all done");
      }
    `,
    expected: code`
      connect users
      query users
      close users
      connect orders
      query orders
      close orders
      all done
    `,
    hint: `<code>__init__</code> becomes a <code>new</code> function, and <code>__del__</code> becomes <code>impl Drop for
      Connection</code> with <code>fn drop(&amp;mut self)</code>. You don't call <code>drop</code> yourself: <code>conn</code>
      is dropped at the end of <code>query</code>.`,
  },
  cheat: [
    ['del x', 'drop(x);'],
    ['def __del__(self): ...', 'impl Drop for X { fn drop(&mut self) { ... } }'],
    ['# freed when the refcount reaches 0', "// freed at the owner's closing }"],
    ['gc.collect()', '// no garbage collector'],
    ['b = a  # same list, two names', 'let b = a;  // moves the header, the items stay'],
    ['b = a.copy()', 'let b = a.clone();  // new heap memory'],
    ['class Node:\n    next: "Node | None"', 'struct Node { next: Option<Box<Node>> }'],
    ['sys.getsizeof(x)', 'std::mem::size_of::<T>()'],
    ['_ = make()  # a normal name', 'let _ = make();  // dropped at once'],
  ],
});
