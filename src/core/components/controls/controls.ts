// @ts-nocheck

import { vec2 } from "gl-matrix"
import Input from "../../internal/input"

export type InputDirection = -1 | 0 | 1

export type ControlsOptions = {
  camera: Entity

  collider: Array<Collider>
}

export type ControlsStats = {
    isRotating: boolean
    isMoving: boolean
    speed: number // normalized 0 - 1
  }

export const getControlsInputDirection = (): Array<InputDirection> => {
    const inputDirection = vec2.create()

    // front
    inputDirection[1] += (Input.isKeyDown('w') || Input.isKeyDown('arrowup')) | 0
    inputDirection[1] -= (Input.isKeyDown('s') || Input.isKeyDown('arrowdown')) | 0

    // side
    inputDirection[0] += (Input.isKeyDown('a') || Input.isKeyDown('arrowleft')) | 0
    inputDirection[0] -= (Input.isKeyDown('d') || Input.isKeyDown('arrowright')) | 0

    return inputDirection as Array<InputDirection>
} 