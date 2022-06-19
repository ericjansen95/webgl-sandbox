export function roundNumber(number: number): number {
  return Math.round(number * 1000) * 0.001
}