import { vec3 } from "gl-matrix";
import entity from "../../scene/entity";
import BoundingBox from "../boundingVolume/boundingBox";
import Geometry, { DrawMode } from "./geometry";

export default class Plane extends Geometry {
  constructor(subdivisions: number = 1) {
    super(DrawMode.TRIANGLE, true, true, false)

    const positions = new Array<number>()
    const step: number = 2.0 / subdivisions

    for(let xPos = 0.0; xPos < 1.0; xPos += step) {
      for(let zPos = 0.0; zPos < 1.0; zPos += step) {
        positions.push(xPos, 0.0, zPos)
        positions.push(xPos + step, 0.0, zPos)
        positions.push(xPos + step, 0.0, zPos - step)

        positions.push(xPos + step, 0.0, zPos - step)
        positions.push(xPos, 0.0, zPos - step)
        positions.push(xPos, 0.0, zPos)
      }
    }

    let position: number[] = []
    let min: number[] = [0, 0, 0]
    let max: number[] = [0, 0, 0]

    for(let posIndex = 0; posIndex < positions.length; posIndex += 3) {
      position = [positions[posIndex], positions[posIndex + 1], positions[posIndex + 2]]

      min = [Math.min(position[0], min[0]),
            Math.min(position[1], min[1]),
            Math.min(position[2], min[2])]      
      max = [Math.max(position[0], max[0]),
            Math.max(position[1], max[1]),
            Math.max(position[2], max[2])] 
    }

    // TMP
    min[1] = 0
    max[1] = 150

    this.setVertices({
      position: new Float32Array(positions),
      min: vec3.fromValues(min[0], min[1], min[2]),
      max: vec3.fromValues(max[0], max[1], max[2]),
    })
  }

  onAdd = (self: entity) => { 
    const boundingBox: BoundingBox = new BoundingBox()
    self.add(boundingBox)
  }
}