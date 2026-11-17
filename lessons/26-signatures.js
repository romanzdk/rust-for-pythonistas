LESSONS.push({
  id: 'signatures',
  title: 'Reading function signatures',
  summary: "Generics, bounds, impl Trait, Fn and dyn, and lifetimes: read any real signature piece by piece.",
  intro: `
    <p>In real Rust code, the signature is often the hardest line to read. Something like
    <code>fn spawn&lt;F, T&gt;(f: F) -&gt; JoinHandle&lt;T&gt; where F: FnOnce() -&gt; T + Send + 'static</code> can look
    like noise. But it is built from a few small parts, and you already know most of them from Python type hints:</p>
    <ul>
      <li><b>Generics</b> <code>&lt;T&gt;</code> are a <code>TypeVar</code>. A <b>bound</b> such as <code>T: PartialOrd</code>
        is a <code>TypeVar</code> with a bound, except the compiler enforces it.</li>
      <li><b><code>impl Trait</code></b> means "any type that has this trait", like <code>Iterable[int]</code> or
        <code>str | Path</code>.</li>
      <li><b><code>Fn(i32) -&gt; i32</code></b> is <code>Callable[[int], int]</code>.</li>
      <li><b>Lifetimes</b> such as <code>'a</code> say which input a returned reference is borrowed from. Python has no
        equivalent, because its objects stay alive as long as someone points at them.</li>
    </ul>
    <p>The goal of this lesson is reading. When you can say out loud what each part of a signature promises, you can
    change the code around it safely.</p>`,
  examples: [
    {
      title: 'A generic with a bound: a TypeVar the compiler checks',
      text: `<p><code>&lt;T: PartialOrd&gt;</code> says: <code>T</code> can be any type, as long as its values can be
      compared with <code>&lt;</code> and <code>&gt;</code>. Python's version is a type parameter with a bound. The
      difference is what happens without the bound. Python runs anyway; Rust refuses to compile, because inside the
      function it only lets you do what the bounds promise. The Rust code below leaves the bound out, so it does not compile.</p>`,
      py: code`
        from typing import Protocol


        class Comparable(Protocol):
            def __gt__(self, other, /) -> bool: ...


        def largest[T: Comparable](items: list[T]) -> T:
            best = items[0]
            for item in items:
                if item > best:
                    best = item
            return best


        print(largest([3, 7, 2]))
        print(largest(["pear", "fig"]))
      `,
      rs: code`
        fn largest<T>(items: &[T]) -> &T {
            let mut best = &items[0];
            for item in items {
                if item > best {
                    best = item;
                }
            }
            best
        }

        fn main() {
            println!("{}", largest(&[3, 7, 2]));
            println!("{}", largest(&["pear", "fig"]));
        }
      `,
      out: code`
        7
        pear
      `,
      rsError: 'error[E0369]: binary operation `>` cannot be applied to type `&T`',
      rsFix: code`
        fn largest<T: PartialOrd>(items: &[T]) -> &T {
            let mut best = &items[0];
            for item in items {
                if item > best {
                    best = item;
                }
            }
            best
        }

        fn main() {
            println!("{}", largest(&[3, 7, 2]));
            println!("{}", largest(&["pear", "fig"]));
        }
      `,
      fixNote: `The fix is the bound <code>T: PartialOrd</code>: "T must support <code>&lt;</code> and <code>&gt;</code>". The
        compiler then checks every caller: integers and strings have it, so both calls are fine.`,
      links: [
        [1, 8, `Read it as: <i>largest, for any type T, takes a borrowed slice of T and returns a borrowed T</i>. Here
          <code>T</code> has no bound, so the compiler knows nothing about it, not even that it can be compared.`],
        [4, 11, `This is the line the compiler rejects. Python looks up <code>__gt__</code> when the line runs; Rust needs
          the bound to promise it before the program runs.`],
        [8, 13, `The return type <code>&amp;T</code> means the result is one of the items, borrowed, not a copy.`],
        [12, 16, `The same function works for <code>i32</code> and for <code>&amp;str</code>. The compiler makes one copy of
          the function per type it is used with.`],
      ],
    },
    {
      title: 'Generic structs, where, and methods only for some T',
      text: `<p>A struct can be generic too: <code>Stack&lt;T&gt;</code> is <code>class Stack[T]</code>. The line
      <code>impl&lt;T&gt; Stack&lt;T&gt;</code> reads "for every T, Stack of T has these methods". The first
      <code>&lt;T&gt;</code> declares the name, the second uses it. A second <code>impl</code> block can add methods only
      when <code>T</code> has some trait. Python has no way to say "this method exists only for stacks of printable
      things". In Rust it is common, so when a method seems to be missing, check the bounds on its <code>impl</code>
      block.</p>`,
      py: code`
        class Stack[T]:
            def __init__(self) -> None:
                self.items: list[T] = []

            def push(self, item: T) -> None:
                self.items.append(item)

            def pop(self) -> T | None:
                return self.items.pop() if self.items else None

            def show(self) -> str:
                return " | ".join(str(item) for item in self.items)


        def show_twice[T](stack: Stack[T]) -> None:
            print(stack.show())
            print(stack.show())


        stack: Stack[int] = Stack()
        stack.push(1)
        stack.push(2)
        stack.push(3)
        print(stack.pop())
        show_twice(stack)
      `,
      rs: code`
        use std::fmt::Display;

        struct Stack<T> {
            items: Vec<T>,
        }

        impl<T> Stack<T> {
            fn new() -> Stack<T> {
                Stack { items: Vec::new() }
            }

            fn push(&mut self, item: T) {
                self.items.push(item);
            }

            fn pop(&mut self) -> Option<T> {
                self.items.pop()
            }
        }

        impl<T: Display> Stack<T> {
            fn show(&self) -> String {
                let parts: Vec<String> = self.items.iter().map(|item| item.to_string()).collect();
                parts.join(" | ")
            }
        }

        fn show_twice<T>(stack: &Stack<T>)
        where
            T: Display,
        {
            println!("{}", stack.show());
            println!("{}", stack.show());
        }

        fn main() {
            let mut stack: Stack<i32> = Stack::new();
            stack.push(1);
            stack.push(2);
            stack.push(3);
            println!("{:?}", stack.pop());
            show_twice(&stack);
        }
      `,
      out: code`
        Some(3)
        1 | 2
        1 | 2
      `,
      pyOut: code`
        3
        1 | 2
        1 | 2
      `,
      links: [
        [3, 1, `<code>struct Stack&lt;T&gt;</code> is <code>class Stack[T]</code>: a stack of some type T, chosen by whoever
          creates it.`],
        [7, null, `<code>impl&lt;T&gt;</code> declares T, and <code>Stack&lt;T&gt;</code> uses it: "for any T, these methods
          exist". These work for every stack.`],
        [16, 8, `<code>Option&lt;T&gt;</code> is <code>T | None</code>. Rust prints it as <code>Some(3)</code>, Python as
          <code>3</code>.`],
        [21, 11, `<code>impl&lt;T: Display&gt;</code>: <code>show</code> exists only when T can be printed. A
          <code>Stack&lt;Vec&lt;i32&gt;&gt;</code> would have <code>push</code> and <code>pop</code>, but no
          <code>show</code>.`],
        [28, 15, `A <code>where</code> clause is the same bound written below the signature. Long signatures in real
          code use it to stay readable.`],
        [30, null, `Read <code>where T: Display</code> as "on the condition that T can be printed". Several bounds join with
          <code>+</code>, for example <code>T: Display + Clone</code>.`],
        [37, 20, `<code>Stack&lt;i32&gt;</code> fixes T to <code>i32</code>, like <code>Stack[int]</code>. Usually you can
          leave it out and the compiler works it out from the first <code>push</code>.`],
      ],
    },
    {
      title: 'impl Trait: "any type that can do this"',
      text: `<p>In argument position, <code>impl Trait</code> is the Rust spelling of an abstract type hint.
      <code>impl IntoIterator&lt;Item = i32&gt;</code> is <code>Iterable[int]</code>: a <code>Vec</code>, an array, or an
      iterator all fit. <code>impl AsRef&lt;Path&gt;</code> is <code>str | Path</code>: anything that can be viewed as a
      path. <code>Item = i32</code> is an <b>associated type</b>, the trait's way of saying what the items are.</p>
      <p>In return position, <code>-&gt; impl Iterator&lt;Item = i32&gt;</code> means "I return some iterator of
      <code>i32</code>; you don't need to know its exact type". That is <code>-&gt; Iterator[int]</code>. The real type
      of an iterator chain is long and can't be written out for a closure, so library code returns it this way.</p>`,
      py: code`
        from collections.abc import Iterable, Iterator
        from pathlib import Path


        def total(nums: Iterable[int]) -> int:
            return sum(nums)


        def evens(limit: int) -> Iterator[int]:
            return (n for n in range(limit) if n % 2 == 0)


        def is_rust(path: str | Path) -> bool:
            return Path(path).suffix == ".rs"


        print(total([1, 2, 3]))
        print(total((10, 20)))
        print(total(evens(7)))
        print(is_rust("main.rs"))
        print(is_rust(Path("notes.txt")))
      `,
      rs: code`
        use std::path::{Path, PathBuf};

        fn total(nums: impl IntoIterator<Item = i32>) -> i32 {
            nums.into_iter().sum()
        }

        fn evens(limit: i32) -> impl Iterator<Item = i32> {
            (0..limit).filter(|n| n % 2 == 0)
        }

        fn is_rust(path: impl AsRef<Path>) -> bool {
            path.as_ref().extension().is_some_and(|ext| ext == "rs")
        }

        fn main() {
            println!("{}", total(vec![1, 2, 3]));
            println!("{}", total([10, 20]));
            println!("{}", total(evens(7)));
            println!("{}", is_rust("main.rs"));
            println!("{}", is_rust(PathBuf::from("notes.txt")));
        }
      `,
      out: code`
        6
        30
        12
        true
        false
      `,
      pyOut: code`
        6
        30
        12
        True
        False
      `,
      links: [
        [3, 5, `<code>impl IntoIterator&lt;Item = i32&gt;</code>: "anything you can loop over that gives <code>i32</code>
          values". The <code>Item = i32</code> part names the trait's associated type, like the <code>[int]</code> in
          <code>Iterable[int]</code>.`],
        [4, 6, `<code>.into_iter()</code> turns whatever was passed into an iterator. Inside the function, that is all
          you are allowed to do with it, because that is all the bound promises.`],
        [7, 9, `<code>-&gt; impl Iterator&lt;Item = i32&gt;</code>: the caller only learns "some iterator of i32". Like
          returning a generator in Python, nothing runs until someone loops over it.`],
        [11, 13, `<code>impl AsRef&lt;Path&gt;</code> is the common way to accept <code>&amp;str</code>,
          <code>String</code>, <code>&amp;Path</code> or <code>PathBuf</code>. Standard functions like
          <code>std::fs::read_to_string</code> use it.`],
        [12, 14, `<code>.as_ref()</code> gives a <code>&amp;Path</code>, whatever was passed in.`],
        [16, 17, `Each call can pass a different type: a <code>Vec</code>, an array, and below an iterator.`],
        [20, 21, `<code>PathBuf</code> is the owned path type, like <code>Path</code> in Python. <code>&amp;Path</code> is a
          borrowed one, the way <code>&amp;str</code> is to <code>String</code>.`],
      ],
    },
    {
      title: 'Functions as arguments: Fn, FnMut and dyn',
      text: `<p><code>impl Fn(i32) -&gt; i32</code> reads as <code>Callable[[int], int]</code>: a closure or function
      that takes an <code>i32</code> and returns an <code>i32</code>. There are three flavors, and the signature tells you
      what the function will do with your closure:</p>
      <ul>
        <li><code>Fn</code>: it may call it many times, and the closure only reads what it captured.</li>
        <li><code>FnMut</code>: it may call it many times, and the closure may change what it captured, like a counter.</li>
        <li><code>FnOnce</code>: it calls it at most once, so the closure may give away what it captured.</li>
      </ul>
      <p>Every closure has its own type, so a <code>Vec</code> can't hold two different closures directly.
      <code>Box&lt;dyn Fn(i32) -&gt; i32&gt;</code> is the way out: a box holding <i>some</i> function of that shape. That is
      what a Python <code>list[Callable[[int], int]]</code> is all the time.</p>`,
      py: code`
        from collections.abc import Callable


        def apply(f: Callable[[int], int], x: int) -> int:
            return f(x)


        def make_adder(n: int) -> Callable[[int], int]:
            return lambda x: x + n


        def repeat(times: int, f: Callable[[], None]) -> None:
            for _ in range(times):
                f()


        double = lambda x: x * 2
        add_ten = make_adder(10)
        print(apply(double, 5))
        print(apply(add_ten, 5))

        steps: list[Callable[[int], int]] = [double, add_ten, lambda x: x - 1]
        value = 1
        for step in steps:
            value = step(value)
        print(value)

        count = 0


        def tick() -> None:
            global count
            count += 1


        repeat(3, tick)
        print(count)
      `,
      rs: code`
        fn apply(f: impl Fn(i32) -> i32, x: i32) -> i32 {
            f(x)
        }

        fn make_adder(n: i32) -> impl Fn(i32) -> i32 {
            move |x| x + n
        }

        fn repeat(times: u32, mut f: impl FnMut()) {
            for _ in 0..times {
                f();
            }
        }

        fn main() {
            let double = |x: i32| x * 2;
            let add_ten = make_adder(10);
            println!("{}", apply(double, 5));
            println!("{}", apply(&add_ten, 5));

            let steps: Vec<Box<dyn Fn(i32) -> i32>> = vec![Box::new(double), Box::new(add_ten), Box::new(|x| x - 1)];
            let mut value = 1;
            for step in &steps {
                value = step(value);
            }
            println!("{value}");

            let mut count = 0;
            repeat(3, || count += 1);
            println!("{count}");
        }
      `,
      out: code`
        10
        15
        11
        3
      `,
      links: [
        [1, 4, `<code>impl Fn(i32) -&gt; i32</code> is <code>Callable[[int], int]</code>. <code>Fn</code> also says
          <code>apply</code> may call <code>f</code> as often as it likes.`],
        [5, 8, `Returning a closure: <code>-&gt; impl Fn(i32) -&gt; i32</code>. <code>move</code> copies <code>n</code> into
          the closure, so it still has it after <code>make_adder</code> returns.`],
        [9, 12, `<code>impl FnMut()</code>: a closure that takes nothing, returns nothing, and may change what it captured.
          The parameter needs <code>mut</code> for that.`],
        [19, 20, `<code>&amp;add_ten</code> lends the closure instead of giving it away, so it can still go into the list
          below.`],
        [21, 22, `<code>Box&lt;dyn Fn(i32) -&gt; i32&gt;</code>: "some function of this shape, on the heap". The three
          closures have three different types; the box hides that. <code>dyn</code> means the call is looked up while the
          program runs, the way Python always does it.`],
        [29, 36, `<code>|| count += 1</code> changes <code>count</code>, so it is an <code>FnMut</code> closure. Passing it to
          a function that wants <code>Fn</code> would not compile.`],
      ],
    },
    {
      title: 'Lifetimes: which input does the result borrow from?',
      text: `<p>A returned <code>&amp;str</code> is always borrowed from something. Most of the time you don't see a
      lifetime, because the compiler fills it in with two simple rules:</p>
      <ul>
        <li>If there is exactly <b>one</b> borrowed input, the result borrows from it.</li>
        <li>If it is a method with <code>&amp;self</code>, the result borrows from <code>self</code>.</li>
      </ul>
      <p>You only write <code>'a</code> when the rules can't decide, or when a struct holds a reference:
      <code>struct Parser&lt;'a&gt; { input: &amp;'a str }</code> reads "a Parser can't outlive the text it reads". In
      Python the parser would keep the text alive. In Rust the owner of the text decides how long it lives, and the
      compiler checks that the parser is gone first. Here a function tries to return a parser over a
      <code>String</code> that is freed when the function ends.</p>`,
      py: code`
        class Parser:
            def __init__(self, input: str) -> None:
                self.input = input

            def first_word(self) -> str:
                return self.input.split(" ")[0]


        def first_line(text: str) -> str:
            return text.splitlines()[0]


        def make_parser() -> Parser:
            text = "cargo build --release\nrun tests"
            return Parser(first_line(text))


        parser = make_parser()
        print(parser.first_word())
      `,
      rs: code`
        struct Parser<'a> {
            input: &'a str,
        }

        impl<'a> Parser<'a> {
            fn first_word(&self) -> &str {
                self.input.split(' ').next().unwrap_or("")
            }
        }

        fn first_line(text: &str) -> &str {
            text.lines().next().unwrap_or("")
        }

        fn make_parser() -> Parser<'static> {
            let text = String::from("cargo build --release\nrun tests");
            Parser { input: first_line(&text) }
        }

        fn main() {
            let parser = make_parser();
            println!("{}", parser.first_word());
        }
      `,
      out: 'cargo',
      rsError: 'error[E0515]: cannot return value referencing local variable `text`',
      rsFix: code`
        struct Parser<'a> {
            input: &'a str,
        }

        impl<'a> Parser<'a> {
            fn first_word(&self) -> &str {
                self.input.split(' ').next().unwrap_or("")
            }
        }

        fn first_line(text: &str) -> &str {
            text.lines().next().unwrap_or("")
        }

        fn main() {
            let text = String::from("cargo build --release\nrun tests");
            let parser = Parser { input: first_line(&text) };
            println!("{}", parser.first_word());
        }
      `,
      fixNote: `The fix moves the <code>String</code> to <code>main</code>, which outlives the parser. The other common fix
        is to make the struct own its data (<code>input: String</code>), which removes the lifetime altogether.`,
      links: [
        [1, 1, `<code>Parser&lt;'a&gt;</code>: "a Parser that borrows something for a while called <code>'a</code>". A struct
          with a lifetime holds a reference, not its own copy.`],
        [5, null, `<code>impl&lt;'a&gt;</code> declares the lifetime name, just like <code>impl&lt;T&gt;</code> declares a
          type name.`],
        [6, 5, `No lifetime written: by the <code>&amp;self</code> rule, the returned <code>&amp;str</code> borrows from the
          parser.`],
        [11, 9, `No lifetime written: by the one-input rule, the result borrows from <code>text</code>. It is a slice of the
          same string, not a copy.`],
        [15, 13, `<code>'static</code> means "lives until the program ends", like a string literal. Data created inside the
          function can't promise that.`],
        [17, 15, `<code>text</code> is freed at the end of this function, but the parser would still point into it. The
          compiler refuses. Python keeps <code>text</code> alive for as long as the parser exists.`],
      ],
    },
    {
      title: 'Putting it together: reading a real signature',
      text: `<p>This is the signature of the standard library's <code>std::thread::spawn</code>, which you used in lesson
      22, wrapped in our own function. Read it in four pieces:</p>
      <ol>
        <li><code>&lt;F, T&gt;</code>: two type parameters. <code>F</code> is the job, <code>T</code> is what it returns.</li>
        <li><code>(job: F) -&gt; JoinHandle&lt;T&gt;</code>: take a job, give back a handle that will produce a
          <code>T</code>. Python's <code>Future[T]</code>.</li>
        <li><code>F: FnOnce() -&gt; T + Send + 'static</code>: the job is a closure called once, with no arguments, that
          returns a <code>T</code>. It can be sent to another thread (<code>Send</code>), and it borrows nothing that could
          disappear (<code>'static</code>), because the thread may outlive the caller.</li>
        <li><code>T: Send + 'static</code>: the result must also be safe to send back.</li>
      </ol>
      <p>Each bound explains a rule you meet when calling it. <code>'static</code> is why you need <code>move</code>, and
      <code>Send</code> is why <code>Rc</code> is rejected. The same shape appears in <code>tokio::spawn</code> (lesson 24).
      </p>`,
      py: code`
        from collections.abc import Callable
        from concurrent.futures import Future, ThreadPoolExecutor

        pool = ThreadPoolExecutor()


        def run_in_background[T](job: Callable[[], T]) -> Future[T]:
            return pool.submit(job)


        name = "report.csv"
        handle = run_in_background(lambda: f"processed {name}")
        print(handle.result())
      `,
      rs: code`
        use std::thread::{self, JoinHandle};

        fn run_in_background<F, T>(job: F) -> JoinHandle<T>
        where
            F: FnOnce() -> T + Send + 'static,
            T: Send + 'static,
        {
            thread::spawn(job)
        }

        fn main() {
            let name = String::from("report.csv");
            let handle = run_in_background(move || format!("processed {name}"));
            println!("{}", handle.join().unwrap());
        }
      `,
      out: 'processed report.csv',
      links: [
        [3, 7, `Piece 1 and 2: two type parameters, a job of type <code>F</code> in, a <code>JoinHandle&lt;T&gt;</code> out. In
          Python, <code>Future[T]</code>.`],
        [5, 7, `Piece 3. <code>FnOnce() -&gt; T</code> is <code>Callable[[], T]</code>, called once. <code>+ Send</code>: may
          move to another thread. <code>+ 'static</code>: holds no borrowed data that could be freed while the thread runs.`],
        [6, null, `Piece 4: the result goes back to the calling thread, so it must be <code>Send</code> too.`],
        [8, 8, `The body just passes the job on. The bounds above are copied from <code>thread::spawn</code>, because it
          needs the same promises.`],
        [13, 12, `<code>move</code> makes the closure own <code>name</code>. Without it, the closure would borrow
          <code>name</code> from <code>main</code> and not be <code>'static</code>.`],
        [14, 13, `<code>.join()</code> waits for the thread, like <code>.result()</code>. It returns a <code>Result</code>,
          because the thread might have panicked.`],
      ],
    },
  ],
  quiz: [
    {
      type: 'compiles',
      q: 'Does this compile?',
      code: code`
        fn first<T>(items: &[T]) -> T {
            items[0]
        }

        fn main() {
            println!("{}", first(&[1, 2, 3]));
        }
      `,
      answer: false,
      explain: `<code>items</code> is borrowed, and <code>T</code> could be a <code>String</code>, so taking an item out by
        value would leave a hole in someone else's slice (error E0508). Two fixes: return <code>&amp;T</code>, or add the
        bound <code>T: Copy</code> so the item is copied.`,
    },
    {
      type: 'choice',
      q: `In <code>impl Config { fn get(&amp;self, key: &amp;str) -&gt; &amp;str }</code>, what is the returned
        <code>&amp;str</code> borrowed from?`,
      options: ['From <code>key</code>', 'From <code>self</code>, the Config', 'From nothing: it is a new String', 'It can be either, the compiler decides at run time'],
      answer: 1,
      explain: `With <code>&amp;self</code> in a method, the compiler's rule is that the result borrows from
        <code>self</code>. So the returned text lives inside the Config, and the Config must stay around while you use it.
        <code>key</code> can be dropped right after the call.`,
    },
    {
      type: 'choice',
      q: 'Which of these can you pass to <code>fn greet(name: impl Into&lt;String&gt;)</code>?',
      options: ['Only a <code>String</code>', 'Only a <code>&amp;str</code>', 'Both <code>"ada"</code> and <code>String::from("ada")</code>', 'Any type at all'],
      answer: 2,
      explain: `<code>impl Into&lt;String&gt;</code> means "anything that can be turned into a String". Both
        <code>&amp;str</code> and <code>String</code> can. Inside, the function calls <code>name.into()</code>. Builders and
        constructors use this a lot, so callers don't have to write <code>.to_string()</code>.`,
    },
    {
      type: 'compiles',
      q: 'Does this compile?',
      code: code`
        fn longest<'a>(a: &'a str, b: &'a str) -> &'a str {
            if a.len() >= b.len() { a } else { b }
        }

        fn main() {
            let a = String::from("pear");
            let result;
            {
                let b = String::from("banana");
                result = longest(&a, &b);
            }
            println!("{result}");
        }
      `,
      answer: false,
      explain: `<code>'a</code> promises that the result lives no longer than the <b>shorter</b> of the two inputs.
        <code>b</code> is freed at the inner <code>}</code>, so <code>result</code> can't be used after it (error E0597,
        "<code>b</code> does not live long enough"). The compiler doesn't look at which string actually won. It goes by
        the signature.`,
    },
    {
      type: 'output',
      q: 'What does this print?',
      code: code`
        fn apply_all(x: i32, steps: &[Box<dyn Fn(i32) -> i32>]) -> i32 {
            let mut x = x;
            for step in steps {
                x = step(x);
            }
            x
        }

        fn main() {
            let steps: Vec<Box<dyn Fn(i32) -> i32>> = vec![Box::new(|x| x + 1), Box::new(|x| x * 10)];
            println!("{}", apply_all(2, &steps));
        }
      `,
      options: ['21', '30', '12'],
      answer: 1,
      explain: `The steps run in order: 2 + 1 = 3, then 3 × 10 = 30. Each <code>Box&lt;dyn Fn(i32) -&gt; i32&gt;</code> is
        one function, like a <code>list[Callable[[int], int]]</code> in Python.`,
    },
  ],
  exercise: {
    task: `<p><code>pick</code> returns one of two borrowed strings, so the compiler needs to know which input the result
      borrows from. Neither of its rules applies here (two inputs, no <code>self</code>). Press <b>Run</b> to see the
      error, then add a lifetime so the program compiles.</p>`,
    starter: code`
      fn pick(a: &str, b: &str, first: bool) -> &str {
          if first { a } else { b }
      }

      fn main() {
          let left = String::from("left");
          let right = String::from("right");
          println!("{}", pick(&left, &right, true));
          println!("{}", pick(&left, &right, false));
      }
    `,
    solution: code`
      fn pick<'a>(a: &'a str, b: &'a str, first: bool) -> &'a str {
          if first { a } else { b }
      }

      fn main() {
          let left = String::from("left");
          let right = String::from("right");
          println!("{}", pick(&left, &right, true));
          println!("{}", pick(&left, &right, false));
      }
    `,
    expected: code`
      left
      right
    `,
    hint: `Declare the name after the function name, <code>pick&lt;'a&gt;</code>, then use it on both inputs and the output:
      <code>&amp;'a str</code>. It says "the result lives as long as both inputs". The compiler's help line shows the same
      change.`,
  },
  breaks: [
    `A Python type hint is a note for tools; the program runs either way. A Rust bound is a rule. Inside the function you
      may only use what the bounds promise, and every caller is checked against them before the program runs.`,
    `A generic function is compiled once per type it is used with, so <code>largest::&lt;i32&gt;</code> and
      <code>largest::&lt;&amp;str&gt;</code> are two separate pieces of machine code. Python has one function that checks
      types while it runs. Only <code>dyn Trait</code> works the Python way, looking up the method at run time.`,
    `Lifetimes don't change how long anything lives. They only describe it, so the compiler can check that no reference
      outlives its owner. Python solves the same problem the other way: anything still referenced stays alive.`,
    `<code>'static</code> doesn't mean "a global variable". In a bound like <code>T: 'static</code> it means "holds no
      short-lived borrows", so an owned <code>String</code> qualifies, even one made a moment ago.`,
    `Every closure has its own type, even two that look the same. That is why a list of them needs
      <code>Box&lt;dyn Fn(...)&gt;</code>, while in Python any callable fits in a list.`,
  ],
  translate: {
    task: `<p>Write <code>count_matching</code> so it works for any kind of items, like the Python version. You need a type
      parameter for the items, something to loop over, and a function that checks one item.</p>`,
    py: code`
      from collections.abc import Callable, Iterable


      def count_matching[T](items: Iterable[T], keep: Callable[[T], bool]) -> int:
          n = 0
          for item in items:
              if keep(item):
                  n += 1
          return n


      print(count_matching([3, 8, 12, 5], lambda n: n > 4))
      print(count_matching(["ant", "bee", "cat"], lambda w: "a" in w))
    `,
    starter: code`
      // Write count_matching here.

      fn main() {
          // Uncomment these two lines once count_matching exists:
          // println!("{}", count_matching(vec![3, 8, 12, 5], |n| *n > 4));
          // println!("{}", count_matching(["ant", "bee", "cat"], |w| w.contains('a')));
      }
    `,
    solution: code`
      fn count_matching<T>(items: impl IntoIterator<Item = T>, keep: impl Fn(&T) -> bool) -> usize {
          let mut n = 0;
          for item in items {
              if keep(&item) {
                  n += 1;
              }
          }
          n
      }

      fn main() {
          println!("{}", count_matching(vec![3, 8, 12, 5], |n| *n > 4));
          println!("{}", count_matching(["ant", "bee", "cat"], |w| w.contains('a')));
      }
    `,
    expected: code`
      3
      2
    `,
    hint: `<code>Iterable[T]</code> becomes <code>impl IntoIterator&lt;Item = T&gt;</code>, and <code>Callable[[T], bool]</code>
      becomes <code>impl Fn(&amp;T) -&gt; bool</code>: the check only needs to look at the item, so it takes a reference.
      Declare <code>T</code> with <code>fn count_matching&lt;T&gt;(...)</code> and return a <code>usize</code>.`,
  },
  cheat: [
    ['def f[T](x: T) -> T:', 'fn f<T>(x: T) -> T'],
    ['def f[T: Comparable](xs: list[T]) -> T:', 'fn f<T: PartialOrd>(xs: &[T]) -> &T'],
    ['# (bound written after the signature)', 'fn f<T>(x: T) where T: Display + Clone'],
    ['class Stack[T]: ...', 'struct Stack<T> { items: Vec<T> }\nimpl<T> Stack<T> { ... }'],
    ['def total(nums: Iterable[int])', 'fn total(nums: impl IntoIterator<Item = i32>)'],
    ['def evens() -> Iterator[int]:', 'fn evens() -> impl Iterator<Item = i32>'],
    ['def open(path: str | Path)', 'fn open(path: impl AsRef<Path>)'],
    ['def greet(name: str)  # str or anything str-like', 'fn greet(name: impl Into<String>)'],
    ['f: Callable[[int], int]', 'f: impl Fn(i32) -> i32'],
    ['steps: list[Callable[[int], int]]', 'steps: Vec<Box<dyn Fn(i32) -> i32>>'],
    ['# (no equivalent)', "fn pick<'a>(a: &'a str, b: &'a str) -> &'a str"],
    ['# (no equivalent)', "struct Parser<'a> { input: &'a str }"],
    ['Future[T]', 'JoinHandle<T>  // F: FnOnce() -> T + Send + \'static'],
  ],
});
