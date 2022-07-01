import { mat4, quat, vec3 } from "gl-matrix"
import Time from "../../internal/time"
import Entity from "../../scene/entity"
import Component, { ComponentEnum } from "../base/component"
import Transform from "../base/transform"
import SkinnedGeometry, { MAX_JOINTS } from "../geometry/skinned"

export type Joint = {
  children: Array<Joint>
  translation: vec3
  rotation: quat
  entity: Entity
}

export type Skeleton = {
  jointCount: number,
  inverseBindPose: Array<mat4>,
  bindPose: Array<mat4>,
  root: Joint
}

export type JointTransfrom = {
  rotation: quat
  translation: vec3
}

export type KeyFrame = Array<JointTransfrom>

export type Animation = {
  name: string
  weight: number
  speed: number
  length: number
  keyframes: Array<KeyFrame>
}

export default class Animator implements Component {
  type: ComponentEnum

  time: number
  speed: number

  skeleton: Skeleton
  animations: Array<Animation>

  geometry: SkinnedGeometry

  constructor(skeleton: Skeleton, animations: Array<Animation>) {
    this.type = ComponentEnum.ANIMATOR

    this.time = 0

    this.skeleton = skeleton
    this.animations = animations
  }

  onAdd = (self: Entity) => {
    this.geometry = self.get(ComponentEnum.GEOMETRY) as SkinnedGeometry

    const transform = self.get(ComponentEnum.TRANSFORM) as Transform
    transform.add(this.skeleton.root.entity)
  }

  onUpdate = (self: Entity, camera: Entity) => {
    let pose = new Array<mat4>()

    // round time and convert to valid frame index
    // calculate blend factor between 0 - 1 for lerping animation rotation and translation
    const roundedTime = Math.floor(this.time)
    const lerpFactor = this.time - roundedTime

    let jointIndex = -1
    const buildPose = (joint: Joint, parentTransform: mat4 = mat4.create()) => {
      ++jointIndex

      const { translation, rotation } = joint

      const blendedFromRotation = quat.clone(rotation)
      const blendedToRotation = quat.clone(rotation)

      const blendedFromTranslation = vec3.clone(translation)
      const blendedToTranslation = vec3.clone(translation)

      for(const animation of this.animations) {
        const { keyframes, weight, speed } = animation

        if(weight < 0.05) continue
  
        // ToDo: Calc frame index with speed of animation
        const frameIndex = roundedTime % (animation.length - 1)

        // receive animation frames
        const { rotation: fromRotation, translation: fromTranslation } = keyframes[frameIndex][jointIndex]
        const { rotation: toRotation, translation: toTranslation } = keyframes[frameIndex + 1][jointIndex]

        quat.slerp(blendedFromRotation, blendedFromRotation, fromRotation, weight)
        quat.slerp(blendedToRotation, blendedToRotation, toRotation, weight)

        vec3.lerp(blendedFromTranslation, blendedFromTranslation, fromTranslation, weight)
        vec3.lerp(blendedToTranslation, blendedToTranslation, toTranslation, weight)
      }
      // lerp frames for current time
      const globalRotation = quat.slerp(quat.create(), blendedFromRotation, blendedToRotation, lerpFactor)
      const globalTranslation = vec3.lerp(vec3.create(), blendedFromTranslation, blendedToTranslation, lerpFactor)

      // update debug joint entity
      /*
        const transform = joint.entity.get(ComponentEnum.TRANSFORM) as Transform
        transform.setLocalRotation(rotation)
        transform.setLocalPosition(translation)
      */

      // calculate global joint transform
      const jointTransform = mat4.fromRotationTranslation(mat4.create(), globalRotation, globalTranslation)
      mat4.multiply(jointTransform, parentTransform, jointTransform)

      pose.push(jointTransform)

      // recusivly calculate skeleton pose
      for(const child of joint.children)
        buildPose(child, jointTransform)
    }

    buildPose(this.skeleton.root)

    // transform pose back into local space
    pose.forEach((globalJointPose, jointIndex) => {
      mat4.multiply(globalJointPose, globalJointPose, this.skeleton.inverseBindPose[jointIndex])
    })

    // construct uniform pose matrix array to be consumed by geometry pipeline
    const uniformPose = new Float32Array(16 * MAX_JOINTS)
    for(let jointIndex = 0; jointIndex < pose.length; jointIndex++)
      uniformPose.set(pose[jointIndex], jointIndex * 16)

    this.geometry.setPose(uniformPose)

    // increase global delta corrected animator time by speed
    // ToDo: Update this to use speed based by animation
    this.time += 18 * Time.deltaTime
  }
}