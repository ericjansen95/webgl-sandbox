import Component, { ComponentEnum } from "../base/component"
import Entity from "../../scene/entity"
import { mat4, vec3 } from "gl-matrix"
import Transform from "../base/transform"
import Camera from "../base/camera"
import Debug from "../../internal/debug"
import { roundNumber } from "../../../util/math/round"

const vsDefaultSource: string = require('/src/core/components/material/shader/default.vs') as string

export type LightData = { mainDirection: vec3 }
const DEFAULT_MAIN_LIGHT_DIRECTION: vec3 = vec3.normalize(vec3.create(), [0.75, 0.25, 0.0])
export const DEFAULT_AMBIENT_LIGHT_INTENSITY: number = 0.25

export default class Material implements Component {
  type: ComponentEnum
  program: WebGLProgram

  attributeLocations: Map<string, number>
  uniformLocations: Map<string, WebGLUniformLocation>

  bind: (gl?: WebGL2RenderingContext, light?: LightData, viewDir?: vec3, offsetMatrix?: mat4) => void
  compile: (gl: WebGL2RenderingContext) => boolean

  bindBase = (gl: WebGL2RenderingContext, entity: Entity, camera: Entity, light: LightData = { mainDirection: DEFAULT_MAIN_LIGHT_DIRECTION }): boolean => {
    const { localMatrix: modelMatrix, globalMatrix: globalMatrix } = entity.get(ComponentEnum.TRANSFORM) as Transform
    const { projectionMatrix, viewMatrix, viewDir } = camera.get(ComponentEnum.CAMERA) as Camera

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
  compileBase = (gl: WebGL2RenderingContext, fsSource: string, vsSource: string = vsDefaultSource): boolean => {
    if(this.program) return false

    const startTime = performance.now()
    
    const result = compileProgram(gl, vsSource, fsSource)
    if(!result) {
      Debug.info(`Material::compileBase(): Failed to compile program!`)
      return null
    }

    const {program, attributeLocations, uniformLocations} = result
    
    this.program = program
    this.attributeLocations = attributeLocations
    this.uniformLocations = uniformLocations

    const compileTime = roundNumber(performance.now() - startTime)
    Debug.info(`Material::compileBase(): Compiled program in = ${compileTime} ms`)

    return true
  }

  constructor() {
    this.type = ComponentEnum.MATERIAL
    this.program = null

    this.attributeLocations = null
    this.uniformLocations = null
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