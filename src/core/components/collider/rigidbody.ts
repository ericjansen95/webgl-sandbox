import { quat, vec3 } from "gl-matrix";
import { createRay } from "../../../util/helper/ray";
import { Ray } from "../../../util/math/raycast";
import { GLOBAL } from "../../constants";
import Entity from "../../scene/entity";
import Component, { ComponentType } from "../base/component";
import Transform from "../base/transform";
import UnlitMaterial from "../material/unlitMaterial";
import Collider, { getClosestIntersection } from "./collider";

export type RigidbodyState = {
  self: Entity,
  position: vec3
}

export type RigidbodyConfig = {
  RAY_HEIGHT_OFFSET: number,
  CIRCLE_RAY_COUNT: number,
  CIRCLE_RADIUS: number
}

const DEFAULT_RIGIDBODY_CONFIG: RigidbodyConfig = Object.freeze({
  RAY_HEIGHT_OFFSET: 1.0,
  CIRCLE_RAY_COUNT: 8,
  CIRCLE_RADIUS: 0.4
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
      self,
      position: self.get(ComponentType.TRANSFORM).localPosition
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

  move = (position: vec3) => {
    this.state.position = position
  }

  /*
    ToDo:
    - pass in player transform from controls logic to avoid wall jitter
    - check behaviour at arbitaly angles
    - abstract debug vis logic and add console toggle command
    - cleanup and state, config seperation
    - add basic gravity
    - add improved config logic for increased precision with ray circle check at head heigt and chest?
    - check precision at low framerates
    - cache most of the data on config change => positions / rotations for ray directions
  */
  update = (colliders: Array<Collider>) => {
    const { position } = this.state

    const groundRayOrigin = vec3.clone(position)
    groundRayOrigin[1] += this.config.RAY_HEIGHT_OFFSET

    const wallRayOrigin = vec3.clone(position)
    wallRayOrigin[1] += this.config.RAY_HEIGHT_OFFSET * 0.5

    for(let rayStep = 1; rayStep <= this.config.CIRCLE_RAY_COUNT; rayStep++) {
      const radians = Math.PI * 2 * (rayStep / this.config.CIRCLE_RAY_COUNT)
      const rayDirection = vec3.fromValues(-Math.cos(radians), 0, Math.sin(radians))
      vec3.normalize(rayDirection, rayDirection)

      const debugRay = this.debugRays[rayStep - 1]
      const debugRayTransform = debugRay.get(ComponentType.TRANSFORM) as Transform
      const debugRayMaterial = debugRay.get(ComponentType.MATERIAL) as UnlitMaterial

      const ray: Ray = {
        origin: wallRayOrigin,
        direction: rayDirection,
        length: this.config.CIRCLE_RADIUS * 4
      }

      const intersection = getClosestIntersection(ray, colliders)
      // TMP Filter out nan and pow cicle radius since instersection distance is squared
      if(!intersection) {
        debugRayMaterial.color = [0, 1, 0]
        continue
      }

      const distance = Math.sqrt(intersection.distance)
      if(distance > this.config.CIRCLE_RADIUS)  {
        debugRayMaterial.color = [0, 1, 0]
        continue
      }

      debugRayTransform.setLocalRotation(quat.setAxisAngle(quat.create(), GLOBAL.UP, radians))
      debugRayMaterial.color = [1, 0, 0]

      const directionToIntersection = vec3.sub(vec3.create(), intersection.position, position)
      directionToIntersection[1] = 0

      vec3.normalize(directionToIntersection, directionToIntersection)
      vec3.scale(directionToIntersection, directionToIntersection, -1)

      vec3.scaleAndAdd(position, position, directionToIntersection, this.config.CIRCLE_RADIUS - distance)
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

    this.state.self.get(ComponentType.TRANSFORM).setLocalPosition(position)
  }
}