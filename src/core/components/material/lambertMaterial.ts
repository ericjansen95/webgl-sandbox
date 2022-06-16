import { vec3 } from "gl-matrix";
import Material, { compileProgram, MaterialType } from "./material";
import { GL } from "../../scene/renderer"

const vsDefaultSource: string = require('/src/core/components/material/shader/default.vs') as string
const fsLambertSource: string = require('/src/core/components/material/shader/lambert.fs') as string

export default class LambertMaterial extends Material {
  color: vec3

  constructor(color) {
    super()

    this.materialType = "LAMBERT"

    const {program, attributeLocations, uniformLocations} = compileProgram(vsDefaultSource, fsLambertSource)
    
    this.program = program
    this.attributeLocations = attributeLocations
    this.uniformLocations = uniformLocations

    this.color = color
    this.uniformLocations.set('uColor', GL.getUniformLocation(program, 'uColor'))

    this.uniformLocations.set('uAmbientLight', GL.getUniformLocation(program, 'uAmbientLight'))
    this.uniformLocations.set('uLightDir', GL.getUniformLocation(program, 'uLightDir'))
  }

  bind = (lightDir: vec3) => {
    GL.uniform1f(this.uniformLocations.get('uAmbientLight'), 0.1)
    GL.uniform3fv(this.uniformLocations.get('uLightDir'), lightDir)
    GL.uniform3fv(this.uniformLocations.get('uColor'), this.color)
  }
}