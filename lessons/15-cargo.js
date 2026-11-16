LESSONS.push({
  id: 'cargo',
  title: 'Cargo projects and Cargo.toml',
  summary: 'Project layout, Cargo.toml vs pyproject.toml, Cargo.lock, dependencies, modules as files, and workspaces.',
  intro: `
    <p>In Python you combine several tools: <code>uv</code> or <code>pip</code> for packages, <code>pytest</code> for
    tests, <code>ruff</code> for formatting and linting, <code>mypy</code> for types, and a build backend for wheels. Rust
    ships with <b>one</b> tool that does all of this: <b>Cargo</b>. When you open a Rust repository, almost everything
    you need to know is in two places: <code>Cargo.toml</code> and the <code>src/</code> folder.</p>
    <p>A few words first. A <b>crate</b> is one Rust package, the unit Cargo builds and publishes, like a
    Python distribution package. A crate is either a <b>binary</b> (a program, it has <code>src/main.rs</code>) or a
    <b>library</b> (code for other crates, it has <code>src/lib.rs</code>), or both. Crates are published on
    <b>crates.io</b> (Rust's PyPI), and their documentation is built automatically on <b>docs.rs</b>.</p>`,
  examples: [
    {
      title: 'Starting and running a project',
      text: `<p><code>cargo new</code> creates a ready-to-run project: <code>Cargo.toml</code>, a hello-world
      <code>src/main.rs</code>, a <code>.gitignore</code> and a git repository. There is no virtual environment to create
      or activate. Dependencies are downloaded and compiled into the project's <code>target/</code> folder.</p>`,
      files: true,
      pyLabel: 'Terminal · Python',
      pyLang: 'bash',
      rsLabel: 'Terminal · Rust',
      rsLang: 'bash',
      py: code`
        uv init shop
        cd shop
        uv run main.py
        uv run mypy .
      `,
      rs: code`
        cargo new shop
        cd shop
        cargo run
        cargo check
      `,
      links: [
        [1, 1, '<code>cargo new shop</code> makes a binary crate. <code>cargo new --lib shop</code> makes a library crate (<code>src/lib.rs</code> instead of <code>src/main.rs</code>).'],
        [3, 3, '<code>cargo run</code> compiles (only what changed) and then runs <code>src/main.rs</code>. The first run also downloads and compiles all dependencies, so it is slow. Later runs are fast.'],
        [4, 4, '<code>cargo check</code> type-checks everything without producing a program. It is the fastest way to see compiler errors, so editors run it all the time. Think of it as <code>mypy</code> that can never be skipped.'],
      ],
    },
    {
      title: 'Where things live',
      text: `<p>A typical crate next to a typical Python package. The biggest difference is in the last lines:
      Rust's build output goes to <code>target/</code>. It can be large, it is never committed, and you can delete it any time.</p>`,
      files: true,
      pyLabel: 'Python package',
      pyLang: 'plaintext',
      rsLabel: 'Rust crate',
      rsLang: 'plaintext',
      py: code`
        shop/
        ├── pyproject.toml
        ├── uv.lock
        ├── src/shop/
        │   ├── __main__.py
        │   ├── __init__.py
        │   ├── models.py
        │   └── payments/
        │       ├── __init__.py
        │       └── stripe.py
        ├── tests/
        │   └── test_models.py
        └── .venv/
      `,
      rs: code`
        shop/
        ├── Cargo.toml
        ├── Cargo.lock
        ├── src/
        │   ├── main.rs
        │   ├── lib.rs
        │   ├── models.rs
        │   ├── payments.rs
        │   └── payments/
        │       └── stripe.rs
        ├── tests/
        │   └── models.rs
        └── target/
      `,
      links: [
        [2, 2, 'The project file: name, version, dependencies.'],
        [3, 3, 'Exact versions of every dependency, like <code>uv.lock</code>. Commit it.'],
        [5, 5, '<code>main.rs</code> holds <code>fn main</code>. It is the program, like <code>__main__.py</code>.'],
        [6, 6, '<code>lib.rs</code> is the root of the library: what other crates (and your tests) can <code>use</code>. It plays the role of <code>__init__.py</code>. Many crates have only one of the two files.'],
        [7, 7, 'One file is one module, <code>models</code>, like <code>models.py</code>.'],
        [8, [8, 9], '<code>payments.rs</code> is the <code>payments</code> module itself, like <code>payments/__init__.py</code>. Older code puts it in <code>payments/mod.rs</code> instead.'],
        [10, 10, 'A submodule, <code>payments::stripe</code>.'],
        [12, 12, 'Integration tests. Each file here is compiled as a separate crate that uses your library from the outside (lesson 16).'],
        [13, 13, 'All build output: debug and release builds, compiled dependencies, test binaries. Git-ignored. It takes the place of <code>.venv</code>, <code>__pycache__</code> and <code>dist/</code> together.'],
      ],
    },
    {
      title: 'Cargo.toml vs pyproject.toml',
      text: `<p>Both are TOML files, and most sections match one to one. The one surprise is version strings: in Cargo,
      <code>"0.12"</code> does <b>not</b> mean exactly 0.12. It means "0.12 or any compatible update". Cargo follows
      semantic versioning by default, as if you always wrote Python's <code>~=</code>.</p>
      <p>There is no <code>[project.scripts]</code>: <code>src/main.rs</code> is the program, and it gets the crate's name.</p>`,
      files: true,
      pyLabel: 'pyproject.toml',
      pyLang: 'ini',
      rsLabel: 'Cargo.toml',
      rsLang: 'ini',
      py: code`
        [project]
        name = "shop"
        version = "0.1.0"
        requires-python = ">=3.12"
        dependencies = [
            "requests>=2.31,<3",
            "pydantic[email]>=2,<3",
        ]

        [dependency-groups]
        dev = ["pytest>=8"]

        [project.scripts]
        shop = "shop.__main__:main"
      `,
      rs: code`
        [package]
        name = "shop"
        version = "0.1.0"
        edition = "2024"
        rust-version = "1.85"

        [dependencies]
        reqwest = "0.12"
        serde = { version = "1", features = ["derive"] }

        [dev-dependencies]
        pretty_assertions = "1"

        [profile.release]
        lto = true
      `,
      links: [
        [1, 1, '<code>[package]</code> is <code>[project]</code>: who this crate is.'],
        [4, null, 'The <b>edition</b> is a set of language rules (2015, 2018, 2021, 2024), not a compiler version. A new compiler still builds old editions, and crates of different editions work together. Python has nothing like it, which is why Python 2 → 3 was so painful.'],
        [5, 4, 'The oldest compiler that may build this crate, like <code>requires-python</code>.'],
        [7, 5, 'Normal dependencies, one per line, from crates.io.'],
        [8, 6, '<code>"0.12"</code> means <code>&gt;=0.12.0, &lt;0.13.0</code>. <code>"1"</code> would mean <code>&gt;=1.0.0, &lt;2.0.0</code>. Write <code>"=0.12.4"</code> to pin exactly.'],
        [9, 7, '<b>Features</b> are optional parts of a crate that you switch on, like <code>pydantic[email]</code> extras. <code>serde</code> with <code>derive</code> enables <code>#[derive(Serialize, Deserialize)]</code>.'],
        [11, [10, 11], 'Only for tests, examples and benchmarks. Not part of what users of your crate download.'],
        [14, null, 'Build settings per profile. <code>lto = true</code> lets the compiler optimize across all crates in the release build. Python has no build step to tune.'],
      ],
    },
    {
      title: 'Modules are files, but only when you say so',
      text: `<p>In Python, every <code>.py</code> file inside a package can be imported. In Rust, a file only becomes part of
      the crate when its parent <b>declares</b> it with <code>mod name;</code>. So when you read a crate, start at
      <code>main.rs</code> or <code>lib.rs</code> and follow the <code>mod</code> lines. They are the table of contents.
      Everything is private unless marked <code>pub</code> (lesson 14).</p>`,
      files: true,
      pyLabel: 'Python files',
      rsLabel: 'Rust files',
      py: code`
        # src/shop/models.py
        class Order:
            ...


        # src/shop/payments/stripe.py
        def charge(cents):
            ...


        # src/shop/payments/__init__.py
        # (often empty)

        # src/shop/__main__.py
        from shop.models import Order
        from shop.payments.stripe import charge
      `,
      rs: code`
        // src/models.rs
        pub struct Order {
            // ...
        }

        // src/payments/stripe.rs
        pub fn charge(cents: u32) {
            // ...
        }

        // src/payments.rs
        pub mod stripe;

        // src/main.rs
        mod models;
        mod payments;

        use models::Order;
        use payments::stripe::charge;
      `,
      links: [
        [2, 2, '<code>pub</code>, or nothing outside <code>models.rs</code> could use <code>Order</code>.'],
        [7, 7, 'A public function in the <code>stripe</code> module.'],
        [12, [11, 12], '<code>pub mod stripe;</code> means "load <code>payments/stripe.rs</code> as the submodule <code>stripe</code>, and let others see it". Python just finds the file.'],
        [15, null, '<code>mod models;</code> is not an import. It tells the compiler that <code>src/models.rs</code> belongs to this crate. Delete this line and the file is simply ignored.'],
        [16, null, 'Same for <code>src/payments.rs</code>, which in turn declares <code>stripe</code>.'],
        [18, 15, '<code>use</code> is the import, once the modules are declared. Inside the same crate, paths can also start with <code>crate::</code>, like <code>use crate::models::Order;</code>.'],
        [19, 16, 'Module path <code>payments::stripe::charge</code> = file path <code>src/payments/stripe.rs</code> + function <code>charge</code>.'],
      ],
    },
    {
      title: 'Adding and updating dependencies',
      text: `<p><code>cargo add</code> edits <code>Cargo.toml</code> for you. <code>Cargo.lock</code> records the exact
      versions that were picked, just like <code>uv.lock</code>. Commit it, so everyone (and CI) builds the same thing.
      <code>cargo update</code> moves the lock file forward within the ranges in <code>Cargo.toml</code>.</p>`,
      files: true,
      pyLabel: 'Terminal · Python',
      pyLang: 'bash',
      rsLabel: 'Terminal · Rust',
      rsLang: 'bash',
      py: code`
        uv add requests
        uv add 'pydantic[email]'
        uv add --dev pytest
        uv lock --upgrade-package requests
        uv tree
      `,
      rs: code`
        cargo add reqwest
        cargo add serde --features derive
        cargo add --dev pretty_assertions
        cargo update -p reqwest
        cargo tree
      `,
      links: [
        [1, 1, 'Picks the latest version from crates.io and writes <code>reqwest = "0.12"</code> into <code>[dependencies]</code>.'],
        [2, 2, 'Turns on a feature, the same idea as an extra.'],
        [4, 4, 'Updates only that crate in <code>Cargo.lock</code>. Plain <code>cargo update</code> updates everything.'],
        [5, 5, 'Prints the whole dependency tree. <code>cargo tree -i serde</code> shows who pulls in <code>serde</code>.'],
      ],
    },
    {
      title: 'Workspaces: several crates in one repository',
      text: `<p>Bigger projects split their code into several crates in one repository, a <b>workspace</b>. All members
      share one <code>Cargo.lock</code> and one <code>target/</code> folder. This is the same idea as a uv workspace.
      When the root <code>Cargo.toml</code> has a <code>[workspace]</code> section, look at <code>members</code> to find the
      real code. polars, ruff and uv are all organized this way.</p>`,
      files: true,
      pyLabel: 'pyproject.toml (root)',
      pyLang: 'ini',
      rsLabel: 'Cargo.toml (root)',
      rsLang: 'ini',
      py: code`
        [tool.uv.workspace]
        members = ["packages/*"]

        [tool.uv.sources]
        shop-core = { workspace = true }
      `,
      rs: code`
        [workspace]
        members = ["crates/*"]
        resolver = "3"

        [workspace.dependencies]
        serde = { version = "1", features = ["derive"] }
      `,
      links: [
        [2, 2, 'Every folder in <code>crates/</code> is a crate with its own <code>Cargo.toml</code>. <code>cargo build</code> at the root builds them all, and <code>cargo test -p shop-core</code> tests just one.'],
        [3, null, 'Which dependency resolver to use. "3" is the current one. You only need to recognize it.'],
        [5, null, 'Shared versions. Member crates write <code>serde = { workspace = true }</code> to use them, so all crates use the same version.'],
      ],
    },
  ],
  quiz: [
    {
      type: 'choice',
      q: '<code>Cargo.toml</code> says <code>serde = "1.0.200"</code>. Which versions may Cargo use?',
      options: [
        'Any version from 1.0.200 up to, but not including, 2.0.0',
        'Exactly 1.0.200',
        'Any version at all',
        '1.0.200 and every newer version, including 2.x',
      ],
      answer: 0,
      explain: 'Cargo treats a bare version as a <b>caret</b> requirement: compatible updates only. The exact version picked is stored in <code>Cargo.lock</code>. Write <code>"=1.0.200"</code> to pin it.',
    },
    {
      type: 'choice',
      q: 'You create <code>src/utils.rs</code> with <code>pub fn slug()</code>. In <code>main.rs</code>, <code>use utils::slug;</code> fails with "unresolved import". Why?',
      options: [
        '<code>main.rs</code> never declared <code>mod utils;</code>, so the file is not part of the crate',
        'The file must be named <code>utils/mod.rs</code>',
        'You need <code>cargo add utils</code>',
        '<code>slug</code> must be inside a struct',
      ],
      answer: 0,
      explain: 'A file only joins the crate through a <code>mod</code> line in its parent. Add <code>mod utils;</code> to <code>main.rs</code> and the <code>use</code> works.',
    },
    {
      type: 'output',
      q: 'Here the modules are written inline instead of as separate files. What does it print?',
      code: code`
        mod payments {
            pub mod stripe {
                pub fn charge(cents: u32) -> String {
                    format!("charged {cents} cents")
                }
            }
        }

        use payments::stripe::charge;

        fn main() {
            println!("{}", charge(250));
        }
      `,
      options: ['charged 250 cents', 'charged {cents} cents', 'stripe: 250'],
      answer: 0,
      explain: 'This is exactly what <code>src/payments.rs</code> plus <code>src/payments/stripe.rs</code> become: module <code>payments</code>, submodule <code>stripe</code>, and a public function inside.',
    },
    {
      type: 'compiles',
      q: 'Does this compile? (Look at what is <code>pub</code>.)',
      code: code`
        mod payments {
            mod stripe {
                pub fn charge(cents: u32) -> String {
                    format!("charged {cents} cents")
                }
            }
        }

        fn main() {
            println!("{}", payments::stripe::charge(250));
        }
      `,
      answer: false,
      explain: 'The function is <code>pub</code>, but the module <code>stripe</code> is not, so <code>main</code> cannot reach inside it (error E0603: module <code>stripe</code> is private). Every step of the path must be visible.',
    },
    {
      type: 'choice',
      q: 'Which of these do you <b>not</b> commit to git?',
      options: ['<code>target/</code>', '<code>Cargo.lock</code>', '<code>Cargo.toml</code>', '<code>src/lib.rs</code>'],
      answer: 0,
      explain: '<code>target/</code> is build output and can be rebuilt any time. <code>cargo new</code> already puts it in <code>.gitignore</code>. <code>Cargo.lock</code> should be committed.',
    },
  ],
  exercise: {
    task: `<p>This is <code>src/payments.rs</code> and <code>src/payments/stripe.rs</code> written as inline modules in one file.
      <code>main</code> can't call <code>charge</code> because things are private. Run it, read the error, and add the
      missing <code>pub</code> keywords. You need two.</p>`,
    starter: code`
      mod payments {
          mod stripe {
              fn charge(cents: u32) -> String {
                  format!("charged {cents} cents")
              }
          }
      }

      fn main() {
          println!("{}", payments::stripe::charge(250));
      }
    `,
    solution: code`
      mod payments {
          pub mod stripe {
              pub fn charge(cents: u32) -> String {
                  format!("charged {cents} cents")
              }
          }
      }

      fn main() {
          println!("{}", payments::stripe::charge(250));
      }
    `,
    expected: 'charged 250 cents',
    hint: 'Both the module <code>stripe</code> and the function <code>charge</code> need <code>pub</code>. <code>payments</code> itself is fine: <code>main</code> lives in the same file, so it can see it.',
  },
  cheat: [
    ['uv init shop', 'cargo new shop'],
    ['uv run main.py', 'cargo run'],
    ['mypy .', 'cargo check'],
    ['pyproject.toml / uv.lock', 'Cargo.toml / Cargo.lock'],
    ['[project] dependencies = [...]', '[dependencies]'],
    ['[dependency-groups] dev = [...]', '[dev-dependencies]'],
    ['requires-python = ">=3.12"', 'rust-version = "1.85"'],
    ['"pydantic[email]~=2.0"', 'serde = { version = "1", features = ["derive"] }'],
    ['uv add requests', 'cargo add reqwest'],
    ['uv lock --upgrade', 'cargo update'],
    ['uv tree', 'cargo tree'],
    ['__main__.py / __init__.py', 'src/main.rs / src/lib.rs'],
    ['import shop.models  # file found automatically', 'mod models;  // declare the file, then use'],
    ['.venv/  __pycache__/  dist/', 'target/'],
    ['PyPI / Read the Docs', 'crates.io / docs.rs'],
  ],
});
