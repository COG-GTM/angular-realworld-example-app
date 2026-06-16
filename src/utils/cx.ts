/**
 * Tiny className helper. Accepts strings and a record of conditional classes,
 * mirroring Angular's `[ngClass]` ergonomics.
 */
export function cx(...args: Array<string | false | null | undefined | Record<string, boolean>>): string {
  const out: string[] = [];
  for (const arg of args) {
    if (!arg) continue;
    if (typeof arg === 'string') {
      out.push(arg);
    } else {
      for (const [key, value] of Object.entries(arg)) {
        if (value) out.push(key);
      }
    }
  }
  return out.join(' ');
}
