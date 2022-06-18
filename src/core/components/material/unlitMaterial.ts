import { vec3 } from "gl-matrix";
import Material from "./material";

const fsUnlitSource: string = require('/src/core/components/material/shader/unlit.fs') as string

export default class UnlitMaterial extends Material {
  color: vec3

  constructor(color) {
    super()
    this.color = color
  }

  compile = (gl: WebGL2RenderingContext): boolean => {
    if(!this.compileBase(gl, fsUnlitSource)) return true

    this.uniformLocations.set('uColor', gl.getUniformLocation(this.program, 'uColor'))

    return true
  }

  bind = (gl: WebGL2RenderingContext): boolean => {
    gl.uniform3fv(this.uniformLocations.get('uColor'), this.color)
    return true
  }
}