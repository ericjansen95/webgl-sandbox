import Entity from "../../scene/entity"

export enum Component {
  TRANSFORM = 0,
  GEOMETRY,
  BOUNDING_VOLUME,
  MATERIAL,
  CAMERA,
  TERRAIN,
  CONTROLS,
  SCRIPT
}

export default interface ComponentInterface {
  // remove self and add delta time?
  type: Component
  onUpdate?: (self: Entity, camera: Entity) => void
  onAdd?: (self: Entity) => void
  onRemove?: () => void
}