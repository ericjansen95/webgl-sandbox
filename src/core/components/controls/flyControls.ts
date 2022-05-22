import { vec3, vec2, mat4, quat } from "gl-matrix"
import Entity from "../../scene/entity"
import { Component } from "../component"
import Input from "../../internal/input"
import Time from "../../internal/time"

const VECTOR_UP: vec3 = vec3.fromValues(0.0, -1.0, 0.0)

const MAX_YAW_ANGEL: number = Math.PI * 0.45
const ROTATE_SPEED: number = 150.0
const TRANSLATE_SPEED: number = 14.0

export default class FlyControls implements Component {
  angleRotation: vec2
  position: vec3

  constructor() {
    this.angleRotation = vec2.create()
  }

  onUpdate = (self: Entity, camera: Entity) => {
    // ROTATION

    // x: yaw, y: pitch
    const deltaMousePosition = vec2.clone(Input.mouseState.deltaPosition)
    vec2.scale(deltaMousePosition, deltaMousePosition, -1.0)
    const rotateSpeed = ROTATE_SPEED * Time.deltaTime;

    vec2.add(this.angleRotation, this.angleRotation, vec2.scale(deltaMousePosition, deltaMousePosition, rotateSpeed))

    if(this.angleRotation[1] > MAX_YAW_ANGEL)
      this.angleRotation[1] = MAX_YAW_ANGEL
    if(this.angleRotation[1] < -MAX_YAW_ANGEL)
      this.angleRotation[1] = -MAX_YAW_ANGEL;

    const rotation = quat.create()
    quat.rotateY(rotation, rotation, this.angleRotation[0])
    quat.rotateX(rotation, rotation, this.angleRotation[1])

    // COORDINATE SYSTEM AXES

    const forward = vec3.transformQuat(vec3.create(), vec3.fromValues(0.0, 0.0, -1.0), rotation)
    const side = vec3.cross(vec3.create(), forward, VECTOR_UP)
    const up = vec3.cross(vec3.create(), forward, side)

    // TRANSLATION

    this.position = self.getComponent("Transform").getPosition()

    const translateSpeed = TRANSLATE_SPEED * Time.deltaTime * (Input.isKeyDown('shift') ? 6.0 : 1.0)
    const inputDirection: vec3 = [Input.isKeyDown('a') ? 1.0 : Input.isKeyDown('d') ? -1.0 : 0.0,
                                  Input.isKeyDown('e') ? 1.0 : Input.isKeyDown('q') ? -1.0 : 0.0,
                                  Input.isKeyDown('w') ? 1.0 : Input.isKeyDown('s') ? -1.0 : 0.0]

    vec3.scaleAndAdd(this.position, this.position, side, inputDirection[0] * translateSpeed)
    vec3.scaleAndAdd(this.position, this.position, up, inputDirection[1] * translateSpeed)
    vec3.scaleAndAdd(this.position, this.position, forward, inputDirection[2] * translateSpeed)

    // CONSTRUCT MATRIX

    const rotationMatrix = mat4.fromQuat(mat4.create(), rotation)
    const translationMatrix = mat4.fromTranslation(mat4.create(), this.position)

    // UPDATE ENTITY TRANSFORM

    self.getComponent("Transform").worldMatrix = mat4.mul(mat4.create(), translationMatrix, rotationMatrix)
  }

  onAdd = (self: Entity) => {
    this.position = self.getComponent("Transform").position
  }
}