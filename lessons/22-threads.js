LESSONS.push({
  id: 'threads',
  title: 'Threads without a GIL',
  summary: 'thread::spawn, Arc and Mutex, channels and scoped threads, and why data races are compile errors.',
  intro: `
    <p>In CPython, the <b>GIL</b> (global interpreter lock) lets only one thread run Python code at a time. Threads still
    help while waiting on the network or disk, but CPU-heavy work doesn't get faster. And the GIL doesn't protect your
    data: <code>count += 1</code> is several steps, and another thread can run in between, so you still need locks. Nothing
    checks that you used them.</p>
    <p>Rust has no GIL. Threads run truly in parallel, on all cores. In exchange, the compiler checks every piece of data
    that more than one thread can reach. Two marker traits decide it: <code>Send</code> ("may move to another thread") and
    <code>Sync</code> ("may be used from several threads at once"). You rarely write them, but you see them in errors.</p>
    <p>For reading code, four tools cover most of it:</p>
    <ul>
      <li><code>thread::spawn(move || ...)</code> starts a thread; <code>.join()</code> waits for it.</li>
      <li><code>Arc&lt;Mutex&lt;T&gt;&gt;</code> is data that many threads share and change: the thread-safe
        <code>Rc&lt;RefCell&lt;T&gt;&gt;</code> from lesson 21.</li>
      <li><code>mpsc::channel()</code> is a <code>queue.Queue</code> between threads.</li>
      <li><code>thread::scope</code> is like <code>with ThreadPoolExecutor()</code>: all its threads finish at the end.</li>
    </ul>`,
  examples: [
    {
      title: 'Start threads and collect their results',
      text: `<p>Python's <code>ThreadPoolExecutor</code> reuses a few threads; <code>thread::spawn</code> starts one operating
      system thread per call. A Rust thread can return a value, and <code>join()</code> hands it back. (For many small jobs,
      real code often uses the <code>rayon</code> crate instead. When you read <code>.par_iter()</code>, it means "this loop
      runs on all cores".)</p>`,
      py: code`
        from concurrent.futures import ThreadPoolExecutor


        def square(n):
            return n * n


        with ThreadPoolExecutor() as pool:
            results = list(pool.map(square, [1, 2, 3, 4]))
        print(results)
      `,
      rs: code`
        use std::thread;

        fn square(n: i32) -> i32 {
            n * n
        }

        fn main() {
            let mut handles = Vec::new();
            for n in [1, 2, 3, 4] {
                handles.push(thread::spawn(move || square(n)));
            }
            let results: Vec<i32> = handles.into_iter().map(|h| h.join().unwrap()).collect();
            println!("{:?}", results);
        }
      `,
      out: '[1, 4, 9, 16]',
      links: [
        [10, 9, `<code>thread::spawn</code> starts a thread right away and returns a handle. <code>move ||</code> hands
          <code>n</code> to the thread: a thread may outlive the code that started it, so it must own what it uses.`],
        [12, 9, `<code>join()</code> waits for the thread and gives back what its closure returned, in a <code>Result</code>
          that is <code>Err</code> if the thread panicked. Going through the handles in order keeps the results in order,
          like <code>pool.map</code>.`],
      ],
    },
    {
      title: 'A shared counter: Arc<Mutex<T>>',
      text: `<p>Both programs start 4 threads that each add 1 a thousand times, under a lock. The difference is where the
      lock lives. In Python the lock sits <b>next to</b> the data, and you have to remember to use it. In Rust the data
      sits <b>inside</b> the <code>Mutex</code>, and <code>lock()</code> is the only way to reach it.</p>`,
      py: code`
        import threading

        count = 0
        lock = threading.Lock()


        def work():
            global count
            for _ in range(1000):
                with lock:
                    count += 1


        threads = [threading.Thread(target=work) for _ in range(4)]
        for t in threads:
            t.start()
        for t in threads:
            t.join()
        print(count)
      `,
      rs: code`
        use std::sync::{Arc, Mutex};
        use std::thread;

        fn main() {
            let count = Arc::new(Mutex::new(0));
            let mut handles = Vec::new();
            for _ in 0..4 {
                let count = Arc::clone(&count);
                handles.push(thread::spawn(move || {
                    for _ in 0..1000 {
                        *count.lock().unwrap() += 1;
                    }
                }));
            }
            for h in handles {
                h.join().unwrap();
            }
            println!("{}", count.lock().unwrap());
        }
      `,
      out: '4000',
      links: [
        [5, [3, 4], `The number goes inside the <code>Mutex</code>, and the <code>Mutex</code> inside an <code>Arc</code> so every
          thread can own it. Python keeps the number and the lock as two separate names.`],
        [8, 14, `Each thread gets its own <code>Arc</code> pointing at the same counter. <code>Arc</code> is <code>Rc</code>
          (lesson 21) with an atomic count, which is safe to change from many threads.`],
        [11, [10, 11], `<code>lock()</code> returns a guard. When the guard is dropped, at the end of this statement, the lock
          is released, like leaving the <code>with</code> block. The <code>unwrap()</code> is there because a lock is
          "poisoned" if a thread panicked while holding it.`],
        [16, 18, `Wait for every thread, like <code>t.join()</code>.`],
      ],
    },
    {
      title: "Rc can't cross threads: a compile error",
      text: `<p>In lesson 21, <code>Rc&lt;RefCell&lt;T&gt;&gt;</code> was the way to share data you can change. Try that with
      threads and Rust refuses to compile, because <code>Rc</code> is not <code>Send</code>: its count isn't safe to change
      from two threads at once. Python lets every object cross threads and leaves the rest to the GIL and to you. The fix
      is the thread-safe pair: <code>Arc</code> instead of <code>Rc</code>, <code>Mutex</code> instead of
      <code>RefCell</code>.</p>`,
      py: code`
        import threading

        names = []


        def add(name):
            names.append(name)


        threads = [threading.Thread(target=add, args=(n,)) for n in ["ada", "bob", "cy"]]
        for t in threads:
            t.start()
        for t in threads:
            t.join()
        print(", ".join(sorted(names)))
      `,
      rs: code`
        use std::cell::RefCell;
        use std::rc::Rc;
        use std::thread;

        fn main() {
            let names = Rc::new(RefCell::new(Vec::new()));
            let mut handles = Vec::new();
            for name in ["ada", "bob", "cy"] {
                let names = Rc::clone(&names);
                handles.push(thread::spawn(move || names.borrow_mut().push(name)));
            }
            for h in handles {
                h.join().unwrap();
            }
            let mut all = names.borrow().clone();
            all.sort();
            println!("{}", all.join(", "));
        }
      `,
      out: 'ada, bob, cy',
      rsError: 'error[E0277]: `Rc<RefCell<Vec<&str>>>` cannot be sent between threads safely',
      rsFix: code`
        use std::sync::{Arc, Mutex};
        use std::thread;

        fn main() {
            let names = Arc::new(Mutex::new(Vec::new()));
            let mut handles = Vec::new();
            for name in ["ada", "bob", "cy"] {
                let names = Arc::clone(&names);
                handles.push(thread::spawn(move || names.lock().unwrap().push(name)));
            }
            for h in handles {
                h.join().unwrap();
            }
            let mut all = names.lock().unwrap().clone();
            all.sort();
            println!("{}", all.join(", "));
        }
      `,
      fixNote: `Three swaps: <code>Rc</code> → <code>Arc</code>, <code>RefCell</code> → <code>Mutex</code>, and
        <code>borrow()</code> / <code>borrow_mut()</code> → <code>lock().unwrap()</code>. The rest of the code stays the same.`,
      links: [
        [6, 3, `<code>Rc&lt;RefCell&lt;...&gt;&gt;</code> works in one thread. Neither its count nor its borrow check is safe
          when two threads touch them at the same moment.`],
        [10, 7, `This is where rustc stops: <code>thread::spawn</code> requires everything the closure takes to be
          <code>Send</code>, and <code>Rc</code> is not.`],
        [16, 15, `Threads finish in any order, so we sort before printing, as the Python does.`],
      ],
    },
    {
      title: 'Scoped threads can borrow',
      text: `<p><code>thread::spawn</code> needs <code>move</code> because the thread might outlive everything around it.
      <code>thread::scope</code> promises that it won't: every thread started inside the scope is finished when the scope
      ends, just like the threads of a <code>with ThreadPoolExecutor()</code> block. Because of that promise, scoped
      threads may borrow local data, with no <code>Arc</code> and no copy.</p>`,
      py: code`
        from concurrent.futures import ThreadPoolExecutor

        words = ["apple", "kiwi", "banana"]
        with ThreadPoolExecutor() as pool:
            lengths = list(pool.map(len, words))
        print(lengths)
        print(", ".join(words))
      `,
      rs: code`
        use std::thread;

        fn main() {
            let words = vec!["apple", "kiwi", "banana"];
            let lengths: Vec<usize> = thread::scope(|s| {
                let handles: Vec<_> = words.iter().map(|w| s.spawn(move || w.len())).collect();
                handles.into_iter().map(|h| h.join().unwrap()).collect()
            });
            println!("{:?}", lengths);
            println!("{}", words.join(", "));
        }
      `,
      out: code`
        [5, 4, 6]
        apple, kiwi, banana
      `,
      links: [
        [5, 4, `<code>thread::scope</code> is the <code>with</code> block: all threads started with <code>s.spawn</code> are
          finished when it ends.`],
        [6, 5, `The threads borrow <code>words</code>. <code>move</code> only moves the reference <code>w</code> into each
          thread, not the list.`],
        [10, 7, `<code>words</code> is still ours after the scope: the threads only borrowed it.`],
      ],
    },
    {
      title: 'Channels: queue.Queue between threads',
      text: `<p>Instead of sharing data, threads can send it to each other. A channel has a sending end and a receiving
      end. When a value is sent, the receiver becomes its owner, so the two threads never touch the same value. There is
      no need for a <code>None</code> at the end: when the sender is dropped, the channel closes.</p>`,
      py: code`
        import queue
        import threading

        q = queue.Queue()


        def produce():
            for n in range(1, 4):
                q.put(f"job {n}")
            q.put(None)


        threading.Thread(target=produce).start()
        while (item := q.get()) is not None:
            print(f"got {item}")
        print("done")
      `,
      rs: code`
        use std::sync::mpsc;
        use std::thread;

        fn main() {
            let (tx, rx) = mpsc::channel();
            thread::spawn(move || {
                for n in 1..=3 {
                    tx.send(format!("job {n}")).unwrap();
                }
            });
            for item in rx {
                println!("got {item}");
            }
            println!("done");
        }
      `,
      out: code`
        got job 1
        got job 2
        got job 3
        done
      `,
      links: [
        [5, 4, `<code>tx</code> sends, <code>rx</code> receives. <code>mpsc</code> means "many producers, single consumer": you
          can clone <code>tx</code> to have more senders.`],
        [8, 9, `<code>send</code> moves the <code>String</code> into the channel. The receiving thread becomes its owner.`],
        [10, 10, `When the thread ends, <code>tx</code> is dropped, and that closes the channel. No end marker needed.`],
        [11, 14, `<code>for item in rx</code> waits for each message and stops when the channel is closed and empty.`],
      ],
    },
  ],
  quiz: [
    {
      type: 'compiles',
      q: 'Does this compile?',
      code: code`
        use std::thread;

        fn main() {
            let name = String::from("ada");
            let h = thread::spawn(|| println!("{name}"));
            h.join().unwrap();
        }
      `,
      answer: false,
      explain: `The thread borrows <code>name</code>, but a spawned thread might outlive <code>main</code>'s variables, so
        rustc refuses (error E0373) and suggests <code>move ||</code>. <code>thread::scope</code> would allow the borrow.`,
    },
    {
      type: 'output',
      q: 'What does this print?',
      code: code`
        use std::sync::Mutex;

        fn main() {
            let m = Mutex::new(vec![1]);
            m.lock().unwrap().push(2);
            m.lock().unwrap().push(3);
            println!("{:?}", m.lock().unwrap());
        }
      `,
      options: ['[1, 2, 3]', '[1]', 'It hangs: the first lock is never released'],
      answer: 0,
      explain: `Each <code>m.lock().unwrap()</code> makes a guard that is dropped at the end of its statement, which releases
        the lock. If you kept a guard in a variable and called <code>lock()</code> again in the same thread, then it would
        hang.`,
    },
    {
      type: 'choice',
      q: 'Why does Python need a lock around <code>count += 1</code> in threads, even with the GIL?',
      options: [
        "It doesn't: the GIL makes it safe",
        '<code>count += 1</code> is several steps (read, add, write), and another thread can run between them',
        'Locks make Python faster',
        'Only because <code>count</code> is a global',
      ],
      answer: 1,
      explain: `The GIL protects the interpreter, not your data. It can switch threads between the read and the write, and an
        update gets lost. In Rust, sharing <code>count</code> across threads without a <code>Mutex</code> or an atomic doesn't
        compile.`,
    },
    {
      type: 'choice',
      q: 'What is the difference between <code>Arc</code> and <code>Rc</code>?',
      options: [
        '<code>Arc</code> updates its count atomically, so it can be shared between threads; <code>Rc</code> is a bit faster but for one thread only',
        "<code>Arc</code> lets you change the value, <code>Rc</code> doesn't",
        '<code>Arc</code> is a garbage collector',
        'There is no difference',
      ],
      answer: 0,
      explain: `Both are reference counts with read-only access. To change the value you add <code>RefCell</code> (one
        thread) or <code>Mutex</code> (many threads).`,
    },
  ],
  exercise: {
    task: `<p>The thread should count the letters in <code>words</code>, but this doesn't compile. Press Run, read the error,
      and follow its <code>help:</code> line. You only need to add one word.</p>`,
    starter: code`
      use std::thread;

      fn main() {
          let words = vec!["apple", "kiwi", "banana"];
          let handle = thread::spawn(|| {
              let total: usize = words.iter().map(|w| w.len()).sum();
              total
          });
          println!("total letters: {}", handle.join().unwrap());
      }
    `,
    solution: code`
      use std::thread;

      fn main() {
          let words = vec!["apple", "kiwi", "banana"];
          let handle = thread::spawn(move || {
              let total: usize = words.iter().map(|w| w.len()).sum();
              total
          });
          println!("total letters: {}", handle.join().unwrap());
      }
    `,
    expected: 'total letters: 15',
    hint: `The thread might run longer than <code>main</code>, so it can't borrow <code>words</code>. Put <code>move</code>
      before <code>||</code> so the thread takes ownership.`,
  },
  breaks: [
    `The GIL lets only one thread run Python code at a time (unless you use the free-threaded build that Python 3.13
      added). Rust threads run in parallel on every core, so CPU-heavy work really gets faster.`,
    `Python checks nothing: a forgotten lock is a silent bug that shows up once in a while. In Rust, changing data from
      several threads without a <code>Mutex</code> or an atomic doesn't compile. Data races are compile errors.`,
    `The lock holds the data. A Python <code>Lock</code> sits next to the data, and you must remember to use it. A Rust
      <code>Mutex&lt;T&gt;</code> wraps the data, and <code>lock()</code> is the only way in. It unlocks when the guard is
      dropped.`,
    `Deadlocks are still possible. The compiler stops data races, not two threads waiting for each other forever. Take locks
      in the same order everywhere, as you would in Python.`,
    `A spawned thread can't borrow local variables, which is why you see <code>move ||</code> everywhere.
      <code>thread::scope</code> is the exception, because its threads must finish before the scope ends.`,
  ],
  translate: {
    task: `<p>Write the Rust version of this Python: it should print exactly the same thing. You can share the list with
      <code>Arc&lt;Mutex&lt;...&gt;&gt;</code> like the Python does, or let each thread <b>return</b> its number and collect
      the results from <code>join()</code>, which is the more usual Rust.</p>`,
    py: code`
      import threading

      results = [0, 0, 0]


      def work(i):
          results[i] = (i + 1) * 10


      threads = [threading.Thread(target=work, args=(i,)) for i in range(3)]
      for t in threads:
          t.start()
      for t in threads:
          t.join()
      print(results)
      print(f"sum: {sum(results)}")
    `,
    starter: code`
      use std::thread;

      fn main() {
      }
    `,
    solution: code`
      use std::thread;

      fn main() {
          let mut handles = Vec::new();
          for i in 0..3 {
              handles.push(thread::spawn(move || (i + 1) * 10));
          }
          let results: Vec<i32> = handles.into_iter().map(|h| h.join().unwrap()).collect();
          println!("{:?}", results);
          let total: i32 = results.iter().sum();
          println!("sum: {total}");
      }
    `,
    expected: code`
      [10, 20, 30]
      sum: 60
    `,
    hint: `Start each thread with <code>thread::spawn(move || (i + 1) * 10)</code> and keep the handles in a
      <code>Vec</code>. Then <code>handles.into_iter().map(|h| h.join().unwrap()).collect()</code> gives the numbers in
      order, as in the first example.`,
  },
  cheat: [
    ['threading.Thread(target=f).start()', 'let h = thread::spawn(move || f());'],
    ['t.join()', 'h.join().unwrap()  // also gives the return value'],
    ['lock = threading.Lock()\nwith lock:\n    count += 1', 'let count = Mutex::new(0);\n*count.lock().unwrap() += 1;'],
    ['# the same object in many threads', 'let shared = Arc::clone(&data);  // Arc<Mutex<T>>'],
    ['with ThreadPoolExecutor() as pool:', 'thread::scope(|s| { s.spawn(...); });'],
    ['queue.Queue()', 'let (tx, rx) = mpsc::channel();'],
    ['q.put(x)', 'tx.send(x).unwrap();'],
    ['q.get()', 'rx.recv().unwrap()  // or: for x in rx { }'],
    ['# GIL: one thread runs Python at a time', '// threads run in parallel; data races do not compile'],
  ],
});
