LESSONS.push({
  id: 'async',
  title: 'async/await vs asyncio',
  summary: 'async fn and .await, tokio::join! and tokio::spawn, timeouts, and why async Rust needs a runtime like tokio.',
  intro: `
    <p>Async code lets one program wait for many slow things at once, such as network calls, without a thread for each.
    Python does this with <code>asyncio</code>: <code>async def</code>, <code>await</code>, and an event loop started by
    <code>asyncio.run</code>. Rust's version reads almost the same: <code>async fn</code> and <code>.await</code>.</p>
    <p>The big difference: Rust's standard library has no event loop. It only defines what a <b>future</b> is (a piece
    of work that can pause). To run futures you add a <b>runtime</b> crate, and almost all real code uses
    <b>tokio</b>. So most async Rust you read starts with <code>#[tokio::main]</code> and calls things like
    <code>tokio::spawn</code> and <code>tokio::time::sleep</code>.</p>
    <p>For reading code, map it like this:</p>
    <ul>
      <li><code>async fn</code> = <code>async def</code>, and <code>x.await</code> = <code>await x</code> (the
        <code>.await</code> goes after).</li>
      <li><code>#[tokio::main]</code> = <code>asyncio.run(main())</code>.</li>
      <li><code>tokio::join!</code> = <code>asyncio.gather</code>, and <code>tokio::spawn</code> =
        <code>asyncio.create_task</code>.</li>
      <li><code>tokio::time::timeout</code> = <code>asyncio.wait_for</code>, and <code>tokio::select!</code> = "wait for
        whichever finishes first".</li>
    </ul>`,
  examples: [
    {
      title: 'async def becomes async fn',
      text: `<p>The shape is the same: an async function that waits, and a <code>main</code> that awaits it. Two things
      move. <code>.await</code> goes <b>after</b> the call, so you can chain it: <code>fetch().await.len()</code>. And
      <code>asyncio.run(main())</code> becomes the <code>#[tokio::main]</code> line above <code>main</code>.</p>`,
      py: code`
        import asyncio


        async def greet(name):
            await asyncio.sleep(0.01)
            return f"hello {name}"


        async def main():
            message = await greet("ada")
            print(message)


        asyncio.run(main())
      `,
      rs: code`
        use std::time::Duration;

        async fn greet(name: &str) -> String {
            tokio::time::sleep(Duration::from_millis(10)).await;
            format!("hello {name}")
        }

        #[tokio::main]
        async fn main() {
            let message = greet("ada").await;
            println!("{message}");
        }
      `,
      out: 'hello ada',
      links: [
        [3, 4, `<code>async fn</code> is <code>async def</code>. The return type is the value you get <b>after</b> awaiting:
          here a <code>String</code>.`],
        [4, 5, `<code>tokio::time::sleep</code> is <code>asyncio.sleep</code>. Never use <code>std::thread::sleep</code>
          here: it would block the whole thread, like <code>time.sleep</code> inside an <code>async def</code>.`],
        [8, 14, `<code>#[tokio::main]</code> is <code>asyncio.run(main())</code>: it starts the tokio runtime and runs
          <code>main</code> on it. Without it, <code>main</code> can't be <code>async</code>.`],
        [10, 10, `<code>greet("ada").await</code> is <code>await greet("ada")</code>, written the other way round.`],
      ],
    },
    {
      title: 'Calling an async function does nothing yet',
      text: `<p>Here Python and Rust agree. Calling an async function doesn't run its body. It gives back a paused piece
      of work: a <b>coroutine</b> in Python, a <b>future</b> in Rust. The body only runs when you await it. That is why
      both print <code>created the job</code> before <code>working</code>.</p>`,
      py: code`
        import asyncio


        async def work():
            print("working")
            return 1


        async def main():
            job = work()
            print("created the job")
            result = await job
            print(f"result: {result}")


        asyncio.run(main())
      `,
      rs: code`
        async fn work() -> i32 {
            println!("working");
            1
        }

        #[tokio::main]
        async fn main() {
            let job = work();
            println!("created the job");
            let result = job.await;
            println!("result: {result}");
        }
      `,
      out: code`
        created the job
        working
        result: 1
      `,
      links: [
        [8, 10, `Calling <code>work()</code> runs none of its body. <code>job</code> is a future, not an <code>i32</code>.
          If you never await it, Python warns at run time ("coroutine was never awaited"); Rust warns when compiling.`],
        [10, 12, `Only <code>.await</code> runs it. Now <code>working</code> is printed, and <code>result</code> is the
          <code>i32</code>.`],
      ],
    },
    {
      title: 'Run several at once: tokio::join! and asyncio.gather',
      text: `<p>Each call waits 50 ms. To show that they really wait at the same time, without timing anything, each
      call counts how many calls are running at that moment. Awaiting them one by one would never have more than 1
      running. <code>asyncio.gather</code> and <code>tokio::join!</code> start all three before any of them finishes. The
      results come back in the order you wrote the calls, not the order they finished.</p>`,
      py: code`
        import asyncio

        running = 0
        most = 0


        async def fetch(name):
            global running, most
            running += 1
            most = max(most, running)
            await asyncio.sleep(0.05)
            running -= 1
            return f"{name} done"


        async def main():
            users, orders, prices = await asyncio.gather(fetch("users"), fetch("orders"), fetch("prices"))
            print(f"{users}, {orders}, {prices}")
            print(f"at most {most} running at once")


        asyncio.run(main())
      `,
      rs: code`
        use std::sync::atomic::{AtomicUsize, Ordering};
        use std::time::Duration;

        static RUNNING: AtomicUsize = AtomicUsize::new(0);
        static MOST: AtomicUsize = AtomicUsize::new(0);

        async fn fetch(name: &str) -> String {
            let now = RUNNING.fetch_add(1, Ordering::SeqCst) + 1;
            MOST.fetch_max(now, Ordering::SeqCst);
            tokio::time::sleep(Duration::from_millis(50)).await;
            RUNNING.fetch_sub(1, Ordering::SeqCst);
            format!("{name} done")
        }

        #[tokio::main]
        async fn main() {
            let (users, orders, prices) = tokio::join!(fetch("users"), fetch("orders"), fetch("prices"));
            println!("{users}, {orders}, {prices}");
            println!("at most {} running at once", MOST.load(Ordering::SeqCst));
        }
      `,
      out: code`
        users done, orders done, prices done
        at most 3 running at once
      `,
      links: [
        [4, [3, 4], `A global counter that the calls change. A plain Rust <code>static</code> can't be changed, because several
          threads might use it at once, so these are <b>atomics</b>: numbers with safe updates and no lock. You'll mostly
          meet them as counters.`],
        [8, [9, 10], `<code>fetch_add</code> adds 1 and gives back the old value, and <code>fetch_max</code> keeps the biggest
          value seen. <code>Ordering::SeqCst</code> is the simplest, strictest setting; you can read past it.`],
        [17, 17, `<code>tokio::join!</code> is <code>gather</code>: it starts all the futures, waits for all of them, and gives
          back a tuple with one result per future, in the order written.`],
        [19, 19, `All three were waiting at the same time. Awaiting them one by one would print 1.`],
      ],
    },
    {
      title: 'Tasks: tokio::spawn and asyncio.create_task',
      text: `<p><code>join!</code> runs futures inside the current task. <code>tokio::spawn</code> makes each future its own
      <b>task</b> that runs by itself, like <code>asyncio.create_task</code>, and gives you a handle to await later. One
      difference: asyncio runs everything on one thread, but tokio spreads tasks over several threads. So, just like
      <code>thread::spawn</code> in lesson 22, a spawned future must own its data (<code>'static</code>) and be safe to
      move to another thread (<code>Send</code>).</p>`,
      py: code`
        import asyncio


        async def square(n):
            await asyncio.sleep(0.01)
            return n * n


        async def main():
            tasks = [asyncio.create_task(square(n)) for n in [1, 2, 3]]
            results = [await t for t in tasks]
            print(results)


        asyncio.run(main())
      `,
      rs: code`
        use std::time::Duration;

        async fn square(n: i32) -> i32 {
            tokio::time::sleep(Duration::from_millis(10)).await;
            n * n
        }

        #[tokio::main]
        async fn main() {
            let mut handles = Vec::new();
            for n in [1, 2, 3] {
                handles.push(tokio::spawn(square(n)));
            }
            let mut results = Vec::new();
            for h in handles {
                results.push(h.await.unwrap());
            }
            println!("{:?}", results);
        }
      `,
      out: '[1, 4, 9]',
      links: [
        [12, 10, `<code>tokio::spawn</code> is <code>create_task</code>: the future starts running as its own task, and you
          get a <code>JoinHandle</code> back.`],
        [16, 11, `Awaiting a <code>JoinHandle</code> gives a <code>Result</code>: <code>Err</code> if the task panicked or
          was cancelled, hence the <code>unwrap()</code>. Awaiting the handles in order keeps the results in order.`],
      ],
    },
    {
      title: 'Timeouts: tokio::time::timeout and asyncio.wait_for',
      text: `<p><code>slow()</code> needs a second, but we only give it 50 ms. Python raises <code>TimeoutError</code>.
      Rust's <code>timeout</code> returns a <code>Result</code> instead: <code>Ok</code> with the value, or
      <code>Err</code> if time ran out. The slow future is then simply dropped, and dropping a future stops it.
      <code>tokio::select!</code>, which you'll also see in real code, works the same way: it waits for whichever
      branch finishes first and drops the others.</p>`,
      py: code`
        import asyncio


        async def slow():
            await asyncio.sleep(1)
            return "finished"


        async def main():
            try:
                result = await asyncio.wait_for(slow(), timeout=0.05)
                print(result)
            except TimeoutError:
                print("gave up after 50 ms")


        asyncio.run(main())
      `,
      rs: code`
        use std::time::Duration;
        use tokio::time::{sleep, timeout};

        async fn slow() -> String {
            sleep(Duration::from_secs(1)).await;
            String::from("finished")
        }

        #[tokio::main]
        async fn main() {
            match timeout(Duration::from_millis(50), slow()).await {
                Ok(result) => println!("{result}"),
                Err(_) => println!("gave up after 50 ms"),
            }
        }
      `,
      out: 'gave up after 50 ms',
      links: [
        [11, 11, `<code>timeout</code> wraps another future and gives back a <code>Result</code>: an error value instead of
          an exception (lesson 12).`],
        [13, [13, 14], `Python cancels <code>slow()</code> by raising <code>CancelledError</code> inside it. Rust just
          drops the future. It stops at the <code>.await</code> where it was waiting, and none of its code runs again.`],
      ],
    },
  ],
  quiz: [
    {
      type: 'output',
      q: 'What does this print?',
      code: code`
        async fn hello() {
            println!("hello");
        }

        #[tokio::main]
        async fn main() {
            let _job = hello();
            println!("end");
        }
      `,
      options: ['end', 'hello\nend', 'end\nhello'],
      answer: 0,
      explain: `<code>hello()</code> only creates a future. Nobody awaits it, so its body never runs. In Python,
        <code>hello()</code> without <code>await</code> doesn't run either.`,
    },
    {
      type: 'compiles',
      q: 'Does this compile?',
      code: code`
        async fn answer() -> i32 {
            42
        }

        #[tokio::main]
        async fn main() {
            let n: i32 = answer();
            println!("{n}");
        }
      `,
      answer: false,
      explain: `<code>answer()</code> is a future that will give an <code>i32</code>, not an <code>i32</code> yet. rustc
        says "mismatched types" and suggests adding <code>.await</code>. In Python, forgetting <code>await</code> gives you
        a coroutine object at run time instead.`,
    },
    {
      type: 'output',
      q: 'What does this print?',
      code: code`
        use std::time::Duration;
        use tokio::time::sleep;

        #[tokio::main]
        async fn main() {
            tokio::select! {
                _ = sleep(Duration::from_millis(500)) => println!("slow"),
                _ = sleep(Duration::from_millis(10)) => println!("fast"),
            }
            println!("done");
        }
      `,
      options: ['fast\ndone', 'fast\nslow\ndone', 'slow\nfast\ndone'],
      answer: 0,
      explain: `<code>select!</code> waits for the first branch to finish, runs its code, and drops the other futures.
        The 500 ms sleep is dropped, so <code>slow</code> is never printed.`,
    },
    {
      type: 'choice',
      q: 'What happens if an <code>async fn</code> calls <code>std::thread::sleep(Duration::from_secs(1))</code>?',
      options: [
        'Only that task waits; tokio runs the others meanwhile',
        'It blocks the thread it runs on, so other tasks on that thread can\'t run for a second',
        'It does not compile inside an async fn',
        'tokio turns it into an async sleep',
      ],
      answer: 1,
      explain: `It compiles, but it blocks, exactly like <code>time.sleep</code> inside an <code>async def</code>. Use
        <code>tokio::time::sleep(...).await</code>, and run truly blocking work with
        <code>tokio::task::spawn_blocking</code> (like <code>asyncio.to_thread</code>).`,
    },
    {
      type: 'choice',
      q: 'Why does async Rust code need a crate like <code>tokio</code>?',
      options: [
        'The standard library defines futures but has no runtime to run them',
        'Rust has no async or await keywords',
        'tokio makes Rust code single-threaded',
        'Only tokio can use the network',
      ],
      answer: 0,
      explain: `<code>async</code>, <code>.await</code> and the <code>Future</code> trait are built in, but something has
        to keep polling futures and wake them up. Python ships that in <code>asyncio</code>; in Rust you pick a runtime,
        and tokio is the usual choice.`,
    },
  ],
  exercise: {
    task: `<p>This should greet Ada and Bob, then print <code>done</code>. Press Run: it only prints <code>done</code>.
      The two greetings are created but never run. Make them run, in order.</p>`,
    starter: code`
      async fn greet(name: &str) {
          println!("hello {name}");
      }

      #[tokio::main]
      async fn main() {
          greet("ada");
          greet("bob");
          println!("done");
      }
    `,
    solution: code`
      async fn greet(name: &str) {
          println!("hello {name}");
      }

      #[tokio::main]
      async fn main() {
          greet("ada").await;
          greet("bob").await;
          println!("done");
      }
    `,
    expected: code`
      hello ada
      hello bob
      done
    `,
    hint: `Calling an async fn only creates a future. Add <code>.await</code> after each call, the way Python needs
      <code>await greet("ada")</code>.`,
  },
  breaks: [
    `Async needs a runtime crate. Python ships an event loop in <code>asyncio</code>. Rust's standard library only defines
      futures; <code>#[tokio::main]</code> is what starts a runtime to run them.`,
    `tokio uses several threads. asyncio runs all coroutines on one thread, but tokio spreads tasks over a thread pool by
      default. That's why <code>tokio::spawn</code> needs <code>Send + 'static</code> futures, like
      <code>thread::spawn</code> in lesson 22.`,
    `A forgotten <code>.await</code> is caught early. Python warns at run time that a "coroutine was never awaited". rustc
      warns at compile time ("unused implementer of <code>Future</code> that must be used"), and using the result as a
      value doesn't compile at all.`,
    `Cancelling is dropping. Python raises <code>CancelledError</code> inside a cancelled task, so it can clean up in
      <code>except</code> or <code>finally</code>. In Rust, <code>timeout</code> and <code>select!</code> just drop the
      future: it stops at its current <code>.await</code>, and only its <code>Drop</code> code runs.`,
    `Blocking still blocks. <code>std::thread::sleep</code>, a slow file read with <code>std::fs</code>, or heavy CPU work
      inside an <code>async fn</code> stalls other tasks, just like <code>time.sleep</code> in an <code>async def</code>.
      Use <code>tokio::time::sleep</code>, <code>tokio::fs</code>, or <code>tokio::task::spawn_blocking</code>.`,
  ],
  translate: {
    py: code`
      import asyncio


      async def download(size):
          await asyncio.sleep(0.01)
          return size


      async def main():
          sizes = await asyncio.gather(download(120), download(80), download(40))
          print(f"files: {len(sizes)}")
          print(f"total: {sum(sizes)} KB")


      asyncio.run(main())
    `,
    starter: code`
      use std::time::Duration;

      #[tokio::main]
      async fn main() {
      }
    `,
    solution: code`
      use std::time::Duration;

      async fn download(size: u32) -> u32 {
          tokio::time::sleep(Duration::from_millis(10)).await;
          size
      }

      #[tokio::main]
      async fn main() {
          let (a, b, c) = tokio::join!(download(120), download(80), download(40));
          let sizes = vec![a, b, c];
          println!("files: {}", sizes.len());
          println!("total: {} KB", a + b + c);
      }
    `,
    expected: code`
      files: 3
      total: 240 KB
    `,
    hint: `<code>async def</code> becomes <code>async fn download(size: u32) -> u32</code>, and
      <code>asyncio.sleep(0.01)</code> becomes <code>tokio::time::sleep(Duration::from_millis(10)).await</code>.
      <code>asyncio.gather(...)</code> is <code>tokio::join!(...)</code>, which gives back a tuple.`,
  },
  cheat: [
    ['asyncio.run(main())', '#[tokio::main]\nasync fn main() { }'],
    ['async def f(): ...', 'async fn f() { }'],
    ['await f()', 'f().await'],
    ['await asyncio.sleep(0.5)', 'tokio::time::sleep(Duration::from_millis(500)).await;'],
    ['await asyncio.gather(a(), b())', 'tokio::join!(a(), b())'],
    ['task = asyncio.create_task(f())', 'let handle = tokio::spawn(f());'],
    ['await task', 'handle.await.unwrap()'],
    ['await asyncio.wait_for(f(), timeout=1)', 'tokio::time::timeout(Duration::from_secs(1), f()).await'],
    ['asyncio.wait(..., return_when=FIRST_COMPLETED)', 'tokio::select! { ... }'],
    ['await asyncio.to_thread(blocking)', 'tokio::task::spawn_blocking(blocking).await'],
    ['except asyncio.CancelledError:', '// no exception: a dropped future just stops'],
  ],
});
