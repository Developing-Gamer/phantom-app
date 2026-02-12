import fs from "node:fs/promises";
import path from "node:path";
import ts from "typescript";

const args = process.argv.slice(2);
const fileArg = args[0];
const supportedExts = new Set([".js", ".jsx", ".ts", ".tsx"]);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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
      console.log(
        "[parser] oxc-parser native bindings unavailable; falling back to TypeScript parser."
      );
      return null;
    }
    // Non-binding error: log clearly and fall back instead of crashing.
    console.log(
      `[parser] Failed to load oxc-parser: ${error?.message ?? error}; falling back to TypeScript parser.`
    );
    return null;
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

// ---------------------------------------------------------------------------
// Parsers
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// File parsing with proper error format normalisation
// ---------------------------------------------------------------------------

const normalizeErrors = (rawErrors, code, usedOxc) => {
  return (rawErrors ?? []).map((error) => {
    // oxc-parser format: errors have .labels[].start (byte offset) and .codeframe
    // TypeScript format: errors already have .line, .column, .context
    if (usedOxc) {
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
    }

    // TypeScript parser: position is already computed, preserve it.
    return {
      message: error?.message ?? "Unknown parse error",
      line: error?.line ?? null,
      column: error?.column ?? null,
      codeframe: error?.codeframe ?? null,
      context: error?.context ?? { lines: [], indicator: "" },
    };
  });
};

const parseFile = async (filename, parseSync) => {
  try {
    const code = await fs.readFile(filename, "utf8");
    const result = parseWithSelectedParser(filename, code, parseSync);
    const formattedErrors = normalizeErrors(result.errors, code, !!parseSync);
    return {
      file: filename,
      errors: formattedErrors,
    };
  } catch (error) {
    return {
      file: filename,
      errors: [
        {
          message: `Failed to read/parse file: ${error?.message ?? String(error)}`,
          line: null,
          column: null,
          codeframe: null,
          context: { lines: [], indicator: "" },
        },
      ],
    };
  }
};

// ---------------------------------------------------------------------------
// Output formatting
// ---------------------------------------------------------------------------

const formatHumanReadable = (filesWithErrors, totalErrors) => {
  const lines = [];
  lines.push(
    `Parse error: Found ${totalErrors} syntax error(s) in ${filesWithErrors.length} file(s):`
  );
  lines.push("");

  for (const entry of filesWithErrors) {
    for (const err of entry.errors) {
      const location =
        err.line && err.column ? `:${err.line}:${err.column}` : "";
      lines.push(`error: ${entry.file}${location} - ${err.message}`);

      if (err.codeframe) {
        for (const frameLine of err.codeframe.trim().split("\n")) {
          lines.push(`    ${frameLine}`);
        }
        lines.push("");
        continue;
      }
      if (err.context?.lines?.length) {
        for (const ctxLine of err.context.lines) {
          const marker = ctxLine.line === err.line ? ">" : " ";
          lines.push(`  ${marker} ${ctxLine.line} | ${ctxLine.content}`);
          if (ctxLine.line === err.line && err.context.indicator) {
            lines.push(`      | ${err.context.indicator}`);
          }
        }
        lines.push("");
      }
    }
  }

  return lines.join("\n");
};

const formatJsonSummary = (filesWithErrors, totalErrors, totalFiles) => {
  const summary = {
    passed: false,
    totalFiles,
    totalErrors,
    filesWithErrors: filesWithErrors.length,
    errors: filesWithErrors.flatMap((entry) =>
      entry.errors.map((err) => ({
        file: entry.file,
        line: err.line,
        column: err.column,
        message: err.message,
      }))
    ),
  };
  return JSON.stringify(summary);
};

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const main = async () => {
  const parseSync = await loadOxcParseSync();
  const parserName = parseSync ? "oxc-parser" : "typescript";
  console.log(`[parser] Using ${parserName} parser.`);

  // --- stdin mode ---
  // Only read from stdin when explicitly requested via --stdin flag.
  // Relying on !process.stdin.isTTY causes hangs in non-interactive environments
  // (sandboxes, CI, background processes) where isTTY is undefined but no data
  // is actually being piped.
  if (fileArg === "--stdin" || fileArg === "-") {
    const code = await readStdin();
    const filename = "stdin.tsx";
    const result = parseWithSelectedParser(filename, code, parseSync);
    const normalizedErrors = normalizeErrors(result.errors, code, !!parseSync);
    const parsed = {
      file: filename,
      errors: normalizedErrors,
      comments: result.comments ?? [],
      module: result.module ?? null,
      program: result.program ?? null,
    };
    process.stdout.write(
      `${JSON.stringify(parsed, null, 2)}\n`
    );
    if (normalizedErrors.length > 0) {
      process.exit(1);
    }
    return;
  }

  // --- single file or directory mode ---
  let target = fileArg && fileArg !== "--stdin" && fileArg !== "-" ? fileArg : "src";
  try {
    const stats = await fs.stat(target);
    if (stats.isFile()) {
      const parsed = await parseFile(target, parseSync);
      process.stdout.write(`${JSON.stringify(parsed, null, 2)}\n`);
      if (parsed.errors.length > 0) {
        process.exit(1);
      }
      return;
    }
  } catch (error) {
    if (fileArg) {
      console.log(
        `error: Failed to read path "${fileArg}": ${error?.message ?? error}`
      );
      process.exit(1);
    }
    // No fileArg — fall through to directory scan of "src"
  }

  // --- directory scan mode ---
  const rootDir = path.resolve(target);
  let files;
  try {
    files = await listSourceFiles(rootDir);
  } catch (error) {
    console.log(
      `error: Failed to scan directory "${rootDir}": ${error?.message ?? error}`
    );
    process.exit(1);
  }

  console.log(`[parser] Scanning ${files.length} source file(s) in ${rootDir}`);

  const results = await Promise.all(
    files.map((file) => parseFile(file, parseSync))
  );
  const filesWithErrors = results.filter(
    (result) => Array.isArray(result.errors) && result.errors.length > 0
  );

  if (filesWithErrors.length === 0) {
    console.log(
      `[parser] Success: parsed ${files.length} file(s) with 0 errors.`
    );
    return;
  }

  const totalErrors = filesWithErrors.reduce(
    (sum, entry) => sum + entry.errors.length,
    0
  );

  // Human-readable output with file locations and code context.
  process.stdout.write(`${formatHumanReadable(filesWithErrors, totalErrors)}\n`);

  // Machine-readable JSON summary on a single line for automated extraction.
  process.stdout.write(
    `\n__PARSER_RESULT__${formatJsonSummary(filesWithErrors, totalErrors, files.length)}\n`
  );

  process.exit(1);
};

main().catch((error) => {
  // Top-level safety net: if anything in main() throws unexpectedly, output a
  // clear, extractable error instead of crashing silently.
  const message = error?.message ?? String(error);
  const stack = error?.stack ?? "";
  console.log(`error: Parser crashed unexpectedly: ${message}`);
  if (stack) {
    console.log(stack);
  }
  console.log(
    `\n__PARSER_RESULT__${JSON.stringify({
      passed: false,
      totalFiles: 0,
      totalErrors: 1,
      filesWithErrors: 0,
      errors: [{ file: "unknown", line: null, column: null, message: `Parser internal error: ${message}` }],
    })}\n`
  );
  process.exit(1);
});
