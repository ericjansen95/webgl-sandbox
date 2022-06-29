import { vec3, vec2, quat } from "gl-matrix"
import Entity from "../../scene/entity"
import Component, { ComponentEnum } from "../base/component"
import Input from "../../internal/input"
import Time from "../../internal/time"
import Transform from "../base/transform"
import Debug from "../../internal/debug"
import Animator from "../animation/animator"

const GLOBAL_FORWARD: vec3 = vec3.fromValues(0.0, 0.0, -1.0)

const ROTATE_SPEED: number = 3.0
const TRANSLATE_SPEED: number = 4.0

export default class ThirdPersonControls implements Component {
  type: ComponentEnum

  rotation: number
  position: vec3

  animator: Animator

  constructor(animator: Animator) {
    this.type = ComponentEnum.CONTROLS

    this.rotation = 0
    this.position = vec3.create()

    this.animator = animator
  }

  onUpdate = (self: Entity, camera: Entity) => {
    if(Debug.cameraEnabled) return

    // ROTATION
    const inputDirection: vec2 = [Input.isKeyDown('a') ? 1.0 : Input.isKeyDown('d') ? -1.0 : 0.0,
                                  Input.isKeyDown('w') ? 1.0 : Input.isKeyDown('s') ? -1.0 : 0.0]

    const transform = self.get(ComponentEnum.TRANSFORM) as Transform                              

    const rotateSpeed = inputDirection[0] * ROTATE_SPEED * Time.deltaTime;    
    this.rotation += rotateSpeed 

    const rotation = quat.create()
    quat.rotateY(rotation, rotation, this.rotation)

    if(rotateSpeed) transform.setLocalRotation(rotation)

    const forward = vec3.transformQuat(vec3.create(), GLOBAL_FORWARD, rotation)

    const translateSpeed = inputDirection[1] * TRANSLATE_SPEED * Time.deltaTime
    this.position = transform.getGlobalPosition()
    vec3.scaleAndAdd(this.position, this.position, forward,  translateSpeed)

    if(translateSpeed) transform.setLocalPosition(this.position)

    this.animator.animations[0].weight = translateSpeed ? 1.0 : 0.0
  }
}