export function removeDuplicates<T>(
  items: T[],
  keyFn: (item: T) => string,
): T[] {
  const uniqueMap = new Map<string, T>();

  for (const item of items) {
    const key = keyFn(item);
    if (!uniqueMap.has(key)) {
      uniqueMap.set(key, item);
    }
  }

  return Array.from(uniqueMap.values());
}
