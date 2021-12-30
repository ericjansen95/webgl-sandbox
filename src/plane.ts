import Geometry from "./geometry";

export default class Plane extends Geometry {
  constructor(subdivisions: number = 1) {
    super()

    this.vertex = {
      count: 3 * 3 * 2 * subdivisions * subdivisions,
      positions: new Array<number>(),
      normals: new Array<number>()
    }

    const step: number = 2.0 / subdivisions

    for(let xPos = -1.0; xPos < 1.0; xPos += step) {
      for(let zPos = 1.0; zPos > -1.0; zPos -= step) {
        this.vertex.positions.push(xPos, 0.0, zPos)
        this.vertex.positions.push(xPos + step, 0.0, zPos)
        this.vertex.positions.push(xPos + step, 0.0, zPos - step)

        this.vertex.positions.push(xPos + step, 0.0, zPos - step)
        this.vertex.positions.push(xPos, 0.0, zPos - step)
        this.vertex.positions.push(xPos, 0.0, zPos)
      }
    }

    for(let triangleIndex = 0; triangleIndex < this.vertex.count / 3.0; triangleIndex++)
      this.vertex.normals.push(...[0.0, 1.0, 0.0])
  }
}