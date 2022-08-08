import { vec3 } from "gl-matrix";
import { createWireframeBox } from "../../../util/helper/box";
import { dispatch } from "../../../util/helper/event";
import Entity from "../../scene/entity";
import entity from "../../scene/entity";
import Component, { ComponentType } from "../base/component";
import Transform from "../base/transform";
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
    this.type = ComponentType.TRIGGER
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

  private createBox = (): boolean => {
    if(!this.visible || this.box || !this.self) return false;

    this.box = createWireframeBox(this.min, this.max)
    this.self.get(ComponentType.TRANSFORM).add(this.box)

    return true
  }

  private isEntityInTrigger = (entity: Entity): boolean => {
    if(!entity) return false

    const entityTransform = entity.get(ComponentType.TRANSFORM) as Transform
    
    if(!entityTransform.dirty) return false
    
    const position = entityTransform.getGlobalPosition()

    const triggerTransform = this.self.get(ComponentType.TRANSFORM) as Transform
    const center = triggerTransform.getGlobalPosition()

    const min = vec3.add(vec3.create(), this.min, center)
    const max = vec3.add(vec3.create(), this.max, center)

    if(position[0] > max[0] || position[0] < min[0] ||
       position[1] > max[1] || position[1] < min[0] ||
       position[2] > max[2] || position[2] < min[2])
        return false

    return true
  }

  onAdd = (self: entity) => {
    this.self = self
  }

  update = (entities: Array<Entity>) => {
    for(const entity of entities) {
      const { id } = entity

      if(id === this.self.id) continue

      if(this.isEntityInTrigger(entity)) {
        if(this.entitiesInside.has(id)) continue

        this.entitiesInside.add(id)
        dispatch('triggerenter', { entity })
      } else {
        if(!this.entitiesInside.has(id)) continue

        this.entitiesInside.delete(id)
        dispatch('triggerleave', { entity })
      }
    }
  }
}