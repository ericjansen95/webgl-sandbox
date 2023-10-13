import { vec3 } from "gl-matrix";
import Time from "../../internal/time";
import Texture from "../../renderer/texture";
import Material, { LightData, Uniforms, UniformType } from "./material";

const vsVegetationSource = require('/src/core/components/material/shader/vegetation.vs') as string
const fsVegetationSource = require('/src/core/components/material/shader/vegetation.fs') as string

export type VegetationMaterialOptions = {
  uAlbedo: Texture
  uTime?: number
}

export default class VegetationMaterial extends Material {
  constructor(options: VegetationMaterialOptions) {
    super()

    const uniforms: Uniforms = {
      uAlbedo: { type: UniformType.TEXTURE, value: null },
      uTime: { type: UniformType.FLOAT, value: 0 }
    }

    for(const [uniformName, uniform] of Object.entries(uniforms))
      if(options[uniformName]) uniform.value = options[uniformName]
      else if(uniforms[uniformName].value == null) delete uniforms[uniformName]

    this.uniforms = uniforms
  }

  compile = (gl: WebGL2RenderingContext): boolean => {
    if(!this.compileBase(gl, fsVegetationSource, vsVegetationSource)) return true

    for(const uniformName in this.uniforms)
      this.uniformLocations.set(uniformName, gl.getUniformLocation(this.program, uniformName))  

    return true
  }

  bind = (gl: WebGL2RenderingContext, light: LightData, viewDir: vec3): boolean => {
    this.uniforms.uTime.value = Time.startTime - Date.now()

    return true
  }
}