
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

    for(const [planeName, plane] of Object.entries(this.frustrum)) {
      if(planeName === "positions") continue

      // @ts-ignore
      const distance: number = vec3.dot(point, plane.normal) + plane.distance

      if(distance <= 0.0) 
        return false
    }
      
    return true
  }

  updateFrustrum = () => {
    const position = this.self.getComponent(Transform).position

    // see: http://www.lighthouse3d.com/tutorials/view-frustum-culling/geometric-approach-extracting-the-planes/

    // NEAR PLANE CONSTRUCTION

    const hNear: number = -2.0 * Math.tan(this.fov * 0.5) * DEFAULT_Z_NEAR
    console.log("height near =", hNear)
    const wNear: number = hNear * this.aspect
    console.log("width near =", wNear)

    const nearUpOffset: vec3 = vec3.scale(vec3.create(), CAMERA_UP, hNear * 0.5)
    console.log("near up offset =", nearUpOffset.toString())
    const nearSideOffset: vec3 = vec3.scale(vec3.create(), CAMERA_SIDE, wNear * 0.5)
    console.log("near side offset =", nearSideOffset.toString())

    const nearCenter: vec3 = vec3.scaleAndAdd(vec3.create(), position, CAMERA_FORWARD, DEFAULT_Z_NEAR)
    console.log("near center =", nearCenter.toString())    

    const nearTopLeft: vec3 = vec3.add(vec3.create(), nearCenter, vec3.sub(vec3.create(), nearUpOffset, nearSideOffset))
    console.log("near top left =", nearTopLeft.toString())
    const nearTopRight: vec3 = vec3.add(vec3.create(), nearCenter, vec3.add(vec3.create(), nearUpOffset, nearSideOffset))
    console.log("near top right =", nearTopRight.toString())
    const nearBottomRight: vec3 = vec3.sub(vec3.create(), nearCenter, vec3.sub(vec3.create(), nearUpOffset, nearSideOffset))
    console.log("near bottom right =", nearBottomRight.toString())
    const nearBottomLeft: vec3 = vec3.sub(vec3.create(), nearCenter, vec3.add(vec3.create(), nearUpOffset, nearSideOffset))
    console.log("near bottom left =", nearBottomLeft.toString())

    // FAR PLANE CONSTRUCTION

    const hFar: number = -2.0 * Math.tan(this.fov * 0.5) * DEFAULT_Z_FAR
    console.log("height far =", hFar)
    const wFar: number = hFar * this.aspect
    console.log("width far =", wFar)

    const farUpOffset: vec3 = vec3.scale(vec3.create(), CAMERA_UP, hFar * 0.5)
    console.log("far up offset =", farUpOffset.toString())
    const farSideOffset: vec3 = vec3.scale(vec3.create(), CAMERA_SIDE, wFar * 0.5)
    console.log("far side offset =", farSideOffset.toString())

    const farCenter: vec3 = vec3.scaleAndAdd(vec3.create(), position, CAMERA_FORWARD, DEFAULT_Z_FAR)
    console.log("far center =", farCenter.toString())

    // Info: this was switched
    const farTopLeft: vec3 = vec3.add(vec3.create(), farCenter, vec3.sub(vec3.create(), farUpOffset, farSideOffset))
    console.log("far top left =", farTopLeft.toString())
    const farTopRight: vec3 = vec3.add(vec3.create(), farCenter, vec3.add(vec3.create(), farUpOffset, farSideOffset))
    console.log("far top right =", farTopRight.toString())
    const farBottomRight: vec3 = vec3.sub(vec3.create(), farCenter, vec3.sub(vec3.create(), farUpOffset, farSideOffset))
    console.log("far bottom right =", farBottomRight.toString())
    const farBottomLeft: vec3 = vec3.sub(vec3.create(), farCenter, vec3.add(vec3.create(), farUpOffset, farSideOffset))
    console.log("far bottom left =", farBottomLeft.toString())

    // PLANE CONSTRUCTION

    this.frustrum.near = createPlaneFromPoints(nearTopLeft, nearTopRight, nearBottomRight)
    console.log("near =", this.frustrum.near.normal.toString(), this.frustrum.near.distance)
    this.frustrum.far = createPlaneFromPoints(farTopRight, farTopLeft, farBottomRight)
    console.log("far =", this.frustrum.far.normal.toString(), this.frustrum.far.distance)

    this.frustrum.left = createPlaneFromPoints(nearTopLeft, nearBottomLeft, farBottomLeft)
    console.log("left =", this.frustrum.left.normal.toString(), this.frustrum.left.distance)    
    this.frustrum.right = createPlaneFromPoints(nearBottomRight, nearTopRight, farBottomRight)
    console.log("right =", this.frustrum.right.normal.toString(), this.frustrum.right.distance)

    this.frustrum.top = createPlaneFromPoints(nearTopRight, nearTopLeft, farTopLeft)
    console.log("top =", this.frustrum.top.normal.toString(), this.frustrum.top.distance)    
    this.frustrum.bottom = createPlaneFromPoints(nearBottomLeft, nearBottomRight, farBottomRight)
    console.log("bottom =", this.frustrum.bottom.normal.toString(), this.frustrum.bottom.distance)
    
    this.frustrum.positions.push(nearBottomLeft, nearTopLeft, nearTopRight, nearBottomRight)
    this.frustrum.positions.push(farBottomLeft, farTopLeft, farTopRight, farBottomRight)

    this.frustrum.positions.push(farBottomLeft, farTopLeft, nearTopLeft, nearBottomLeft)
    this.frustrum.positions.push(nearBottomRight, nearTopRight, farTopRight, farBottomRight)

    this.frustrum.positions.push(nearTopLeft, farTopLeft, farTopRight, nearTopRight)
    this.frustrum.positions.push(farBottomLeft, farBottomRight, nearBottomRight, nearBottomLeft)

  }

  onAdd = (self: Entity) => {
    this.self = self
    this.updateProjection(this.fov, this.aspect)
  }

  onUpdate = (self: Entity, camera: Entity) => {
    this.updateFrustrum()
  }
}