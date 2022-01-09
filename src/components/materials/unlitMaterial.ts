import { vec3 } from "gl-matrix";
import Material, { compileProgram, MaterialType } from "../../material";
import { GL } from "../../renderer"

const vsDefaultSource: string = require('/public/res/shader/default.vs') as string
const fsUnlitSource: string = require('/public/res/shader/unlit.fs') as string

export default class UnlitMaterial extends Material {
  color: vec3

  constructor(color) {
    super()

    this.type = "UNLIT"

    const {program, attributeLocations, uniformLocations} = compileProgram(vsDefaultSource, fsUnlitSource)
    
    this.program = program
    this.attributeLocations = attributeLocations
    this.uniformLocations = uniformLocations

    this.color = color
    this.uniformLocations.set('uColor', GL.getUniformLocation(program, 'uColor'))
  }

  bind = () => {
    GL.uniform3fv(this.uniformLocations.get('uColor'), this.color)
  }
}