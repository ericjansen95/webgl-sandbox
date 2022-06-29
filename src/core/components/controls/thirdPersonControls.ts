import { vec3, vec2, quat } from "gl-matrix"
import Entity from "../../scene/entity"
import Component, { ComponentEnum } from "../base/component"
import Input from "../../internal/input"
import Time from "../../internal/time"
import Transform from "../base/transform"
import Debug from "../../internal/debug"

const GLOBAL_FORWARD: vec3 = vec3.fromValues(0.0, 0.0, -1.0)

const ROTATE_SPEED: number = 3.0
const TRANSLATE_SPEED: number = 4.0

export default class ThirdPersonControls implements Component {
  type: ComponentEnum

  rotation: number
  position: vec3

  constructor() {
    this.type = ComponentEnum.CONTROLS

    this.rotation = 0
    this.position = vec3.create()
  }

  onUpdate = (self: Entity, camera: Entity) => {
    if(Debug.cameraEnabled) return

    // ROTATION
    const rotateSpeed = ROTATE_SPEED * Time.deltaTime;

    const translateSpeed = TRANSLATE_SPEED * Time.deltaTime * (Input.isKeyDown('shift') ? 6.0 : 1.0)
    const inputDirection: vec2 = [Input.isKeyDown('a') ? 1.0 : Input.isKeyDown('d') ? -1.0 : 0.0,
                                  Input.isKeyDown('w') ? 1.0 : Input.isKeyDown('s') ? -1.0 : 0.0]

    this.rotation += rotateSpeed * inputDirection[0]

    const rotation = quat.create()
    quat.rotateY(rotation, rotation, this.rotation)

    // COORDINATE SYSTEM AXES

    const forward = vec3.transformQuat(vec3.create(), GLOBAL_FORWARD, rotation)
    const transform = self.get(ComponentEnum.TRANSFORM) as Transform

    // TRANSLATION

    this.position = transform.getGlobalPosition()
    vec3.scaleAndAdd(this.position, this.position, forward, inputDirection[1] * translateSpeed)

    transform.setLocalRotation(rotation)
    transform.setLocalPosition(this.position)
  }

  onAdd = (self: Entity) => {
    this.position = self.get(ComponentEnum.TRANSFORM).position
  }
}