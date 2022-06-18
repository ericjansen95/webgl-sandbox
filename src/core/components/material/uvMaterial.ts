import Material from "./material";

const fsUvSource: string = require('/src/core/components/material/shader/uv.fs') as string

export default class UvMaterial extends Material {
  constructor() {
    super()
  }

  compile = (gl: WebGL2RenderingContext): boolean => {
    if(!this.compileBase(gl, fsUvSource)) return true
    
    return true
  }

  bind = (): boolean => {
    return true
  }
}