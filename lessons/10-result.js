LESSONS.push({
  id: 'result',
  title: 'Result and ? instead of exceptions',
  summary: 'Errors in the return type: Ok, Err, match, the ? operator, unwrap and your own error enum.',
  intro: `
    <p>In Python a function can fail without saying so. <code>int("x")</code> looks like any other call, then it
    raises <code>ValueError</code>, and you find out by running it or by reading the docs. Rust puts the failure in
    the <b>return type</b>: <code>Result&lt;T, E&gt;</code> means "either a value of type T, or an error of type E".</p>
    <p><code>Result</code> is an enum with two variants, like the enums in lesson 8:</p>
    <ul>
      <li><code>Ok(value)</code>: it worked, here is the value.</li>
      <li><code>Err(error)</code>: it failed, here is the error.</li>
    </ul>
    <p>So you can <b>see</b> which functions can fail just by reading their signature. You also cannot use the value
    without opening the <code>Result</code> first, so nothing is silently ignored. Two tools open it:
    <code>match</code> when you handle both cases here, and <code>?</code> when you want the error to travel up to
    the caller, the way an exception does.</p>
    <p><code>Option&lt;T&gt;</code> from lesson 9 is a close cousin: it is either <code>Some(value)</code> or
    <code>None</code>, "a value or nothing". <code>Result</code> is "a value or an error", and the error can say what
    went wrong.</p>
    <p><code>panic!</code> is the other kind of failure: it stops the whole program right there, like a
    <code>raise</code> that nobody catches. You will see it in code that treats a bug as unrecoverable.</p>`,
  examples: [
    {
      title: 'Parsing gives a Result, not an exception',
      text: `<p><code>int(text)</code> and <code>parse</code> do the same job, but Rust hands the outcome back as a
      value. <code>match</code> then takes it apart, one arm per variant.</p>`,
      py: code`
        for text in ["42", "4x2"]:
            try:
                n = int(text)
                print(f"parsed {n}")
            except ValueError:
                print("not a number")
      `,
      rs: code`
        fn main() {
            for text in ["42", "4x2"] {
                match text.parse::<i32>() {
                    Ok(n) => println!("parsed {n}"),
                    Err(_) => println!("not a number"),
                }
            }
        }
      `,
      out: code`
        parsed 42
        not a number
      `,
      links: [
        [1, null, '<code>fn main()</code> is where the program starts, as always.'],
        [2, 1, 'The same loop over the same two strings.'],
        [3, 3, '<code>text.parse::&lt;i32&gt;()</code> plays the role of <code>int(text)</code>. It never raises: it returns a <code>Result&lt;i32, ParseIntError&gt;</code>. The <code>::&lt;i32&gt;</code> part says which type to parse into.'],
        [4, [3, 4], '<code>Ok(n)</code> means it worked; <code>n</code> is the number. These two Python lines live inside the <code>try</code>.'],
        [5, 6, '<code>Err(_)</code> is the failure case, the <code>except</code> branch. The <code>_</code> means "I do not need the error value here".'],
        [6, null, 'Arms of a <code>match</code> end with commas because each arm is an expression.'],
      ],
    },
    {
      title: 'The ? operator lets the error travel up',
      text: `<p>Python code often lets an exception bubble up through several functions, and catches it once at the
      top. <code>?</code> does exactly that, but the signatures show it.</p>
      <p>Read <code>?</code> as: <i>"If this is an <code>Err</code>, return it from this function right now.
      Otherwise give me the value inside the <code>Ok</code>."</i></p>
      <p>The function must say in its return type that it can fail, otherwise <code>?</code> does not compile.</p>`,
      py: code`
        def read_number(text):
            n = int(text)
            return n * 2

        def read_label(text):
            n = read_number(text)
            return f"label-{n}"

        for text in ["21", "x"]:
            try:
                print(read_label(text))
            except ValueError:
                print("failed")
      `,
      rs: code`
        fn read_number(text: &str) -> Result<i32, std::num::ParseIntError> {
            let n: i32 = text.parse()?;
            Ok(n * 2)
        }

        fn read_label(text: &str) -> Result<String, std::num::ParseIntError> {
            let n = read_number(text)?;
            Ok(format!("label-{n}"))
        }

        fn main() {
            for text in ["21", "x"] {
                match read_label(text) {
                    Ok(label) => println!("{label}"),
                    Err(_) => println!("failed"),
                }
            }
        }
      `,
      out: code`
        label-42
        failed
      `,
      links: [
        [1, 1, 'The return type says this function can fail, and with which error. In Python only the docstring or the body tells you.'],
        [2, 2, '<code>?</code> means: if <code>parse</code> returned <code>Err</code>, return that <code>Err</code> from <code>read_number</code> now. If it is <code>Ok</code>, give me the number.'],
        [3, 3, 'A function returning <code>Result</code> must wrap its success value in <code>Ok(...)</code>. There is no bare return of a number.'],
        [7, 6, 'Same <code>?</code> here. If <code>read_number</code> failed, the error leaves <code>read_label</code> at this line and nothing after it runs. That is the exception bubbling up.'],
        [8, 7, 'The success path, wrapped in <code>Ok</code> because that is what the signature promises.'],
        [13, [10, 13], 'Only the caller has to handle the error: with <code>match</code>, or with another <code>?</code>. This is the <code>try/except</code> at the top.'],
      ],
    },
    {
      title: 'unwrap, expect and unwrap_or',
      text: `<p><code>.unwrap()</code> says "I am sure this is <code>Ok</code>, give me the value". On an
      <code>Err</code> it <b>panics</b>: the program stops and prints an error. That is the same as an exception you
      never catch. <code>.expect("message")</code> does the same but adds your message to the crash.</p>
      <p>Neither is a way to handle errors. You meet them everywhere while reading Rust, mostly in examples and in
      code that has already checked the input. <code>.unwrap_or(default)</code> is the calm version: it uses a
      fallback instead of crashing.</p>`,
      py: code`
        def to_number(text):
            try:
                n = int(text)
            except ValueError:
                raise ValueError("bad number")
            return n + 1

        good = int("7")
        also = int("8")
        try:
            fallback = int("x")
        except ValueError:
            fallback = 0
        print(good, also, fallback)

        try:
            print(to_number("x"))
        except ValueError as e:
            print(e)
      `,
      rs: code`
        fn to_number(text: &str) -> Result<i32, String> {
            let n: i32 = text.parse().map_err(|_| String::from("bad number"))?;
            Ok(n + 1)
        }

        fn main() {
            let good: i32 = "7".parse().unwrap();
            let also: i32 = "8".parse().expect("8 is a number");
            let fallback: i32 = "x".parse().unwrap_or(0);
            println!("{good} {also} {fallback}");
            match to_number("x") {
                Ok(n) => println!("{n}"),
                Err(msg) => println!("{msg}"),
            }
        }
      `,
      out: code`
        7 8 0
        bad number
      `,
      links: [
        [2, [4, 5], '<code>map_err</code> changes the error before <code>?</code> returns it. Here the parse error is replaced with a fixed message, like the new <code>ValueError("bad number")</code>.'],
        [7, 8, '<code>unwrap</code> is "give me the value, crash if it is <code>Err</code>". Safe here only because "7" is a number.'],
        [8, 9, '<code>expect</code> is <code>unwrap</code> with a message. If this failed, the program would stop and print your message followed by the error.'],
        [9, [10, 13], '<code>unwrap_or</code> is the fallback: 0 if the parse fails. Like a <code>try/except</code> that returns a default.'],
      ],
    },
    {
      title: 'Your own error type is an enum',
      text: `<p>Standard errors like <code>ParseIntError</code> are fine until you need to say <i>why</i> something failed.
      Then you write an enum, exactly like lesson 8, and use it as the <code>E</code> in <code>Result</code>. Each
      variant is one kind of failure, and a variant can carry data.</p>`,
      py: code`
        class BadName(Exception):
            pass

        def check_name(name):
            if not name:
                raise BadName("empty name")
            if len(name) > 5:
                raise BadName(f"too long: {len(name)} letters")
            return name.upper()

        for name in ["ada", "", "lovelace"]:
            try:
                print(f"ok {check_name(name)}")
            except BadName as e:
                print(e)
      `,
      rs: code`
        #[derive(Debug)]
        enum BadName {
            Empty,
            TooLong(usize),
        }

        fn check_name(name: &str) -> Result<String, BadName> {
            if name.is_empty() {
                return Err(BadName::Empty);
            }
            if name.len() > 5 {
                return Err(BadName::TooLong(name.len()));
            }
            Ok(name.to_uppercase())
        }

        fn main() {
            for name in ["ada", "", "lovelace"] {
                match check_name(name) {
                    Ok(n) => println!("ok {n}"),
                    Err(BadName::Empty) => println!("empty name"),
                    Err(BadName::TooLong(n)) => println!("too long: {n} letters"),
                }
            }
        }
      `,
      out: code`
        ok ADA
        empty name
        too long: 8 letters
      `,
      links: [
        [2, 1, 'Your error type is an ordinary enum. <code>#[derive(Debug)]</code> lets it be printed with <code>{:?}</code>, as in lesson 7.'],
        [4, null, 'This variant carries data: how long the name was. A Python exception carries its message the same way.'],
        [7, 4, 'The signature names the possible failure, so callers can see it without reading the body.'],
        [9, 6, '<code>return Err(...)</code> is <code>raise</code>: stop here and hand this error to the caller.'],
        [12, 8, 'A second kind of failure, with its own data.'],
        [14, 9, '<code>Ok(...)</code> is the normal return.'],
        [19, 12, '<code>match</code> opens the <code>Result</code> first; the <code>Err</code> arms then match the enum variants.'],
        [21, 15, 'Printing the message here is the <code>print(e)</code> in the <code>except</code> block.'],
      ],
    },
    {
      title: 'main can return a Result too',
      text: `<p><code>fn main()</code> may itself return a <code>Result</code>. Then you can use <code>?</code> at the top
      level of the program, and no <code>match</code> is needed. On success, <code>main</code> must end with
      <code>Ok(())</code>.</p>
      <p>The catch: if a <code>?</code> really returns an <code>Err</code>, the program stops and exits with an error
      status. That is fine for a command-line tool, and it is what you will see in real code.</p>
      <p>When there is more than one error type in one function, you will see
      <code>Box&lt;dyn std::error::Error&gt;</code> as the error type. Read it as "any error".</p>`,
      py: code`
        try:
            count = int("3")
            price = float("2.5")
            print(f"{count} items at {price} = {count * price}")
        except ValueError as e:
            print(f"error: {e}")
      `,
      rs: code`
        fn main() -> Result<(), Box<dyn std::error::Error>> {
            let count: i32 = "3".parse()?;
            let price: f64 = "2.5".parse()?;
            println!("{count} items at {price} = {}", count as f64 * price);
            Ok(())
        }
      `,
      out: code`
        3 items at 2.5 = 7.5
      `,
      links: [
        [1, null, '<code>main</code> returns <code>Result&lt;(), Box&lt;dyn std::error::Error&gt;&gt;</code>. The <code>()</code> means "nothing on success", and the boxed error means "any error type", so <code>?</code> can carry several different errors. <code>fn main() -&gt; Result&lt;(), String&gt;</code> is the same idea with your own message.'],
        [2, 2, 'The bare value sits on the left, the error on the right. <code>?</code> here means main stops with that error if the parse fails.'],
        [4, 4, '<code>as f64</code> converts the integer so the two numbers can be multiplied, like Python just does automatically.'],
        [5, null, '<code>Ok(())</code> is the success value: unit <code>()</code> says main returns nothing. A program whose main returns <code>Err</code> exits with a non-zero status.'],
      ],
    },
  ],
  quiz: [
    {
      type: 'output',
      q: 'What does this print?',
      code: code`
        fn main() {
            let n: i32 = "10".parse().unwrap_or(0);
            let m: i32 = "x".parse().unwrap_or(5);
            println!("{}", n + m);
        }
      `,
      options: ['15', '5', '10', '0'],
      answer: 0,
      explain: 'The first <code>unwrap_or</code> is never needed: "10" parses, so <code>n</code> is 10. The second one is used: "x" fails, so <code>m</code> is the fallback 5. 10 + 5 is 15.',
    },
    {
      type: 'compiles',
      q: 'Does this compile?',
      code: code`
        fn main() {
            let n: i32 = "7".parse()?;
            println!("{n}");
        }
      `,
      answer: false,
      explain: '<code>?</code> needs a function that returns a <code>Result</code>, because it may have to return the <code>Err</code>. <code>main</code> here returns <code>()</code>, so the compiler rejects it. The fix is <code>fn main() -> Result&lt;(), Box&lt;dyn std::error::Error&gt;&gt;</code>, plus <code>Ok(())</code> at the end.',
    },
    {
      type: 'compiles',
      q: 'And this one?',
      code: code`
        fn main() -> Result<(), std::num::ParseIntError> {
            let n: i32 = "7".parse()?;
            println!("{n}");
            Ok(())
        }
      `,
      answer: true,
      explain: 'Now <code>main</code> says it returns a <code>Result</code>, so <code>?</code> is allowed, and the last expression is <code>Ok(())</code>. It prints 7 and exits normally.',
    },
    {
      type: 'choice',
      q: 'A line inside a function ends with <code>? </code>, and the call returned <code>Err(e)</code>. What happens?',
      options: [
        'The function returns <code>Err(e)</code> right away; nothing after that line runs.',
        'The program panics and stops.',
        'The error is printed to stderr and the function continues with a default value.',
        'The line is skipped and the function carries on.',
      ],
      answer: 0,
      explain: 'That is the whole point of <code>?</code>: it is an early return of the error, like letting an exception propagate. The caller decides what to do with it. Nothing crashes unless somebody calls <code>unwrap</code> on it in the end.',
    },
    {
      type: 'choice',
      q: 'You are reading <code>fn load(path: &amp;str) -&gt; Result&lt;Config, LoadError&gt;</code>. What do you know?',
      options: [
        'The function can fail, and the error is a <code>LoadError</code>. Every caller has to deal with it.',
        'The function returns two values, a <code>Config</code> and a <code>LoadError</code>.',
        'The function crashes on a bad path.',
        'The function may return nothing at all.',
      ],
      answer: 0,
      explain: 'One value comes back: either <code>Ok(Config)</code> or <code>Err(LoadError)</code>. The type tells you a failure is possible before you read a single line of the body, which is the big difference from a Python function that may raise.',
    },
  ],
  exercise: {
    task: `<p><code>read_age</code> returns a <code>Result</code>, but it uses <code>unwrap</code> on the parse, so the
      second call kills the program instead of returning an error. Press <b>Run</b> to see it. Replace the
      <code>unwrap</code> with <code>?</code> so the error goes back to <code>main</code> and gets printed.</p>`,
    starter: code`
      fn read_age(text: &str) -> Result<i32, std::num::ParseIntError> {
          let age: i32 = text.parse().unwrap();
          Ok(age)
      }

      fn main() {
          for text in ["42", "old"] {
              match read_age(text) {
                  Ok(age) => println!("age {age}"),
                  Err(e) => println!("could not read age: {e}"),
              }
          }
      }
    `,
    solution: code`
      fn read_age(text: &str) -> Result<i32, std::num::ParseIntError> {
          let age: i32 = text.parse()?;
          Ok(age)
      }

      fn main() {
          for text in ["42", "old"] {
              match read_age(text) {
                  Ok(age) => println!("age {age}"),
                  Err(e) => println!("could not read age: {e}"),
              }
          }
      }
    `,
    expected: code`
      age 42
      could not read age: invalid digit found in string
    `,
    hint: 'Delete <code>unwrap()</code> and put a <code>?</code> right after <code>parse()</code>. The function already promises it returns a Result, so ? has somewhere to return the error to.',
  },
  cheat: [
    ['try:\n    n = int(s)\nexcept ValueError:\n    n = 0', 'let n: i32 = s.parse().unwrap_or(0);'],
    ['n = int(s)  # may raise', 'let n: i32 = s.parse::<i32>()?;'],
    ['raise ValueError("empty")', 'return Err(BadName::Empty);'],
    ['x = f()  # may raise', 'let x = f()?;'],
    ['try:\n    print(f())\nexcept ValueError as e:\n    print(e)', 'match f() {\n    Ok(v) => println!("{v}"),\n    Err(e) => println!("{e}"),\n}'],
    ['n = int(s)  # crashes on bad input', 'let n: i32 = s.parse::<i32>().unwrap();'],
    ['n = int(s)  # crashes, with a message', 'let n: i32 = s.parse().expect("need a number");'],
    ['raise RuntimeError("boom")', 'panic!("boom");'],
    ['def f() -> int:', 'fn f() -> Result<i32, ParseIntError>'],
    ['def f() -> None:  # may fail', 'fn f() -> Result<(), String>'],
    ['x if x is not None else 0', 'x.unwrap_or(0)'],
  ],
});
