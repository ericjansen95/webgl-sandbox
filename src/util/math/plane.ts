import { vec3 } from "gl-matrix"

export type Plane = {
  position: vec3
  normal: vec3,
}

export function createPlaneFromPoints(p1: vec3, p2: vec3, p3: vec3, zFar: number): Plane {
  const p1p2: vec3 = vec3.create()
  vec3.sub(p1p2, p2, p1)

  const p1p3: vec3 = vec3.create()
  vec3.sub(p1p3, p3, p1)

  const normal: vec3 = vec3.create()
  normal[0] = (p1p2[1] * p1p3[2]) - (p1p2[2] - p1p3[1])
  normal[1] = (p1p2[2] * p1p3[0]) - (p1p2[0] - p1p3[2])
  normal[2] = (p1p2[0] * p1p3[1]) - (p1p2[1] - p1p3[0])
  vec3.normalize(normal, normal)

  const position: vec3 = p1
  vec3.scaleAndAdd(position, position, normal, zFar * 0.5)

  return {
    position,
    normal,
  }
}

export function createPlane(): Plane {
  return {
    position: vec3.create(),
    normal: vec3.create()
  }
}