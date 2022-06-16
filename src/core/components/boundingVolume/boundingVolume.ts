import ComponentInterface from "../base/component";

export default interface BoundingVolume extends ComponentInterface {
  visible: boolean
  setVisible: (visible: boolean) => void
}