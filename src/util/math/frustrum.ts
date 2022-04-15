import { Plane, createPlane } from "./plane"

export type Frustrum = {
  top: Plane,
  bottom: Plane,
  right: Plane,
  left: Plane,
  far: Plane,
  near: Plane
}

export default function createFrustrum(): Frustrum {
  return {
    top: createPlane(),
    bottom: createPlane(),
    right: createPlane(),
    left: createPlane(),
    far: createPlane(),
    near: createPlane()
  }
}