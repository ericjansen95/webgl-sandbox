import { vec3 } from "gl-matrix";
import Entity from "../entity";
import Material from "../material";
import { Component } from "./component";
import Geometry from "./geometry";
import UnlitMaterial from "./materials/unlitMaterial";
import Transform from "./transform";

const boxObj: string = require('/public/res/geo/cube.txt') as string

export default class Aabb implements Component {
  
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

  createBox = (): boolean => {
    if(!this.visible || this.box || !this.self) return false;

    const boxGeometry: Geometry = new Geometry()
    boxGeometry.load(boxObj)

    const boxMaterial: Material = new UnlitMaterial([1.0, 0.0, 1.0]) as Material
    boxMaterial.wireframe = true

    this.box = new Entity()
    this.box.addComponent(boxGeometry)
    this.box.addComponent(boxMaterial)

    // ToDo(Eric) Offset box verts instead of scaling the matrix
    const xScale: number = this.max[0] - this.min[0]
    const yScale: number = this.max[1] - this.min[1]
    const zScale: number = this.max[2] - this.min[2]

    this.box.getComponent(Transform).setScale([xScale, yScale, zScale])

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