import Entity from "../../scene/entity"

export enum Component {
  TRANSFORM = 0,
  CAMERA,
  GEOMETRY,
  BOUNDING_VOLUME,
  MATERIAL,
  CONTROLS,
  TERRAIN
}

export default interface ComponentInterface {
  // remove self and add delta time?
  type: Component
  onUpdate?: (self: Entity, camera: Entity) => void
  onAdd?: (self: Entity) => void
  onRemove?: () => void
}