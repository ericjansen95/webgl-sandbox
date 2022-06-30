import { vec3 } from "gl-matrix";
import { Ray } from "../../../util/math/raycast";
import Collider from "./collider";

export default class HeightmapCollider extends Collider {
  constructor() {
    super()
  }

  getIntersectionPoints = (ray: Ray): Array<vec3> => {
    return []
  }
}