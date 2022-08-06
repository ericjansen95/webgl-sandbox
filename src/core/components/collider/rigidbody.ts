import { vec3 } from "gl-matrix";
import { Ray } from "../../../util/math/raycast";
import { GLOBAL } from "../../constants";
import Time from "../../internal/time";
import Entity from "../../scene/entity";
import Component, { ComponentType } from "../base/component";
import Transform from "../base/transform";
import Collider, { getClosestIntersection } from "./collider";

export type RigidbodyState = {
  self: Entity
}

export type RigidbodyConfig = {
  RAY_HEIGHT_OFFSET: number
}

const DEFAULT_RIGIDBODY_CONFIG: RigidbodyConfig = Object.freeze({
  RAY_HEIGHT_OFFSET: 1.0
})

export default class Rigidbody implements Component {
  type: ComponentType
  state: RigidbodyState
  config: RigidbodyConfig

  constructor() {
    this.type = ComponentType.RIGIDBODY
    this.config = DEFAULT_RIGIDBODY_CONFIG
  }

  onAdd = (self: Entity) => {
    this.state = {
      self
    }
  }

  update = (colliders: Array<Collider>) => {
    const transform = this.state.self.get(ComponentType.TRANSFORM) as Transform
    const position = transform.localPosition

    const origin = vec3.clone(position)
    origin[1] += this.config.RAY_HEIGHT_OFFSET

    // check ground collision by casting a ray down from current position with slight offset
    const ray: Ray = {
      origin,
      direction: GLOBAL.DOWN,
      length: 2
    }
    const intersection = getClosestIntersection(ray, colliders)

    // correct y position with intersection position
    if(intersection)
      position[1] = intersection.position[1]

    // are we above the ground or closes collision point?
    // than simulate basic physics
    if (position[1] > (intersection ? intersection.position[1] : 0))
      position[1] += -9.81 * Time.deltaTime

    transform.setLocalPosition(position)
  }
}