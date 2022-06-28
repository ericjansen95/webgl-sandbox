import Component, { ComponentEnum } from "../base/component";

export default class Collider implements Component {
  type: ComponentEnum

  constructor() {
    this.type = ComponentEnum.COLLIDER
  }
}