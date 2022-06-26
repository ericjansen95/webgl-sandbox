import { mat4, quat } from "gl-matrix"
import Entity from "../../scene/entity"
import entity from "../../scene/entity"
import Component, { ComponentEnum } from "../base/component"
import Transform from "../base/transform"
import SkinnedGeometry from "../geometry/skinned"

export type Skeleton = {
  jointCount: number
  
  bindPose: Array<mat4>
  inverseBindPose: Array<mat4>

  jointEntities: Array<Entity>
  parentJoint: Array<number>
}

export type JointTransfrom = {
  rotation: quat
}

export type KeyFrame = Array<JointTransfrom>

export type Animation = Array<KeyFrame>

export default class Animator implements Component {
  type: ComponentEnum

  currentFrame: number

  skeleton: Skeleton
  animations: Array<Animation>

  geometry: SkinnedGeometry

  constructor(skeleton: Skeleton, animations: Array<Animation>) {
    this.type = ComponentEnum.ANIMATOR

    this.currentFrame = 0

    this.skeleton = skeleton
    this.animations = animations
  }

  onAdd = (self: entity) => {
    this.geometry = self.get(ComponentEnum.GEOMETRY) as SkinnedGeometry

    const transform = self.get(ComponentEnum.TRANSFORM) as Transform
    for(const joint of this.skeleton.jointEntities)
      transform.add(joint)
  }

  onUpdate = (self: entity, camera: entity) => {
    const animation = this.animations[0]

    const pose = new Array<mat4>()
    const { jointCount, inverseBindPose, bindPose, parentJoint, jointEntities } = this.skeleton

    for(let jointIndex = 0; jointIndex < jointCount; jointIndex++) {
      // rotate in local space
      const rotationMatrix = mat4.fromQuat(mat4.create(), animation[this.currentFrame][jointIndex].rotation)
      // translate to model position
      mat4.multiply(rotationMatrix, bindPose[jointIndex], rotationMatrix)
      
      // transform by parent joint pose in world space
      const parentJointIndex = parentJoint[jointIndex]
      if(parentJointIndex)
        mat4.multiply(rotationMatrix, pose[parentJointIndex], rotationMatrix)

      // transform back to model space
      const jointMatrix = mat4.create()
      mat4.multiply(jointMatrix, rotationMatrix, inverseBindPose[jointIndex])
      pose.push(jointMatrix)
      
      const debugJointTransform = jointEntities[jointIndex].get(ComponentEnum.TRANSFORM) as Transform
      debugJointTransform.localMatrix = rotationMatrix
    }
    
    this.geometry.setPose(pose)
    this.currentFrame = ++this.currentFrame % 30
  }
}