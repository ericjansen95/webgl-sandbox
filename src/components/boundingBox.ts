import { vec3 } from "gl-matrix";
import Entity from "../entity";
import Material from "../material";
import { Component } from "./component";
import Geometry from "./geometry";
import UnlitMaterial from "./materials/unlitMaterial";
import Transform from "./transform";

export default class BoundingBox implements Component {
  
  box: Entity | null

  min: vec3 
  max: vec3

  self: Entity | null
  visible: boolean
  
  constructor(visible: boolean = true) {
    this.visible = visible
  }

  setVisible = (visible: boolean) => {
    this.visible = visible

    this.createBox()

    const geometry = this.box.getComponent(Geometry)
    geometry.visible = visible
  }

  createBoxBuffer = (min: vec3, max: vec3): Array<number> => {
    const positions: Array<number> = new Array<number>()
    
    // order clockwise from view outside

    // front

    positions.push(min[0], min[1], max[2])
    positions.push(min[0], max[1], max[2])
    positions.push(max[0], max[1], max[2])

    positions.push(min[0], min[1], max[2])
    positions.push(max[0], max[1], max[2])
    positions.push(max[0], min[1], max[2])
    
    // left

    positions.push(min[0], min[1], min[2])
    positions.push(min[0], max[1], min[2])
    positions.push(min[0], max[1], max[2])

    positions.push(min[0], min[1], min[2])
    positions.push(min[0], max[1], max[2])
    positions.push(min[0], min[1], max[2])

    // back

    positions.push(max[0], min[1], min[2])
    positions.push(max[0], max[1], min[2])
    positions.push(min[0], max[1], min[2])

    positions.push(max[0], min[1], min[2])
    positions.push(min[0], max[1], min[2])
    positions.push(min[0], min[1], min[2])

    // right

    positions.push(max[0], min[1], max[2])
    positions.push(max[0], max[1], max[2])
    positions.push(max[0], max[1], min[2])

    positions.push(max[0], min[1], max[2])
    positions.push(max[0], max[1], min[2])
    positions.push(max[0], min[1], min[2])
    
    // top

    positions.push(min[0], max[1], max[2])
    positions.push(min[0], max[1], min[2])
    positions.push(max[0], max[1], min[2])

    positions.push(min[0], max[1], max[2])
    positions.push(max[0], max[1], min[2])
    positions.push(max[0], max[1], max[2])

    // bottom

    positions.push(min[0], min[1], min[2])
    positions.push(min[0], min[1], max[2])
    positions.push(max[0], min[1], max[2])

    positions.push(min[0], min[1], min[2])
    positions.push(max[0], min[1], max[2])
    positions.push(max[0], min[1], min[2])

    return positions
  }

  createBox = (): boolean => {
    if(!this.visible || this.box || !this.self) return false;

    const boxGeometry: Geometry = new Geometry()
    boxGeometry.loadFromBuffer(this.createBoxBuffer(this.min, this.max));

    const boxMaterial: Material = new UnlitMaterial([1.0, 0.0, 1.0]) as Material
    boxMaterial.wireframe = true

    this.box = new Entity()
    this.box.addComponent(boxGeometry)
    this.box.addComponent(boxMaterial)

    this.self.getComponent(Transform).addChild(this.box)

    return true
  }

  onAdd = (self: Entity) => {
    this.self = self

    const geometry = self.getComponent(Geometry)

    this.min = geometry.vertex.min
    this.max = geometry.vertex.max

    this.createBox()
  }
}