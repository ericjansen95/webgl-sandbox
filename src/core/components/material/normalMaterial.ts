import Material from "./material";

const fsNormalSource: string = require('/src/core/components/material/shader/normal.fs') as string

export default class NormalMaterial extends Material {
  constructor() {
    super()
  }

  compile = (gl: WebGL2RenderingContext): boolean => {
    if(!this.compileBase(gl, fsNormalSource)) return true
    return true
  }

  bind = (): boolean => {
    return true
  }
}