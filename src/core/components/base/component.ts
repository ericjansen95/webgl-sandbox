import Entity from "../../scene/entity"

export enum ComponentEnum {
  TRANSFORM = 0,
  GEOMETRY,
  MATERIAL,
  BOUNDING_VOLUME,
  CAMERA,
  COLLIDER,
  TERRAIN,
  CONTROLS,
  AUDIO_SOURCE,
  SCRIPT,
  ANIMATOR,
  UI
}

export default interface Component {
  // remove self and add delta time?
  type: ComponentEnum
  onUpdate?: (self: Entity, camera: Entity) => void
  onAdd?: (self: Entity) => void
  onRemove?: () => void
}