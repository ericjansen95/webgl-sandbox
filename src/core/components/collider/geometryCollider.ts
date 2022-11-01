import { mat4, vec3 } from "gl-matrix";
import getIntersections, { Ray } from "../../../util/math/raycast";
import Entity from "../../scene/entity";
import { ComponentType } from "../base/component";
import Transform from "../base/transform";
import Geometry from "../geometry/geometry";
import Collider, { IntersectionInfo } from "./collider";

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
  modelSpaceTriangles: Array<Triangle>
  worldSpaceTriangles: Array<Triangle>

  constructor() {
    super()
  }

  getIntersections = (ray: Ray): Array<IntersectionInfo> => {
    return getIntersections(ray, this.worldSpaceTriangles, this.self)
  }

  onAdd = (self: Entity) => {
    this.self = self

    const transform = self.getComponent(ComponentType.TRANSFORM) as Transform

    const geometry = self.getComponent(ComponentType.GEOMETRY) as Geometry
    const { INDICES, POSITION } = geometry.vao

    this.modelSpaceTriangles = buildTriangles(INDICES, POSITION)
    this.worldSpaceTriangles = this.modelSpaceTriangles
  }

  update = (transformMatrix: mat4) => {
    const triangles = new Array<Triangle>()

    for(const { corners, normal } of this.modelSpaceTriangles) {
      const triangle = {
        corners : new Array(),
        normal
      } as Triangle

      for(const corner of corners) {
        const cornerMatrix = mat4.fromTranslation(mat4.create(), corner)
        triangle.corners.push(mat4.getTranslation(vec3.create(), mat4.mul(mat4.create(), transformMatrix, cornerMatrix)))
      }

      triangles.push(triangle)
    }

    this.worldSpaceTriangles = triangles
  }
}