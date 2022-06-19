import { mat4, quat } from "gl-matrix"
import entity from "../../scene/entity"
import Component, { ComponentEnum } from "../base/component"
import Transform from "../base/transform"
import SkinnedGeometry, { Skeleton } from "../geometry/skinnedGeometry"

export type JointTransfrom = {
  rotation: quat
}

export type KeyFrame = Array<JointTransfrom>

export type Animation = Array<KeyFrame>

export default class Animator implements Component {
  type: ComponentEnum

  currentFrame: number
  animations: Array<Animation>

  skeleton: Skeleton

  constructor() {
    this.type = ComponentEnum.ANIMATOR

    this.animations = null
    this.currentFrame = 0
  }

  setAnimations = (animations: Array<Animation>) => {
    this.animations = animations
  }

  onAdd = (self: entity) => {
    const { skeleton } = self.get(ComponentEnum.GEOMETRY) as SkinnedGeometry
    this.skeleton = skeleton
  }

  onUpdate = (self: entity, camera: entity) => {
    const animation = this.animations[0]
    const currentPose = new Array<mat4>()

    for(let jointIndex = 0; jointIndex < this.skeleton.bones.length; jointIndex++) {
      
      const rotationMatrix = mat4.fromQuat(mat4.create(), animation[this.currentFrame][jointIndex].rotation)
      const localMatrix = mat4.mul(mat4.create(), this.skeleton.bindPose[jointIndex], rotationMatrix)

      currentPose.push(localMatrix)

      // debug vis
      const boneTransform = this.skeleton.bones[jointIndex].get(ComponentEnum.TRANSFORM) as Transform
      boneTransform.localMatrix = localMatrix
    }

    this.currentFrame = ++this.currentFrame % 30
  }
}