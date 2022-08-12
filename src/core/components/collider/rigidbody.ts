import { quat, vec3 } from "gl-matrix";
import { createRay } from "../../../util/helper/ray";
import { Ray } from "../../../util/math/raycast";
import { GLOBAL } from "../../constants";
import Entity from "../../scene/entity";
import Component, { ComponentType } from "../base/component";
import Transform from "../base/transform";
import Collider, { getClosestIntersection } from "./collider";

export type RigidbodyState = {
  self: Entity
}

export type RigidbodyConfig = {
  RAY_HEIGHT_OFFSET: number,
  CIRCLE_RAY_COUNT: number,
  CIRCLE_RADIUS: number
}

const DEFAULT_RIGIDBODY_CONFIG: RigidbodyConfig = Object.freeze({
  RAY_HEIGHT_OFFSET: 1.0,
  CIRCLE_RAY_COUNT: 6,
  CIRCLE_RADIUS: 0.3
})

export default class Rigidbody implements Component {
  type: ComponentType
  state: RigidbodyState
  config: RigidbodyConfig
  debugRays: Array<Entity>

  constructor() {
    this.type = ComponentType.RIGIDBODY
    this.config = DEFAULT_RIGIDBODY_CONFIG

    this.debugRays = new Array<Entity>()
  }

  onAdd = (self: Entity) => {
    this.state = {
      self
    }

    const wallRayOrigin = vec3.clone(vec3.fromValues(0, 0, 0))
    wallRayOrigin[1] += this.config.RAY_HEIGHT_OFFSET * 0.5

    for(let debugRayIndex = 0; debugRayIndex < this.config.CIRCLE_RAY_COUNT; debugRayIndex++) {
      const ray = createRay({ color: [0, 1, 0], length: this.config.CIRCLE_RADIUS })
      const transform = ray.get(ComponentType.TRANSFORM) as Transform
      transform.setLocalPosition(wallRayOrigin)
      this.debugRays.push(ray)
      this.state.self.get(ComponentType.TRANSFORM).add(ray)
    }
  }

  update = (colliders: Array<Collider>) => {
    const transform = this.state.self.get(ComponentType.TRANSFORM) as Transform
    const position = transform.localPosition

    const groundRayOrigin = vec3.clone(position)
    groundRayOrigin[1] += this.config.RAY_HEIGHT_OFFSET

    const wallRayOrigin = vec3.clone(position)
    wallRayOrigin[1] += this.config.RAY_HEIGHT_OFFSET * 0.5

    for(let rayStep = 1; rayStep <= this.config.CIRCLE_RAY_COUNT; rayStep++) {
      const radians = Math.PI * 2 * (rayStep / this.config.CIRCLE_RAY_COUNT)
      const rayDirection = vec3.fromValues(-Math.cos(radians), 0, Math.sin(radians))
      vec3.normalize(rayDirection, rayDirection)

      const debugRayTransform = this.debugRays[rayStep - 1].get(ComponentType.TRANSFORM) as Transform
      debugRayTransform.setLocalRotation(quat.setAxisAngle(quat.create(), GLOBAL.UP, radians))

      const debugRay = this.debugRays[rayStep - 1].get(ComponentType.GEOMETRY) as Ray

      this.debugRays[rayStep - 1].get(ComponentType.MATERIAL).color = [0, 1, 0]

      const ray: Ray = {
        origin: wallRayOrigin,
        direction: rayDirection,
        length: this.config.CIRCLE_RADIUS * 4
      }

      const intersection = getClosestIntersection(ray, colliders)
      // TMP Filter out nan and pow cicle radius since instersection distance is squared
      if(!intersection || intersection.distance > Math.pow(this.config.CIRCLE_RADIUS, 2)) continue

      this.debugRays[rayStep - 1].get(ComponentType.MATERIAL).color = [1, 0, 0]

      const directionToIntersection = vec3.sub(vec3.create(), intersection.position, position)
      directionToIntersection[1] = 0
      vec3.normalize(directionToIntersection, directionToIntersection)
      // TMP Inverse vector
      vec3.rotateY(directionToIntersection, directionToIntersection, vec3.fromValues(0, 0, 0), Math.PI)
      vec3.scaleAndAdd(position, position, directionToIntersection, Math.pow(this.config.CIRCLE_RADIUS, 2) - intersection.distance)
    }

    // check ground collision by casting a ray down from current position with slight offset
    const ray: Ray = {
      origin: groundRayOrigin,
      direction: GLOBAL.DOWN,
      length: 2
    }
    const intersection = getClosestIntersection(ray, colliders)

    // correct y position with intersection position
    if(intersection)
      position[1] = intersection.position[1]

    // are we above the ground or closes collision point?
    // than simulate basic physics
    //if (transform.localPosition[1] > (intersection ? intersection.position[1] : 0))
    //  transform.localPosition[1] += -9.81 * Time.deltaTime

    transform.setLocalPosition(vec3.clone(position))
  }
}