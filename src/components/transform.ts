import { mat4, vec3 } from "gl-matrix";
import Camera from "../camera";
import Entity from "../entity";
import { Component } from "./component";

export default class Transform implements Component {
  position: vec3
  rotation: vec3
  scale: vec3

  dirty: boolean
  autoUpdate: boolean

  worldMatrix: mat4

  parent: Transform | null
  children: Array<Entity>
  
  constructor() {
    this.position = vec3.create()
    this.rotation = vec3.create()
    this.scale = vec3.create()
    this.scale.fill(1.0)

    this.dirty = true
    this.autoUpdate = true

    this.worldMatrix = mat4.create()

    this.parent = null
    this.children = new Array<Entity>()
  }

  setPosition = (position: vec3) => {
    this.position = position
    this.dirty = true
  }

  setRotation = (rotation: vec3) => {
    this.rotation = rotation
    this.dirty = true
  }

  setScale = (scale: vec3) => {
    this.scale = scale
    this.dirty = true
  }

  addChild = (entity: Entity) => {
    entity.getComponent(Transform).parent = this
    this.children.push(entity)
  }

  onUpdate = (self: Entity, camera: Camera) => {
    if(!this.dirty) return

    this.dirty = false

    this.worldMatrix = mat4.create()

    mat4.translate(this.worldMatrix, this.worldMatrix, this.position)

    mat4.scale(this.worldMatrix, this.worldMatrix, this.scale)

    // ToDo(Eric) Is this possible in one call with the library?
    mat4.rotateX(this.worldMatrix, this.worldMatrix, this.rotation[0])
    mat4.rotateY(this.worldMatrix, this.worldMatrix, this.rotation[1])
    mat4.rotateZ(this.worldMatrix, this.worldMatrix, this.rotation[2])  

    if(!this.parent) return
    
    mat4.multiply(this.worldMatrix, this.parent.worldMatrix, this.worldMatrix)

    console.log(mat4.getScaling(vec3.create(), this.worldMatrix))
    console.log(mat4.getTranslation(vec3.create(), this.worldMatrix))
  }
}