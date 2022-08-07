import { vec3 } from "gl-matrix";
import { createWireframeBox } from "../../../util/helper/box";
import Entity from "../../scene/entity";
import entity from "../../scene/entity";
import Component, { ComponentType } from "../base/component";
import Geometry from "../geometry/geometry";

export default class Trigger implements Component {
  type: ComponentType

  box: Entity

  min: vec3
  max: vec3

  self: Entity | null
  visible: boolean

  entitiesInside: Set<Entity["id"]>

  constructor(size) {
    this.entitiesInside = new Set()
    
    this.min = vec3.scale(vec3.create(), size, -0.5)
    this.max = vec3.scale(vec3.create(), size, 0.5)
  }

  setVisible = (visible: boolean) => {
    this.visible = visible

    this.createBox()

    const geometry = this.box.get(ComponentType.GEOMETRY) as Geometry
    geometry.visible = visible
  }

  createBox = (): boolean => {
    if(!this.visible || this.box || !this.self) return false;

    this.box = createWireframeBox(this.min, this.max)
    this.self.get(ComponentType.TRANSFORM).add(this.box)

    return true
  }

  onAdd = (self: entity) => {
    this.self = self
  }
}