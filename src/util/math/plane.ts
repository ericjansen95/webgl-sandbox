import { vec3 } from "gl-matrix"

export type Plane = {
  distance: number
  normal: vec3,
}

export function createPlaneFromPoints(p1: vec3, p2: vec3, p3: vec3): Plane {
  const p1p2: vec3 = vec3.create()
  vec3.sub(p1p2, p2, p1)

  const p1p3: vec3 = vec3.create()
  vec3.sub(p1p3, p3, p1)

  const normal: vec3 = vec3.create()
  vec3.cross(normal, p1p2, p1p3)
  vec3.normalize(normal, normal)

  const distance: number = vec3.len(vec3.sub(vec3.create(), p3, p1))

  return {
    distance,
    normal,
  }
}

export function createPlane(): Plane {
  return {
    distance: 0.0,
    normal: vec3.create()
  }
}