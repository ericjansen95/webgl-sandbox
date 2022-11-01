import { vec3 } from "gl-matrix";
import Texture from "../../renderer/texture";
import Material, { DEFAULT_AMBIENT_LIGHT_INTENSITY, LightData, Uniform, Uniforms, UniformType } from "./material";

const fsPrincipleSource: string = require('/src/core/components/material/shader/principle.fs') as string

export type PrincipleMaterialUniforms = {
  uColor: { type: UniformType.VEC3, value: vec3}
  uAlbedo: { type: UniformType.TEXTURE, value: Texture}
  uSpecular: { type: UniformType.FLOAT, value: number}
  uRoughness: { type: UniformType.FLOAT, value: number}
  uEnviroment: { type: UniformType.TEXTURE, value: Texture}
}

export default class PrincipleMaterial extends Material {
  constructor(uniforms: PrincipleMaterialUniforms) {
    super()
    this.uniforms = uniforms as Uniforms
  }

  compile = (gl: WebGL2RenderingContext): boolean => {
    if(!this.compileBase(gl, fsPrincipleSource)) return true

    for(const uniformName in this.uniforms)
      this.uniformLocations.set(uniformName, gl.getUniformLocation(this.program, uniformName))  

    this.uniformLocations.set('uViewDir', gl.getUniformLocation(this.program, 'uViewDir'))

    this.uniformLocations.set('uLightDir', gl.getUniformLocation(this.program, 'uLightDir'))
    this.uniformLocations.set('uAmbientLight', gl.getUniformLocation(this.program, 'uAmbientLight'))
    
    return true
  }

  bind = (gl: WebGL2RenderingContext, light: LightData, viewDir: vec3): boolean => {
    this.setUniforms(gl)

    const { mainDirection } = light

    gl.uniform3fv(this.uniformLocations.get('uLightDir'), mainDirection)
    gl.uniform1f(this.uniformLocations.get('uAmbientLight'), DEFAULT_AMBIENT_LIGHT_INTENSITY)

    gl.uniform3fv(this.uniformLocations.get('uViewDir'), viewDir)

    return true
  }
}