import { vec3 } from "gl-matrix";
import Geometry, { calcNormals } from "./geometry";

export default class Quad extends Geometry {
  constructor(positions: Array<vec3>) {
    if(positions.length !== 4) console.error("Quad::constructor(): Invalid arguments!")

    super()

    this.vertex = {
      count: 18,
      positions: new Array<number>(),
      normals: null,
      min: vec3.create(),
      max: vec3.create()
    }

    this.vertex.positions.push(...positions[0])
    this.vertex.positions.push(...positions[1])
    this.vertex.positions.push(...positions[2])

    this.vertex.positions.push(...positions[0])
    this.vertex.positions.push(...positions[2])
    this.vertex.positions.push(...positions[3])

    this.vertex.normals = calcNormals(this.vertex.positions, true)
  }
}