
import { mat4 } from 'gl-matrix';

const DEFAULT_Z_NEAR: number = 0.05
const DEFAULT_Z_FAR: number = 100.0

export default class Camera {
  projectionMatrix: mat4
  viewMatrix: mat4

  constructor(fov: number, aspect: number) {
    this.projectionMatrix = mat4.create()
    mat4.perspective(this.projectionMatrix, fov * Math.PI / 180, aspect, DEFAULT_Z_NEAR, DEFAULT_Z_FAR)
  
    this.viewMatrix = mat4.create()
    mat4.translate(this.viewMatrix,
                  this.viewMatrix, 
                  [-0.5, 0.0, -2.0])

    mat4.rotateX(this.viewMatrix,
                 this.viewMatrix,
                 Math.PI * 0.1)  
  }
}