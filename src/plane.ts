import Geometry from "./geometry";

export default class Plane extends Geometry {
  constructor(subdevisions: number = 1) {
    super()

    this.vertex = {
      count: 3 * 3 * 2 * subdevisions * subdevisions,
      positions: new Array<number>(),
      normals: new Array<number>()
    }

    const step: number = 2.0 / subdevisions
  
    let yPos: number = 0.0

    for(let xPos = -1.0; xPos < 1.0; xPos += step) {
      for(let zPos = 1.0; zPos > -1.0; zPos -= step) {
        this.vertex.positions.push(xPos, yPos, zPos)
        this.vertex.positions.push(xPos + step, yPos, zPos)
        this.vertex.positions.push(xPos + step, yPos, zPos - step)

        this.vertex.positions.push(xPos + step, yPos, zPos - step)
        this.vertex.positions.push(xPos, yPos, zPos - step)
        this.vertex.positions.push(xPos, yPos, zPos)
      
        yPos += step * 0.005
      }
    }

    console.log(this.vertex.positions)

    this.vertex.normals = this.vertex.positions
  }
}