import { vec3 } from "gl-matrix";
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
  const { origin, direction, length } = ray
  const { corners, normal } = triangle

  const distanceToPoint = -1.0 * (vec3.dot(vec3.sub(vec3.create(), origin, corners[0]), normal) / vec3.dot(direction, normal))
  if(distanceToPoint < 0 || distanceToPoint > length) return null

  const intersectionPoint = vec3.add(vec3.create(), origin, vec3.scale(vec3.create(), direction, distanceToPoint))

  if(!isPointInFront(intersectionPoint, corners[0], corners[1], corners[2]) ||
     !isPointInFront(intersectionPoint, corners[1], corners[0], corners[2]) ||
     !isPointInFront(intersectionPoint, corners[2], corners[0], corners[1]))
      return null

  return intersectionPoint
}

export default function getIntersectionPoints(ray: Ray, triangles: Array<Triangle>): Array<vec3> {
  const intersectionPoints = new Array<vec3>()

  for(const triangle of triangles) {
    const intersectionPoint = calcIntersectionPoint(ray, triangle)
    if(!intersectionPoint) continue

    intersectionPoints.push(intersectionPoint)
    break
  }

  // ToDo: sort by distance to ray origin
  return intersectionPoints
}