/** Simple incrementing reference generator, e.g. generateReference("PROD", 6) -> "PROD-000007". */
export function generateReference(prefix: string, currentCount: number): string {
  return `${prefix}-${String(currentCount + 1).padStart(6, "0")}`;
}
