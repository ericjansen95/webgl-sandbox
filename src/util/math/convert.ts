export const floatToScaledInt = (float: number): number => {
  return Math.round(float * 1000)
}

export const scaledIntToFloat = (int: unknown): number => {
  return Number(int) * 0.001
}

