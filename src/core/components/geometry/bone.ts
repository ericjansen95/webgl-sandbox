import Geometry, { DrawMode } from "./geometry";

export default class Bone extends Geometry {
  constructor(visible: boolean = true, cull: boolean = true, boundingVolume: boolean = true) {
    super(DrawMode.LINE, visible, cull, boundingVolume)

    const positions = new Array<number>()

    positions.push(0, 0, 0)
    positions.push(0.075, 0.2, 0.075)   

    positions.push(0.075, 0.2, 0.075) 
    positions.push(0.075, 0.2, -0.075) 

    positions.push(0.075, 0.2, -0.075) 
    positions.push(0, 0, 0)
  
    positions.push(0, 0, 0)
    positions.push(-0.075, 0.2, -0.075) 

    positions.push(-0.075, 0.2, -0.075) 
    positions.push(-0.075, 0.2, 0.075) 

    positions.push(-0.075, 0.2, 0.075) 
    positions.push(0, 0, 0)

    positions.push(-0.075, 0.2, 0.075) 
    positions.push(0.075, 0.2, 0.075) 

    positions.push(0.075, 0.2, -0.075) 
    positions.push(-0.075, 0.2, -0.075) 

    positions.push(-0.075, 0.2, -0.075) 
    positions.push(0, 1, 0)    

    positions.push(-0.075, 0.2, 0.075) 
    positions.push(0, 1, 0)
    
    positions.push(0.075, 0.2, 0.075) 
    positions.push(0, 1, 0)

    positions.push(0.075, 0.2, -0.075) 
    positions.push(0, 1, 0)

    this.setVertices({
      position: new Float32Array(positions),
    })
  }
}