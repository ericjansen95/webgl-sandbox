import ComponentInterface, { Component } from "../base/component"
import { GL } from "../../scene/renderer"
import Entity from "../../scene/entity"
import { mat4, vec3 } from "gl-matrix"
import Transform from "../base/transform"
import Camera from "../base/camera"

export type MaterialType = "LAMBERT" | "TERRAIN" | "UNLIT"

export default class Material implements ComponentInterface {
  type: Component
  materialType: MaterialType
  program: WebGLProgram

  attributeLocations: Map<string, number>
  uniformLocations: Map<string, WebGLUniformLocation>

  bindBase = (GL: WebGL2RenderingContext, options: { entity: Entity, camera: Entity, lightDir: vec3 }): boolean => {
    const {entity, camera, lightDir} = options

    const transform = entity.get(Component.TRANSFORM) as Transform
    const material = entity.get(Component.MATERIAL) as any
  
    if(!transform || !material) return false

    // ToDo: Extract this data once at start of tick?
    const viewMatrix = (camera.get(Component.TRANSFORM) as Transform).worldMatrix
    const projectionMatrix = (camera.get(Component.CAMERA) as Camera).projectionMatrix

    GL.useProgram(material.program)       

    GL.uniformMatrix4fv(
      material.uniformLocations.get('uWorldMatrix'),
      false,
      transform.worldMatrix
    )

    // ToDo: Cache inverted view matrix in camera?
    GL.uniformMatrix4fv(
      material.uniformLocations.get('uViewMatrix'),
      false,
      mat4.invert(mat4.create(), viewMatrix)
    )

    GL.uniformMatrix4fv(
      material.uniformLocations.get('uProjectionMatrix'),
      false,
      projectionMatrix
    )

    switch(material.materialType) {
      case "LAMBERT": {
        material.bind(lightDir)
        break
      }
      case "TERRAIN": {
        material.bind(lightDir, transform.modelMatrix)
        break
      }
      case "UNLIT": {
        material.bind()
        break
      }
      default:
        throw new Error("Renderer::bindMaterial(): Invalid or unimplemented material type!")
    }

    return true
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
    console.error(`Failed to initialize shader program: ${GL.getProgramInfoLog(program)}`)
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