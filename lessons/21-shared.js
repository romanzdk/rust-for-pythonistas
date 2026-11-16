LESSONS.push({
  id: 'shared',
  title: 'Shared ownership: Rc, RefCell and Weak',
  summary: 'Many owners for one value, changing shared data, and why reference cycles leak in Rust but not in Python.',
  intro: `
    <p>In Python, sharing is the default. Any number of names, lists and objects can point at the same object, and any
    of them can change it. CPython keeps a reference count to know when to free it.</p>
    <p>In Rust, a value has one owner (lesson 13). Usually that is enough. When it isn't, as with a graph, a tree with
    links back to the parent, or a cache that several parts of a program hold on to, Rust gives you Python's model back,
    one piece at a time:</p>
    <ul>
      <li><code>Rc&lt;T&gt;</code> ("reference counted"): many owners of one value, freed when the last owner goes. That is
        what CPython does for every object. <code>Rc</code> only lets you read.</li>
      <li><code>RefCell&lt;T&gt;</code>: lets you change a value through a shared reference, by checking the borrow rules
        while the program runs instead of when it compiles.</li>
      <li><code>Weak&lt;T&gt;</code>: a reference that doesn't keep the value alive, like Python's <code>weakref</code>.</li>
    </ul>
    <p>When reading code, <code>Rc&lt;RefCell&lt;T&gt;&gt;</code> means "a shared object that anyone holding it may change".
    That is a normal Python object.</p>`,
  examples: [
    {
      title: 'Rc: many owners of one value',
      text: `<p>Two teams share one roster. In Python both attributes simply point at the same list. In Rust the roster
      is wrapped in an <code>Rc</code>, and each team holds one of its owners.</p>`,
      py: code`
        class Team:
            def __init__(self, name, roster):
                self.name = name
                self.roster = roster


        roster = ["ada", "bob"]
        red = Team("red", roster)
        blue = Team("blue", roster)
        shared = "yes" if red.roster is blue.roster else "no"
        print(f"{red.name} and {blue.name} share {len(red.roster)} players: {shared}")
      `,
      rs: code`
        use std::rc::Rc;

        struct Team {
            name: String,
            roster: Rc<Vec<String>>,
        }

        fn main() {
            let roster = Rc::new(vec![String::from("ada"), String::from("bob")]);
            let red = Team { name: String::from("red"), roster: Rc::clone(&roster) };
            let blue = Team { name: String::from("blue"), roster: Rc::clone(&roster) };
            let shared = if Rc::ptr_eq(&red.roster, &blue.roster) { "yes" } else { "no" };
            println!("{} and {} share {} players: {shared}", red.name, blue.name, red.roster.len());
        }
      `,
      out: 'red and blue share 2 players: yes',
      links: [
        [5, 4, `<code>Rc&lt;Vec&lt;String&gt;&gt;</code>: a shared, reference-counted <code>Vec</code>. Each <code>Team</code>
          is one of its owners.`],
        [9, 7, `<code>Rc::new</code> puts the <code>Vec</code> on the heap together with a counter, which starts at 1.`],
        [10, 8, `<code>Rc::clone(&amp;roster)</code> does <b>not</b> copy the <code>Vec</code>. It adds 1 to the counter and hands
          out another pointer, like passing <code>roster</code> in Python. Writing <code>Rc::clone(&amp;x)</code> rather than
          <code>x.clone()</code> is a convention that tells readers "cheap: only the count changes".`],
        [12, 10, `<code>Rc::ptr_eq</code> is Python's <code>is</code>: do both point at the same value?`],
        [13, 11, `You read through an <code>Rc</code> as if it were the value: <code>red.roster.len()</code>. When the last
          owner is dropped, the count reaches 0 and the <code>Vec</code> is freed.`],
      ],
    },
    {
      title: 'Changing shared data: Rc<RefCell<T>>',
      text: `<p>Python lets everyone who holds an object change it. <code>Rc</code> alone only gives shared <b>reading</b>,
      because "many readers or one writer" (lesson 13) still applies. <code>RefCell</code> lets you change the value anyway,
      and checks that rule while the program runs: <code>.borrow()</code> to read, <code>.borrow_mut()</code> to change.</p>`,
      py: code`
        class Settings:
            def __init__(self):
                self.theme = "light"


        shared = Settings()
        editor = shared
        viewer = shared

        editor.theme = "dark"
        print(f"viewer sees: {viewer.theme}")
      `,
      rs: code`
        use std::cell::RefCell;
        use std::rc::Rc;

        struct Settings {
            theme: String,
        }

        fn main() {
            let shared = Rc::new(RefCell::new(Settings { theme: String::from("light") }));
            let editor = Rc::clone(&shared);
            let viewer = Rc::clone(&shared);

            editor.borrow_mut().theme = String::from("dark");
            println!("viewer sees: {}", viewer.borrow().theme);
        }
      `,
      out: 'viewer sees: dark',
      links: [
        [9, 6, `Read it from the inside out: <code>Settings</code>, in a <code>RefCell</code> so it can be changed, in an
          <code>Rc</code> so it can be shared. Together that is a normal Python object.`],
        [10, 7, `Another owner of the same object. The count goes up; nothing is copied.`],
        [13, 10, `<code>borrow_mut()</code> asks for permission to change. If someone else were borrowing it at this moment,
          the program would panic rather than quietly change data under them.`],
        [14, 11, `<code>borrow()</code> asks to read. The change made through <code>editor</code> is visible here, as in
          Python.`],
      ],
    },
    {
      title: "Cycles: Python's gc cleans up, Rc leaks",
      text: `<p>Two objects that point at each other never reach a reference count of 0. CPython's cycle collector finds
      them and frees them; <code>gc.collect()</code> runs it right now. Rust has no cycle collector. Two <code>Rc</code>s that
      point at each other keep each other alive until the program ends: a memory leak. It compiles fine, because a leak
      is wasteful but not unsafe. That is why the two outputs differ: Rust never prints <code>free</code>.</p>`,
      py: code`
        import gc


        class Node:
            def __init__(self, name):
                self.name = name
                self.other = None

            def __del__(self):
                print(f"free {self.name}")


        a = Node("a")
        b = Node("b")
        a.other = b
        b.other = a
        del a, b
        print("names deleted")
        gc.collect()
        print("after gc.collect()")
      `,
      rs: code`
        use std::cell::RefCell;
        use std::rc::Rc;

        struct Node {
            name: String,
            other: RefCell<Option<Rc<Node>>>,
        }

        impl Drop for Node {
            fn drop(&mut self) {
                println!("free {}", self.name);
            }
        }

        fn main() {
            let a = Rc::new(Node { name: String::from("a"), other: RefCell::new(None) });
            let b = Rc::new(Node { name: String::from("b"), other: RefCell::new(None) });
            *a.other.borrow_mut() = Some(Rc::clone(&b));
            *b.other.borrow_mut() = Some(Rc::clone(&a));
            println!("a has {} owners", Rc::strong_count(&a));
            drop(a);
            drop(b);
            println!("names dropped");
        }
      `,
      pyOut: code`
        names deleted
        free a
        free b
        after gc.collect()
      `,
      out: code`
        a has 2 owners
        names dropped
      `,
      links: [
        [6, 7, `Each node may point at another node. It is in a <code>RefCell</code> so we can set it after both nodes
          exist.`],
        [18, 15, `a → b`],
        [19, 16, `b → a. Now each node owns the other.`],
        [20, null, `Two owners of <code>a</code>: the variable <code>a</code>, and node <code>b</code>.`],
        [21, 17, `Dropping our variables only takes each count from 2 to 1. Neither reaches 0, so <code>drop</code> never
          runs, not even when the program ends. Python frees both when <code>gc.collect()</code> finds the cycle.`],
      ],
    },
    {
      title: "Weak: a link back that doesn't keep anything alive",
      text: `<p>The usual fix is to make one direction <b>weak</b>. A parent owns its children with <code>Rc</code>; a child
      points back at its parent with <code>Weak</code>, which doesn't count as an owner. Python has the same tool in
      <code>weakref</code>. To use a <code>Weak</code>, call <code>.upgrade()</code>: it gives <code>Some</code> while the value
      is alive and <code>None</code> once it has been freed, just like calling a Python weak reference.</p>`,
      py: code`
        import weakref


        class Parent:
            def __init__(self, name):
                self.name = name
                self.children = []

            def __del__(self):
                print(f"free {self.name}")


        class Child:
            def __init__(self, name, parent):
                self.name = name
                self.parent = weakref.ref(parent)

            def __del__(self):
                print(f"free {self.name}")


        mom = Parent("mom")
        kid = Child("kid", mom)
        mom.children.append(kid)
        print(f"{kid.name}'s parent is {kid.parent().name}")
        del kid
        del mom
        print("end")
      `,
      rs: code`
        use std::cell::RefCell;
        use std::rc::{Rc, Weak};

        struct Parent {
            name: String,
            children: RefCell<Vec<Rc<Child>>>,
        }

        struct Child {
            name: String,
            parent: Weak<Parent>,
        }

        impl Drop for Parent {
            fn drop(&mut self) {
                println!("free {}", self.name);
            }
        }

        impl Drop for Child {
            fn drop(&mut self) {
                println!("free {}", self.name);
            }
        }

        fn main() {
            let mom = Rc::new(Parent { name: String::from("mom"), children: RefCell::new(Vec::new()) });
            let kid = Rc::new(Child { name: String::from("kid"), parent: Rc::downgrade(&mom) });
            mom.children.borrow_mut().push(Rc::clone(&kid));
            println!("{}'s parent is {}", kid.name, kid.parent.upgrade().unwrap().name);
            drop(kid);
            drop(mom);
            println!("end");
        }
      `,
      out: code`
        kid's parent is mom
        free mom
        free kid
        end
      `,
      links: [
        [6, 7, `The parent <b>owns</b> its children: <code>Rc</code>.`],
        [11, 16, `The child only <b>points back</b>: <code>Weak</code>, like <code>weakref.ref</code>. It doesn't count as an
          owner, so there is no circle of owners.`],
        [28, 23, `<code>Rc::downgrade(&amp;mom)</code> makes a <code>Weak</code> from an <code>Rc</code>.`],
        [30, 25, `<code>upgrade()</code> gives <code>Some(parent)</code> while the parent is alive and <code>None</code>
          after. Python's <code>kid.parent()</code> gives the object or <code>None</code> in the same way.`],
        [31, 26, `The kid has another owner (mom's list of children), so nothing is freed yet.`],
        [32, 27, `Mom's only owner is gone, so mom is freed. Her list of children goes with her, and it held the kid's last
          owner, so the kid is freed too.`],
      ],
    },
  ],
  quiz: [
    {
      type: 'output',
      q: 'What does this print?',
      code: code`
        use std::rc::Rc;

        fn main() {
            let a = Rc::new(5);
            let b = Rc::clone(&a);
            {
                let c = Rc::clone(&a);
                println!("{}", Rc::strong_count(&c));
            }
            println!("{}", Rc::strong_count(&b));
        }
      `,
      options: ['3\n2', '2\n2', '3\n3', '1\n1'],
      answer: 0,
      explain: `<code>a</code>, <code>b</code> and <code>c</code> are three owners of the same <code>5</code>, so the count
        is 3 inside the block. At the block's <code>}</code>, <code>c</code> is dropped and the count goes back to 2.`,
    },
    {
      type: 'compiles',
      q: 'Does this compile?',
      code: code`
        use std::rc::Rc;

        fn main() {
            let names = Rc::new(vec![String::from("ada")]);
            names.push(String::from("bob"));
            println!("{}", names.len());
        }
      `,
      answer: false,
      explain: `<code>Rc</code> only gives shared, read-only access. To change what is inside, it needs a
        <code>RefCell</code>: <code>Rc::new(RefCell::new(vec![...]))</code> and then <code>names.borrow_mut().push(...)</code>.`,
    },
    {
      type: 'output',
      q: 'What does this print?',
      code: code`
        use std::cell::RefCell;
        use std::rc::Rc;

        fn main() {
            let names = Rc::new(RefCell::new(vec![String::from("ada")]));
            let other = Rc::clone(&names);
            other.borrow_mut().push(String::from("bob"));
            println!("{}", names.borrow().len());
        }
      `,
      options: ['1', '2', '0'],
      answer: 1,
      explain: `<code>names</code> and <code>other</code> are two owners of one <code>Vec</code>. A change through one is
        seen through the other, exactly like two Python names for one list.`,
    },
    {
      type: 'choice',
      q: `What happens with <code>let cell = RefCell::new(5);</code>, then <code>let a = cell.borrow_mut();</code>, then
        <code>let b = cell.borrow_mut();</code> while <code>a</code> is still alive?`,
      options: [
        'It does not compile: two mutable borrows',
        'It compiles, then panics when it runs, because the value is already borrowed',
        'It works: RefCell allows any number of changes at once',
        '<code>b</code> waits until <code>a</code> is dropped',
      ],
      answer: 1,
      explain: `<code>RefCell</code> moves the borrow check from compile time to run time. The compiler can't see the problem,
        so the second <code>borrow_mut()</code> panics. That is why code keeps each <code>borrow_mut()</code> short, often a
        single line.`,
    },
    {
      type: 'choice',
      q: 'Which Rust type is closest to a normal Python object that many parts of a program hold and change?',
      options: ['<code>Box&lt;T&gt;</code>', '<code>Rc&lt;T&gt;</code>', '<code>Rc&lt;RefCell&lt;T&gt;&gt;</code>', '<code>&amp;T</code>'],
      answer: 2,
      explain: `<code>Rc</code> gives many owners, and <code>RefCell</code> lets them change the value. A <code>Box</code> has
        one owner, and <code>&amp;T</code> only borrows for reading.`,
    },
  ],
  exercise: {
    task: `<p><code>log</code> and <code>writer</code> are two owners of the same <code>Vec</code>. The program should add
      <code>"saved"</code> through <code>writer</code> and print it through <code>log</code>, but it doesn't compile. Press
      Run to read the error, then fix the line it points at.</p>`,
    starter: code`
      use std::cell::RefCell;
      use std::rc::Rc;

      fn main() {
          let log = Rc::new(RefCell::new(Vec::new()));
          let writer = Rc::clone(&log);
          writer.borrow().push("saved");
          println!("{:?}", log.borrow());
      }
    `,
    solution: code`
      use std::cell::RefCell;
      use std::rc::Rc;

      fn main() {
          let log = Rc::new(RefCell::new(Vec::new()));
          let writer = Rc::clone(&log);
          writer.borrow_mut().push("saved");
          println!("{:?}", log.borrow());
      }
    `,
    expected: '["saved"]',
    hint: '<code>.borrow()</code> only lets you read. To change the <code>Vec</code>, ask with <code>.borrow_mut()</code>.',
  },
  breaks: [
    `Every Python object is shared and reference counted, and you never ask for it. In Rust it is opt-in, per value, with
      <code>Rc</code>, and most values keep exactly one owner.`,
    `<code>Rc</code> is read-only. Python lets anyone holding an object change it. In Rust, changing shared data needs
      <code>Rc&lt;RefCell&lt;T&gt;&gt;</code>.`,
    `<code>RefCell</code> moves the borrow check to run time. Two <code>borrow_mut()</code> at the same time compile fine and
      then panic. Python never stops you, so two parts of a program can quietly change the same object.`,
    `Cycles leak. Python's <code>gc</code> finds objects that point at each other and frees them. <code>Rc</code> has no cycle
      collector, so use <code>Weak</code> for links back, such as child → parent, the way you'd use <code>weakref</code>.`,
    `<code>Rc</code> is for one thread only, and the compiler enforces it. Across threads you use <code>Arc</code> (an atomic
      reference count), with <code>Mutex</code> instead of <code>RefCell</code>.`,
  ],
  translate: {
    py: code`
      class Counter:
          def __init__(self):
              self.count = 0


      shared = Counter()
      buttons = [shared, shared, shared]
      for button in buttons:
          button.count += 1
      print(f"count: {shared.count}")
    `,
    starter: code`
      use std::cell::RefCell;
      use std::rc::Rc;

      struct Counter {
          count: i32,
      }

      fn main() {
      }
    `,
    solution: code`
      use std::cell::RefCell;
      use std::rc::Rc;

      struct Counter {
          count: i32,
      }

      fn main() {
          let shared = Rc::new(RefCell::new(Counter { count: 0 }));
          let buttons = vec![Rc::clone(&shared), Rc::clone(&shared), Rc::clone(&shared)];
          for button in &buttons {
              button.borrow_mut().count += 1;
          }
          println!("count: {}", shared.borrow().count);
      }
    `,
    expected: 'count: 3',
    hint: `One shared object that can change is an <code>Rc&lt;RefCell&lt;Counter&gt;&gt;</code>. Each list item is an
      <code>Rc::clone(&amp;shared)</code>, and <code>button.borrow_mut().count += 1</code> changes it.`,
  },
  cheat: [
    ['a = b  # any object, shared', 'let a = Rc::clone(&b);'],
    ['a is b', 'Rc::ptr_eq(&a, &b)'],
    ['sys.getrefcount(x)', 'Rc::strong_count(&x)'],
    ['obj.field = 1  # through any name', 'obj.borrow_mut().field = 1;  // Rc<RefCell<T>>'],
    ['print(obj.field)', 'println!("{}", obj.borrow().field);'],
    ['weakref.ref(obj)', 'Rc::downgrade(&obj)  // a Weak<T>'],
    ['ref()  # the object or None', 'weak.upgrade()  // Some(rc) or None'],
    ['gc.collect()  # frees cycles', '// no cycle collector: break cycles with Weak'],
    ['# threads share objects', 'Arc<Mutex<T>>  // Rc<RefCell<T>> for threads'],
  ],
});
