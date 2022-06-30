import { vec3 } from "gl-matrix";
import Entity from "../../scene/entity";
import { ComponentEnum } from "../base/component";
import Geometry from "../geometry/geometry";
import Collider from "./collider";

export type Triangle = {
  corners: Array<vec3>,
  normal: vec3
}

const buildTriangles = (indices: Uint16Array, position: Float32Array): Array<Triangle> => {
  const triangles = new Array<Triangle>()

  // ToDo: Calculate triangle normal
  for(let index = 0; index < indices.length; index += 3) {
    const triangle: Triangle = {
      corners: new Array<vec3>(3),
      normal: vec3.fromValues(0, 1, 0)
    }

    for(let cornerIndex = 0; cornerIndex < 3; cornerIndex++) {
      const vertexIndex = indices[index + cornerIndex] * 3

      triangle.corners[cornerIndex] = vec3.fromValues(
          position[vertexIndex],
          position[vertexIndex + 1],
          position[vertexIndex + 2]
        )
    }

    const ab = vec3.create()
    vec3.sub(ab, triangle.corners[1], triangle.corners[0])

    const bc = vec3.create()
    vec3.sub(bc, triangle.corners[2], triangle.corners[1])

    vec3.cross(triangle.normal, ab, bc)
    vec3.normalize(triangle.normal, triangle.normal)

    triangles.push(triangle)
  }
    
  return triangles
}

export default class GeometryCollider extends Collider {
  triangles: Array<Triangle>

  constructor() {
    super()
  }

  onAdd = (self: Entity) => {
    const geometry = self.get(ComponentEnum.GEOMETRY) as Geometry
    const { INDICES, POSITION } = geometry.vao

    this.triangles = buildTriangles(INDICES, POSITION)
  }
}