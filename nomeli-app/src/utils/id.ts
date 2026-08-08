let counter = 0;

/** Simple, dependency-free id generator — good enough for a local prototype. */
export function generateId(prefix = 'id'): string {
  counter += 1;
  return `${prefix}_${Date.now().toString(36)}_${counter}_${Math.random().toString(36).slice(2, 7)}`;
}
