import { vec2, vec3 } from "gl-matrix";
import { Ray } from "../../../util/math/raycast";
import { roundNumber } from "../../../util/math/round";
import Collider, { IntersectionInfo } from "./collider";

export default class HeightmapCollider extends Collider {
  context: CanvasRenderingContext2D 

  center: vec3
  height: number

  size: number
  resolution: number

  constructor(heightmapUri: string, height: number, size: number, center: vec3) {
    super()

    this.center = center
    this.height = height
    
    this.size = size

    const heightmap = new Image()
    heightmap.src = heightmapUri

    heightmap.addEventListener('load', () => {
      this.resolution = heightmap.width

      const canvas = document.createElement('canvas')
      canvas.width = this.resolution
      canvas.height = this.resolution

      this.context = canvas.getContext('2d')
      this.context.drawImage(heightmap, 0, 0, this.resolution, this.resolution)  
    })
  }

  getIntersecetions = (ray: Ray): Array<IntersectionInfo> => {
    const { origin, direction, length } = ray

    // project ray origin onto x, y plane
    const transformedOrigin = vec2.fromValues(origin[0], origin[2])
    // translate to heightmap origin (usually terrain origin)
    vec2.sub(transformedOrigin, transformedOrigin, vec2.fromValues(this.center[0], this.center[2]))
    // normalize to 0-1 on both axis
    vec2.divide(transformedOrigin, transformedOrigin, vec2.fromValues(this.size, this.size))
    // transform into pixel space of heightmap resolution size
    vec2.scale(transformedOrigin, transformedOrigin, this.resolution)

    const minOrigin = vec2.fromValues(Math.floor(transformedOrigin[0]), Math.floor(transformedOrigin[1]))
    const maxOrigin = vec2.fromValues(Math.ceil(transformedOrigin[0]), Math.ceil(transformedOrigin[1]))
    const lerpFactor = vec2.sub(vec2.create(), transformedOrigin, minOrigin)

    // sample height at position and scale by (terrain) height
    const h1 = this.context.getImageData(minOrigin[0], minOrigin[1], 1, 1).data[3]  
    const h2 = this.context.getImageData(maxOrigin[0], maxOrigin[1], 1, 1).data[3]   
    if(!h1 || !h2) return []
    
    const lerp = roundNumber((lerpFactor[0] + lerpFactor[1]) * 0.5)
    const height = roundNumber((((1 - lerp) * h1 + lerp * h2) / 255) * this.height)

    const position = vec3.fromValues(origin[0], height + this.center[1], origin[2])
    
    // construct intersection point with added y offset of center position
    const intersectionInfo: IntersectionInfo = {
      distance: vec3.sqrDist(origin, position),
      position,
    }

    return [intersectionInfo]
  }
}