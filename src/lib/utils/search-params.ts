export type ParamPatch = Record<string, string | null | undefined>;

export function applyParamPatch(current: string, patch: ParamPatch): string {
  const next = new URLSearchParams(current);
  for (const [key, value] of Object.entries(patch)) {
    if (value === null || value === undefined || value === "") {
      next.delete(key);
    } else {
      next.set(key, value);
    }
  }
  next.sort();
  return next.toString();
}
