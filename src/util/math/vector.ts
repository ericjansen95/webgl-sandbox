import { vec3 } from "gl-matrix";

export default function vec3ToRoundedArray(vec3: vec3): Array<number> {
  const x: number = roundNumber(vec3[0])
  const y: number = roundNumber(vec3[1])
  const z: number = roundNumber(vec3[2])

  return [x, y, z]
}

export function roundNumber(number: number): number {
  return Math.round(number * 1000) * 0.001
}