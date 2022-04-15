
import { mat4 } from 'gl-matrix';
import { Component } from './component';

const DEFAULT_Z_NEAR: number = 0.05
const DEFAULT_Z_FAR: number = 100.0

/*
  - viewFrustrumPlanes = Array<Plane>
  - distanceTo(plane, point)
  - transform view frustrum planes based on viewMatrix
*/

// @ts-expect-error
export default class Camera implements Component {
  projectionMatrix: mat4

  constructor(fov: number, aspect: number) {
    this.projectionMatrix = mat4.create()

    mat4.perspective(this.projectionMatrix, 
                      fov * Math.PI / 180, aspect, 
                      DEFAULT_Z_NEAR, 
                      DEFAULT_Z_FAR)
  }
}