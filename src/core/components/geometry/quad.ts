import { vec3 } from "gl-matrix";
import Geometry, { calcNormals, createVertexObject, DrawMode } from "./geometry";

export default class Quad extends Geometry {
  constructor(positions: Array<vec3>, visible: boolean = true, cull: boolean = true, boundingVolume: boolean = true) {
    if(positions.length !== 4) console.error("Quad::constructor(): Invalid arguments!")

    super(DrawMode.LINE, visible, cull, boundingVolume)

    this.vertex.positions.push(...positions[0])
    this.vertex.positions.push(...positions[1])   

    this.vertex.positions.push(...positions[1])
    this.vertex.positions.push(...positions[2])

    this.vertex.positions.push(...positions[2])
    this.vertex.positions.push(...positions[3])
    
    this.vertex.positions.push(...positions[3])    
    this.vertex.positions.push(...positions[0])

    this.vertex.count = this.vertex.positions.length
    this.vertex.normals = calcNormals(this.vertex.positions)
  }
}