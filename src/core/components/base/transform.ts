import { mat4, quat, vec3 } from "gl-matrix";
import Camera from "./camera";
import Entity from "../../scene/entity";
import Component, { ComponentEnum } from "./component";

export default class Transform implements Component {
  type: ComponentEnum

  localPosition: vec3
  localScale: vec3
  localRotation: quat

  dirty: boolean
  localRotationMatrix: mat4
  localMatrix: mat4

  globalMatrix: mat4

  parent: Transform | null
  children: Array<Entity>
  
  constructor() {
    this.type = ComponentEnum.TRANSFORM

    this.localPosition = vec3.create()
    this.localScale = vec3.create()
    this.localScale.fill(1.0)
    this.localRotation = quat.create()

    this.dirty = true
    this.localRotationMatrix = mat4.create()
    this.localMatrix = mat4.create()

    this.globalMatrix = mat4.create()

    this.parent = null
    this.children = new Array<Entity>()
  }

  setLocalPosition = (position: vec3) => {
    this.localPosition = position
    this.dirty = true
  }

  setLocalEulerRotation = (rotation: vec3) => {
    quat.copy(this.localRotation, quat.create())
    this.rotateLocalEuler(rotation)
  }

  rotateLocalEuler = (rotation: vec3) => {
    quat.rotateX(this.localRotation, this.localRotation, rotation[0])
    quat.rotateY(this.localRotation, this.localRotation, rotation[1])
    quat.rotateZ(this.localRotation, this.localRotation, rotation[2])
    this.dirty = true
  }

  setLocalScale = (scale: vec3) => {
    this.localScale = scale
    this.dirty = true
  }

  getGlobalPosition = (): vec3 => {
    return mat4.getTranslation(vec3.create(), this.globalMatrix)
  }

  getGlobalRotation = (): quat => {
    return mat4.getRotation(quat.create(), this.globalMatrix)
  }

  getGlobalScale = (): vec3 => {
    return mat4.getScaling(vec3.create(), this.globalMatrix)
  }

  add = (entity: Entity) => {
    (entity.get(ComponentEnum.TRANSFORM) as Transform).parent = this
    this.children.push(entity)
  }

  removeChild = (entity: Entity): boolean => {
    const entityIndex = this.children.indexOf(entity)
    if(!entityIndex) return null

    return Boolean(this.children.splice(entityIndex, 1).length)
  }

  onUpdate = () => {
    if(this.dirty) {
      mat4.copy(this.localMatrix, mat4.create())
  
      mat4.translate(this.localMatrix, this.localMatrix, this.localPosition)
  
      mat4.scale(this.localMatrix, this.localMatrix, this.localScale)
  
      mat4.fromQuat(this.localRotationMatrix, this.localRotation)
      mat4.multiply(this.localMatrix, this.localMatrix, this.localRotationMatrix)  
    }

    if(this.parent)
      mat4.multiply(this.globalMatrix, this.parent.globalMatrix, this.localMatrix)
    else if(this.dirty)
      mat4.copy(this.globalMatrix, this.localMatrix)      

    this.dirty = false;
  }
}