self.onmessage = (e) => {
  let out = "";
  const log = (...a) => (out += a.join(" ") + "\n");
  try {
    // Pass our own "console" in, so console.log output is captured instead of lost.
    new Function("console", e.data.code)({ log, error: log, warn: log, info: log });
    self.postMessage({ ok: true, output: out });
  } catch (err) {
    self.postMessage({ ok: false, output: out + String(err) });
  }
};
