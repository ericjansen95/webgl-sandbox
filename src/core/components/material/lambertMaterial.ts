import { vec3 } from "gl-matrix";
import Material, { compileProgram, DEFAULT_AMBIENT_LIGHT_INTENSITY, LightData } from "./material";

const vsDefaultSource: string = require('/src/core/components/material/shader/default.vs') as string
const fsLambertSource: string = require('/src/core/components/material/shader/lambert.fs') as string

export default class LambertMaterial extends Material {
  color: vec3

  constructor(color) {
    super()
    this.color = color
  }

  compile = (gl: WebGL2RenderingContext): boolean => {
    if(this.program) return true

    const {program, attributeLocations, uniformLocations} = compileProgram(gl, vsDefaultSource, fsLambertSource)
    
    this.program = program
    this.attributeLocations = attributeLocations
    this.uniformLocations = uniformLocations

    this.uniformLocations.set('uColor', gl.getUniformLocation(program, 'uColor'))

    this.uniformLocations.set('uAmbientLight', gl.getUniformLocation(program, 'uAmbientLight'))
    this.uniformLocations.set('uLightDir', gl.getUniformLocation(program, 'uLightDir'))

    return true
  }

  bind = (gl: WebGL2RenderingContext, light: LightData): boolean => {
    this.compile(gl)

    const { mainDirection } = light

    gl.uniform1f(this.uniformLocations.get('uAmbientLight'), DEFAULT_AMBIENT_LIGHT_INTENSITY)
    gl.uniform3fv(this.uniformLocations.get('uLightDir'), mainDirection)
    gl.uniform3fv(this.uniformLocations.get('uColor'), this.color)

    return true
  }
}