import { vec3 } from "gl-matrix";
import { Ray, sortIntersectionsByDistance } from "../../../util/math/raycast";
import Entity from "../../scene/entity";
import Component, { ComponentEnum } from "../base/component";

export type IntersectionInfo = {
  distance: number,
  position: vec3
}

export const getClosestIntersection = (ray: Ray, collider: Array<Collider>): IntersectionInfo | null => {
  let intersections = new Array<IntersectionInfo>()
      
  for(const entry of collider) {
    const intersection = entry.getIntersecetions(ray)
    if(!intersection.length) continue

    intersections = intersections.concat(intersection)
  }

  if(!intersections.length) return null

  return sortIntersectionsByDistance(intersections)[0]
}

export default class Collider implements Component {
  type: ComponentEnum
  getIntersecetions: (ray: Ray) => Array<IntersectionInfo>

  constructor() {
    this.type = ComponentEnum.COLLIDER
  }
}