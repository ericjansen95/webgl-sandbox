import Entity from "../../scene/entity"

export enum ComponentType {
  TRANSFORM = 0,
  GEOMETRY,
  MATERIAL,
  BOUNDING_VOLUME,
  CAMERA,
  COLLIDER,
  CONTROLS,
  RIGIDBODY,
  SCRIPT,
  AUDIO_SOURCE,
  ANIMATOR,
  UI,
  TRIGGER,
  TERRAIN,
}

export default interface Component {
  // remove self and add delta time?
  type: ComponentType
  onUpdate?: (self: Entity, camera: Entity) => void
  onAdd?: (self: Entity) => void
  onRemove?: () => void
}