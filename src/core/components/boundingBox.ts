import { vec3 } from "gl-matrix";
import Entity from "../scene/entity";
import Geometry from "./geometry/geometry";
import UnlitMaterial from "./materials/unlitMaterial";
import BoundingVolume from "./boundingVolume";

export default class BoundingBox implements BoundingVolume {
  
  box: Entity | null

  min: vec3 
  max: vec3

  corners: Array<vec3>

  self: Entity | null
  visible: boolean
  
  constructor(visible: boolean = false) {
    this.visible = visible
    this.corners = new Array<vec3>()
  }

  setVisible = (visible: boolean) => {
    this.visible = visible

    this.createBox()

    const geometry = this.box.getComponent("Geometry")
    geometry.visible = visible
  }

  createBoxBuffer = (min: vec3, max: vec3): Array<number> => {
    const positions: Array<number> = new Array<number>()
    
    // order clockwise from view outside

    // front

    positions.push(min[0], min[1], max[2])
    positions.push(min[0], max[1], max[2])
    
    positions.push(min[0], max[1], max[2])
    positions.push(max[0], max[1], max[2])

    positions.push(max[0], max[1], max[2])
    positions.push(max[0], min[1], max[2])

    positions.push(max[0], min[1], max[2])
    positions.push(min[0], min[1], max[2])

    // back

    positions.push(max[0], min[1], min[2])
    positions.push(max[0], max[1], min[2])

    positions.push(max[0], max[1], min[2])  
    positions.push(min[0], max[1], min[2])

    positions.push(min[0], max[1], min[2])   
    positions.push(min[0], min[1], min[2])

    positions.push(min[0], min[1], min[2])
    positions.push(max[0], min[1], min[2])

    // left

    positions.push(min[0], max[1], min[2])
    positions.push(min[0], max[1], max[2])

    positions.push(min[0], min[1], min[2])
    positions.push(min[0], min[1], max[2])

    // right

    positions.push(max[0], max[1], min[2])
    positions.push(max[0], max[1], max[2])

    positions.push(max[0], min[1], min[2])
    positions.push(max[0], min[1], max[2])
   
    return positions
  }

  createBox = (): boolean => {
    if(!this.visible || this.box || !this.self) return false;

    this.box = new Entity()

    const boxGeometry = new Geometry("LINE", true, false, false)
    boxGeometry.loadFromBuffer(this.createBoxBuffer(this.min, this.max))

    this.box.addComponent(boxGeometry)
    this.box.addComponent(new UnlitMaterial([1.0, 0.0, 1.0]))

    this.self.getComponent("Transform").addChild(this.box)

    return true
  }

  onAdd = (self: Entity) => {
    this.self = self

    const geometry = self.getComponent("Geometry")

    this.min = geometry.vertex.min
    this.max = geometry.vertex.max

    this.corners.push([this.min[0], this.min[1], this.min[2]])
    this.corners.push([this.max[0], this.min[1], this.min[2]])
    this.corners.push([this.min[0], this.max[1], this.min[2]])
    this.corners.push([this.min[0], this.min[1], this.max[2]])
    this.corners.push([this.max[0], this.max[1], this.min[2]])
    this.corners.push([this.min[0], this.max[1], this.max[2]])
    this.corners.push([this.max[0], this.min[1], this.max[2]])
    this.corners.push([this.max[0], this.max[1], this.max[2]])

    this.createBox()
  }
}