import Component, { ComponentEnum } from "../base/component"
import Entity from "../../scene/entity"
import { mat4, vec3 } from "gl-matrix"
import Transform from "../base/transform"
import Camera from "../base/camera"
import Debug from "../../internal/debug"

export type LightData = { mainDirection: vec3 }
const DEFAULT_MAIN_LIGHT_DIRECTION: vec3 = vec3.normalize(vec3.create(), [0.75, 0.25, 0.0])
export const DEFAULT_AMBIENT_LIGHT_INTENSITY: number = 0.25

export default class Material implements Component {
  type: ComponentEnum
  program: WebGLProgram

  attributeLocations: Map<string, number>
  uniformLocations: Map<string, WebGLUniformLocation>

  bind: (gl: WebGL2RenderingContext, light?: LightData, viewDir?: vec3, offsetMatrix?: mat4) => boolean
  compile: (gl: WebGL2RenderingContext) => boolean

  bindBase = (gl: WebGL2RenderingContext, entity: Entity, camera: Entity, light: LightData = { mainDirection: DEFAULT_MAIN_LIGHT_DIRECTION }): boolean => {
    const { modelMatrix, worldMatrix } = entity.get(ComponentEnum.TRANSFORM) as Transform
    const material = entity.get(ComponentEnum.MATERIAL) as any
    const { projectionMatrix, viewMatrix, viewDir } = camera.get(ComponentEnum.CAMERA) as Camera

    gl.useProgram(material.program)

    gl.uniformMatrix4fv(
      material.uniformLocations.get('uWorldMatrix'),
      false,
      worldMatrix
    )

    gl.uniformMatrix4fv(
      material.uniformLocations.get('uViewMatrix'),
      false,
      viewMatrix
    )

    gl.uniformMatrix4fv(
      material.uniformLocations.get('uProjectionMatrix'),
      false,
      projectionMatrix
    )

    return material.bind(gl, light, viewDir, modelMatrix)
  }

  constructor() {
    this.type = ComponentEnum.MATERIAL
    this.program = null

    this.attributeLocations = new Map<string, number>()
    this.uniformLocations = new Map<string, WebGLUniformLocation>()
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