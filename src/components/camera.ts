
import { mat4, vec3 } from 'gl-matrix';
import { Component } from './component';
import createFrustrum, { Frustrum, PlaneIndex } from '../util/math/frustrum'
import Entity from '../core/entity';
import Transform from './transform';
import { createPlaneFromPoints } from '../util/math/plane';
import BoundingSphere from './boundingSphere';
import Material from './material';

const DEFAULT_Z_NEAR: number = 0.05
const DEFAULT_Z_FAR: number = 25.0

const CAMERA_FORWARD: vec3 = [0.0, 0.0, -1.0]
const CAMERA_UP: vec3 = [0.0, 1.0, 0.0]
const CAMERA_SIDE: vec3 = [1.0, 0.0, 0.0]

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
                     this.fov, 
                     this.aspect, 
                     DEFAULT_Z_NEAR, 
                     DEFAULT_Z_FAR * 4)

    this.updateFrustrum()
  }

  isEntityInFrustrum = (entity: Entity): boolean => {
    if(!this.frustrum) return false

    const boundingSphere: BoundingSphere = entity.getComponent("BoundingSphere")
    let radius: number = 0.0

    if(boundingSphere)
      radius = boundingSphere.radius

    const entityPosition: vec3 = mat4.getTranslation(vec3.create(), entity.getComponent("Transform").worldMatrix)

    let dotProduct: number = 0.0
    let distance: number = 0.0

    for(const plane of this.frustrum.planes) {
      dotProduct = vec3.dot(entityPosition, plane.normal)
      distance = dotProduct + plane.distance - radius

      if(distance <= 0.0) {
        entity.getComponent("Transform").children[0].getComponent("Material").color = [0.678, 0.847, 0.9]
        return false
      }
    }

    entity.getComponent("Transform").children[0].getComponent("Material").color = [1.0, 0.628, 0.478]

    /*
    console.log("dot product =", dotProduct)
    console.log("distance =", distance)
    */

    return true
  }

  updateFrustrum = () => {
    const position = this.self.getComponent("Transform").position

    // see: http://www.lighthouse3d.com/tutorials/view-frustum-culling/geometric-approach-extracting-the-planes/

    // NEAR PLANE CONSTRUCTION

    const hNear: number = -2.0 * Math.tan(this.fov * 0.5) * DEFAULT_Z_NEAR
    const wNear: number = hNear * this.aspect

    console.log("height near =", hNear)
    console.log("width near =", wNear)

    const nearUpOffset: vec3 = vec3.scale(vec3.create(), CAMERA_UP, hNear * 0.5)
    const nearSideOffset: vec3 = vec3.scale(vec3.create(), CAMERA_SIDE, wNear * 0.5)

    const nearCenter: vec3 = vec3.scaleAndAdd(vec3.create(), position, CAMERA_FORWARD, DEFAULT_Z_NEAR)

    console.log("near up offset =", nearUpOffset.toString())
    console.log("near side offset =", nearSideOffset.toString())
    console.log("near center =", nearCenter.toString())    

    const nearBottomLeft: vec3 = vec3.sub(vec3.create(), nearCenter, vec3.add(vec3.create(), nearUpOffset, nearSideOffset))
    const nearTopLeft: vec3 = vec3.add(vec3.create(), nearCenter, vec3.sub(vec3.create(), nearUpOffset, nearSideOffset))
    const nearTopRight: vec3 = vec3.add(vec3.create(), nearCenter, vec3.add(vec3.create(), nearUpOffset, nearSideOffset))
    const nearBottomRight: vec3 = vec3.sub(vec3.create(), nearCenter, vec3.sub(vec3.create(), nearUpOffset, nearSideOffset))

    console.log("near bottom left =", nearBottomLeft.toString())
    console.log("near top left =", nearTopLeft.toString())
    console.log("near top right =", nearTopRight.toString())
    console.log("near bottom right =", nearBottomRight.toString())

    // FAR PLANE CONSTRUCTION

    const hFar: number = -2.0 * Math.tan(this.fov * 0.5) * DEFAULT_Z_FAR
    const wFar: number = hFar * this.aspect

    console.log("height far =", hFar)
    console.log("width far =", wFar)

    const farUpOffset: vec3 = vec3.scale(vec3.create(), CAMERA_UP, hFar * 0.5)
    const farSideOffset: vec3 = vec3.scale(vec3.create(), CAMERA_SIDE, wFar * 0.5)

    const farCenter: vec3 = vec3.scaleAndAdd(vec3.create(), position, CAMERA_FORWARD, DEFAULT_Z_FAR)

    console.log("far up offset =", farUpOffset.toString())
    console.log("far side offset =", farSideOffset.toString())
    console.log("far center =", farCenter.toString())

    const farBottomLeft: vec3 = vec3.sub(vec3.create(), farCenter, vec3.add(vec3.create(), farUpOffset, farSideOffset))
    const farTopLeft: vec3 = vec3.add(vec3.create(), farCenter, vec3.sub(vec3.create(), farUpOffset, farSideOffset))
    const farTopRight: vec3 = vec3.add(vec3.create(), farCenter, vec3.add(vec3.create(), farUpOffset, farSideOffset))
    const farBottomRight: vec3 = vec3.sub(vec3.create(), farCenter, vec3.sub(vec3.create(), farUpOffset, farSideOffset))

    console.log("far bottom left =", farBottomLeft.toString())
    console.log("far top left =", farTopLeft.toString())
    console.log("far top right =", farTopRight.toString())
    console.log("far bottom right =", farBottomRight.toString())

    // PLANE CONSTRUCTION

    this.frustrum.planes[PlaneIndex.NEAR] = createPlaneFromPoints(nearBottomLeft, nearTopLeft, nearTopRight)
    this.frustrum.planes[PlaneIndex.FAR] = createPlaneFromPoints(farBottomRight, farTopRight, farTopLeft)
    this.frustrum.planes[PlaneIndex.LEFT] = createPlaneFromPoints(farBottomLeft, farTopLeft, nearTopLeft)
    this.frustrum.planes[PlaneIndex.RIGHT] = createPlaneFromPoints(nearBottomRight, nearTopRight, farTopRight)
    this.frustrum.planes[PlaneIndex.TOP] = createPlaneFromPoints(nearTopLeft, farTopLeft, farTopRight)
    this.frustrum.planes[PlaneIndex.BOTTOM] = createPlaneFromPoints(farBottomLeft, nearBottomLeft, nearBottomRight)

    console.log("near =", this.frustrum.planes[PlaneIndex.NEAR].normal.toString(), this.frustrum.planes[PlaneIndex.NEAR].distance)
    console.log("far =", this.frustrum.planes[PlaneIndex.FAR].normal.toString(), this.frustrum.planes[PlaneIndex.FAR].distance)
    console.log("left =", this.frustrum.planes[PlaneIndex.LEFT].normal.toString(), this.frustrum.planes[PlaneIndex.LEFT].distance) 
    console.log("right =", this.frustrum.planes[PlaneIndex.RIGHT].normal.toString(), this.frustrum.planes[PlaneIndex.RIGHT].distance)
    console.log("top =", this.frustrum.planes[PlaneIndex.TOP].normal.toString(), this.frustrum.planes[PlaneIndex.TOP].distance) 
    console.log("bottom =", this.frustrum.planes[PlaneIndex.BOTTOM].normal.toString(), this.frustrum.planes[PlaneIndex.BOTTOM].distance)
    
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