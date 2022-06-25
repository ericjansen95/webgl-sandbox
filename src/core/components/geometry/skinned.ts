import { mat4 } from "gl-matrix"
import Entity from "../../scene/entity"
import { ComponentEnum } from "../base/component"
import Transform from "../base/transform"
import Material from "../material/material"
import Geometry, { createVBO, createVAO, DrawMode, VBO, VAO } from "./geometry"

export type SVAO = VAO & {
  WEIGHTS_0: Float32Array
  JOINTS_0: Uint8Array
}

export type SVBO = VBO & {
  WEIGHTS_0: WebGLBuffer
  JOINTS_0: WebGLBuffer
}

export const createSVAO = (): SVAO => {
  return {
    ...createVAO(),
    WEIGHTS_0: new Float32Array(),
    JOINTS_0: new Uint8Array(),
  }
}

export const createSVBO = (gl: WebGL2RenderingContext): SVBO => {
  return {
    ...createVBO(gl),
    WEIGHTS_0: gl.createBuffer(),
    JOINTS_0: gl.createBuffer()
  }
}

export default class SkinnedGeometry extends Geometry {
  vao: SVAO
  vbo: SVBO | null

  pose: Array<mat4>

  constructor(visible: boolean = true, cull: boolean = true, boundingSphere: boolean = true) {
    super(DrawMode.TRIANGLE, visible, cull, boundingSphere)

    this.vao = createSVAO()
  }

  load = (gl: WebGL2RenderingContext) => {
    if(this.vbo) return true
    if(!this.vao.count) return false

    this.loadBase(gl)

    this.vbo.WEIGHTS_0 = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo.WEIGHTS_0)
    gl.bufferData(gl.ARRAY_BUFFER, this.vao.WEIGHTS_0, gl.STATIC_DRAW)
    
    this.vbo.JOINTS_0 = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo.JOINTS_0)
    gl.bufferData(gl.ARRAY_BUFFER, this.vao.JOINTS_0, gl.STATIC_DRAW)

    return true
  }

  bind = (gl: WebGL2RenderingContext, material: Material): boolean => {
    if(!this.load(gl)) return false

    this.bindBase(gl, material)

    const normalize: boolean = false
    const stride: number = 0
    const offset: number = 0

    // JOINT WEIGHTS

    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo.WEIGHTS_0)
    gl.enableVertexAttribArray(
      material.attributeLocations.get('aJointWeight')
    )
    gl.vertexAttribPointer(
      material.attributeLocations.get('aJointWeight'),
      4,
      gl.FLOAT,
      normalize,
      stride,
      offset)
  
    // JOINT INDICES

    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo.JOINTS_0)
    gl.enableVertexAttribArray(
      material.attributeLocations.get('aJointIndices')
    )
    gl.vertexAttribPointer(
      material.attributeLocations.get('aJointIndices'),
      4,
      gl.UNSIGNED_BYTE,
      normalize,
      stride,
      offset)

    const jointsMatrixBuffer = new Float32Array(16 * 24)
    for(let jointIndex = 0; jointIndex < this.pose.length; jointIndex++)
      jointsMatrixBuffer.set(this.pose[jointIndex], jointIndex * 16)

    gl.uniformMatrix4fv(material.uniformLocations.get('uJointsMatrix'), false, jointsMatrixBuffer)

    return true
  }

  setPose = (pose: Array<mat4>) => {
    this.pose = pose
  }

  setVAO = (vao: SVAO): boolean => {
    this.setVAOBase(vao)
    
    this.vao.JOINTS_0 = vao.JOINTS_0
    this.vao.WEIGHTS_0 = vao.WEIGHTS_0

    return true
  }

  onAdd = (self: Entity) => {
    this.onAddBase(self)
  }
}