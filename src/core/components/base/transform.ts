import { mat4, quat, vec3 } from "gl-matrix";
import Entity from "../../scene/entity";
import GeometryCollider from "../collider/geometryCollider";
import Component, { ComponentType } from "./component";

export default class Transform implements Component {
  type: ComponentType
  self: Entity

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
    this.type = ComponentType.TRANSFORM

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

  onAdd = (self: Entity) => {
    this.self = self
  }

  setLocalPosition = (position: vec3) => {
    this.localPosition = position
    this.dirty = true
  }

  setLocalRotation = (rotation: quat) => {
    quat.copy(this.localRotation, rotation)
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

  addChild = (entity: Entity) => {
    (entity.getComponent(ComponentType.TRANSFORM) as Transform).parent = this
    this.children.push(entity)
  }

  removeChild = (entity: Entity): boolean => {
    const entityIndex = this.children.indexOf(entity)
    if(!entityIndex) return null

    return Boolean(this.children.splice(entityIndex, 1).length)
  }

  onUpdate = () => {
    let localUpdate = false

    if(this.dirty) {
      mat4.copy(this.localMatrix, mat4.create())
  
      mat4.translate(this.localMatrix, this.localMatrix, this.localPosition)
  
      mat4.scale(this.localMatrix, this.localMatrix, this.localScale)
  
      mat4.fromQuat(this.localRotationMatrix, this.localRotation)
      mat4.multiply(this.localMatrix, this.localMatrix, this.localRotationMatrix)

      const collider = this.self.getComponent(ComponentType.COLLIDER) as GeometryCollider
      if(collider?.update) collider.update(this.localMatrix)

      localUpdate = true
    }

    if(this.parent)
      mat4.multiply(this.globalMatrix, this.parent.globalMatrix, this.localMatrix)
    else if(this.dirty)
      mat4.copy(this.globalMatrix, this.localMatrix)      

    this.dirty = false;

    return localUpdate
  }
}