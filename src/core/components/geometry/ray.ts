import Geometry, { calcNormals, createVAO, DrawMode } from "./geometry";

export default class Ray extends Geometry {
  constructor(length: number = 1) {
    super(DrawMode.LINE, true, false, false)

    const positions = new Array<number>()

    positions.push(0.0, 0.0, 0.0)
    positions.push(0.0, 0.0, -length)

    this.setVAO({
      POSITION: new Float32Array(positions)
    })
  }
}