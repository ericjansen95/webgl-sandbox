import { vec3, quat, vec2 } from "gl-matrix"
import Entity from "../../scene/entity"
import Component, { ComponentEnum } from "../base/component"
import Time from "../../internal/time"
import Transform from "../base/transform"
import Debug from "../../internal/debug"
import Collider, { getClosestIntersection } from "../collider/collider"
import { Ray } from "../../../util/math/raycast"
import Camera from "../base/camera"
import { ControlsOptions, ControlsStats, getControlsInputDirection, InputDirection } from "./controls"
import { GLOBAL } from "../../constants"
import Input from "../../internal/input"

export type FirstPersonControlsConfig = {
  ROTATE_SPEED: number
  TRANSLATE_SPEED: number

  CAMERA_Y_OFFSET: number

  GROUND_RAY_OFFSET: vec3
}

export type FirstPersonControlsState = {
  transform: Transform

  camera: FirstPersonControlsCameraState
  
  collider: Array<Collider>

  forward: vec3

  currentRotation: vec2
  currentPosition: vec3
}

type FirstPersonControlsCameraState = {
  component: Camera
  transform: Transform

  currentPosition: vec3
  currentRotation: quat
}

const FIRST_PERSON_CONTROLS_DEFAULT_CONFIG: FirstPersonControlsConfig = Object.freeze({
  ROTATE_SPEED: 400.0,
  TRANSLATE_SPEED: 1.42, // m/s

  CAMERA_Y_OFFSET: 1.6,

  GROUND_RAY_OFFSET: vec3.fromValues(0.0, 1.0, 0.0)
})

export default class FirstPersonControls implements Component {
  type: ComponentEnum
  stats: ControlsStats
  config: FirstPersonControlsConfig
  state: FirstPersonControlsState

  constructor({ camera, collider }: ControlsOptions) {
    this.type = ComponentEnum.CONTROLS

    this.config = FIRST_PERSON_CONTROLS_DEFAULT_CONFIG

    const transform = camera.get(ComponentEnum.TRANSFORM) as Transform
    this.state = {
      transform: null,

      camera: {
        component: camera.get(ComponentEnum.CAMERA) as Camera,
        transform,
  
        currentPosition: vec3.create(),
        currentRotation: quat.create(),
      },
  
      collider,

      forward: vec3.clone(GLOBAL.FORWARD),

      currentRotation: vec2.create(),
      currentPosition: vec3.create()
    }

    this.stats = {
      isMoving: false,
      isRotating: false,
      speed: 0
    }
  }

  private updateRotation = () => {
    const { deltaPosition } = Input.mouseState

    if(vec2.sqrLen(deltaPosition) === 0) {
      this.stats.isRotating = false
      return
    }

    const inputRotation = vec2.clone(deltaPosition)
    vec2.scale(inputRotation, inputRotation, this.config.ROTATE_SPEED * Time.deltaTime)

    vec2.sub(this.state.currentRotation, this.state.currentRotation, inputRotation)

    if(this.state.currentRotation[1] < -1)
    this.state.currentRotation[1] = -1 

    if(this.state.currentRotation[1] > 1)
    this.state.currentRotation[1] = 1

    // transform y rotation to quaternion
    const rotation = quat.create()
    
    quat.rotateY(rotation, rotation, this.state.currentRotation[0])

    // update forward vector if rotation changed
    vec3.transformQuat(this.state.forward, GLOBAL.FORWARD, rotation)

    // set new rotation
    this.state.transform.setLocalRotation(rotation)

    quat.rotateX(rotation, rotation, this.state.currentRotation[1])

    this.state.camera.currentRotation = quat.clone(rotation)
    
    this.stats.isRotating = true
  }

  private updateTranslation = () => {
    const inputDirection = getControlsInputDirection()

    if(vec2.sqrLen(inputDirection as vec2) === 0) {
      this.stats.isMoving = false
      return
    }

    // update position with current velocity
    this.state.currentPosition = this.state.transform.getGlobalPosition()
    vec3.scaleAndAdd(this.state.currentPosition, this.state.currentPosition, this.state.forward, inputDirection[1] * this.config.TRANSLATE_SPEED * Time.deltaTime)

    const side = vec3.cross(vec3.create(), this.state.forward, GLOBAL.UP)
    vec3.scaleAndAdd(this.state.currentPosition, this.state.currentPosition, side, -1.0 * inputDirection[0] * this.config.TRANSLATE_SPEED * Time.deltaTime)

    // check ground collision by casting a ray down from current position with slight offset
    const ray: Ray = {
      origin: vec3.add(vec3.create(), this.state.currentPosition, this.config.GROUND_RAY_OFFSET),
      direction: GLOBAL.DOWN,
      length: 2
    }
    const intersection = getClosestIntersection(ray, this.state.collider)

    // correct y position with intersection position
    this.state.currentPosition[1] = intersection ? intersection.position[1] : 0.0

    this.state.transform.setLocalPosition(this.state.currentPosition)

    this.stats.isMoving = true
  }

  private updateCameraTransform = () => {
    vec3.copy(this.state.camera.currentPosition, this.state.currentPosition)
    vec3.add(this.state.camera.currentPosition, this.state.camera.currentPosition, [0, this.config.CAMERA_Y_OFFSET, 0])

    this.state.camera.transform.setLocalRotation(this.state.camera.currentRotation)
    this.state.camera.transform.setLocalPosition(this.state.camera.currentPosition)
  }

  onAdd = (self: Entity) => {
    this.state.transform = self.get(ComponentEnum.TRANSFORM) as Transform
  }

  onUpdate = (self: Entity, camera: Entity) => {
    if(Debug.cameraEnabled) return                              

    this.updateRotation()
    this.updateTranslation()

    this.updateCameraTransform()
  }
}