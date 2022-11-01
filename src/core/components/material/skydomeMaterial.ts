import { vec3 } from "gl-matrix";
import Time from "../../internal/time";
import Texture from "../../renderer/texture";
import Material from "./material";

const fsSkyboxSource: string = require('/src/core/components/material/shader/skybox.fs') as string
const vsSkyboxSource: string = require('/src/core/components/material/shader/skybox.vs') as string

export default class SkydomeMaterial extends Material {
  texture: Texture

  windDirection: vec3
  strength: number
  speed: number

  constructor(texture: Texture, windDirection: vec3 = [0.0, 0.0, -1.0], strength: number = 0.07, speed: number = 0.00002) {
    super()
    this.texture = texture
    this.windDirection = windDirection
    this.strength = strength
    this.speed = speed
  }

  compile = (gl: WebGL2RenderingContext): boolean => {
    if(!this.compileBase(gl, fsSkyboxSource, vsSkyboxSource)) return true

    this.uniformLocations.set('uTexture', gl.getUniformLocation(this.program, 'uTexture'))
    this.uniformLocations.set('uWindDirection', gl.getUniformLocation(this.program, 'uWindDirection'))
    this.uniformLocations.set('uTime', gl.getUniformLocation(this.program, 'uTime'))
    this.uniformLocations.set('uSpeed', gl.getUniformLocation(this.program, 'uSpeed'))
    this.uniformLocations.set('uStrength', gl.getUniformLocation(this.program, 'uStrength'))

    return true
  }

  bind = (gl: WebGL2RenderingContext): boolean => {
    gl.activeTexture(gl.TEXTURE0)
    this.texture.bind(gl)
    gl.uniform1i(this.uniformLocations.get('uTexture'), 0)

    gl.uniform3fv(this.uniformLocations.get('uWindDirection'), this.windDirection)
    gl.uniform1f(this.uniformLocations.get('uSpeed'), this.speed)
    gl.uniform1f(this.uniformLocations.get('uStrength'), this.strength)

    gl.uniform1f(this.uniformLocations.get('uTime'), Date.now() - Time.startTime)

    return true
  }
}