import { Component } from "./component"
import { GL } from "./renderer"

export type MaterialType = "LAMBERT" | "TERRAIN"

// @ts-expect-error
export default class Material implements Component {
  type: MaterialType
  program: WebGLProgram

  attributeLocations: Map<string, number>
  uniformLocations: Map<string, WebGLUniformLocation>

  bind: Function

  constructor() {
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
    console.error(`Failed to initialize shader program: ${GL.getProgramInfoLog(program)}`)
    return null
  }

  const attributeLocations: Map<string, number> = new Map<string, number>();

  attributeLocations.set('aVertexPosition', GL.getAttribLocation(program, 'aVertexPosition'))
  attributeLocations.set('aVertexNormal', GL.getAttribLocation(program, 'aVertexNormal'))

  const uniformLocations: Map<string, WebGLUniformLocation> = new Map<string, WebGLUniformLocation>();

  uniformLocations.set('uModelMatrix', GL.getUniformLocation(program, 'uModelMatrix'))
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