import { vec3 } from "gl-matrix"
import Entity from "../../scene/entity"
import BoundingSphere from "../boundingVolume/boundingSphere"
import Component, { ComponentType } from "../base/component"
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

export type VAO = {
  count?: number

  POSITION: Float32Array
  NORMAL?: Float32Array

  INDICES?: Uint16Array
  TEXCOORD_0?: Float32Array
  
  min?: vec3
  max?: vec3
}

export type VBO = {
  POSITION: WebGLBuffer
  NORMAL: WebGLBuffer

  INDICES?: WebGLBuffer
  TEXCOORD_0?: WebGLBuffer
}

export const createVAO = (): VAO => {
  return {
    count: 0,

    POSITION: new Float32Array(),
    NORMAL: null,

    INDICES: null,
    TEXCOORD_0: null,

    min: vec3.create(),
    max: vec3.create()
  }
}

export const createVBO = (gl: WebGL2RenderingContext): VBO => {
  return {
    POSITION: gl.createBuffer(),
    NORMAL: gl.createBuffer(),

    INDICES: null,
    TEXCOORD_0: null
  }
}

export default class Geometry implements Component {
  type: ComponentType
  drawMode: DrawMode

  vao: VAO
  vbo: VBO | null

  visible: boolean

  cull: boolean
  boundingSphere: boolean

  constructor(drawMode: DrawMode = DrawMode.TRIANGLE, visible: boolean = true, cull: boolean = true, boundingSphere: boolean = true) {
    this.type = ComponentType.GEOMETRY
    this.drawMode = drawMode

    this.vao = createVAO()
    this.vbo = null

    this.visible = visible

    this.cull = cull
    this.boundingSphere = boundingSphere
  }

  loadBase = (gl: WebGL2RenderingContext, usage: number = gl.STATIC_DRAW) => {
    if(this.vbo) return true
    if(!this.vao.count) return false

    this.vbo = createVBO(gl)

    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo.POSITION)
    gl.bufferData(gl.ARRAY_BUFFER, this.vao.POSITION, usage)
    
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo.NORMAL)
    gl.bufferData(gl.ARRAY_BUFFER, this.vao.NORMAL, usage)
    
    if(this.vao.INDICES) {
      this.vbo.INDICES = gl.createBuffer()

      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.vbo.INDICES)
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.vao.INDICES, usage)  
    }

    if(this.vao.TEXCOORD_0) {
      this.vbo.TEXCOORD_0 = gl.createBuffer()

      gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo.TEXCOORD_0)
      gl.bufferData(gl.ARRAY_BUFFER, this.vao.TEXCOORD_0, usage) 
    }

    return true
  }

  load = (gl: WebGL2RenderingContext) => {
    return this.loadBase(gl)
  }

  bindBase = (gl: WebGL2RenderingContext, material: Material): boolean => {
    if(!this.load(gl)) return false

    const type: number = gl.FLOAT
    const normalize: boolean = false
    const stride: number = 0
    const offset: number = 0

    // POSITION

    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo.POSITION)
    gl.enableVertexAttribArray(
      material.attributeLocations.get('aVertexPosition')
    )
    gl.vertexAttribPointer(
      material.attributeLocations.get('aVertexPosition'),
      3,
      type,
      normalize,
      stride,
      offset)
 
    // NORMAL

    if(material.attributeLocations.get('aVertexNormal') !== -1) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo.NORMAL)
      gl.enableVertexAttribArray(
        material.attributeLocations.get('aVertexNormal')
      )
      gl.vertexAttribPointer(
        material.attributeLocations.get('aVertexNormal'),
        3,
        type,
        normalize,
        stride,
        offset)
    }

    // INDICES

    if(this.vbo.INDICES)
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.vbo.INDICES)

    // UV

    if(this.vbo.TEXCOORD_0) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo.TEXCOORD_0)
      gl.enableVertexAttribArray(
        material.attributeLocations.get('aVertexUv')
      )
      gl.vertexAttribPointer(
        material.attributeLocations.get('aVertexUv'),
        2,
        type,
        normalize,
        stride,
        offset)
    }

    return true
  }

  bind = (gl: WebGL2RenderingContext, material: Material): boolean => {
    return this.bindBase(gl, material)
  }

  setVAOBase = (vao: VAO): boolean => {
    this.vao = vao
    this.vao.count = this.vao.POSITION.length

    if(!this.vao.NORMAL) this.vao.NORMAL = calcNormals(this.vao.POSITION)

    if(!this.vao.min) this.vao.min = [-1.0, -1.0, -1.0]
    if(!this.vao.max) this.vao.max = [1.0, 1.0, 1.0]

    return true
  }

  setVAO = (vao: VAO): boolean => {
    return this.setVAOBase(vao)
  }

  onAddBase = (self: Entity) => {
    if(!this.boundingSphere) return
    
    const boundingSphere: BoundingSphere = new BoundingSphere()
    self.add(boundingSphere)
  }

  onAdd = (self: Entity) => {
    this.onAddBase(self)
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