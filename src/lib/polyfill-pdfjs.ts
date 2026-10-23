/** O pdfjs-dist recente usa Map/WeakMap.getOrInsertComputed, ausente em muitos navegadores. */
for (const C of [Map, WeakMap] as unknown as { prototype: Record<string, unknown> }[]) {
  const proto = C.prototype as Record<string, unknown> & {
    has(k: unknown): boolean;
    get(k: unknown): unknown;
    set(k: unknown, v: unknown): unknown;
  };
  if (typeof proto.getOrInsertComputed !== "function") {
    proto.getOrInsertComputed = function (this: typeof proto, k: unknown, fn: (k: unknown) => unknown) {
      if (this.has(k)) return this.get(k);
      const v = fn(k);
      this.set(k, v);
      return v;
    };
  }
  if (typeof proto.getOrInsert !== "function") {
    proto.getOrInsert = function (this: typeof proto, k: unknown, v: unknown) {
      if (!this.has(k)) this.set(k, v);
      return this.get(k);
    };
  }
}
export {};
