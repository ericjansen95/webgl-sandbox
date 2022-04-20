import { vec3 } from "gl-matrix";
import Geometry, { calcNormals } from "./geometry";

export default class Grid extends Geometry {
  constructor(subdivisions: number = 1) {
    super("LINE", true, false, false)

    this.vertex = {
      count: 2 * subdivisions * subdivisions + 8,
      positions: new Array<number>(),
      normals: new Array<number>(),
      min: vec3.create(),
      max: vec3.create()
    }

    const step: number = 0.5 / subdivisions

    this.vertex.positions.push(0.0, 0.0, 0.0)
    this.vertex.positions.push(0.0, 0.0, 0.5)

    this.vertex.positions.push(0.0, 0.0, 0.5)
    this.vertex.positions.push(0.5, 0.0, 0.5)

    this.vertex.positions.push(0.5, 0.0, 0.5)
    this.vertex.positions.push(0.5, 0.0, 0.0)

    this.vertex.positions.push(0.5, 0.0, 0.0)
    this.vertex.positions.push(0.0, 0.0, 0.0)

    for(let pos = step; pos < 0.5; pos += step) {
      this.vertex.positions.push(pos, 0.0, 0.0)
      this.vertex.positions.push(pos, 0.0, 0.5)

      this.vertex.positions.push(0.0, 0.0, pos)
      this.vertex.positions.push(0.5, 0.0, pos)
    }

    this.vertex.normals = calcNormals(this.vertex.positions, true)
  }
}