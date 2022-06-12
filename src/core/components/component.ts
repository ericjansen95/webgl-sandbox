import Entity from "../scene/entity"

export default interface Component {
  // remove self and add delta time?
  onUpdate?: (self: Entity, camera: Entity) => void
  onAdd?: (self: Entity) => void
  onRemove?: () => void
}