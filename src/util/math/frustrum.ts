import { vec3 } from "gl-matrix"
import { Plane, createPlane } from "./plane"

export enum PlaneIndex {
  TOP = 0,
  BOTTOM = 1,
  RIGHT = 2,
  LEFT = 3,
  FAR = 4,
  NEAR = 5
}

export type Frustrum = {
  planes: Array<Plane>
  positions: Array<vec3>,
}

export default function createFrustrum(): Frustrum {
  return {
    planes: new Array<Plane>(createPlane(), 
                             createPlane(), 
                             createPlane(), 
                             createPlane(), 
                             createPlane(), 
                             createPlane()),
    positions: new Array<vec3>(),
  }
}