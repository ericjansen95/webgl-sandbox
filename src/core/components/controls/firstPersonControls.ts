import { vec3, quat, vec2 } from "gl-matrix"
import Entity from "../../scene/entity"
import Component, { ComponentType } from "../base/component"
import Time from "../../internal/time"
import Transform from "../base/transform"
import Debug from "../../internal/debug"
import Camera from "../base/camera"
import { ControlsOptions, ControlsStats, getControlsInputDirection, InputDirection } from "./controls"
import { GLOBAL } from "../../constants"
import Input from "../../internal/input"
import { Ray } from "../../../util/math/raycast"
import Physics from "../../internal/physics"

export type FirstPersonControlsConfig = {
  ROTATE_SPEED: number
  TRANSLATE_SPEED: number

  CAMERA_Y_OFFSET: number

  GROUND_RAY_OFFSET: vec3

  MAX_INTERACTION_DISTANCE: number
}

export type FirstPersonControlsState = {
  self: Entity
  transform: Transform

  camera: FirstPersonControlsCameraState

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
  ROTATE_SPEED: 0.8,
  TRANSLATE_SPEED: 3, // m/s

  CAMERA_Y_OFFSET: 1.6,

  GROUND_RAY_OFFSET: vec3.fromValues(0.0, 1.0, 0.0),

  MAX_INTERACTION_DISTANCE: 1.5
})

export default class FirstPersonControls implements Component {
  type: ComponentType
  stats: ControlsStats
  config: FirstPersonControlsConfig
  state: FirstPersonControlsState

  constructor({ camera }: ControlsOptions) {
    this.type = ComponentType.SCRIPT

    this.config = FIRST_PERSON_CONTROLS_DEFAULT_CONFIG

    const transform = camera.get(ComponentType.TRANSFORM) as Transform
    this.state = {
      self: null,
      transform: null,

      camera: {
        component: camera.get(ComponentType.CAMERA) as Camera,
        transform,
  
        currentPosition: vec3.create(),
        currentRotation: quat.create(),
      },

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
    const { deltaTranslation } = Input.mouseState

    if(vec2.sqrLen(deltaTranslation) === 0) {
      this.stats.isRotating = false
      return
    }

    const inputRotation = vec2.clone(deltaTranslation)
    vec2.scale(inputRotation, inputRotation, this.config.ROTATE_SPEED * Time.deltaTime)

    vec2.sub(this.state.currentRotation, this.state.currentRotation, inputRotation)

    this.state.currentRotation[1] = Math.min(Math.max(-1, this.state.currentRotation[1]), 1)

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

    this.state.self.get(ComponentType.RIGIDBODY).move(this.state.currentPosition)

    this.stats.isMoving = true
  }

  private updateCameraTransform = () => {
    vec3.copy(this.state.camera.currentPosition, this.state.self.get(ComponentType.TRANSFORM).localPosition)
    this.state.camera.currentPosition[1] += this.config.CAMERA_Y_OFFSET

    this.state.camera.transform.setLocalRotation(this.state.camera.currentRotation)
    this.state.camera.transform.setLocalPosition(this.state.camera.currentPosition)
  }

  interact = () => {
    const origin = vec3.clone(this.state.currentPosition)
    origin[1] += this.config.CAMERA_Y_OFFSET

    const ray = {
      origin,
      direction: this.state.forward, // TMP should be view direction form camera
      length: this.config.MAX_INTERACTION_DISTANCE
    } as Ray

    const intersectionInfo = Physics.getIntersection(ray)
    if(!intersectionInfo) return

    const { entity } = intersectionInfo
    if(Input.isKeyDown('e') && entity.meta.name.includes('Door')) {
      const entityTransform = entity.get(ComponentType.TRANSFORM) as Transform
      entityTransform.setLocalEulerRotation([0, Math.PI * -0.5, 0])
    }
  }

  onAdd = (self: Entity) => {
    this.state.self = self
    this.state.transform = this.state.self.get(ComponentType.TRANSFORM) as Transform
  }

  onUpdate = (self: Entity, camera: Entity) => {
    if(Debug.cameraEnabled) return                              

    this.updateRotation()
    this.updateTranslation()

    this.updateCameraTransform()

    this.interact()
  }
}