import { mat4, quat, vec3 } from "gl-matrix"
import Time from "../../internal/time"
import Entity from "../../scene/entity"
import Component, { ComponentEnum } from "../base/component"
import Transform from "../base/transform"
import SkinnedGeometry, { MAX_JOINTS } from "../geometry/skinned"

export type Joint = {
  children: Array<Joint>
  entity: Entity
}

export type Skeleton = {
  jointCount: number,
  inverseBindPose: Array<mat4>,
  root: Joint
}

export type JointTransfrom = {
  rotation: quat
  translation: vec3
}

export type KeyFrame = Array<JointTransfrom>

export type Animation = Array<KeyFrame>

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
    // WIP: Move speed in animation data structure
    this.speed = 15

    this.skeleton = skeleton
    this.animations = animations
  }

  onAdd = (self: Entity) => {
    this.geometry = self.get(ComponentEnum.GEOMETRY) as SkinnedGeometry

    const transform = self.get(ComponentEnum.TRANSFORM) as Transform
    transform.add(this.skeleton.root.entity)
  }

  onUpdate = (self: Entity, camera: Entity) => {
    // TMP: Always pick first animation for pose calculation
    const animation = this.animations[0]

    const pose = new Array<mat4>()

    // round time and convert to valid frame index
    // calculate blend factor between 0 - 1 for lerping animation rotation and translation
    const roundedTime = Math.floor(this.time)
    const frameIndex = roundedTime % (animation.length - 1)
    const lerpFactor = this.time - roundedTime

    let jointIndex = -1
    const buildPose = (joint: Joint, parentTransform: mat4 = mat4.create()) => {
      ++jointIndex

      // receive animation frames
      const { rotation: fromRotation, translation: fromTranslation } = animation[frameIndex][jointIndex]
      const { rotation: toRotation, translation: toTranslation } = animation[frameIndex + 1][jointIndex]

      // lerp frames for current time
      const rotation = quat.slerp(quat.create(), fromRotation, toRotation, lerpFactor)
      const translation = vec3.lerp(vec3.create(), fromTranslation, toTranslation, lerpFactor)

      // update debug joint entity
      /*
        const transform = joint.entity.get(ComponentEnum.TRANSFORM) as Transform
        transform.setLocalRotation(rotation)
        transform.setLocalPosition(translation)
      */

      // calculate global joint transform
      const jointTransform = mat4.fromRotationTranslation(mat4.create(), rotation, translation)
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
    this.time += this.speed * Time.deltaTime
  }
}