import { vec3 } from "gl-matrix";
import { compileProgram, Material, MaterialType } from "../material";
import Renderer, { GL } from "../renderer"

const vsDefaultSource: string = require('/public/res/shader/default.vs') as string
const fsLambertSource: string = require('/public/res/shader/lambert.fs') as string

export default class LambertMaterial implements Material {
  type: MaterialType
  color: vec3
  program: WebGLProgram
  attributeLocations: Map<string, number>
  uniformLocations: Map<string, WebGLUniformLocation>

  constructor(color) {
    this.type = "LAMBERT"

    const {program, attributeLocations, uniformLocations} = compileProgram(vsDefaultSource, fsLambertSource)
    
    this.program = program
    this.attributeLocations = attributeLocations
    this.uniformLocations = uniformLocations

    this.color = color
    this.uniformLocations.set('uColor', GL.getUniformLocation(program, 'uColor'))

    this.uniformLocations.set('uAmbientLight', GL.getUniformLocation(program, 'uAmbientLight'))
    this.uniformLocations.set('uLightDir', GL.getUniformLocation(program, 'uLightDir'))
  }

  bind = (gl: WebGL2RenderingContext, lightDir: vec3) => {
    gl.uniform1f(this.uniformLocations.get('uAmbientLight'), 0.1)
    gl.uniform3fv(this.uniformLocations.get('uLightDir'), lightDir)
    gl.uniform3fv(this.uniformLocations.get('uColor'), this.color)
  }
}