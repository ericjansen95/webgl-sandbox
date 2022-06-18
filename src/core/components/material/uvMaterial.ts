import { vec3 } from "gl-matrix";
import Material, { compileProgram, LightData } from "./material";

const vsDefaultSource: string = require('/src/core/components/material/shader/default.vs') as string
const fsUvSource: string = require('/src/core/components/material/shader/uv.fs') as string

export default class UvMaterial extends Material {
  constructor() {
    super()
  }

  compile = (gl: WebGL2RenderingContext): boolean => {
    if(this.program) return true

    const {program, attributeLocations, uniformLocations} = compileProgram(gl, vsDefaultSource, fsUvSource)
    
    this.program = program
    this.attributeLocations = attributeLocations
    this.uniformLocations = uniformLocations

    return true
  }

  bind = (gl: WebGL2RenderingContext): boolean => {
    this.compile(gl)

    return true
  }
}