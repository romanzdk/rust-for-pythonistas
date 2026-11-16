LESSONS.push({
  id: 'crates',
  part: 'Real-world Rust',
  title: "The crates you'll meet everywhere",
  summary: 'serde instead of json and pydantic, anyhow and thiserror for errors, and clap instead of argparse.',
  intro: `
    <p>Python ships <code>json</code> and <code>argparse</code> in the standard library. Rust's standard library is small on
    purpose, so almost every real project adds the same few crates to <code>Cargo.toml</code> (lesson 17). Once you can read
    these, most real Rust code looks familiar:</p>
    <ul>
      <li><b>serde</b> and <b>serde_json</b>: turn structs into JSON and back. Like <code>json</code> plus
        <code>dataclasses</code>, and in practice closest to <b>pydantic</b>, because it checks the data while it reads it.</li>
      <li><b>anyhow</b>: one error type that can hold any error, with messages that say what you were doing. Like catching
        <code>Exception</code> and <code>raise ... from e</code>.</li>
      <li><b>thiserror</b>: your own error enum (lesson 12) with less typing. Like a family of exception classes.</li>
      <li><b>clap</b>: command-line arguments from a struct. Like <code>argparse</code>.</li>
    </ul>
    <p>All of them lean on <code>#[derive(...)]</code> (lesson 14): you describe the data, and the crate writes the boring
    code at compile time.</p>`,
  examples: [
    {
      title: 'serde: a struct to JSON and back',
      text: `<p><code>#[derive(Serialize, Deserialize)]</code> teaches serde how to write and read a <code>User</code>. Then
      <code>serde_json::to_string</code> is <code>json.dumps</code>, and <code>serde_json::from_str</code> is
      <code>json.loads</code> that builds a <code>User</code> directly instead of a dict. serde writes compact JSON with no
      spaces, so the Python passes <code>separators</code> to match it.</p>`,
      py: code`
        import json
        from dataclasses import asdict, dataclass


        @dataclass
        class User:
            name: str
            age: int


        user = User("ada", 36)
        text = json.dumps(asdict(user), separators=(",", ":"))
        print(text)

        back = User(**json.loads('{"name": "bob", "age": 41}'))
        print(f"{back.name} is {back.age}")
      `,
      rs: code`
        use serde::{Deserialize, Serialize};

        #[derive(Serialize, Deserialize)]
        struct User {
            name: String,
            age: u32,
        }

        fn main() {
            let user = User { name: String::from("ada"), age: 36 };
            let text = serde_json::to_string(&user).unwrap();
            println!("{text}");

            let back: User = serde_json::from_str(r#"{"name": "bob", "age": 41}"#).unwrap();
            println!("{} is {}", back.name, back.age);
        }
      `,
      out: code`
        {"name":"ada","age":36}
        bob is 41
      `,
      links: [
        [1, [1, 2], `<code>Serialize</code> (write) and <code>Deserialize</code> (read) are traits from the serde crate.
          <code>serde_json</code> is the JSON part; there are sibling crates for TOML, YAML and more.`],
        [3, 5, `The derive writes the code that turns a <code>User</code> into JSON and back, at compile time. No
          reflection at run time.`],
        [11, 12, `<code>to_string</code> returns a <code>Result</code>, because some values can't be written as JSON. For a
          simple struct it can't fail, so <code>unwrap</code> is fine here.`],
        [14, 15, `<code>from_str</code> reads the text and builds a <code>User</code>. The type on the left tells serde what
          to build. <code>r#"..."#</code> is a raw string: the quotes inside need no backslashes.`],
      ],
    },
    {
      title: 'Renamed keys, defaults, and bad input',
      text: `<p><code>json.loads</code> gives you a dict, and checking its shape is your job (or pydantic's). serde checks
      while it reads: if the JSON doesn't fit the struct, <code>from_str</code> returns an <code>Err</code> that says what was
      wrong and where. Attributes like <code>#[serde(rename = ...)]</code> and <code>#[serde(default)]</code> adjust how a
      field maps to JSON. The error texts differ, so the outputs are shown separately.</p>`,
      py: code`
        import json
        from dataclasses import dataclass, field


        @dataclass
        class Config:
            user_name: str
            tags: list[str] = field(default_factory=list)


        def load(text):
            data = json.loads(text)
            if not isinstance(data.get("userName"), str):
                raise ValueError("userName must be a string")
            return Config(data["userName"], data.get("tags", []))


        for text in ['{"userName": "ada"}', '{"userName": 42}']:
            try:
                c = load(text)
                print(f"{c.user_name}, {len(c.tags)} tags")
            except ValueError as e:
                print(f"error: {e}")
      `,
      rs: code`
        use serde::Deserialize;

        #[derive(Deserialize)]
        struct Config {
            #[serde(rename = "userName")]
            user_name: String,
            #[serde(default)]
            tags: Vec<String>,
        }

        fn main() {
            for text in [r#"{"userName": "ada"}"#, r#"{"userName": 42}"#] {
                match serde_json::from_str::<Config>(text) {
                    Ok(c) => println!("{}, {} tags", c.user_name, c.tags.len()),
                    Err(e) => println!("error: {e}"),
                }
            }
        }
      `,
      pyOut: code`
        ada, 0 tags
        error: userName must be a string
      `,
      out: code`
        ada, 0 tags
        error: invalid type: integer \`42\`, expected a string at line 1 column 15
      `,
      links: [
        [5, [13, 15], `<code>rename</code>: the key is <code>userName</code> in JSON, but the field is <code>user_name</code> in
          Rust. <code>#[serde(rename_all = "camelCase")]</code> on the struct does it for every field at once.`],
        [7, [8, 15], `<code>default</code>: if <code>tags</code> is missing, use the type's default value, here an empty
          <code>Vec</code>. Without it, a missing key is an error.`],
        [13, [12, 13, 14], `Parsing and checking in one step. The turbofish <code>::&lt;Config&gt;</code> says what to build.`],
        [15, 23, `The error says what was expected, what came instead, and where. You didn't write any of the checks.`],
      ],
    },
    {
      title: 'anyhow: any error, with context',
      text: `<p>In an application you mostly want to stop and print a good message. <code>anyhow::Result&lt;T&gt;</code> is a
      <code>Result</code> whose error can be any error type, so <code>?</code> works on all of them. <code>.context(...)</code>
      wraps an error with a sentence about what you were doing, like <code>raise RuntimeError(...) from e</code>. The
      original errors are worded differently in the two languages, so the outputs are shown separately.</p>`,
      py: code`
        def parse_port(text):
            try:
                return int(text)
            except ValueError as e:
                raise RuntimeError(f"bad port {text!r}") from e


        for text in ["8080", "eighty"]:
            try:
                print(f"port {parse_port(text)}")
            except RuntimeError as e:
                print(f"error: {e}: {e.__cause__}")
      `,
      rs: code`
        use anyhow::{Context, Result};

        fn parse_port(text: &str) -> Result<u16> {
            let port = text.parse::<u16>().context(format!("bad port '{text}'"))?;
            Ok(port)
        }

        fn main() {
            for text in ["8080", "eighty"] {
                match parse_port(text) {
                    Ok(port) => println!("port {port}"),
                    Err(e) => println!("error: {e:#}"),
                }
            }
        }
      `,
      pyOut: code`
        port 8080
        error: bad port 'eighty': invalid literal for int() with base 10: 'eighty'
      `,
      out: code`
        port 8080
        error: bad port 'eighty': invalid digit found in string
      `,
      links: [
        [3, 1, `<code>anyhow::Result&lt;u16&gt;</code> is <code>Result&lt;u16, anyhow::Error&gt;</code>: one error type that can
          hold any error, like catching <code>Exception</code>.`],
        [4, [3, 4, 5], `<code>.context(...)</code> wraps the parse error with your message, like <code>raise ... from e</code>.
          It is a trait method, which is why <code>Context</code> is imported on line 1.`],
        [12, 12, `<code>{e:#}</code> prints the whole chain: your message, then the cause. Plain <code>{e}</code> prints only
          the outer message.`],
      ],
    },
    {
      title: 'thiserror: an error enum instead of exception classes',
      text: `<p>A library usually wants callers to tell errors apart, so it defines its own error enum (lesson 12).
      <b>thiserror</b> writes the boring parts: <code>#[error("...")]</code> is the message (the <code>Display</code> impl),
      and <code>#[from]</code> lets <code>?</code> convert another error into yours. A common rule of thumb: thiserror in
      libraries, anyhow in applications.</p>`,
      py: code`
        class ShopError(Exception):
            pass


        class NotFound(ShopError):
            def __init__(self, item):
                super().__init__(f"no item called {item}")


        class BadQuantity(ShopError):
            def __init__(self):
                super().__init__("bad quantity")


        def order(item, qty_text):
            if item != "apple":
                raise NotFound(item)
            try:
                qty = int(qty_text)
            except ValueError as e:
                raise BadQuantity() from e
            return f"{qty} x {item}"


        for item, qty in [("apple", "3"), ("pear", "1"), ("apple", "lots")]:
            try:
                print(order(item, qty))
            except ShopError as e:
                print(f"error: {e}")
      `,
      rs: code`
        use std::num::ParseIntError;
        use thiserror::Error;

        #[derive(Debug, Error)]
        enum ShopError {
            #[error("no item called {0}")]
            NotFound(String),
            #[error("bad quantity")]
            BadQuantity(#[from] ParseIntError),
        }

        fn order(item: &str, qty_text: &str) -> Result<String, ShopError> {
            if item != "apple" {
                return Err(ShopError::NotFound(String::from(item)));
            }
            let qty: u32 = qty_text.parse()?;
            Ok(format!("{qty} x {item}"))
        }

        fn main() {
            for (item, qty) in [("apple", "3"), ("pear", "1"), ("apple", "lots")] {
                match order(item, qty) {
                    Ok(text) => println!("{text}"),
                    Err(e) => println!("error: {e}"),
                }
            }
        }
      `,
      out: code`
        3 x apple
        error: no item called pear
        error: bad quantity
      `,
      links: [
        [5, 1, `One enum instead of a family of exception classes. Each variant is one kind of error (lesson 10).`],
        [6, [6, 7], `<code>#[error("...")]</code> writes the <code>Display</code> impl (lesson 14), which is the message.
          <code>{0}</code> is the variant's first field.`],
        [9, [10, 11, 12], `<code>#[from]</code> writes <code>impl From&lt;ParseIntError&gt; for ShopError</code>. That is what
          lets the <code>?</code> on line 16 turn a parse error into <code>ShopError::BadQuantity</code>.`],
        [16, [18, 19, 20, 21], `<code>?</code> gets a <code>ParseIntError</code>, but the function returns
          <code>ShopError</code>, so it converts the error with <code>From</code>. In Python you catch and re-raise by hand.`],
        [24, [28, 29], `One <code>match</code> arm for every kind of error, like <code>except ShopError</code>. A caller could
          also match <code>ShopError::NotFound(name)</code> on its own.`],
      ],
    },
    {
      title: 'clap: argparse from a struct',
      text: `<p>With clap you write a struct, and <code>#[derive(Parser)]</code> turns it into a parser. Field names become
      argument names, field types do the conversion and checking, and <code>--help</code> is generated for you. A bad
      argument prints a usage message and exits with code 2, as with argparse.</p>`,
      py: code`
        import argparse

        parser = argparse.ArgumentParser()
        parser.add_argument("name")
        parser.add_argument("--times", type=int, default=1)
        parser.add_argument("--shout", action="store_true")
        args = parser.parse_args()

        text = f"hello, {args.name}"
        if args.shout:
            text = text.upper()
        for _ in range(args.times):
            print(text)
      `,
      rs: code`
        use clap::Parser;

        #[derive(Parser)]
        struct Args {
            name: String,
            #[arg(long, default_value_t = 1)]
            times: u32,
            #[arg(long)]
            shout: bool,
        }

        fn main() {
            let args = Args::parse();
            let mut text = format!("hello, {}", args.name);
            if args.shout {
                text = text.to_uppercase();
            }
            for _ in 0..args.times {
                println!("{text}");
            }
        }
      `,
      run: { args: ['ada', '--times', '2', '--shout'] },
      out: code`
        HELLO, ADA
        HELLO, ADA
      `,
      links: [
        [3, 3, `The struct is the parser: <code>derive(Parser)</code> writes the parsing code from the fields.`],
        [5, 4, `A field without <code>#[arg]</code> is a positional argument.`],
        [6, 5, `<code>#[arg(long)]</code> makes a <code>--times</code> option, and <code>default_value_t</code> sets its default.
          The type <code>u32</code> replaces <code>type=int</code>: <code>--times two</code> is rejected with a clear message.`],
        [8, 6, `A <code>bool</code> with <code>long</code> is a flag: present means <code>true</code>, like
          <code>store_true</code>.`],
        [13, 7, `<code>parse()</code> reads the real arguments. On a mistake it prints usage and exits with code 2; on
          <code>--help</code> it prints the help and exits with 0.`],
      ],
    },
  ],
  quiz: [
    {
      type: 'output',
      q: 'What does this print?',
      code: code`
        use serde::Serialize;

        #[derive(Serialize)]
        struct Item {
            #[serde(rename = "itemName")]
            name: String,
            price: u32,
        }

        fn main() {
            let item = Item { name: String::from("pen"), price: 2 };
            println!("{}", serde_json::to_string(&item).unwrap());
        }
      `,
      options: ['{"itemName":"pen","price":2}', '{"name":"pen","price":2}', '{"itemName": "pen", "price": 2}'],
      answer: 0,
      explain: `<code>rename</code> changes the key in JSON, and <code>to_string</code> writes compact JSON with no spaces.
        Use <code>to_string_pretty</code> for indented output.`,
    },
    {
      type: 'compiles',
      q: 'Does this compile?',
      code: code`
        use std::num::ParseIntError;

        #[derive(Debug)]
        enum AppError {
            BadNumber(ParseIntError),
        }

        fn read(text: &str) -> Result<u32, AppError> {
            let n: u32 = text.parse()?;
            Ok(n)
        }

        fn main() {
            println!("{:?}", read("5"));
        }
      `,
      answer: false,
      explain: `<code>?</code> only converts an error when there is a <code>From</code> impl, and nothing here says how a
        <code>ParseIntError</code> becomes an <code>AppError</code> (error E0277). Add <code>#[from]</code> with thiserror, write
        the <code>impl From</code> yourself, or convert by hand with <code>.map_err(AppError::BadNumber)?</code>.`,
    },
    {
      type: 'output',
      q: 'What does this print?',
      code: code`
        use anyhow::{Context, Result};

        fn load() -> Result<u32> {
            let n = "x".parse::<u32>().context("reading the limit")?;
            Ok(n)
        }

        fn main() {
            if let Err(e) = load() {
                println!("{e}");
            }
        }
      `,
      options: ['reading the limit', 'reading the limit: invalid digit found in string', 'invalid digit found in string'],
      answer: 0,
      explain: `Plain <code>{e}</code> prints only the outer message, the context. <code>{e:#}</code> would print the whole
        chain: <code>reading the limit: invalid digit found in string</code>.`,
    },
    {
      type: 'choice',
      q: 'A library wants its callers to be able to tell "not found" apart from "bad input". What fits best?',
      options: ['<code>anyhow::Result</code> everywhere', 'An error enum, written with thiserror', '<code>panic!</code>', 'Return a <code>String</code> with the message'],
      answer: 1,
      explain: `An enum has one variant per kind of error, so callers can <code>match</code> on it, like
        <code>except NotFound</code>. <code>anyhow::Error</code> is great for printing, but callers can't easily tell the kinds
        apart.`,
    },
    {
      type: 'choice',
      q: 'What does <code>#[serde(default)]</code> on a field do?',
      options: [
        "If the key is missing from the JSON, the field gets its type's default value (0, empty string, empty Vec)",
        'It makes the field optional in Rust code',
        'It skips the field when writing JSON',
        'It sets the field to null',
      ],
      answer: 0,
      explain: `It is like <code>field(default_factory=list)</code> in a dataclass, or a default in a pydantic model. For an
        optional value in Rust code, use an <code>Option</code> field instead.`,
    },
  ],
  exercise: {
    task: `<p>The JSON uses the key <code>userName</code>, but the struct field is <code>user_name</code>, so serde can't find
      it. Press Run to see the error, then add one serde attribute so it prints <code>hello, ada</code>. Don't change the
      JSON.</p>`,
    starter: code`
      use serde::Deserialize;

      #[derive(Deserialize)]
      struct User {
          user_name: String,
      }

      fn main() {
          let text = r#"{"userName": "ada"}"#;
          match serde_json::from_str::<User>(text) {
              Ok(user) => println!("hello, {}", user.user_name),
              Err(e) => println!("error: {e}"),
          }
      }
    `,
    solution: code`
      use serde::Deserialize;

      #[derive(Deserialize)]
      struct User {
          #[serde(rename = "userName")]
          user_name: String,
      }

      fn main() {
          let text = r#"{"userName": "ada"}"#;
          match serde_json::from_str::<User>(text) {
              Ok(user) => println!("hello, {}", user.user_name),
              Err(e) => println!("error: {e}"),
          }
      }
    `,
    expected: 'hello, ada',
    hint: `Put <code>#[serde(rename = "userName")]</code> on the line above the field. <code>#[serde(rename_all =
      "camelCase")]</code> above the struct works too.`,
  },
  breaks: [
    `serde checks the shape while it reads. <code>json.loads</code> gives you a plain dict and leaves the checking to you, or
      to pydantic. Reading into a struct with <code>serde_json::from_str</code> fails with a message such as "missing field"
      or "invalid type", plus a line and column.`,
    `Unknown keys are ignored by default. A JSON key with no matching field is skipped without an error, as in a default
      pydantic model. Add <code>#[serde(deny_unknown_fields)]</code> to the struct to make it an error.`,
    `serde writes compact JSON: <code>serde_json::to_string</code> gives <code>{"a":1}</code>, while <code>json.dumps</code>
      gives <code>{"a": 1}</code>. Use <code>to_string_pretty</code> for indented output.`,
    `Errors are values, not a class hierarchy. A family of exception subclasses becomes one enum, and
      <code>except NotFound</code> becomes a <code>match</code> arm. There is no "catch this class and all its children",
      but an <code>anyhow::Error</code> can hold any error.`,
    `These crates are not built in. Python ships <code>json</code> and <code>argparse</code>; in Rust you add serde, anyhow,
      thiserror and clap to <code>Cargo.toml</code> with <code>cargo add</code> (lesson 17). Nearly every project does.`,
  ],
  translate: {
    py: code`
      import json

      text = '[{"name": "pen", "price": 2}, {"name": "book", "price": 12}]'
      items = json.loads(text)
      total = sum(item["price"] for item in items)
      for item in items:
          print(f"{item['name']}: {item['price']}")
      print(f"total: {total}")
      print(json.dumps({"count": len(items), "total": total}, separators=(",", ":")))
    `,
    starter: code`
      use serde::{Deserialize, Serialize};

      fn main() {
          let text = r#"[{"name": "pen", "price": 2}, {"name": "book", "price": 12}]"#;
      }
    `,
    solution: code`
      use serde::{Deserialize, Serialize};

      #[derive(Deserialize)]
      struct Item {
          name: String,
          price: u32,
      }

      #[derive(Serialize)]
      struct Summary {
          count: usize,
          total: u32,
      }

      fn main() {
          let text = r#"[{"name": "pen", "price": 2}, {"name": "book", "price": 12}]"#;
          let items: Vec<Item> = serde_json::from_str(text).unwrap();
          let total: u32 = items.iter().map(|item| item.price).sum();
          for item in &items {
              println!("{}: {}", item.name, item.price);
          }
          println!("total: {total}");
          let summary = Summary { count: items.len(), total };
          println!("{}", serde_json::to_string(&summary).unwrap());
      }
    `,
    expected: code`
      pen: 2
      book: 12
      total: 14
      {"count":2,"total":14}
    `,
    hint: `Make a struct <code>Item</code> with <code>#[derive(Deserialize)]</code> and let serde fill a list:
      <code>let items: Vec&lt;Item&gt; = serde_json::from_str(text).unwrap();</code>. For the last line, a small struct with
      <code>#[derive(Serialize)]</code> and <code>serde_json::to_string</code>.`,
  },
  cheat: [
    ['json.dumps(obj, separators=(",", ":"))', 'serde_json::to_string(&obj)?'],
    ['json.dumps(obj, indent=2)', 'serde_json::to_string_pretty(&obj)?'],
    ['User(**json.loads(text))', 'let user: User = serde_json::from_str(text)?;'],
    ['@dataclass  # or a pydantic model', '#[derive(Serialize, Deserialize)]'],
    ['Field(alias="userName")  # pydantic', '#[serde(rename = "userName")]'],
    ['tags: list = field(default_factory=list)', '#[serde(default)]'],
    ['raise RuntimeError("...") from e', 'result.context("...")?  // anyhow'],
    ['except Exception as e:', 'fn main() -> anyhow::Result<()>'],
    ['class NotFound(ShopError): ...', '#[derive(Debug, Error)] enum ShopError { #[error("...")] NotFound }'],
    ['raise BadQuantity() from e', 'BadQuantity(#[from] ParseIntError)  // then ? converts'],
    ['argparse.ArgumentParser()', '#[derive(Parser)] struct Args { ... }'],
    ['parser.add_argument("--times", type=int, default=1)', '#[arg(long, default_value_t = 1)] times: u32'],
    ['parser.add_argument("--shout", action="store_true")', '#[arg(long)] shout: bool'],
    ['args = parser.parse_args()', 'let args = Args::parse();'],
  ],
});
