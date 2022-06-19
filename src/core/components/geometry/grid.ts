import { vec3 } from "gl-matrix";
import Geometry, { calcNormals, createVAO, DrawMode } from "./geometry";

export default class Grid extends Geometry {
  constructor(subdivisions: number = 1) {
    super(DrawMode.LINE, true, false, false)

    const positions = new Array<number>()
    const step: number = 1.0 / subdivisions

    for(let pos = 0.0; pos < 1.0; pos += step) {
      positions.push(pos, 0.0, 0.0)
      positions.push(pos, 0.0, 1.0)

      positions.push(0.0, 0.0, pos)
      positions.push(1.0, 0.0, pos)
    }

    this.setVAO({
      POSITION: new Float32Array(positions)
    })
  }
}