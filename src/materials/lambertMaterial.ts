import { vec3 } from "gl-matrix";
import { Material, MaterialType } from "../material";
import Renderer from "../renderer"

const vsDefaultSource: string = require('/public/res/shader/default.vs') as string
const fsLambertSource: string = require('/public/res/shader/lambert.fs') as string

export default class LambertMaterial implements Material {
  type: MaterialType
  program: WebGLProgram
  attributeLocations: Map<string, number>
  uniformLocations: Map<string, WebGLUniformLocation>

  constructor(renderer: Renderer) {
    this.type = "LAMBERT"

    const {program, attributeLocations, uniformLocations} = renderer.compileProgram(vsDefaultSource, fsLambertSource)
    
    this.program = program
    this.attributeLocations = attributeLocations
    this.uniformLocations = uniformLocations

    this.uniformLocations.set('uAmbientLight', renderer.gl.getUniformLocation(program, 'uAmbientLight'))
    this.uniformLocations.set('uLightDir', renderer.gl.getUniformLocation(program, 'uLightDir'))
  }

  bind = (gl: WebGL2RenderingContext, lightDir: vec3) => {
    gl.uniform1f(this.uniformLocations.get('uAmbientLight'), 0.1)
    gl.uniform3fv(this.uniformLocations.get('uLightDir'), lightDir)
  }
}