import { quat, vec3 } from "gl-matrix";
import { createRay } from "../../../util/helper/ray";
import { Ray } from "../../../util/math/raycast";
import { GLOBAL } from "../../constants";
import Time from "../../internal/time";
import Entity from "../../scene/entity";
import Component, { ComponentType } from "../base/component";
import Transform from "../base/transform";
import UnlitMaterial from "../material/unlitMaterial";
import Collider, { getClosestIntersection } from "../collider/collider";
import { debug } from "console";
import Geometry from "../geometry/geometry";
import Debug from "../../internal/debug";

export type CharacterControllerState = {
  self: Entity

  localPosition: vec3
  wallCollisionRayRotations: Array<{
    direction: vec3,
    yRotation: number
  }>

  debug: boolean
  debugRays: Array<Entity> | null
}

export type CharacterControllerConfig = {
  WALL_COLLISION_HEIGHT_STEPS: number
  WALL_COLLISION_RAY_COUNT: number
  
  COLLIDER_RADIUS: number
  COLLIDER_HEIGHT: number

  STEP_HEIGHT: number
}

const DEFAULT_CHARACTER_CONTROLLER_CONFIG: CharacterControllerConfig = Object.freeze({
  WALL_COLLISION_HEIGHT_STEPS: 2,
  WALL_COLLISION_RAY_COUNT: 6,

  COLLIDER_RADIUS: 0.4,
  COLLIDER_HEIGHT: 1.7,

  STEP_HEIGHT: 0.5
})

export default class CharacterController implements Component {
  type: ComponentType
  state: CharacterControllerState
  config: CharacterControllerConfig

  debugRays: Array<Entity>

  constructor() {
    this.type = ComponentType.RIGIDBODY
    this.config = DEFAULT_CHARACTER_CONTROLLER_CONFIG

    Debug.console.registerCommand({ name: "cc", description: "Visualize character controller collider.", callback: this.toggleColliderDebug })
  }

  onAdd = (self: Entity) => {
    const wallCollisionRayRotations: CharacterControllerState["wallCollisionRayRotations"] = new Array()

    // cache ray directions for wall collision
    for(let rayStep = 1; rayStep <= this.config.WALL_COLLISION_RAY_COUNT; rayStep++) {
      const yRotation = Math.PI * 2 * (rayStep / this.config.WALL_COLLISION_RAY_COUNT)

      const direction = vec3.fromValues(-Math.cos(yRotation), 0, Math.sin(yRotation))
      vec3.normalize(direction, direction)

      wallCollisionRayRotations.push({
        direction,
        yRotation
      })
    }

    this.state = {
      self,

      localPosition: self.get(ComponentType.TRANSFORM).localPosition,
      wallCollisionRayRotations,

      debug: false,
      debugRays: null
    }
  }

  move = (position: vec3) => {
    this.state.localPosition = position
  }

  /*
    ToDo:
    - check behaviour at arbitaly angles
    - add basic gravity
    - check precision at low framerates
  */
  update = (colliders: Array<Collider>) => {
    const { localPosition } = this.state

    // WALL COLLISION
    for(let originHeight = this.config.STEP_HEIGHT; originHeight < this.config.COLLIDER_HEIGHT - this.config.STEP_HEIGHT; originHeight += (this.config.COLLIDER_HEIGHT - (this.config.STEP_HEIGHT * 2)) / this.config.WALL_COLLISION_HEIGHT_STEPS) {
      
      for(let rotationIndex = 0; rotationIndex < this.config.WALL_COLLISION_RAY_COUNT; rotationIndex++) {
        const origin = vec3.clone(localPosition)
        origin[1] += originHeight

        const { direction } = this.state.wallCollisionRayRotations[rotationIndex]

        const ray: Ray = {
          origin,
          direction,
          length: this.config.COLLIDER_RADIUS
        }

        const intersection = getClosestIntersection(ray, colliders)
        if(!intersection) continue

        const directionToIntersection = vec3.sub(vec3.create(), intersection.position, localPosition)
        directionToIntersection[1] = 0

        vec3.normalize(directionToIntersection, directionToIntersection)
        vec3.scale(directionToIntersection, directionToIntersection, -1)

        const distanceToIntersection = Math.sqrt(intersection.distance)
        vec3.scaleAndAdd(localPosition, localPosition, directionToIntersection, this.config.COLLIDER_RADIUS - distanceToIntersection)
      }
    }

    // GROUND COLLISION
    const origin = vec3.clone(localPosition)
    origin[1] += this.config.COLLIDER_HEIGHT

    const ray: Ray = {
      origin,
      direction: GLOBAL.DOWN,
      length: 4
    }

    const intersection = getClosestIntersection(ray, colliders)
    if(intersection)
      localPosition[1] = intersection.position[1]

    this.state.self.get(ComponentType.TRANSFORM).setLocalPosition(localPosition)
  }

  toggleColliderDebug = (): string => {
    this.state.debug = !this.state.debug

    if(this.state.debugRays)
      for(const debugRay of this.state.debugRays) {
        const rayGeometry = debugRay.get(ComponentType.GEOMETRY) as Geometry
        rayGeometry.visible = !rayGeometry.visible
      }
    else
      this.createDebugRays()

    return `CharacterController::toggleColliderDebug(): ${this.state.debug ? 'Enabled' : 'Disabled'} collider debug ray visiblity.`
  }

  private createDebugRays = () => {
    this.state.debugRays = new Array()

    for(let originHeight = this.config.STEP_HEIGHT; originHeight < this.config.COLLIDER_HEIGHT - this.config.STEP_HEIGHT; originHeight += (this.config.COLLIDER_HEIGHT - this.config.STEP_HEIGHT * 2) / this.config.WALL_COLLISION_HEIGHT_STEPS) {
      const localPosition = vec3.fromValues(0, 0, 0)
      localPosition[1] += originHeight

      for(let rotationIndex = 0; rotationIndex < this.config.WALL_COLLISION_RAY_COUNT; rotationIndex++) {
        const ray = createRay({ color: [0, 1, 0], length: this.config.COLLIDER_RADIUS })

        const { yRotation } = this.state.wallCollisionRayRotations[rotationIndex]

        const transform = ray.get(ComponentType.TRANSFORM) as Transform
        transform.setLocalPosition(localPosition)
        transform.setLocalRotation(quat.rotateY(quat.create(), quat.create(), yRotation))

        this.state.debugRays.push(ray)
        this.state.self.get(ComponentType.TRANSFORM).add(ray)
      }
    }
  }
}