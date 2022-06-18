import { vec3 } from "gl-matrix";
import Geometry, { calcNormals, createVertexObject, DrawMode } from "./geometry";

export default class Grid extends Geometry {
  constructor(subdivisions: number = 1) {
    super(DrawMode.LINE, true, false, false)

    const step: number = 1.0 / subdivisions

    for(let pos = 0.0; pos < 1.0; pos += step) {
      this.vertex.positions.push(pos, 0.0, 0.0)
      this.vertex.positions.push(pos, 0.0, 1.0)

      this.vertex.positions.push(0.0, 0.0, pos)
      this.vertex.positions.push(1.0, 0.0, pos)
    }

    this.vertex.count = this.vertex.positions.length
    this.vertex.normals = calcNormals(this.vertex.positions)
  }
}