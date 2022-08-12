import { vec3 } from "gl-matrix";
import Ray from "../../core/components/geometry/ray";
import UnlitMaterial from "../../core/components/material/unlitMaterial";
import Entity from "../../core/scene/entity";

export const createRay = ({ color, length } : { color: vec3, length: number }) => {
  const rayMaterial = new UnlitMaterial(color)

  const ray = new Entity()
  ray.add(new Ray(length))
  ray.add(rayMaterial)

  return ray
}