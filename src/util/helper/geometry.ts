import { vec3 } from "gl-matrix"

export const createBoxBuffer = (min: vec3, max: vec3): Float32Array => {
  const positions: Array<number> = new Array<number>()
  
  // order clockwise from view outside

  // front

  positions.push(min[0], min[1], max[2])
  positions.push(min[0], max[1], max[2])
  
  positions.push(min[0], max[1], max[2])
  positions.push(max[0], max[1], max[2])

  positions.push(max[0], max[1], max[2])
  positions.push(max[0], min[1], max[2])

  positions.push(max[0], min[1], max[2])
  positions.push(min[0], min[1], max[2])

  // back

  positions.push(max[0], min[1], min[2])
  positions.push(max[0], max[1], min[2])

  positions.push(max[0], max[1], min[2])  
  positions.push(min[0], max[1], min[2])

  positions.push(min[0], max[1], min[2])   
  positions.push(min[0], min[1], min[2])

  positions.push(min[0], min[1], min[2])
  positions.push(max[0], min[1], min[2])

  // left

  positions.push(min[0], max[1], min[2])
  positions.push(min[0], max[1], max[2])

  positions.push(min[0], min[1], min[2])
  positions.push(min[0], min[1], max[2])

  // right

  positions.push(max[0], max[1], min[2])
  positions.push(max[0], max[1], max[2])

  positions.push(max[0], min[1], min[2])
  positions.push(max[0], min[1], max[2])
 
  return new Float32Array(positions)
}