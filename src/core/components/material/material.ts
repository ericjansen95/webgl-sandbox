import Component, { ComponentType } from "../base/component"
import Entity from "../../scene/entity"
import { mat4, vec2, vec3 } from "gl-matrix"
import Transform from "../base/transform"
import Camera from "../base/camera"
import Debug from "../../internal/debug"
import { roundNumber } from "../../../util/math/round"
import Texture from "../../renderer/texture"

const vsStaticSource: string = require('/src/core/components/material/shader/static.vs') as string

export type LightData = { mainDirection: vec3 }
const DEFAULT_MAIN_LIGHT_DIRECTION: vec3 = vec3.normalize(vec3.create(), [0.75, 0.25, 0.0])
export const DEFAULT_AMBIENT_LIGHT_INTENSITY: number = 0.29

export enum UniformType {
  FLOAT = 'float',
  VEC2 = 'vec2',
  VEC3 = 'vec3',
  TEXTURE = 'texture'
}
export type UniformValue = number | vec2 | vec3 | Texture | any

export type Uniform = {type: UniformType, value: UniformValue}
export type Uniforms = {[uniformName: string]: Uniform}

export default class Material implements Component {
  type: ComponentType
  program: WebGLProgram

  attributeLocations: Map<string, number>
  uniformLocations: Map<string, WebGLUniformLocation>
  uniforms: Uniforms

  bind: (gl?: WebGL2RenderingContext, light?: LightData, viewDir?: vec3, offsetMatrix?: mat4) => void
  compile: (gl: WebGL2RenderingContext) => boolean

  bindBase = (gl: WebGL2RenderingContext, entity: Entity, camera: Entity, light: LightData = { mainDirection: DEFAULT_MAIN_LIGHT_DIRECTION }): boolean => {
    const { localMatrix: modelMatrix, globalMatrix: globalMatrix } = entity.getComponent(ComponentType.TRANSFORM) as Transform
    const { projectionMatrix, viewMatrix, viewDir } = camera.getComponent(ComponentType.CAMERA) as Camera

    if(!this.compile(gl)) return false
    gl.useProgram(this.program)

    this.bind(gl, light, viewDir, modelMatrix)

    gl.uniformMatrix4fv(
      this.uniformLocations.get('uWorldMatrix'),
      false,
      globalMatrix
    )

    gl.uniformMatrix4fv(
      this.uniformLocations.get('uViewMatrix'),
      false,
      viewMatrix
    )

    gl.uniformMatrix4fv(
      this.uniformLocations.get('uProjectionMatrix'),
      false,
      projectionMatrix
    )

    return true
  }
  compileBase = (gl: WebGL2RenderingContext, fsSource: string, vsSource: string = vsStaticSource): boolean => {
    if(this.program) return false

    const startTime = window.performance.now()
    
    const result = compileProgram(gl, vsSource, fsSource)
    if(!result) {
      Debug.error(`Material::compileBase(): Failed to compile program!`)
      return null
    }

    const {program, attributeLocations, uniformLocations} = result
    
    this.program = program
    this.attributeLocations = attributeLocations
    this.uniformLocations = uniformLocations

    const compileTime = roundNumber(window.performance.now() - startTime)
    Debug.info(`Material::compileBase(): Compiled program in = ${compileTime} ms`)

    return true
  }

  setUniforms = (gl: WebGL2RenderingContext) => {
    let textureIndex = 0
    for(const entry of Object.entries(this.uniforms)) {
      this.setUniform(gl, entry, textureIndex)

      if(entry[1].type === UniformType.TEXTURE) ++textureIndex
    }
  }

  setUniform = (gl: WebGL2RenderingContext, entry: [string, Uniform], textureIndex: number) => {
    const [uniformName, uniform] = entry
    const { type, value } = uniform
    const location = this.uniformLocations.get(uniformName)

    switch(type) {
      case UniformType.FLOAT: {
        gl.uniform1f(location, value)
        return
      }
      case UniformType.VEC2: {
        gl.uniform2fv(location, value)
        return
      }
      case UniformType.VEC3: {
        gl.uniform3fv(location, value)
        return
      }
      case UniformType.TEXTURE: {
        // inital index is gl.TEXTURE0
        // see: https://registry.khronos.org/OpenGL-Refpages/es2.0/xhtml/glActiveTexture.xml
        gl.activeTexture(gl.TEXTURE0 + textureIndex)
        value.bind(gl)
        gl.uniform1i(location, textureIndex)
        return
      }
      default: {
        Debug.error(`Material::setUniform(): Invalid uniform type = ${type}`)
        return
      }
    }
  }

  constructor() {
    this.type = ComponentType.MATERIAL
    this.program = null

    this.attributeLocations = null
    this.uniformLocations = null

    this.uniforms = null
  }
}

export const compileProgram = (gl: WebGL2RenderingContext, vsSource: string, fsSource: string): {program: Material["program"], uniformLocations: Material["uniformLocations"], attributeLocations: Material["attributeLocations"]} | null => {
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource)
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource)

  const program: WebGLProgram = gl.createProgram()
  gl.attachShader(program, vertexShader)
  gl.attachShader(program, fragmentShader)
  gl.linkProgram(program)

  if(!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    Debug.error(`Failed to initialize shader program: ${gl.getProgramInfoLog(program)}`)
    return null
  }

  const attributeLocations: Map<string, number> = new Map<string, number>();

  attributeLocations.set('aVertexPosition', gl.getAttribLocation(program, 'aVertexPosition'))
  attributeLocations.set('aVertexNormal', gl.getAttribLocation(program, 'aVertexNormal'))
  attributeLocations.set('aVertexTangent', gl.getAttribLocation(program, 'aVertexTangent'))
  attributeLocations.set('aVertexUv', gl.getAttribLocation(program, 'aVertexUv'))

  const uniformLocations: Map<string, WebGLUniformLocation> = new Map<string, WebGLUniformLocation>();

  uniformLocations.set('uWorldMatrix', gl.getUniformLocation(program, 'uWorldMatrix'))
  uniformLocations.set('uViewMatrix', gl.getUniformLocation(program, 'uViewMatrix'))
  uniformLocations.set('uProjectionMatrix', gl.getUniformLocation(program, 'uProjectionMatrix'))
      
  return {
    program,
    attributeLocations,
    uniformLocations,
  }
}

export const loadShader = (gl: WebGL2RenderingContext, type: number, source: string): WebGLShader | null => {

  const shader: WebGLShader = gl.createShader(type)

  gl.shaderSource(shader, source)
  gl.compileShader(shader)

  if(!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(`Failed to compile shader: ${gl.getShaderInfoLog(shader)}`)
    gl.deleteShader(shader)
    return null
  }

  return shader
}