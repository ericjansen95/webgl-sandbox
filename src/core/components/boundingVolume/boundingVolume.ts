import Component from "../base/component";

export default interface BoundingVolume extends Component {
  visible: boolean
  setVisible: (visible: boolean) => void
}