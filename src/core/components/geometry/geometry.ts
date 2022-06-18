import { vec3 } from "gl-matrix"
import Entity from "../../scene/entity"
import BoundingSphere from "../boundingVolume/boundingSphere"
import Component, { ComponentEnum } from "../base/component"
import Material from "../material/material"
import { toUSVString } from "util"

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

export const parseUnindexedVertexUvs = (indices: Uint16Array, uvs: Float32Array) => {
  const output = new Array<number>()
  for(const index of indices) {
    const correctedIndex = index * 2
    output.push(uvs[correctedIndex], uvs[correctedIndex + 1])
  }
  return output
}

export type VertexObject = {
  count: number

  indices: Array<number>
  positions: Array<number>
  normals?: Array<number>

  uvs?: Array<number>
  
  min?: vec3
  max?: vec3
}

export type VertexBufferObject = {
  indices: WebGLBuffer

  positions: WebGLBuffer
  normals: WebGLBuffer

  uvs: WebGLBuffer
}

export const createVertexObject = (): VertexObject => {
  return {
    count: 0,

    indices: new Array<number>(),
    positions: new Array<number>(),
    normals: null,

    uvs: null,

    min: vec3.create(),
    max: vec3.create()
  }
}

export const createVertexBufferObject = (gl: WebGL2RenderingContext): VertexBufferObject => {
  return {
    indices: gl.createBuffer(),

    positions: gl.createBuffer(),
    normals: gl.createBuffer(),

    uvs: gl.createBuffer()
  }
}

export default class Geometry implements Component {
  type: ComponentEnum
  drawMode: DrawMode

  vertex: VertexObject | null

  buffer: VertexBufferObject | null

  visible: boolean

  cull: boolean
  boundingSphere: boolean

  constructor(drawMode: DrawMode = DrawMode.TRIANGLE, visible: boolean = true, cull: boolean = true, boundingSphere: boolean = true) {
    this.type = ComponentEnum.GEOMETRY
    this.drawMode = drawMode

    this.vertex = createVertexObject()
    this.buffer = null

    this.visible = visible

    this.cull = cull
    this.boundingSphere = boundingSphere
  }

  load = (gl: WebGL2RenderingContext) => {
    if(this.buffer) return true

    if(!this.vertex.count) return false

    this.buffer = createVertexBufferObject(gl)

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.buffer.indices)
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.vertex.indices), gl.STATIC_DRAW)

    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer.positions)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertex.positions), gl.STATIC_DRAW)
    
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer.normals)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertex.normals), gl.STATIC_DRAW)
    
    if(!this.vertex.uvs) return

    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer.uvs)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertex.uvs), gl.STATIC_DRAW)

    return true
  }

  bind = (gl: WebGL2RenderingContext, material: Material): boolean => {
    if(!this.load(gl)) return false

    const type: number = gl.FLOAT
    const normalize: boolean = false
    const stride: number = 0
    const offset: number = 0

    // INDICES

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.buffer.indices)

    // POSITION

    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer.positions)
    gl.vertexAttribPointer(
      material.attributeLocations.get('aVertexPosition'),
      3,
      type,
      normalize,
      stride,
      offset)
    gl.enableVertexAttribArray(
      material.attributeLocations.get('aVertexPosition')
    )
 
    // NORMAL

    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer.normals)
    gl.vertexAttribPointer(
      material.attributeLocations.get('aVertexNormal'),
      3,
      type,
      normalize,
      stride,
      offset)
    gl.enableVertexAttribArray(
      material.attributeLocations.get('aVertexNormal')
    )

    if(!this.vertex.uvs) return true

    // UV

    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer.uvs)
    gl.vertexAttribPointer(
      material.attributeLocations.get('aVertexUv'),
      2,
      type,
      normalize,
      stride,
      offset)
    gl.enableVertexAttribArray(
      material.attributeLocations.get('aVertexUv')
    )

    return true
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

    this.vertex.count = componentCount

    return true
  }

  setVertexNormals = (normals: Array<number>): boolean => {
    this.vertex.normals = normals
    return true
  }

  setVertexUvs = (uvs: Array<number>): boolean => {
    this.vertex.uvs = uvs
    return true
  }

  setVertices = (vertex: VertexObject): boolean => {
    this.vertex = vertex
    if(!this.vertex.normals) this.vertex.normals = calcNormals(this.vertex.positions)

    this.vertex.min = [-1.0, -1.0, -1.0]
    this.vertex.max = [1.0, 1.0, 1.0]

    return true
  }

  onAdd = (self: Entity) => {
    if(!this.boundingSphere) return
    
    const boundingSphere: BoundingSphere = new BoundingSphere()
    self.add(boundingSphere)
  }
}

export const calcNormals = (positions: Array<number>): Array<number> | null => {
  const normals: Array<number> = new Array<number>()

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