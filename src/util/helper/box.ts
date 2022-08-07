import { vec3 } from "gl-matrix"
import Geometry, { DrawMode } from "../../core/components/geometry/geometry"
import Debug from "../../core/internal/debug"
import Entity from "../../core/scene/entity"
import { createBoxBuffer } from "./geometry"

export const createWireframeBox = (min: vec3, max: vec3): Entity => {
  const box = new Entity()

  const boxGeometry = new Geometry(DrawMode.LINE, true, false, false)
  boxGeometry.setVAO({
    POSITION: createBoxBuffer(min, max)
  })
  
  box.add(boxGeometry)
  box.add(Debug.material)

  return box
}