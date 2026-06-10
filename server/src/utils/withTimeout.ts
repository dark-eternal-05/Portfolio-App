export async function withTimeout<T>(
  promise: Promise<T>,
  ms = 3000,
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(
        () => reject(new Error("Operation timed out")),
        ms,
      ),
    ),
  ]);
}