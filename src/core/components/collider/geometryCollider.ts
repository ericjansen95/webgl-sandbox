import { vec3 } from "gl-matrix";
import Entity from "../../scene/entity";
import { ComponentEnum } from "../base/component";
import Geometry from "../geometry/geometry";
import Collider from "./collider";

const buildTriangles = (indices: Uint16Array, position: Float32Array): Array<vec3> => {
  const triangles = new Array<vec3>()

  for(let index = 0; index < indices.length; index += 3) {
    triangles.push(vec3.fromValues(
      position[indices[index]],
      position[indices[index + 1]],
      position[indices[index + 2]]     
    ))
  }
    
  return triangles
}

export default class GeometryCollider extends Collider {
  constructor() {
    super()
  }

  onAdd = (self: Entity) => {
    const geometry = self.get(ComponentEnum.GEOMETRY) as Geometry
    const { INDICES, POSITION } = geometry.vao

    const triangles = buildTriangles(INDICES, POSITION)
    console.log("triangles = ", triangles)
  }
}