import Component, { ComponentEnum } from "../base/component";

export default class BoundingVolume implements Component {
  type: ComponentEnum
  visible: boolean

  constructor(visible: boolean = false) {
    this.type = ComponentEnum.BOUNDING_VOLUME
    this.visible = visible
  }

  setVisible: (visible: boolean) => void
}