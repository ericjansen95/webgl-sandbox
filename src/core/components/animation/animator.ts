import { mat4, quat } from "gl-matrix"
import entity from "../../scene/entity"
import Component, { ComponentEnum } from "../base/component"
import Transform from "../base/transform"
import SkinnedGeometry, { Skeleton } from "../geometry/skinned"

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
    const { inverseBindPose, bindPose, joints } = this.skeleton

    for(let jointIndex = 0; jointIndex < joints.length; jointIndex++) {
      // rotate in local space
      const rotationMatrix = mat4.fromQuat(mat4.create(), animation[this.currentFrame][jointIndex].rotation)
      // translate to model position
      mat4.multiply(rotationMatrix, bindPose[jointIndex], rotationMatrix)
      
      // transform by parent joint pose in world space
      const parentJointIndex = joints[jointIndex].parentIndex
      if(parentJointIndex)
        mat4.multiply(rotationMatrix, currentPose[parentJointIndex], rotationMatrix)

      // transform back to model space
      const jointPose = mat4.multiply(mat4.create(), rotationMatrix, inverseBindPose[jointIndex])
      currentPose.push(jointPose)

      const debugJointTransform = joints[jointIndex].entity.get(ComponentEnum.TRANSFORM) as Transform
      debugJointTransform.localMatrix = rotationMatrix
    }
    
    this.skeleton.currentPose = currentPose
    this.currentFrame = ++this.currentFrame % 30
  }
}