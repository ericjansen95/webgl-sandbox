import { vec3 } from "gl-matrix";
import Material from "./material";

const vsSkinnedSource: string = require('/src/core/components/material/shader/skinned.vs') as string
const fsUnlitSource: string = require('/src/core/components/material/shader/unlit.fs') as string

export default class SkinnedUnlitMaterial extends Material {
  color: vec3

  constructor(color) {
    super()
    this.color = color
  }

  compile = (gl: WebGL2RenderingContext): boolean => {
    if(!this.compileBase(gl, fsUnlitSource, vsSkinnedSource)) return true

    this.attributeLocations.set('aJointWeight', gl.getAttribLocation(this.program, 'aJointWeight'))
    this.attributeLocations.set('aJointIndices', gl.getAttribLocation(this.program, 'aJointIndices'))

    this.uniformLocations.set('uColor', gl.getUniformLocation(this.program, 'uColor'))

    return true
  }

  bind = (gl: WebGL2RenderingContext): boolean => {
    gl.uniform3fv(this.uniformLocations.get('uColor'), this.color)
    return true
  }
}