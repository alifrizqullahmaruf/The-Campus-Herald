/**
 * Whether an id from a URL can be looked up. URLs can hold any number, and PostgreSQL
 * rejects one that does not fit an integer column with an error, not an empty result.
 */
export function isValidId(id: number): boolean {
  return Number.isInteger(id) && id >= 1 && id <= 2147483647;
}
