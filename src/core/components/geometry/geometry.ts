import { vec3 } from "gl-matrix"
import Entity from "../../scene/entity"
import BoundingSphere from "../boundingVolume/boundingSphere"
import Component, { ComponentEnum } from "../base/component"
import Material from "../material/material"

export enum DrawMode {
  TRIANGLE = 4,
  LINE = 1,
}

export const parseUnindexedVertexPositions = (indices: Uint16Array, positions: Float32Array) => {
  const output = new Array<number>()
  for(const index of indices) {
    const correctedIndex = index * 3
    output.push(positions[correctedIndex], positions[correctedIndex + 1], positions[correctedIndex + 2])
  }
  return output
}

export default class Geometry implements Component {
  type: ComponentEnum

  vertex: {
    componentCount: number
    positions: Array<number>
    normals: Array<number>
    min: vec3
    max: vec3
  } | null

  buffer: {
    position: WebGLBuffer
    normal: WebGLBuffer
  } | null

  drawMode: DrawMode
  visible: boolean

  cull: boolean
  boundingSphere: boolean

  constructor(geometryType: DrawMode = DrawMode.TRIANGLE, visible: boolean = true, cull: boolean = true, boundingSphere: boolean = true) {
    this.type = ComponentEnum.GEOMETRY
    this.vertex = null
    this.buffer = null
    this.drawMode = geometryType
    this.visible = visible
    this.cull = cull
    this.boundingSphere = boundingSphere
  }

  load = (gl: WebGL2RenderingContext) => {
    if(this.buffer) return true
    if(!this.vertex.positions.length || !this.vertex.normals.length) return false

    this.buffer = {
      position: gl.createBuffer(),
      normal: gl.createBuffer()
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer.position)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertex.positions), gl.STATIC_DRAW)
    
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer.normal)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertex.normals), gl.STATIC_DRAW)
    
    return true
  }

  bind = (gl: WebGL2RenderingContext, material: Material): boolean => {
    if(!this.load(gl)) return false

    const numComponents: number = 3
    const type: number = gl.FLOAT
    const normalize: boolean = false
    const stride: number = 0
    const offset: number = 0

    // POSITION

    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer.position)
    gl.vertexAttribPointer(
      material.attributeLocations.get('aVertexPosition'),
      numComponents,
      type,
      normalize,
      stride,
      offset)
    gl.enableVertexAttribArray(
      material.attributeLocations.get('aVertexPosition')
    )
 
    // NORMAL

    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer.normal)
    gl.vertexAttribPointer(
      material.attributeLocations.get('aVertexNormal'),
      numComponents,
      type,
      normalize,
      stride,
      offset)
    gl.enableVertexAttribArray(
      material.attributeLocations.get('aVertexNormal')
    )

    return true
  }

  createVertexObject = () => {
    return {
      componentCount: 0,
      positions: new Array<number>(),
      normals: new Array<number>(),
      min: vec3.create(),
      max: vec3.create()
    }
  }

  setVertexPositions = (positions: Array<number>): boolean => {
    this.vertex.positions = positions

    const vertexCount = this.vertex.positions.length
    let componentCount = null

    switch (this.drawMode) {
      case DrawMode.TRIANGLE:
        componentCount = vertexCount / 3
        break
      case DrawMode.LINE:
        componentCount = vertexCount / 2
        break
    }

    this.vertex.componentCount = componentCount

    return true
  }

  setVertexNormals = (normals: Array<number>): boolean => {
    this.vertex.normals = normals
    return true
  }

  setVertices = (positions: Array<number>, normals: Array<number> | null = null): boolean => {
    if(!positions.length) return false

    this.vertex = this.createVertexObject()

    this.setVertexPositions(positions)
    if(normals) this.setVertexNormals(normals)
    else this.vertex.normals = calcNormals(this.vertex.positions)

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

    this.vertex.componentCount = this.vertex.positions.length
    this.vertex.normals = calcNormals(this.vertex.positions)
  }

  onAdd = (self: Entity) => {
    if(!this.boundingSphere) return
    
    const boundingSphere: BoundingSphere = new BoundingSphere()
    self.add(boundingSphere)
  }
}

export const calcNormals = (positions: Array<number>, flat: boolean = true): Array<number> | null => {

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