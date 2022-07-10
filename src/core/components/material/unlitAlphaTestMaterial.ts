import Texture from "../../renderer/texture";
import Material from "./material";

const fsUnlitAlphaTestSource: string = require('/src/core/components/material/shader/unlitAlphaTest.fs') as string

export default class UnlitAlphaTestMaterial extends Material {
  texture: Texture

  constructor(texture: Texture) {
    super()
    this.texture = texture
  }

  compile = (gl: WebGL2RenderingContext): boolean => {
    if(!this.compileBase(gl, fsUnlitAlphaTestSource)) return true

    this.uniformLocations.set('uTexture', gl.getUniformLocation(this.program, 'uColor'))

    return true
  }

  bind = (gl: WebGL2RenderingContext): boolean => {
    gl.activeTexture(gl.TEXTURE0)
    this.texture.bind(gl)
    gl.uniform1i(this.uniformLocations.get('uTexture'), 0)

    return true
  }
}