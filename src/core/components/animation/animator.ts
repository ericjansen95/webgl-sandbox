import { mat4, quat, vec3 } from "gl-matrix"
import Entity from "../../scene/entity"
import entity from "../../scene/entity"
import Component, { ComponentEnum } from "../base/component"
import Transform from "../base/transform"
import SkinnedGeometry from "../geometry/skinned"

export type Joint = {
  children: Array<Joint>
  translation: vec3
  entity: Entity
}

export type Skeleton = {
  jointCount: number,
  inverseBindPose: Array<mat4>,
  root: Joint
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

    transform.add(this.skeleton.root.entity)
  }

  onUpdate = (self: entity, camera: entity) => {
    const animation = this.animations[0]

    const pose = new Array<mat4>()

    let jointIndex = 0
    const buildPose = (joint: Joint, parentPose: mat4 = mat4.create()) => {
      const rotation = animation[this.currentFrame][jointIndex].rotation

      const transform = joint.entity.get(ComponentEnum.TRANSFORM) as Transform
      transform.setLocalRotation(rotation)

      const rotationMatrix = mat4.fromQuat(mat4.create(), rotation)
      const translationMatrix = mat4.fromTranslation(mat4.create(), joint.translation)

      const jointPose = mat4.multiply(mat4.create(), translationMatrix, rotationMatrix)
      mat4.multiply(jointPose, parentPose, jointPose)
      pose.push(jointPose)

      for(const child of joint.children) {
        ++jointIndex
        buildPose(child, jointPose)  
      } 
    }

    buildPose(this.skeleton.root)
    
    pose.forEach((globalJointPose, jointIndex) => {
      mat4.multiply(globalJointPose, globalJointPose, this.skeleton.inverseBindPose[jointIndex])
    })

    this.geometry.setPose(pose)
    this.currentFrame = ++this.currentFrame % 30
  }
}