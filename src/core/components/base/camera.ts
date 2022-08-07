
import { mat4, quat, vec3 } from 'gl-matrix';
import Component, { ComponentType } from './component';
import createFrustrum, { Frustrum, PlaneIndex } from '../../../util/math/frustrum'
import Entity from '../../scene/entity';
import { createPlaneFromPoints } from '../../../util/math/plane';
import BoundingSphere from '../boundingVolume/boundingSphere';
import Transform from './transform';
import BoundingBox from '../boundingVolume/boundingBox';
import { Plane } from '../../../util/math/plane';
import UnlitMaterial from '../material/unlitMaterial';
import Geometry from '../geometry/geometry';
import BoundingVolume from '../boundingVolume/boundingVolume';
import QuadGeometry from '../geometry/quad';
import Material from '../material/material';
import Debug from '../../internal/debug';

const DEFAULT_Z_NEAR: number = 0.05
const DEFAULT_Z_FAR: number = 10000.0

const VECTOR_FORWARD: vec3 = vec3.fromValues(0.0, 0.0, -1.0)
const VECTOR_UP: vec3 = vec3.fromValues(0.0, 1.0, 0.0)

export default class Camera implements Component {
  type: ComponentType
  self: Entity

  viewDir: vec3
  up: vec3
  side: vec3

  projectionMatrix: mat4
  viewMatrix: mat4
  frustrum: Frustrum

  fov: number
  aspect: number

  constructor(fov: number) {
    this.type = ComponentType.CAMERA
    this.projectionMatrix = mat4.create()
    this.viewMatrix = mat4.create()
    this.frustrum = createFrustrum()

    this.viewDir = vec3.fromValues(0.0, 0.0, -1.0)
    this.up = vec3.fromValues(0.0, 1.0, 0.0)
    this.side = vec3.fromValues(1.0, 0.0, 0.0)

    this.fov = fov
    this.aspect = window.innerWidth / window.innerHeight

    window.addEventListener('resize', (event) => this.updateProjection(this.fov, window.innerWidth / window.innerHeight))
  }

  updateProjection = (fov, aspect) => {    
    this.fov = fov
    this.aspect = aspect

    mat4.perspective(this.projectionMatrix, 
                     this.fov, 
                     this.aspect, 
                     DEFAULT_Z_NEAR, 
                     DEFAULT_Z_FAR)

    this.updateFrustrum()
  }

  isPointInFrustrum = (point: vec3): boolean => {
    for(const plane of this.frustrum.planes)
      if(!this.isPointInFront(plane, point)) return false

    return true
  }

  isPointInFront = (plane: Plane, point: vec3, radius: number = 0.0) => {
    if(vec3.dot(point, plane.normal) + plane.distance + radius < 0.0) return false

    return true
  }

  isSphereInFrustrum = (point: vec3, radius: number): boolean => {
    for(const plane of this.frustrum.planes)
      if(!this.isPointInFront(plane, point, radius)) return false

    return true
  }

  isBoxInFrustrum = (corners: Array<vec3>, globalMatrix: mat4): boolean => {
    // ToDo(Eric) Cache this in geometry / bounding box component after transform was diry
    let points: Array<vec3> = new Array<vec3>()

    // ToDo: Cache this!
    corners.forEach(corner => {
      points.push(vec3.transformMat4(vec3.create(), corner, globalMatrix))
    })

    for(const plane of this.frustrum.planes) {

      let inPointCount: number = 0
      let outPointCount: number = 0

      for(let pointIndex: number = 0; pointIndex < 8 && (inPointCount == 0 || outPointCount == 0); pointIndex++)
        this.isPointInFront(plane, points[pointIndex]) ? inPointCount++ : outPointCount++
        
      if(!inPointCount) return false
    }
    
    return true
  }

  isEntityInFrustrum = (entity: Entity): boolean => {
    const geometry: Geometry | null = entity.get(ComponentType.GEOMETRY)

    if(!this.frustrum || !geometry?.visible) return false
    if(!geometry.cull) return true

    let isInFrustrum: boolean | null = null

    const point: vec3 = (entity.get(ComponentType.TRANSFORM) as Transform).getGlobalPosition()

    // ToDo: Abstract bounding volumes with base class and type to improve component query and code flow

    const boundingVolume = entity.get(ComponentType.BOUNDING_VOLUME) as BoundingBox & BoundingSphere

    if(boundingVolume.radius) {
      //const scale: vec3 = (entity.get(ComponentType.TRANSFORM) as Transform).getGlobalScale()
      // ToDo: Chache this!
      //const radiusScalar: number = Math.max(scale[0], Math.max(scale[1], scale[2])) 
      isInFrustrum = this.isSphereInFrustrum(point, boundingVolume.radius)
    }

    if(boundingVolume.corners) {
      const globalMatrix: mat4 = (entity.get(ComponentType.TRANSFORM) as Transform).globalMatrix
      isInFrustrum = this.isBoxInFrustrum(boundingVolume.corners, globalMatrix)
    }

    if(isInFrustrum === null) isInFrustrum = this.isPointInFrustrum(point)

    return isInFrustrum
  }

  updateFrustrum = () => {
    // ToDo: Optimize this!

    const position = this.self.get(ComponentType.TRANSFORM).getGlobalPosition()

    // see: http://www.lighthouse3d.com/tutorials/view-frustum-culling/geometric-approach-extracting-the-planes/

    // NEAR PLANE CONSTRUCTION

    const hNear: number = -2.0 * Math.tan(this.fov * 0.5) * DEFAULT_Z_NEAR
    const wNear: number = hNear * this.aspect

    /*
    console.log("height near =", hNear)
    console.log("width near =", wNear)
    */

    const nearUpOffset: vec3 = vec3.scale(vec3.create(), this.up, hNear * 0.5)
    const nearSideOffset: vec3 = vec3.scale(vec3.create(), this.side, wNear * 0.5)

    const nearCenter: vec3 = vec3.scaleAndAdd(vec3.create(), position, this.viewDir, DEFAULT_Z_NEAR)

    /*
    console.log("near up offset =", nearUpOffset.toString())
    console.log("near side offset =", nearSideOffset.toString())
    console.log("near center =", nearCenter.toString())    
    */

    const nearBottomLeft: vec3 = vec3.sub(vec3.create(), nearCenter, vec3.add(vec3.create(), nearUpOffset, nearSideOffset))
    const nearTopLeft: vec3 = vec3.add(vec3.create(), nearCenter, vec3.sub(vec3.create(), nearUpOffset, nearSideOffset))
    const nearTopRight: vec3 = vec3.add(vec3.create(), nearCenter, vec3.add(vec3.create(), nearUpOffset, nearSideOffset))
    const nearBottomRight: vec3 = vec3.sub(vec3.create(), nearCenter, vec3.sub(vec3.create(), nearUpOffset, nearSideOffset))

    /*
    console.log("near bottom left =", nearBottomLeft.toString())
    console.log("near top left =", nearTopLeft.toString())
    console.log("near top right =", nearTopRight.toString())
    console.log("near bottom right =", nearBottomRight.toString())
    */

    // FAR PLANE CONSTRUCTION

    const hFar: number = -2.0 * Math.tan(this.fov * 0.5) * DEFAULT_Z_FAR
    const wFar: number = hFar * this.aspect

    /*
    console.log("height far =", hFar)
    console.log("width far =", wFar)
    */

    const farUpOffset: vec3 = vec3.scale(vec3.create(), this.up, hFar * 0.5)
    const farSideOffset: vec3 = vec3.scale(vec3.create(), this.side, wFar * 0.5)

    const farCenter: vec3 = vec3.scaleAndAdd(vec3.create(), position, this.viewDir, DEFAULT_Z_FAR)

    /*
    console.log("far up offset =", farUpOffset.toString())
    console.log("far side offset =", farSideOffset.toString())
    console.log("far center =", farCenter.toString())
    */

    const farBottomLeft: vec3 = vec3.sub(vec3.create(), farCenter, vec3.add(vec3.create(), farUpOffset, farSideOffset))
    const farTopLeft: vec3 = vec3.add(vec3.create(), farCenter, vec3.sub(vec3.create(), farUpOffset, farSideOffset))
    const farTopRight: vec3 = vec3.add(vec3.create(), farCenter, vec3.add(vec3.create(), farUpOffset, farSideOffset))
    const farBottomRight: vec3 = vec3.sub(vec3.create(), farCenter, vec3.sub(vec3.create(), farUpOffset, farSideOffset))

    /*
    console.log("far bottom left =", farBottomLeft.toString())
    console.log("far top left =", farTopLeft.toString())
    console.log("far top right =", farTopRight.toString())
    console.log("far bottom right =", farBottomRight.toString())
    */

    // PLANE CONSTRUCTION

    this.frustrum.planes[PlaneIndex.NEAR] = createPlaneFromPoints(nearBottomLeft, nearTopLeft, nearTopRight)
    this.frustrum.planes[PlaneIndex.FAR] = createPlaneFromPoints(farBottomRight, farTopRight, farTopLeft)
    this.frustrum.planes[PlaneIndex.LEFT] = createPlaneFromPoints(farBottomLeft, farTopLeft, nearTopLeft)
    this.frustrum.planes[PlaneIndex.RIGHT] = createPlaneFromPoints(nearBottomRight, nearTopRight, farTopRight)
    this.frustrum.planes[PlaneIndex.TOP] = createPlaneFromPoints(nearTopLeft, farTopLeft, farTopRight)
    this.frustrum.planes[PlaneIndex.BOTTOM] = createPlaneFromPoints(farBottomLeft, nearBottomLeft, nearBottomRight)

    /*
    console.log("near =", this.frustrum.planes[PlaneIndex.NEAR].normal.toString(), this.frustrum.planes[PlaneIndex.NEAR].distance)
    console.log("far =", this.frustrum.planes[PlaneIndex.FAR].normal.toString(), this.frustrum.planes[PlaneIndex.FAR].distance)
    console.log("left =", this.frustrum.planes[PlaneIndex.LEFT].normal.toString(), this.frustrum.planes[PlaneIndex.LEFT].distance) 
    console.log("right =", this.frustrum.planes[PlaneIndex.RIGHT].normal.toString(), this.frustrum.planes[PlaneIndex.RIGHT].distance)
    console.log("top =", this.frustrum.planes[PlaneIndex.TOP].normal.toString(), this.frustrum.planes[PlaneIndex.TOP].distance) 
    console.log("bottom =", this.frustrum.planes[PlaneIndex.BOTTOM].normal.toString(), this.frustrum.planes[PlaneIndex.BOTTOM].distance)
    */

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

    const debugMaterial = new UnlitMaterial([0.0, 1.0, 1.0]) as Material

    for(let posIndex = 0; posIndex < this.frustrum.positions.length; posIndex += 4) {  
      const frustrumPlane = new Entity()
  
      const positions = this.frustrum.positions.slice(posIndex, posIndex + 4)
  
      frustrumPlane.add(new QuadGeometry(positions, false, false, false))
      frustrumPlane.add(debugMaterial)
  
      this.self.get(ComponentType.TRANSFORM).add(frustrumPlane)
    }
  }

  onUpdate = (self: Entity, camera: Entity) => {
    const globalMatrix = (self.get(ComponentType.TRANSFORM) as Transform).globalMatrix
    this.viewMatrix = mat4.invert(mat4.create(), globalMatrix)

    const rotation: quat = mat4.getRotation(quat.create(), globalMatrix)

    vec3.transformQuat(this.viewDir, VECTOR_FORWARD, rotation)
    vec3.cross(this.side, VECTOR_UP, this.viewDir)
    vec3.cross(this.up, this.side, this.viewDir)

    this.updateFrustrum()
  }
}