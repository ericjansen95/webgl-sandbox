import { quat } from "gl-matrix"
import Component, { ComponentEnum } from "../base/component"

type JointTransfrom = {
  rotation: quat
}

type KeyFrame = {
  jointTransfroms: Array<JointTransfrom>
}

export type Animation = {
  keyFrames: Array<KeyFrame>
}

const createAnimation = (): Animation => {
  return {
    keyFrames: new Array<KeyFrame>()
  }
} 

export default class Animator implements Component {
  type: ComponentEnum

  animation: Animation
  currentTime: number

  constructor() {
    this.type = ComponentEnum.ANIMATOR

    this.animation = createAnimation()
    this.currentTime = 0.0
  }
}