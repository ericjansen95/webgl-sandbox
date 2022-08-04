import { vec3 } from "gl-matrix";
import { Ray, sortIntersectionsByDistance } from "../../../util/math/raycast";
import Component, { ComponentType } from "../base/component";

export type IntersectionInfo = {
  distance: number,
  position: vec3
}

export const getClosestIntersection = (ray: Ray, colliders: Array<Collider>): IntersectionInfo | null => {
  let intersections = new Array<IntersectionInfo>()
      
  for(const collider of colliders) {
    const intersection = collider.getIntersections(ray)
    if(!intersection.length) continue

    intersections = intersections.concat(intersection)
  }

  if(!intersections.length) return null

  return sortIntersectionsByDistance(intersections)[0]
}

export default class Collider implements Component {
  type: ComponentType
  getIntersections: (ray: Ray) => Array<IntersectionInfo>

  constructor() {
    this.type = ComponentType.COLLIDER
  }
}