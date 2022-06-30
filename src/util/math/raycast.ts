import { vec3 } from "gl-matrix";
import Collider from "../../core/components/collider/collider";
import { Triangle } from "../../core/components/collider/geometryCollider";

export type Ray = {
  origin: vec3,
  direction: vec3,
  length: number
}

const isPointInFront = (p1: vec3, p2: vec3, a: vec3, b: vec3): boolean => {
  const ba = vec3.sub(vec3.create(), b, a)
  const cp1 = vec3.cross(vec3.create(), ba, vec3.sub(vec3.create(), p1, a))
  const cp2 = vec3.cross(vec3.create(), ba, vec3.sub(vec3.create(), p2, a))

  if(vec3.dot(cp1, cp2) < 0) return false

  return true
}

const calcIntersectionPoint = (ray: Ray, triangle: Triangle): vec3 | null => {
  let intersectionPoint: vec3 | null = null
  const { origin, direction, length } = ray
  const { corners, normal } = triangle

  /*
    RAY
    point = ray origin + ray direction * distance

    PLANE
    0 = plane origin • plane normal

    DISTANCE FROM RAY TO PLANE
    d = -1.0 * ((ray origin - plane origin) • plane normal) / (ray direction • plane normal)
  */

  const d = -1.0 * (vec3.dot(vec3.sub(vec3.create(), origin, corners[0]), normal) / vec3.dot(direction, normal))
  if(d > length) return null

  intersectionPoint = vec3.add(vec3.create(), origin, vec3.scale(vec3.create(), direction, d))

  //const c = vec3.add(vec3.create(), vec3.scale(vec3.create(), corners[0], Math.random()), vec3.scale(vec3.create(), corners[1], Math.random()))
  if(!isPointInFront(intersectionPoint, corners[0], corners[1], corners[2]) ||
     !isPointInFront(intersectionPoint, corners[1], corners[0], corners[2]) ||
     !isPointInFront(intersectionPoint, corners[2], corners[0], corners[1]))
      return null 

  return intersectionPoint
}

export default function getIntersectionPoints(ray: Ray, collider: Array<Collider>): Array<vec3> {
  const intersectionPoints = new Array<vec3>()

  for(const { triangles } of collider as any) {
    for(const triangle of triangles as Array<Triangle>) {
      const intersectionPoint = calcIntersectionPoint(ray, triangle)
      if(!intersectionPoint) continue

      intersectionPoints.push(intersectionPoint)
      break
    }
  }

  // ToDo: sort by distance to ray origin
  return intersectionPoints
}