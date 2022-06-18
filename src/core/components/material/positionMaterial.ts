import Material from "./material";

const fsPositionSource: string = require('/src/core/components/material/shader/position.fs') as string

export default class PositionMaterial extends Material {
  constructor() {
    super()
  }

  compile = (gl: WebGL2RenderingContext): boolean => {
    if(!this.compileBase(gl, fsPositionSource)) return true
    return true
  }

  bind = (): boolean => {
    return true
  }
}