
import { mat4 } from 'gl-matrix';

const DEFAULT_Z_NEAR: number = 0.001
const DEFAULT_Z_FAR: number = 10.0

export default class Camera {
  projectionMatrix: mat4
  viewMatrix: mat4

  constructor(fov: number, aspect: number) {
    this.projectionMatrix = mat4.create()
    mat4.perspective(this.projectionMatrix, fov * Math.PI / 180, aspect, DEFAULT_Z_NEAR, DEFAULT_Z_FAR)
  
    this.viewMatrix = mat4.create()
    mat4.translate(this.viewMatrix,
                  this.viewMatrix, 
                  [0.0, -0.025, 0.0])
  }
}