import Entity from "../../scene/entity";
import Geometry, { DrawMode, VAO } from "./geometry";

export default class SphereGeometry extends Geometry {
  sphere: Entity | null
  
  constructor(radius: number = 1.0, visible: boolean = true) {
    super(DrawMode.LINE, visible, false, false)
    this.setVAO(this.createSphereVAO(radius))
  }

  createSphereVAO = (radius: number): VAO => {
    const positions: Array<number> = new Array<number>()
    
    const UNIT_CIRCUMFERENCE = 2 * Math.PI
    const SECTIONS = 32
    const step = UNIT_CIRCUMFERENCE / SECTIONS

    for(let radiant = 0.0; radiant < UNIT_CIRCUMFERENCE; radiant += step) {
      const pos1 = Math.cos(radiant) * radius
      const pos2 = Math.sin(radiant) * radius
      const pos3 = Math.cos(radiant + step) * radius
      const pos4 = Math.sin(radiant + step) * radius

      positions.push(pos1, pos2, 0.0)
      positions.push(pos3, pos4, 0.0)

      positions.push(0.0, pos1, pos2)
      positions.push(0.0, pos3, pos4)

      positions.push(pos1, 0.0, pos2)
      positions.push(pos3, 0.0, pos4)
    }

    return {
      POSITION: new Float32Array(positions)
    }
  }
}