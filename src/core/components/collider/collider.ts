import { vec3 } from "gl-matrix";
import { Ray } from "../../../util/math/raycast";
import Component, { ComponentEnum } from "../base/component";

export type IntersectionInfo = {
  distance: number,
  position: vec3
}

export default class Collider implements Component {
  type: ComponentEnum
  getIntersecetions: (ray: Ray) => Array<IntersectionInfo>

  constructor() {
    this.type = ComponentEnum.COLLIDER
  }
}