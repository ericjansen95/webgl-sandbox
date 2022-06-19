import Entity from "../../scene/entity"

export enum ComponentEnum {
  TRANSFORM = 0,
  GEOMETRY,
  MATERIAL,
  BOUNDING_VOLUME,
  CAMERA,
  TERRAIN,
  CONTROLS,
  SCRIPT,
  ANIMATOR
}

export default interface Component {
  // remove self and add delta time?
  type: ComponentEnum
  onUpdate?: (self: Entity, camera: Entity) => void
  onAdd?: (self: Entity) => void
  onRemove?: () => void
}