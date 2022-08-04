import { vec3 } from "gl-matrix";
import Time from "../../internal/time";
import Entity from "../../scene/entity";
import Component, { ComponentType } from "../base/component";
import Transform from "../base/transform";

export default class Turntable implements Component {
  type: ComponentType

  speed: number
  axis: vec3

  constructor(speed: number, axis: vec3) {
    this.type = ComponentType.SCRIPT

    this.speed = speed
    this.axis = axis
  }

  onUpdate = (self: Entity, camera: Entity) => {
    const transform = self.get(ComponentType.TRANSFORM) as Transform

    const axisRotation = vec3.scale(vec3.create(), this.axis, this.speed * Time.deltaTime)
    transform.rotateLocalEuler(axisRotation)
  }
}