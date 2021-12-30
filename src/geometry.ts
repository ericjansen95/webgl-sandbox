import { vec3 } from "gl-matrix"
import { Component } from "./component"

export default class Geometry implements Component {
  vertex: {
    count: number
    positions: Array<number>
    normals: Array<number>
  } | null

  buffer: {
    position: WebGLBuffer
    normal: WebGLBuffer
  } | null

  constructor() {
    this.vertex = null
    this.buffer = null
  }

  update = () => {}

  load = (obj: string) => {
    this.vertex = {
      count: 0,
      positions: new Array<number>(),
      normals: new Array<number>()
    }

    const objLines: Array<string> = obj.split('\n')
    const vertexPositions: Array<Array<number>> = []

    objLines.forEach(line => {
      const components: Array<string> = line.split(' ');
      const prefix: string = components[0];
  
      if(prefix === "#" || prefix === "s") return
  
      components.shift();
  
      const values: Array<number> = components.map(value => parseFloat(value))
  
      if(prefix === "v") {
        vertexPositions.push(values)
      }
      else if(prefix === "f") {
        this.vertex.positions.push(...vertexPositions[values[0] - 1], 
                                   ...vertexPositions[values[1] - 1], 
                                   ...vertexPositions[values[2] - 1])
      }
    })

    this.vertex.count = this.vertex.positions.length

    for(let positionIndex = 0; positionIndex < this.vertex.count; positionIndex += 3) {
      const normal: vec3 = vec3.create()
      normal[0] = this.vertex.positions[positionIndex]
      normal[1] = this.vertex.positions[positionIndex + 1]
      normal[2] = this.vertex.positions[positionIndex + 2]
  
      vec3.normalize(normal, normal)
  
      this.vertex.normals.push(...normal)
    }
  }
}