export default function clamp(value: number, min: number, max: number) {
  if(value < min)
    value += max
  if(value > max)
    value -= max

  return value
}