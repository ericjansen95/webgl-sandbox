import Debug from "../../internal/debug";
import Time from "../../internal/time";
import Texture from "../../renderer/texture";
import Material from "./material";

const fsGrassSource: string = require('/src/core/components/material/shader/grass.fs') as string
const vsGrassSource: string = require('/src/core/components/material/shader/grass.vs') as string

export default class GrassMaterial extends Material {
  texture: Texture

  constructor(texture: Texture) {
    super()
    this.texture = texture
  }

  compile = (gl: WebGL2RenderingContext): boolean => {
    if(!this.compileBase(gl, fsGrassSource, vsGrassSource)) return true

    this.uniformLocations.set('uTexture', gl.getUniformLocation(this.program, 'uColor'))
    this.uniformLocations.set('uTime', gl.getUniformLocation(this.program, 'uTime'))

    return true
  }

  bind = (gl: WebGL2RenderingContext): boolean => {
    gl.activeTexture(gl.TEXTURE0)
    this.texture.bind(gl)
    gl.uniform1i(this.uniformLocations.get('uTexture'), 0)

    gl.uniform1f(this.uniformLocations.get('uTime'), Date.now() - Time.startTime)

    return true
  }
}