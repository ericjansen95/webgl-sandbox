import { vec3 } from "gl-matrix"
import Entity from "../../scene/entity"
import BoundingSphere from "../boundingVolume/boundingSphere"
import Component from "../base/component"

export type GeometryType = "TRIANGLE" | "LINE"

export const parseUnindexedVertexPositions = (indices: Uint16Array, positions: Float32Array) => {
  const output = new Array<number>()
  for(const index of indices) {
    const correctedIndex = index * 3
    output.push(positions[correctedIndex], positions[correctedIndex + 1], positions[correctedIndex + 2])
  }
  return output
}

export default class Geometry implements Component {
  vertex: {
    count: number
    positions: Array<number>
    normals: Array<number>
    min: vec3
    max: vec3
  } | null

  buffer: {
    position: WebGLBuffer
    normal: WebGLBuffer
  } | null

  type: GeometryType
  visible: boolean

  cull: boolean
  boundingSphere: boolean

  constructor(type: GeometryType = "TRIANGLE", visible: boolean = true, cull: boolean = true, boundingSphere: boolean = true) {
    this.vertex = null
    this.buffer = null
    this.type = type
    this.visible = visible
    this.cull = cull
    this.boundingSphere = boundingSphere
  }

  createVertexObject = () => {
    return {
      count: 0,
      positions: new Array<number>(),
      normals: new Array<number>(),
      min: vec3.create(),
      max: vec3.create()
    }
  }

  loadFromBuffer = (positions: Array<number>): boolean => {
    if(!Array.isArray(positions) || !positions.length) return false

    this.vertex = this.createVertexObject()

    this.vertex.positions = positions
    this.vertex.count = this.vertex.positions.length
    this.vertex.normals = calcNormals(this.vertex.positions)

    this.vertex.min = [-1.0, -1.0, -1.0]
    this.vertex.max = [1.0, 1.0, 1.0]

    return true
  }

  loadFromObj = (obj: string) => {
    this.vertex = this.createVertexObject()

    const objLines: Array<string> = obj.split('\n')
    const vertexPositions: Array<Array<number>> = []

    objLines.forEach(line => {
      const components: Array<string> = line.split(' ')
      const prefix: string = components[0]
  
      if(prefix === "#" || prefix === "s") return
  
      components.shift();
  
      const values: Array<number> = components.map(value => parseFloat(value))                  

      if(prefix === "v") {
        vertexPositions.push(values)

        // optimize this
        this.vertex.min = [Math.min(values[0], this.vertex.min[0]),
                           Math.min(values[1], this.vertex.min[1]),
                           Math.min(values[2], this.vertex.min[2])]

        this.vertex.max = [Math.max(values[0], this.vertex.max[0]),
                           Math.max(values[1], this.vertex.max[1]),
                           Math.max(values[2], this.vertex.max[2])] 
      }
      else if(prefix === "f") {
        this.vertex.positions.push(...vertexPositions[values[0] - 1], 
                                   ...vertexPositions[values[1] - 1], 
                                   ...vertexPositions[values[2] - 1])
      }
    })

    this.vertex.count = this.vertex.positions.length
    this.vertex.normals = calcNormals(this.vertex.positions)
  }

  onAdd = (self: Entity) => {
    if(!this.boundingSphere) return
    
    const boundingSphere: BoundingSphere = new BoundingSphere()
    self.addComponent(boundingSphere)
  }
}

export const calcNormals = (positions: Array<number>, flat: boolean = false): Array<number> | null => {

  const normals: Array<number> = new Array<number>()

  if(flat) {
    for(let positionIndex = 0; positionIndex < positions.length; positionIndex += 9) {
      const p1: vec3 = [positions[positionIndex], positions[positionIndex + 1], positions[positionIndex + 2]]
      const p2: vec3 = [positions[positionIndex + 3], positions[positionIndex + 4], positions[positionIndex + 5]]    
      const p3: vec3 = [positions[positionIndex + 6], positions[positionIndex + 7], positions[positionIndex + 8]]
      
      const vecA: vec3 = vec3.create()
      vec3.sub(vecA, p2, p1)
  
      const vecB: vec3 = vec3.create()
      vec3.sub(vecB, p3, p1)
  
      let normal: vec3 = vec3.create()
  
      vec3.cross(normal, vecA, vecB)
      vec3.normalize(normal, normal)
  
      normals.push(...normal, ...normal, ...normal)
    }

    return normals
  }

  for(let positionIndex = 0; positionIndex < positions.length; positionIndex += 3) {
    const normal: vec3 = [positions[positionIndex], positions[positionIndex + 1], positions[positionIndex + 2]]
    vec3.normalize(normal, normal)

    normals.push(...normal)
  }

  return normals
}