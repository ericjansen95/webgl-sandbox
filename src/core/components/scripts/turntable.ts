import { vec3 } from "gl-matrix";
import Time from "../../internal/time";
import Entity from "../../scene/entity";
import Component, { ComponentEnum } from "../base/component";
import Transform from "../base/transform";

export default class Turntable implements Component {
  type: ComponentEnum

  speed: number
  axis: vec3

  constructor(speed: number, axis: vec3) {
    this.type = ComponentEnum.SCRIPT

    this.speed = speed
    this.axis = axis
  }

  onUpdate = (self: Entity, camera: Entity) => {
    const transform = self.get(ComponentEnum.TRANSFORM) as Transform

    const axisRotation = vec3.scale(vec3.create(), this.axis, this.speed * Time.deltaTime)
    transform.setRotation([transform.rotation[0] + axisRotation[0], transform.rotation[1] + axisRotation[1], transform.rotation[2] + axisRotation[2]])
  }
}