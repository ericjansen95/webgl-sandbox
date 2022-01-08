import Entity from "../entity";

export interface Component {
  onUpdate?: Function
  onAdd?: Function
  onRemove?: Function
}