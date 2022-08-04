import Component, { ComponentType } from "../base/component";

export default class BoundingVolume implements Component {
  type: ComponentType
  visible: boolean

  constructor(visible: boolean = false) {
    this.type = ComponentType.BOUNDING_VOLUME
    this.visible = visible
  }

  setVisible: (visible: boolean) => void
}