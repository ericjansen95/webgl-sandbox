import { vec3 } from "gl-matrix"

export type Plane = {
  position: vec3
  normal: vec3,
}

export function createPlaneFromPoints(p1: vec3, p2: vec3, p3: vec3): Plane {
  const position: vec3 = vec3.create()
  position[0] = p3[0] - p1[0]
  position[1] = p2[1] - p1[1]
  position[2] = p2[2] - p1[2]

  /*
  console.log("p1 =", p1.toString())
  console.log("p2 =", p2.toString())
  console.log("p3 =", p3.toString())
  */
 
  const v: vec3 = vec3.create()
  vec3.sub(v, p2, p1)

  const w: vec3 = vec3.create()
  vec3.sub(w, p3, p1)

  const normal: vec3 = vec3.create()
  normal[0] = (v[1] * w[2]) - (v[2] - w[1])
  normal[1] = (v[2] * w[0]) - (v[0] - w[2])
  normal[2] = (v[0] * w[1]) - (v[1] - w[0])
  vec3.normalize(normal, normal)

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