import { vec3 } from "gl-matrix";

export const GLOBAL = Object.freeze({
  UP: vec3.fromValues(0, 1, 0),
  FORWARD: vec3.fromValues(0, 0, -1),
  DOWN: vec3.fromValues(0, -1, 0)
})