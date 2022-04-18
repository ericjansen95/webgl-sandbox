import { vec3 } from "gl-matrix";
import Entity from "../core/entity";
import Material from "./material";
import { Component } from "./component";
import Geometry from "./geometry/geometry";
import UnlitMaterial from "./materials/unlitMaterial";
import Transform from "./transform";

export default class BoundingSphere implements Component {
  
  sphere: Entity | null

  radius: number
  min: vec3
  max: vec3

  self: Entity | null
  visible: boolean
  
  constructor(visible: boolean = false) {
    this.visible = visible
  }

  setVisible = (visible: boolean) => {
    this.visible = visible

    this.createSphere()

    const geometry = this.sphere.getComponent(Geometry)
    geometry.visible = visible
  }

  createSphereBuffer = (radius: number): Array<number> => {
    const positions: Array<number> = new Array<number>()
    
    const UNIT_CIRCUMFERENCE = 2 * Math.PI
    const SECTIONS = 32
    const step = UNIT_CIRCUMFERENCE / SECTIONS

    // tmp => offset entity transform?
    const yOffset = (this.max[1] + this.min[1]) * 0.5

    for(let radiant = 0.0; radiant < UNIT_CIRCUMFERENCE; radiant += step) {
      const pos1 = Math.cos(radiant) * radius
      const pos2 = Math.sin(radiant) * radius
      const pos3 = Math.cos(radiant + step) * radius
      const pos4 = Math.sin(radiant + step) * radius

      positions.push(pos1, pos2 + yOffset, 0.0)
      positions.push(pos3, pos4 + yOffset, 0.0)

      positions.push(0.0, pos1 + yOffset, pos2)
      positions.push(0.0, pos3 + yOffset, pos4)

      positions.push(pos1, yOffset, pos2)
      positions.push(pos3, yOffset, pos4)
    }

    return positions
  }

  createSphere = (): boolean => {
    if(!this.visible || this.sphere || !this.self) return false

    const sphereGeometry: Geometry = new Geometry("LINE", true, false, false)
    sphereGeometry.loadFromBuffer(this.createSphereBuffer(this.radius));

    const sphereMaterial: Material = new UnlitMaterial([1.0, 1.0, 1.0]) as Material
    sphereMaterial.wireframe = true

    this.sphere = new Entity()
    this.sphere.addComponent(sphereGeometry)
    this.sphere.addComponent(sphereMaterial)

    this.self.getComponent(Transform).addChild(this.sphere)

    return true
  }

  onAdd = (self: Entity) => {
    this.self = self

    const geometry: Geometry = self.getComponent(Geometry)

    this.min = geometry.vertex.min
    this.max = geometry.vertex.max

    const distanceX: number = this.max[0] - this.min[0]
    const distanceY: number = this.max[1] - this.min[1]
    const distanceZ: number = this.max[2] - this.min[2]

    this.radius = Math.max(distanceX, Math.max(distanceY, distanceZ)) * 0.5

    this.createSphere()
  }
}