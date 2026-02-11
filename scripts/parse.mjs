import fs from "node:fs/promises";
import path from "node:path";
import ts from "typescript";

const args = process.argv.slice(2);
const fileArg = args[0];
const supportedExts = new Set([".js", ".jsx", ".ts", ".tsx"]);

const readStdin = () =>
  new Promise((resolve, reject) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => {
      data += chunk;
    });
    process.stdin.on("end", () => resolve(data));
    process.stdin.on("error", reject);
  });

const usage = () => {
  console.error("Usage:");
  console.error("  npm run parser -- path/to/file.tsx");
  console.error("  npm run parser -- path/to/folder");
  console.error("  npm run parser (defaults to ./src)");
  console.error("  cat file.tsx | npm run parser");
};

const isNativeBindingError = (error) => {
  const stack = [];
  let current = error;

  while (current) {
    stack.push(current);
    current = current.cause;
  }

  return stack.some((entry) => {
    const message = String(entry?.message ?? "");
    return (
      message.includes("Cannot find native binding") ||
      message.includes("MODULE_NOT_FOUND")
    );
  });
};

const loadOxcParseSync = async () => {
  try {
    const mod = await import("oxc-parser");
    return mod?.parseSync ?? null;
  } catch (error) {
    if (isNativeBindingError(error)) {
      console.warn(
        "oxc-parser native bindings are unavailable; falling back to the TypeScript parser."
      );
      return null;
    }
    throw error;
  }
};

const listSourceFiles = async (rootDir) => {
  const entries = await fs.readdir(rootDir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(rootDir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listSourceFiles(fullPath)));
      continue;
    }
    if (supportedExts.has(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }

  return files;
};

const offsetToLineColumn = (code, offset) => {
  if (typeof offset !== "number" || Number.isNaN(offset)) {
    return { line: null, column: null };
  }
  let line = 1;
  let column = 1;
  for (let i = 0; i < Math.min(offset, code.length); i += 1) {
    if (code[i] === "\n") {
      line += 1;
      column = 1;
    } else {
      column += 1;
    }
  }
  return { line, column };
};

const getLineContext = (code, line, column, radius = 2) => {
  if (!line) {
    return { lines: [], indicator: "" };
  }
  const allLines = code.split("\n");
  const start = Math.max(1, line - radius);
  const end = Math.min(allLines.length, line + radius);
  const lines = [];
  for (let current = start; current <= end; current += 1) {
    const content = allLines[current - 1] ?? "";
    lines.push({ line: current, content });
  }
  const indicator =
    column && column > 0 ? `${" ".repeat(column - 1)}^` : "^";
  return { lines, indicator };
};

const getScriptKindFromFilename = (filename) => {
  const ext = path.extname(filename).toLowerCase();
  if (ext === ".tsx") return ts.ScriptKind.TSX;
  if (ext === ".jsx") return ts.ScriptKind.JSX;
  if (ext === ".js" || ext === ".mjs" || ext === ".cjs") return ts.ScriptKind.JS;
  return ts.ScriptKind.TS;
};

const parseWithTypeScript = (filename, code) => {
  const source = ts.createSourceFile(
    filename,
    code,
    ts.ScriptTarget.Latest,
    true,
    getScriptKindFromFilename(filename)
  );

  const errors = (source.parseDiagnostics ?? []).map((diag) => {
    const position = source.getLineAndCharacterOfPosition(diag.start ?? 0);
    const line = (position?.line ?? 0) + 1;
    const column = (position?.character ?? 0) + 1;
    return {
      message: ts.flattenDiagnosticMessageText(diag.messageText, "\n"),
      line,
      column,
      codeframe: null,
      context: getLineContext(code, line, column, 2),
    };
  });

  return {
    errors,
    comments: [],
    module: "unknown",
    program: null,
  };
};

const parseWithSelectedParser = (filename, code, parseSync) => {
  if (parseSync) {
    return parseSync(filename, code);
  }
  return parseWithTypeScript(filename, code);
};

const parseFile = async (filename, parseSync) => {
  try {
    const code = await fs.readFile(filename, "utf8");
    const result = parseWithSelectedParser(filename, code, parseSync);
    const formattedErrors = (result.errors ?? []).map((error) => {
      const label = error?.labels?.[0];
      const position = offsetToLineColumn(code, label?.start);
      const context = getLineContext(code, position.line, position.column, 2);
      return {
        message: error?.message ?? "Unknown parse error",
        line: position.line,
        column: position.column,
        codeframe: error?.codeframe ?? null,
        context,
      };
    });
    return {
      file: filename,
      errors: formattedErrors,
    };
  } catch (error) {
    return {
      file: filename,
      errors: [
        {
          message: error?.message ?? String(error),
        },
      ],
    };
  }
};

const main = async () => {
  const parseSync = await loadOxcParseSync();

  if (!fileArg && !process.stdin.isTTY) {
    const code = await readStdin();
    const filename = "stdin.tsx";
    const result = parseWithSelectedParser(filename, code, parseSync);
    process.stdout.write(
      `${JSON.stringify(
        {
          errors: result.errors,
          comments: result.comments,
          module: result.module,
          program: result.program,
        },
        null,
        2
      )}\n`
    );
    return;
  }

  let target = fileArg ?? "src";
  try {
    const stats = await fs.stat(target);
    if (stats.isFile()) {
      const parsed = await parseFile(target, parseSync);
      process.stdout.write(`${JSON.stringify(parsed, null, 2)}\n`);
      return;
    }
  } catch (error) {
    if (fileArg) {
      console.error(`Failed to read path: ${fileArg}`);
      console.error(error?.message ?? error);
      process.exit(1);
    }
  }

  const rootDir = path.resolve(target);
  const files = await listSourceFiles(rootDir);
  const results = await Promise.all(
    files.map((file) => parseFile(file, parseSync))
  );
  const filesWithErrors = results.filter(
    (result) => Array.isArray(result.errors) && result.errors.length > 0
  );

  if (filesWithErrors.length === 0) {
    process.stdout.write("No parse errors found.\n");
    return;
  }

  const lines = [];
  for (const entry of filesWithErrors) {
    lines.push(entry.file);
    for (const err of entry.errors) {
      const location =
        err.line && err.column ? `:${err.line}:${err.column}` : "";
      lines.push(`  - ${err.message}${location}`);
      if (err.codeframe) {
        for (const frameLine of err.codeframe.trim().split("\n")) {
          lines.push(`    ${frameLine}`);
        }
        continue;
      }
      if (err.context?.lines?.length) {
        for (const ctxLine of err.context.lines) {
          lines.push(`    ${ctxLine.line} | ${ctxLine.content}`);
          if (ctxLine.line === err.line) {
            lines.push(`      | ${err.context.indicator}`);
          }
        }
      }
    }
  }
  process.stdout.write(`${lines.join("\n")}\n`);
};

main();
