import Entity from "../../scene/entity"

export enum ComponentEnum {
  TRANSFORM = 0,
  GEOMETRY,
  BOUNDING_VOLUME,
  MATERIAL,
  CAMERA,
  TERRAIN,
  CONTROLS,
  SCRIPT
}

export default interface Component {
  // remove self and add delta time?
  type: ComponentEnum
  onUpdate?: (self: Entity, camera: Entity) => void
  onAdd?: (self: Entity) => void
  onRemove?: () => void
}