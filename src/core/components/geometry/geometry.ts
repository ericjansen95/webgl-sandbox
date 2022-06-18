import { vec3 } from "gl-matrix"
import Entity from "../../scene/entity"
import BoundingSphere from "../boundingVolume/boundingSphere"
import Component, { ComponentEnum } from "../base/component"
import Material from "../material/material"

// https://www.khronos.org/registry/webgl/specs/latest/1.0/
/*
  const GLenum POINTS         = 0x0000;
  const GLenum LINES          = 0x0001;
  const GLenum LINE_LOOP      = 0x0002;
  const GLenum LINE_STRIP     = 0x0003;
  const GLenum TRIANGLES      = 0x0004;
  const GLenum TRIANGLE_STRIP = 0x0005;
  const GLenum TRIANGLE_FAN   = 0x0006;
*/
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
  return new Float32Array(output)
}

export const parseUnindexedVertexUvs = (indices: Uint16Array, uvs: Float32Array) => {
  const output = new Array<number>()
  for(const index of indices) {
    const correctedIndex = index * 2
    output.push(uvs[correctedIndex], uvs[correctedIndex + 1])
  }
  return new Float32Array(output)
}

export type VertexObject = {
  count?: number

  position: Float32Array
  normal?: Float32Array

  indices?: Uint16Array
  texcoord?: Float32Array
  
  min?: vec3
  max?: vec3
}

export type VertexBufferObject = {
  position: WebGLBuffer
  normal: WebGLBuffer

  indices?: WebGLBuffer
  texcoord?: WebGLBuffer
}

export const createVertexObject = (): VertexObject => {
  return {
    count: 0,

    position: new Float32Array,
    normal: null,

    indices: null,
    texcoord: null,

    min: vec3.create(),
    max: vec3.create()
  }
}

export const createVertexBufferObject = (gl: WebGL2RenderingContext): VertexBufferObject => {
  return {
    position: gl.createBuffer(),
    normal: gl.createBuffer()
  }
}

export default class Geometry implements Component {
  type: ComponentEnum
  drawMode: DrawMode

  vertex: VertexObject
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

    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer.position)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertex.position), gl.STATIC_DRAW)
    
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer.normal)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertex.normal), gl.STATIC_DRAW)
    
    if(this.vertex.indices) {
      this.buffer.indices = gl.createBuffer()

      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.buffer.indices)
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.vertex.indices), gl.STATIC_DRAW)  
    }

    if(this.vertex.texcoord) {
      this.buffer.texcoord = gl.createBuffer()

      gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer.texcoord)
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertex.texcoord), gl.STATIC_DRAW) 
    }

    return true
  }

  bind = (gl: WebGL2RenderingContext, material: Material): boolean => {
    if(!this.load(gl)) return false

    const type: number = gl.FLOAT
    const normalize: boolean = false
    const stride: number = 0
    const offset: number = 0

    // POSITION

    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer.position)
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

    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer.normal)
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

    // INDICES
    
    if(this.buffer.indices)
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.buffer.indices)

    // UV

    if(this.buffer.texcoord) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer.texcoord)
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
    }

    return true
  }

  setVertices = (vertex: VertexObject): boolean => {
    this.vertex = vertex
    this.vertex.count = this.vertex.position.length

    if(!this.vertex.normal) this.vertex.normal = calcNormals(this.vertex.position)

    if(!this.vertex.min) this.vertex.min = [-1.0, -1.0, -1.0]
    if(!this.vertex.max) this.vertex.max = [1.0, 1.0, 1.0]

    return true
  }

  onAdd = (self: Entity) => {
    if(!this.boundingSphere) return
    
    const boundingSphere: BoundingSphere = new BoundingSphere()
    self.add(boundingSphere)
  }
}

export const calcNormals = (positions: Float32Array): Float32Array => {
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

  return new Float32Array(normals)
}