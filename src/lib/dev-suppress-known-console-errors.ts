const knownConsoleErrorSubstrings = [
  "Encountered a script tag while rendering React component.",
];

if (process.env.NODE_ENV === "development" && typeof window !== "undefined") {
  const originalConsoleError = console.error;

  console.error = (...args: Parameters<typeof console.error>) => {
    const message = args
      .map((arg) => {
        if (typeof arg === "string") return arg;
        if (arg instanceof Error) return arg.message;
        return "";
      })
      .join(" ");

    if (
      knownConsoleErrorSubstrings.some((knownMessage) =>
        message.includes(knownMessage)
      )
    ) {
      return;
    }

    originalConsoleError(...args);
  };
}
