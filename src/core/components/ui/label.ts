import { mat4, vec2, vec3, vec4 } from "gl-matrix";
import entity from "../../scene/entity";
import Camera from "../base/camera";
import Component, { ComponentEnum } from "../base/component";
import Transform from "../base/transform";

type LabelState = {
  element: HTMLSpanElement
  text: string
  offset: vec4
}

export type LabelOptions = {
  text: LabelState["text"]
  offset?: vec3
}

export default class Label implements Component {
  type: ComponentEnum
  state: LabelState

  constructor({ text, offset = vec3.create() }: LabelOptions) {
    this.type = ComponentEnum.UI

    const element = document.createElement('span')
    element.innerText = text
    element.style.cssText = 'position: absolute; color: white; font-weight: bold; font-family: monospace; font-size: 16px; background: rgba(0.0, 0.0, 0.0, 0.0); z-index: 1000;'

    document.body.appendChild(element)

    this.state = {
      element,
      text,
      offset: [...offset, 1.0] as vec4
    }
  }

  onUpdate = (self: entity, camera: entity) => {
    const transformComponent = self.get(ComponentEnum.TRANSFORM) as Transform
    const cameraComponent = camera.get(ComponentEnum.CAMERA) as Camera

    const mvpMatrix = mat4.clone(transformComponent.globalMatrix)
    mat4.multiply(mvpMatrix, cameraComponent.viewMatrix, mvpMatrix)
    mat4.multiply(mvpMatrix, cameraComponent.projectionMatrix, mvpMatrix)

    // project label entity position to view space
    const projectedPosition = vec4.transformMat4(vec4.create(), this.state.offset, mvpMatrix)

    // return if point is behind screen
    if(projectedPosition[3] < 0) {
      this.state.element.style.visibility = 'hidden'
      return
    }

    // transform point into normalized screen coordinates
    const normalizedPosition = vec2.fromValues(projectedPosition[0] / projectedPosition[2], -projectedPosition[1] / projectedPosition[2])
    vec2.add(normalizedPosition, normalizedPosition, [1, 1])
    vec2.scale(normalizedPosition, normalizedPosition, 0.5)

    // return if point is outside of view
    if(normalizedPosition[0] < 0 || normalizedPosition[0] > 1 || normalizedPosition[1] < 0 || normalizedPosition[2] > 1) {
      this.state.element.style.visibility = 'hidden'
      return
    }

    // transform point into pixel coordinates
    const pixelPosition = vec2.fromValues(Math.round(normalizedPosition[0] * window.innerWidth), Math.round(normalizedPosition[1] * window.innerHeight))
    
    // update label position
    this.state.element.style.left = `${pixelPosition[0]}px`
    this.state.element.style.top = `${pixelPosition[1]}px`

    if(this.state.element.style.visibility !== 'visible') this.state.element.style.visibility = 'visible'
  }
}