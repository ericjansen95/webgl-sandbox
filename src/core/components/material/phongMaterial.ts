import { vec3 } from "gl-matrix";
import Material, { compileProgram, DEFAULT_AMBIENT_LIGHT_INTENSITY, LightData } from "./material";


const fsPhongSource: string = require('/src/core/components/material/shader/phong.fs') as string

export default class PhongMaterial extends Material {
  color: vec3

  constructor(color) {
    super()
    this.color = color
  }

  compile = (gl: WebGL2RenderingContext): boolean => {
    if(!this.compileBase(gl, fsPhongSource)) return true

    this.uniformLocations.set('uColor', gl.getUniformLocation(this.program, 'uColor'))

    this.uniformLocations.set('uAmbientLight', gl.getUniformLocation(this.program, 'uAmbientLight'))
    this.uniformLocations.set('uLightDir', gl.getUniformLocation(this.program, 'uLightDir'))
    this.uniformLocations.set('uViewDir', gl.getUniformLocation(this.program, 'uViewDir'))

    return true
  }

  bind = (gl: WebGL2RenderingContext, light: LightData, viewDir: vec3): boolean => {
    const { mainDirection } = light

    gl.uniform3fv(this.uniformLocations.get('uColor'), this.color)

    gl.uniform1f(this.uniformLocations.get('uAmbientLight'), DEFAULT_AMBIENT_LIGHT_INTENSITY)
    gl.uniform3fv(this.uniformLocations.get('uLightDir'), mainDirection)
    gl.uniform3fv(this.uniformLocations.get('uViewDir'), viewDir)

    return true
  }
}