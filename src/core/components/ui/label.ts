import { vec3, vec4 } from "gl-matrix";
import { globalToScreenSpace } from "../../../util/math/projection";
import Debug from "../../internal/debug";
import entity from "../../scene/entity";
import Component, { ComponentEnum } from "../base/component";

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
    element.style.cssText = 'position: absolute; color: white; font-weight: bold; font-family: monospace; font-size: 10px; background: rgba(0.0, 0.0, 0.0, 0.0); z-index: 0;'

    document.body.appendChild(element)

    this.state = {
      element,
      text,
      offset: [...offset, 1.0] as vec4
    }
  }

  onUpdate = (self: entity, camera: entity) => {
    const pixelPosition = globalToScreenSpace(this.state.offset, self, Debug.cameraEnabled ? Debug.camera : camera)
    
    if(!pixelPosition) {
      if(this.state.element.style.visibility !== 'hidden') this.state.element.style.visibility = 'hidden'
      return
    }

    // update label position
    this.state.element.style.left = `${pixelPosition[0]}px`
    this.state.element.style.top = `${pixelPosition[1]}px`

    if(this.state.element.style.visibility !== 'visible') this.state.element.style.visibility = 'visible'
  }
}