import { vec3 } from "gl-matrix";
import entity from "../../scene/entity";
import BoundingBox from "../boundingVolume/boundingBox";
import Geometry, { calcNormals, createVertexObject, DrawMode } from "./geometry";

export default class Plane extends Geometry {
  constructor(subdivisions: number = 1) {
    super(DrawMode.TRIANGLE, true, true, false)

    const step: number = 2.0 / subdivisions

    for(let xPos = 0.0; xPos < 1.0; xPos += step) {
      for(let zPos = 0.0; zPos < 1.0; zPos += step) {
        this.vertex.positions.push(xPos, 0.0, zPos)
        this.vertex.positions.push(xPos + step, 0.0, zPos)
        this.vertex.positions.push(xPos + step, 0.0, zPos - step)

        this.vertex.positions.push(xPos + step, 0.0, zPos - step)
        this.vertex.positions.push(xPos, 0.0, zPos - step)
        this.vertex.positions.push(xPos, 0.0, zPos)
      }
    }

    this.vertex.count = this.vertex.positions.length

    let position: number[] = []

    for(let posIndex = 0; posIndex < this.vertex.count; posIndex += 3) {
      position = [this.vertex.positions[posIndex], this.vertex.positions[posIndex + 1], this.vertex.positions[posIndex + 2]]

      this.vertex.min = [Math.min(position[0], this.vertex.min[0]),
                        Math.min(position[1], this.vertex.min[1]),
                        Math.min(position[2], this.vertex.min[2])]

      this.vertex.max = [Math.max(position[0], this.vertex.max[0]),
                        Math.max(position[1], this.vertex.max[1]),
                        Math.max(position[2], this.vertex.max[2])] 
    }

    // TMP
    this.vertex.min[1] = 0
    this.vertex.max[1] = 150

    this.vertex.normals = calcNormals(this.vertex.positions)
  }

  onAdd = (self: entity) => { 
    const boundingBox: BoundingBox = new BoundingBox()
    self.add(boundingBox)
  }
}