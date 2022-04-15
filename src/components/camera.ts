
import { mat4, vec3 } from 'gl-matrix';
import { Component } from './component';
import createFrustrum, { Frustrum } from '../util/math/frustrum'
import Entity from '../core/entity';
import Transform from './transform';
import { createPlaneFromPoints } from '../util/math/plane';
import Quad from './geometry/quad';
import Geometry from './geometry/geometry';
import UnlitMaterial from './materials/unlitMaterial';
import Material from './material';

const DEFAULT_Z_NEAR: number = 0.05
const DEFAULT_Z_FAR: number = 5.0

const CAMERA_FORWARD: vec3 = [0.0, 0.0, -1.0]
const CAMERA_UP: vec3 = [0.0, 1.0, 0.0]
const CAMERA_SIDE: vec3 = [1.0, 0.0, 0.0]

/*
  - viewFrustrumPlanes = Array<Plane>
  - distanceTo(plane, point)
  - transform view frustrum planes based on viewMatrix
*/

export default class Camera implements Component {
  self: Entity

  projectionMatrix: mat4
  frustrum: Frustrum

  fov: number
  aspect: number

  constructor(fov: number, aspect: number) {
    this.projectionMatrix = mat4.create()
    this.frustrum = createFrustrum()

    this.fov = fov
    this.aspect = aspect
  }

  updateProjection = (fov, aspect) => {
    this.fov = fov
    this.aspect = aspect

    mat4.perspective(this.projectionMatrix, 
                     this.fov * Math.PI / 180, 
                     this.aspect, 
                     DEFAULT_Z_NEAR, 
                     DEFAULT_Z_FAR * 10.0)

    this.updateFrustrum()
  }

  isPointInFrustrum = (point: vec3): boolean => {
    if(!point || !this.frustrum) return false

    const pointNormal: vec3 = vec3.create()

    for(const [planeName, plane] of Object.entries(this.frustrum)) {
      if(planeName === "positions") continue

      // @ts-ignore
      vec3.sub(pointNormal, plane.position, point)
      vec3.normalize(pointNormal, pointNormal)
      // @ts-ignore
      const dot: number = vec3.dot(plane.normal, pointNormal)

      if(dot < 0.0) {
        console.log("frustrum plane =", planeName)
        console.log("point normal =", pointNormal.toString())
        // @ts-ignore
        console.log("plane normal =", plane.normal.toString())
        return false
      }
    }
      
    return true
  }

  updateFrustrum = () => {
    const position = this.self.getComponent(Transform).position

    // see: http://www.lighthouse3d.com/tutorials/view-frustum-culling/geometric-approach-extracting-the-planes/

    // NEAR PLANE CONSTRUCTION

    const hNear: number = 2.0 * Math.tan(this.fov * 0.5) * DEFAULT_Z_NEAR
    const wNear: number = hNear * this.aspect

    const nearUpOffset: vec3 = vec3.scale(vec3.create(), CAMERA_UP, hNear * 0.5)
    const nearSideOffset: vec3 = vec3.scale(vec3.create(), CAMERA_SIDE, wNear * 0.5)

    const nearCenter: vec3 = vec3.scaleAndAdd(vec3.create(), position, CAMERA_FORWARD, DEFAULT_Z_NEAR)

    const nearTopLeft: vec3 = vec3.add(vec3.create(), nearCenter, vec3.sub(vec3.create(), nearUpOffset, nearSideOffset))
    const nearTopRight: vec3 = vec3.add(vec3.create(), nearCenter, vec3.add(vec3.create(), nearUpOffset, nearSideOffset))
    const nearBottomLeft: vec3 = vec3.sub(vec3.create(), nearCenter, vec3.sub(vec3.create(), nearUpOffset, nearSideOffset))
    const nearBottomRight: vec3 = vec3.sub(vec3.create(), nearCenter, vec3.add(vec3.create(), nearUpOffset, nearSideOffset))
  
    // FAR PLANE CONSTRUCTION

    const hFar: number = 2.0 * Math.tan(this.fov * 0.5) * DEFAULT_Z_FAR
    const wFar: number = hFar * this.aspect

    const farUpOffset: vec3 = vec3.scale(vec3.create(), CAMERA_UP, hFar * 0.5)
    const farSideOffset: vec3 = vec3.scale(vec3.create(), CAMERA_SIDE, wFar * 0.5)

    const farCenter: vec3 = vec3.scaleAndAdd(vec3.create(), position, CAMERA_FORWARD, DEFAULT_Z_FAR)

    // Info: this was switched
    const farTopRight: vec3 = vec3.add(vec3.create(), farCenter, vec3.sub(vec3.create(), farUpOffset, farSideOffset))
    const farTopLeft: vec3 = vec3.add(vec3.create(), farCenter, vec3.add(vec3.create(), farUpOffset, farSideOffset))
    const farBottomLeft: vec3 = vec3.sub(vec3.create(), farCenter, vec3.sub(vec3.create(), farUpOffset, farSideOffset))
    const farBottomRight: vec3 = vec3.sub(vec3.create(), farCenter, vec3.add(vec3.create(), farUpOffset, farSideOffset))

    // PLANE CONSTRUCTION

    this.frustrum.near = createPlaneFromPoints(nearTopLeft, nearTopRight, nearBottomRight, DEFAULT_Z_FAR)
    this.frustrum.far = createPlaneFromPoints(farTopRight, farTopLeft, farBottomLeft, DEFAULT_Z_FAR)

    this.frustrum.left = createPlaneFromPoints(nearTopLeft, nearBottomLeft, farBottomLeft, DEFAULT_Z_FAR)
    this.frustrum.right = createPlaneFromPoints(nearBottomRight, nearTopRight, farBottomRight, DEFAULT_Z_FAR)

    this.frustrum.top = createPlaneFromPoints(nearTopRight, nearTopLeft, farTopLeft, DEFAULT_Z_FAR)
    this.frustrum.bottom = createPlaneFromPoints(nearBottomLeft, nearBottomRight, farBottomRight, DEFAULT_Z_FAR)

    this.frustrum.positions.push(nearBottomLeft, nearTopLeft, nearTopRight, nearBottomRight)
    //this.frustrum.positions.push(farBottomLeft, farTopLeft, farTopRight, farBottomRight)

    //this.frustrum.positions.push(farBottomLeft, farTopLeft, nearTopLeft, nearBottomLeft)
    //this.frustrum.positions.push(nearBottomRight, nearTopRight, farTopRight, farBottomRight)

    //this.frustrum.positions.push(nearTopLeft, farTopLeft, farTopRight, nearTopRight)
    //this.frustrum.positions.push(farBottomLeft, farBottomRight, nearBottomRight, nearBottomLeft)

  }

  onAdd = (self: Entity) => {
    this.self = self
    this.updateProjection(this.fov, this.aspect)
  }

  onUpdate = (self: Entity, camera: Entity) => {
    this.updateFrustrum()
  }
}