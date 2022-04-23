import { vec3 } from "gl-matrix";
import Geometry, { calcNormals } from "./geometry";

export default class Plane extends Geometry {
  constructor(subdivisions: number = 1) {
    super("TRIANGLE", true, false, false)

    this.vertex = {
      count: 3 * 3 * 2 * subdivisions * subdivisions,
      positions: new Array<number>(),
      normals: new Array<number>(),
      min: vec3.create(),
      max: vec3.create()
    }

    const step: number = 2.0 / subdivisions

    for(let xPos = 0.0; xPos < 1.0; xPos += step) {
      for(let zPos = 0.0; zPos < 1.0; zPos += step) {
        this.vertex.positions.push(xPos, 0.0, zPos)
        this.vertex.positions.push(xPos + step, 0.0, zPos)
        this.vertex.positions.push(xPos + step, 0.0, zPos - step)

        this.vertex.positions.push(xPos + step, 0.0, zPos - step)
        this.vertex.positions.push(xPos, 0.0, zPos - step)
        this.vertex.positions.push(xPos, 0.0, zPos)
      }
    }

    this.vertex.normals = calcNormals(this.vertex.positions, true)
  }
}