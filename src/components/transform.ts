import { mat4, vec3 } from "gl-matrix";
import Camera from "./camera";
import Entity from "../entity";
import { Component } from "./component";

export default class Transform implements Component {
  position: vec3
  rotation: vec3
  scale: vec3

  modelMatrix: mat4

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

  onUpdate = () => {
    if(this.dirty) {
      this.modelMatrix = mat4.create()
  
      mat4.translate(this.modelMatrix, this.modelMatrix, this.position)
  
      mat4.scale(this.modelMatrix, this.modelMatrix, this.scale)
  
      // ToDo(Eric) Is this possible in one call with the library?
      mat4.rotateX(this.modelMatrix, this.modelMatrix, this.rotation[0])
      mat4.rotateY(this.modelMatrix, this.modelMatrix, this.rotation[1])
      mat4.rotateZ(this.modelMatrix, this.modelMatrix, this.rotation[2])    
    }

    if(this.parent)
      this.worldMatrix = mat4.multiply(this.worldMatrix, this.parent.worldMatrix, this.modelMatrix)
    else if(this.dirty)
      this.worldMatrix = mat4.clone(this.modelMatrix)      

    this.dirty = false;
  }
}