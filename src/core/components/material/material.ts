import ComponentInterface, { Component } from "../base/component"
import { GL } from "../../scene/renderer"
import Entity from "../../scene/entity"
import { mat4, vec3 } from "gl-matrix"
import Transform from "../base/transform"
import Camera from "../base/camera"
import Debug from "../../internal/debug"

export type LightData = { mainDirection: vec3 }
const DEFAULT_MAIN_LIGHT_DIRECTION: vec3 = vec3.normalize(vec3.create(), [0.75, 0.25, 0.0])

export default class Material implements ComponentInterface {
  type: Component
  program: WebGLProgram

  attributeLocations: Map<string, number>
  uniformLocations: Map<string, WebGLUniformLocation>

  bind: (light?: LightData, offsetMatrix?: mat4) => void

  bindBase = (GL: WebGL2RenderingContext, entity: Entity, camera: Entity, light: LightData = { mainDirection: DEFAULT_MAIN_LIGHT_DIRECTION }) => {
    const { mainDirection } = light

    const { modelMatrix, worldMatrix } = entity.get(Component.TRANSFORM) as Transform
    const material = entity.get(Component.MATERIAL) as any
    const { projectionMatrix, viewMatrix } = camera.get(Component.CAMERA) as Camera

    GL.useProgram(material.program)

    GL.uniformMatrix4fv(
      material.uniformLocations.get('uWorldMatrix'),
      false,
      worldMatrix
    )

    GL.uniformMatrix4fv(
      material.uniformLocations.get('uViewMatrix'),
      false,
      viewMatrix
    )

    GL.uniformMatrix4fv(
      material.uniformLocations.get('uProjectionMatrix'),
      false,
      projectionMatrix
    )

    material.bind(light, modelMatrix)
  }

  constructor() {
    this.type = Component.MATERIAL
    this.attributeLocations = new Map<string, number>()
    this.uniformLocations = new Map<string, WebGLUniformLocation>()
  }
}

export const compileProgram = (vsSource: string, fsSource: string): {program: Material["program"], uniformLocations: Material["uniformLocations"], attributeLocations: Material["attributeLocations"]} | null => {
  const vertexShader = loadShader(GL.VERTEX_SHADER, vsSource)
  const fragmentShader = loadShader(GL.FRAGMENT_SHADER, fsSource)

  const program: WebGLProgram = GL.createProgram()
  GL.attachShader(program, vertexShader)
  GL.attachShader(program, fragmentShader)
  GL.linkProgram(program)

  if(!GL.getProgramParameter(program, GL.LINK_STATUS)) {
    Debug.error(`Failed to initialize shader program: ${GL.getProgramInfoLog(program)}`)
    return null
  }

  const attributeLocations: Map<string, number> = new Map<string, number>();

  attributeLocations.set('aVertexPosition', GL.getAttribLocation(program, 'aVertexPosition'))
  attributeLocations.set('aVertexNormal', GL.getAttribLocation(program, 'aVertexNormal'))

  const uniformLocations: Map<string, WebGLUniformLocation> = new Map<string, WebGLUniformLocation>();

  uniformLocations.set('uWorldMatrix', GL.getUniformLocation(program, 'uWorldMatrix'))
  uniformLocations.set('uViewMatrix', GL.getUniformLocation(program, 'uViewMatrix'))
  uniformLocations.set('uProjectionMatrix', GL.getUniformLocation(program, 'uProjectionMatrix'))
      
  return {
    program,
    attributeLocations,
    uniformLocations,
  }
}

export const loadShader = (type: number, source: string): WebGLShader | null => {

  const shader: WebGLShader = GL.createShader(type)

  GL.shaderSource(shader, source)
  GL.compileShader(shader)

  if(!GL.getShaderParameter(shader, GL.COMPILE_STATUS)) {
    console.error(`Failed to compile shader: ${GL.getShaderInfoLog(shader)}`)
    GL.deleteShader(shader)
    return null
  }

  return shader
}