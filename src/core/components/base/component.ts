import Entity from "../../scene/entity"

export enum ComponentType {
  TRANSFORM = 0,
  CAMERA,
  GEOMETRY,
  BOUNDING_VOLUME,
  MATERIAL,
  CONTROLS,
  TERRAIN
}

export default interface Component {
  // remove self and add delta time?
  componentType: ComponentType
  onUpdate?: (self: Entity, camera: Entity) => void
  onAdd?: (self: Entity) => void
  onRemove?: () => void
}