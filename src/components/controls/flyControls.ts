import { vec3, vec2, mat4 } from "gl-matrix"
import Entity from "../../core/entity"
import { Component } from "../component"
import Input from "../../core/input"
import degreeToRadians from "../../util/math/radians"
import Transform from "../transform"
import Time from "../../core/time"

const VECTOR_UP: vec3 = vec3.fromValues(0.0, -1.0, 0.0)

export default class FlyControls implements Component {
  forward: vec3
  side: vec3
  up: vec3

  center: vec3

  rotateSpeed: number
  translateSpeed: number
  inputDirection: vec3

  yaw: number
  pitch: number

  worldMatrix: mat4
  curPosition: vec3
  newPosition: vec3

  constructor() {
    this.forward = vec3.fromValues(0.0, 0.0, -1.0)
    this.side = vec3.fromValues(1.0, 0.0, 0.0)
    this.up = vec3.fromValues(0.0, 1.0, 0.0)

    this.rotateSpeed = 25000.0
    this.translateSpeed = 14.0
    this.inputDirection = vec3.create()

    this.center = this.forward

    this.yaw = -90.0
    this.pitch = 0.0

    this.curPosition = vec3.create()
    this.newPosition = vec3.create()
  }

  onUpdate = (self: Entity, camera: Entity) => {
    const deltaMousePosition: vec2 = Input.mouseState.deltaPosition

    this.yaw += deltaMousePosition[0] * this.rotateSpeed * Time.deltaTime
    this.pitch -= deltaMousePosition[1] * this.rotateSpeed * Time.deltaTime

    if(this.pitch > 89.0)
        this.pitch = 89.0
    if(this.pitch < -89.0)
        this.pitch = -89.0;

    const yawInRadians: number = degreeToRadians(this.yaw)
    const pitchInRadians: number = degreeToRadians(this.pitch) 

    this.forward[0] = Math.cos(yawInRadians) * Math.cos(pitchInRadians)
    this.forward[1] = Math.sin(pitchInRadians)
    this.forward[2] = Math.sin(yawInRadians) * Math.cos(pitchInRadians)

    vec3.normalize(this.forward, this.forward)
    vec3.cross(this.side, this.forward, VECTOR_UP)
    vec3.cross(this.up, this.forward, this.side)

    this.inputDirection = [Input.isKeyDown('a') ? 1.0 : Input.isKeyDown('d') ? -1.0 : 0.0,
                            Input.isKeyDown('e') ? 1.0 : Input.isKeyDown('q') ? -1.0 : 0.0,
                            Input.isKeyDown('w') ? 1.0 : Input.isKeyDown('s') ? -1.0 : 0.0]           

    this.newPosition = this.curPosition

    let translateSpeed: number = this.translateSpeed * Time.deltaTime
    translateSpeed *= Input.isKeyDown('shift') ? 2.5 : 1.0

    vec3.scaleAndAdd(this.newPosition, this.newPosition, this.side, this.inputDirection[0] * translateSpeed)
    vec3.scaleAndAdd(this.newPosition, this.newPosition, this.up, this.inputDirection[1] * translateSpeed)
    vec3.scaleAndAdd(this.newPosition, this.newPosition, this.forward, this.inputDirection[2] * translateSpeed)
 
    this.worldMatrix = mat4.create()

    vec3.add(this.center, this.curPosition, this.forward)

    mat4.translate(this.worldMatrix, this.worldMatrix, this.newPosition)
    mat4.lookAt(this.worldMatrix, this.curPosition, this.center, this.up)

    this.curPosition = this.newPosition

    self.getComponent("Transform").worldMatrix = this.worldMatrix
  }

  onAdd = (self: Entity) => {
    this.curPosition = self.getComponent("Transform").position
  }
}