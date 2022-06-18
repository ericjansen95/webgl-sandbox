import { vec3 } from "gl-matrix";
import Geometry, { calcNormals, createVertexObject, DrawMode } from "./geometry";

export default class Quad extends Geometry {
  constructor(input: Array<vec3>, visible: boolean = true, cull: boolean = true, boundingVolume: boolean = true) {
    if(input.length !== 4) console.error("Quad::constructor(): Invalid arguments!")

    super(DrawMode.LINE, visible, cull, boundingVolume)

    const positions = new Array<number>()

    positions.push(...input[0])
    positions.push(...input[1])   

    positions.push(...input[1])
    positions.push(...input[2])

    positions.push(...input[2])
    positions.push(...input[3])
  
    positions.push(...input[3])    
    positions.push(...input[0])

    this.setVertices({
      position: new Float32Array(positions),
    })
  }
}