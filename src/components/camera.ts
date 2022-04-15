
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
const DEFAULT_Z_FAR: number = 100.0

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
                     DEFAULT_Z_FAR)

    this.updateFrustrum()
  }

  isPointInFrustrum = (p: vec3): boolean => {
    return true

    if(!p || !this.frustrum) return false

    const pNormal: vec3 = vec3.create()

    for(const [key, plane] of Object.entries(this.frustrum)) {
      // console.log("plane =", key, "with normal =", plane.normal.toString())
      
      vec3.sub(pNormal, p, plane.position)
      vec3.normalize(pNormal, pNormal)

      const planePointDot: number = vec3.dot(plane.normal, pNormal)
      
      console.log("plane point dot =", planePointDot)

      if(planePointDot < 0.0) {
        console.log("point =", p.toString(), "is behind plane =", key, "with normal =", plane.normal.toString())
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

    const farTopLeft: vec3 = vec3.add(vec3.create(), farCenter, vec3.sub(vec3.create(), farUpOffset, farSideOffset))
    const farTopRight: vec3 = vec3.add(vec3.create(), farCenter, vec3.add(vec3.create(), farUpOffset, farSideOffset))
    const farBottomLeft: vec3 = vec3.sub(vec3.create(), farCenter, vec3.sub(vec3.create(), farUpOffset, farSideOffset))
    const farBottomRight: vec3 = vec3.sub(vec3.create(), farCenter, vec3.add(vec3.create(), farUpOffset, farSideOffset))

    // PLANE CONSTRUCTION

    this.frustrum.near = createPlaneFromPoints(nearTopLeft, nearTopRight, nearBottomRight)
    this.frustrum.far = createPlaneFromPoints(farTopRight, farTopLeft, farBottomLeft)
    this.frustrum.left = createPlaneFromPoints(nearBottomLeft, nearTopLeft, farTopLeft)
    this.frustrum.right = createPlaneFromPoints(nearBottomRight, nearTopRight, farBottomRight)
    this.frustrum.top = createPlaneFromPoints(nearTopRight, nearTopLeft, farTopLeft)
    this.frustrum.bottom = createPlaneFromPoints(nearBottomLeft, farBottomLeft, farBottomRight)

    /*
    const planeMaterial: Material = new UnlitMaterial([1.0, 1.0, 0.0]) as Material

    const nearPlane = new Entity()
    const nearPlaneGeometry: Geometry = new Quad([nearBottomLeft, nearTopLeft, nearTopRight, nearBottomRight]) as Geometry
    nearPlane.addComponent(nearPlaneGeometry)
    nearPlane.addComponent(planeMaterial)

    const farPlane = new Entity()
    const farPlaneGeometry: Geometry = new Quad([farBottomLeft, farTopLeft, farTopRight, farBottomRight]) as Geometry
    farPlane.addComponent(farPlaneGeometry)
    farPlane.addComponent(planeMaterial)

    const leftPlane = new Entity()
    const leftPlaneGeometry: Geometry = new Quad([]) as Geometry
    leftPlane.addComponent(leftPlaneGeometry)
    leftPlane.addComponent(planeMaterial)

    const rightPlane = new Entity()
    const rightPlaneGeometry: Geometry = new Quad([]) as Geometry
    rightPlane.addComponent(rightPlaneGeometry)
    rightPlane.addComponent(planeMaterial)

    const topPlane = new Entity()
    const topPlaneGeometry: Geometry = new Quad([]) as Geometry
    topPlane.addComponent(topPlaneGeometry)
    topPlane.addComponent(planeMaterial)

    const bottomPlane = new Entity()
    const bottomPlaneGeometry: Geometry = new Quad([]) as Geometry
    bottomPlane.addComponent(bottomPlaneGeometry)
    bottomPlane.addComponent(planeMaterial)
    */
  }

  onAdd = (self: Entity) => {
    this.self = self
    this.updateProjection(this.fov, this.aspect)
  }

  onUpdate = (self: Entity, camera: Entity) => {
    //this.updateFrustrum()
  }
}