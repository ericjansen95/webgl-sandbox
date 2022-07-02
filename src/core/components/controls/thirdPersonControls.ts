import { vec3, quat } from "gl-matrix"
import Entity from "../../scene/entity"
import Component, { ComponentEnum } from "../base/component"
import Time from "../../internal/time"
import Transform from "../base/transform"
import Debug from "../../internal/debug"
import Animator from "../animation/animator"
import Collider, { getClosestIntersection } from "../collider/collider"
import UnlitMaterial from "../material/unlitMaterial"
import { Ray } from "../../../util/math/raycast"
import Camera from "../base/camera"
import clamp from "../../../util/math/clamp"
import { getControlsInputDirection, InputDirection } from "./controls"
import { GLOBAL } from "../../constants"

export type ThirdPersonControlsOptions = {
  camera: Entity

  animator: ThirdPersonControlsState["animator"]

  collider: ThirdPersonControlsState["collider"]
  rayMaterial: ThirdPersonControlsState["rayMaterial"]
}

export type ThirdPersonControlsConfig = {
  ROTATE_VELOCITY: number
  TRANSLATE_VELOCITY: number

  CAMERA_DISTANCE: number
  CAMERA_HEIGHT: number
  CAMERA_X_ROTATION: number

  GROUND_RAY_OFFSET: vec3
}

export type ThirdPersonControlsState = {
  transform: Transform

  camera: ThirdPersonControlsCameraState

  animator: Animator
  
  collider: Array<Collider>
  rayMaterial: UnlitMaterial

  forward: vec3

  currentRotationVelocity: number
  currentRotation: number

  currentTranslationVelocity: number
  speed: number

  currentPosition: vec3

  isMoving: boolean
  isRotating: boolean
}

type ThirdPersonControlsCameraState = {
  component: Camera
  transform: Transform

  currentPosition: vec3
  targetPosition: vec3
}

const THIRD_PERSON_CONTROLS_DEFAULT_CONFIG: ThirdPersonControlsConfig = Object.freeze({
  ROTATE_VELOCITY: 2.0,
  TRANSLATE_VELOCITY: 1.42,//1.42, // m/s

  CAMERA_DISTANCE: 2.5,
  CAMERA_HEIGHT: 1.3,
  CAMERA_X_ROTATION: Math.PI * 0.25,

  GROUND_RAY_OFFSET: vec3.fromValues(0.0, 1.0, 0.0)
})

export default class ThirdPersonControls implements Component {
  type: ComponentEnum
  config: ThirdPersonControlsConfig
  state: ThirdPersonControlsState

  constructor({ camera, animator, collider, rayMaterial }: ThirdPersonControlsOptions) {
    this.type = ComponentEnum.CONTROLS

    this.config = THIRD_PERSON_CONTROLS_DEFAULT_CONFIG

    const transform = camera.get(ComponentEnum.TRANSFORM) as Transform
    this.state = {
      transform: null,

      camera: {
        component: camera.get(ComponentEnum.CAMERA) as Camera,
        transform,
  
        currentPosition: vec3.create(),
        targetPosition: vec3.create(),
      },
  
      animator,
  
      collider,
      rayMaterial,

      forward: vec3.clone(GLOBAL.FORWARD),

      currentRotationVelocity: 0,
      currentRotation: 0,

      currentTranslationVelocity: 0,
      currentPosition: vec3.create(),
      speed: 0,

      isMoving: false,
      isRotating: false,
    }
  }

  updateRotation = (inputDirection: InputDirection) => {
    if(inputDirection === 0) {
      this.state.isRotating = false
      return
    }

    // update and clamp y rotation
    this.state.currentRotation += inputDirection * this.config.ROTATE_VELOCITY * Time.deltaTime
    clamp(this.state.currentRotation, 0, Math.PI * 2)

    // transform y rotation to quaternion
    const rotation = quat.create()
    quat.rotateY(rotation, rotation, this.state.currentRotation)

    // update forward vector if rotation changed
    vec3.transformQuat(this.state.forward, GLOBAL.FORWARD, rotation)

    // set new rotation
    this.state.transform.setLocalRotation(rotation)
    
    this.state.isRotating = true
  }

  updateTranslation = (inputDirection: InputDirection) => {
    // increase or dampen translate velocity
    if(inputDirection !== 0) this.state.currentTranslationVelocity += inputDirection * this.config.TRANSLATE_VELOCITY * Time.deltaTime
    else if (this.state.currentTranslationVelocity !== 0) this.state.currentTranslationVelocity *= 36 * this.config.TRANSLATE_VELOCITY * Time.deltaTime

    // clamp velocity to max or return if under threshold of 5%
    const absTranslationVelocity = Math.abs(this.state.currentTranslationVelocity)
    if(absTranslationVelocity > this.config.TRANSLATE_VELOCITY * 0.01) this.state.currentTranslationVelocity = this.config.TRANSLATE_VELOCITY * 0.01 * inputDirection
    else if (absTranslationVelocity < this.config.TRANSLATE_VELOCITY * 0.0005) {
      this.state.currentTranslationVelocity = 0
      this.state.speed = this.state.currentTranslationVelocity
      this.state.isMoving = false
      return
    }

    this.state.speed = (Math.abs(this.state.currentTranslationVelocity) / (this.config.TRANSLATE_VELOCITY * 0.01))

    // update position with current velocity
    this.state.currentPosition = this.state.transform.getGlobalPosition()
    vec3.scaleAndAdd(this.state.currentPosition, this.state.currentPosition, this.state.forward, this.state.currentTranslationVelocity)

    // check ground collision by casting a ray down from current position with slight offset
    const ray: Ray = {
      origin: vec3.add(vec3.create(), this.state.currentPosition, this.config.GROUND_RAY_OFFSET),
      direction: GLOBAL.DOWN,
      length: 2
    }
    const intersection = getClosestIntersection(ray, this.state.collider)

    // correct y position with intersection position
    this.state.currentPosition[1] = intersection ? intersection.position[1] : 0.0
    this.state.rayMaterial.color = intersection ? [0.0, 1.0, 0.0] : [1.0, 0.0, 0.0]

    this.state.transform.setLocalPosition(this.state.currentPosition)

    this.state.isMoving = true
  }

  updateCameraTransform = () => {
    const inverseForward = vec3.scale(vec3.create(), this.state.forward, -1)
    
    vec3.scaleAndAdd(this.state.camera.targetPosition, this.state.currentPosition, inverseForward, this.config.CAMERA_DISTANCE)
    this.state.camera.targetPosition[1] += this.config.CAMERA_HEIGHT

    vec3.lerp(this.state.camera.currentPosition, this.state.camera.targetPosition, this.state.camera.currentPosition, this.state.speed *  0.75)
    
    this.state.camera.transform.setLocalPosition(this.state.camera.currentPosition)
    this.state.camera.transform.setLocalEulerRotation([0, this.state.currentRotation, 0])
  }

  onAdd = (self: Entity) => {
    this.state.transform = self.get(ComponentEnum.TRANSFORM) as Transform
  }

  onUpdate = (self: Entity, camera: Entity) => {
    this.state.animator.animations[1].weight = this.state.speed * 0.4

    if(Debug.cameraEnabled) return                              

    const inputDirection = getControlsInputDirection()

    this.updateRotation(inputDirection[0])
    this.updateTranslation(inputDirection[1])

    this.updateCameraTransform()
  }
}