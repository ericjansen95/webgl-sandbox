import { vec3 } from "gl-matrix";
import { Ray } from "../../../util/math/raycast";
import Component, { ComponentEnum } from "../base/component";

export default class Collider implements Component {
  type: ComponentEnum
  getIntersectionPoints: (ray: Ray) => Array<vec3>

  constructor() {
    this.type = ComponentEnum.COLLIDER
  }
}