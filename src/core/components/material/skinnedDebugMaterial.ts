import { vec3 } from "gl-matrix";
import Material from "./material";

const vsSkinnedSource: string = require('/src/core/components/material/shader/skinned.vs') as string
const fsSkinnedDebugSource: string = require('/src/core/components/material/shader/skinnedDebug.fs') as string

export default class SkinnedDebugMaterial extends Material {
  constructor() {
    super()
  }

  compile = (gl: WebGL2RenderingContext): boolean => {
    if(!this.compileBase(gl, fsSkinnedDebugSource, vsSkinnedSource)) return true

    this.attributeLocations.set('aJointWeight', gl.getAttribLocation(this.program, 'aJointWeight'))
    this.attributeLocations.set('aJointIndices', gl.getAttribLocation(this.program, 'aJointIndices'))

    this.uniformLocations.set('uColor', gl.getUniformLocation(this.program, 'uColor'))
    this.uniformLocations.set('uJointsMatrix', gl.getUniformLocation(this.program, 'uJointsMatrix'))

    return true
  }

  bind = (gl: WebGL2RenderingContext): boolean => {
    return true
  }
}