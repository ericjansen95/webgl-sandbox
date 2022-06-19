import { quat } from "gl-matrix"
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

    for(let boneIndex = 0; boneIndex < this.skeleton.bones.length; boneIndex++) {
      const boneTransform = this.skeleton.bones[boneIndex].get(ComponentEnum.TRANSFORM) as Transform
      boneTransform.setLocalRotation(animation[this.currentFrame][boneIndex].rotation)
    }

    this.currentFrame = ++this.currentFrame % 30
  }
}