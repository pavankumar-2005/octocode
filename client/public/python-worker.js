// Version must exist at cdn.jsdelivr.net/pyodide. If it 404s, use the latest from pyodide.org.
importScripts("https://cdn.jsdelivr.net/pyodide/v0.27.7/full/pyodide.js");

self.onmessage = async (e) => {
  let out = "";
  try {
    // Pyodide = the Python interpreter compiled to WebAssembly, running inside this worker.
    const pyodide = await loadPyodide();
    pyodide.setStdout({ batched: (s) => (out += s + "\n") });
    pyodide.setStderr({ batched: (s) => (out += s + "\n") });
    await pyodide.runPythonAsync(e.data.code);
    self.postMessage({ ok: true, output: out });
  } catch (err) {
    self.postMessage({ ok: false, output: out + String(err) });
  }
};
