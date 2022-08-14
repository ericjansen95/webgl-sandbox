import { vec3 } from "gl-matrix";
import { IntersectionInfo } from "../../core/components/collider/collider";
import { Triangle } from "../../core/components/collider/geometryCollider";
import Entity from "../../core/scene/entity";

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

const calcIntersectionPosition = (ray: Ray, triangle: Triangle): vec3 | null => {
  const { origin, direction, length } = ray
  const { corners, normal } = triangle

  // ToDo: Check why distanceToPoint is sometimes NaN or Infinite
  const distanceToPoint = -1.0 * (vec3.dot(vec3.sub(vec3.create(), origin, corners[0]), normal) / vec3.dot(direction, normal))
  if(distanceToPoint > length || isNaN(distanceToPoint) || distanceToPoint < 0 ) return null

  const intersectionPosition = vec3.add(vec3.create(), origin, vec3.scale(vec3.create(), direction, distanceToPoint))

  if(!isPointInFront(intersectionPosition, corners[0], corners[1], corners[2]) ||
     !isPointInFront(intersectionPosition, corners[1], corners[0], corners[2]) ||
     !isPointInFront(intersectionPosition, corners[2], corners[0], corners[1]))
      return null

  return intersectionPosition
}

export const sortIntersectionsByDistance = (intersections: Array<IntersectionInfo>) => intersections.sort(({distance: firstDistance}, {distance: secondDistance}) => firstDistance < secondDistance ? -1 : 1) 

export default function getIntersections(ray: Ray, triangles: Array<Triangle>, entity: Entity): Array<IntersectionInfo> {
  const intersections = new Array<IntersectionInfo>()

  for(const triangle of triangles) {
    const position = calcIntersectionPosition(ray, triangle)
    if(!position) continue

    intersections.push({
      distance: vec3.sqrDist(ray.origin, position),
      position,
      entity
    })
    break
  }

  return intersections
}