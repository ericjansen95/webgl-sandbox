import { vec3 } from "gl-matrix";
import Material, { compileProgram, LightData } from "./material";

const vsDefaultSource: string = require('/src/core/components/material/shader/default.vs') as string
const fsUnlitSource: string = require('/src/core/components/material/shader/unlit.fs') as string

export default class UnlitMaterial extends Material {
  color: vec3

  constructor(color) {
    super()
    this.color = color
  }

  compile = (gl: WebGL2RenderingContext): boolean => {
    if(this.program) return true

    const {program, attributeLocations, uniformLocations} = compileProgram(gl, vsDefaultSource, fsUnlitSource)
    
    this.program = program
    this.attributeLocations = attributeLocations
    this.uniformLocations = uniformLocations

    this.uniformLocations.set('uColor', gl.getUniformLocation(program, 'uColor'))

    return true
  }

  bind = (gl: WebGL2RenderingContext): boolean => {
    this.compile(gl)

    gl.uniform3fv(this.uniformLocations.get('uColor'), this.color)

    return true
  }
}