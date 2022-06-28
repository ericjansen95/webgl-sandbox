import { vec3 } from "gl-matrix";
import Material, { DEFAULT_AMBIENT_LIGHT_INTENSITY, LightData } from "./material";

const vsSkinnedSource: string = require('/src/core/components/material/shader/skinned.vs') as string
const fsSkinnedLambertSource: string = require('/src/core/components/material/shader/skinnedLambert.fs') as string

export default class SkinnedLambertMaterial extends Material {
  color: vec3

  constructor(color) {
    super()

    this.color = color
  }

  compile = (gl: WebGL2RenderingContext): boolean => {
    if(!this.compileBase(gl, fsSkinnedLambertSource, vsSkinnedSource)) return true

    this.attributeLocations.set('aJointWeight', gl.getAttribLocation(this.program, 'aJointWeight'))
    this.attributeLocations.set('aJointIndices', gl.getAttribLocation(this.program, 'aJointIndices'))

    this.uniformLocations.set('uColor', gl.getUniformLocation(this.program, 'uColor'))

    this.uniformLocations.set('uAmbientLight', gl.getUniformLocation(this.program, 'uAmbientLight'))
    this.uniformLocations.set('uLightDir', gl.getUniformLocation(this.program, 'uLightDir'))

    this.uniformLocations.set('uJointsMatrix', gl.getUniformLocation(this.program, 'uJointsMatrix'))

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