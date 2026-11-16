window.LESSONS = [];

// String.raw keeps "\n" inside Rust/Python strings as typed; dedent lets lesson files indent code naturally.
// A backtick (common in compiler messages) is written as \` and turned back into a plain backtick here.
function code(strings, ...values) {
  const text = String.raw(strings, ...values).replace(/\\`/g, '`').replace(/^\n/, '').replace(/\s+$/, '');
  const lines = text.split('\n');
  const indent = Math.min(...lines.filter((l) => l.trim()).map((l) => l.match(/^ */)[0].length));
  return lines.map((l) => l.slice(indent)).join('\n');
}
