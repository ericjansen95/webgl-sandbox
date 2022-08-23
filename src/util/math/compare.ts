export const equalPosition = (a: Array<number>, b: Array<number>) => {
  for (var i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]) return false;
  }
  return true
}