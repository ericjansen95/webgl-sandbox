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
    if(!this.compileBase(gl, fsLambertSource)) return true

    this.uniformLocations.set('uColor', gl.getUniformLocation(this.program, 'uColor'))

    this.uniformLocations.set('uAmbientLight', gl.getUniformLocation(this.program, 'uAmbientLight'))
    this.uniformLocations.set('uLightDir', gl.getUniformLocation(this.program, 'uLightDir'))

    return true
  }

  bind = (gl: WebGL2RenderingContext, light: LightData): boolean => {
    const { mainDirection } = light

    gl.uniform3fv(this.uniformLocations.get('uColor'), this.color)

    gl.uniform1f(this.uniformLocations.get('uAmbientLight'), DEFAULT_AMBIENT_LIGHT_INTENSITY)
    gl.uniform3fv(this.uniformLocations.get('uLightDir'), mainDirection)

    return true
  }
}