import { mat4 } from "gl-matrix";
import Geometry from "./geometry";
import { Material } from "./material";

export default class Entity {
  geometry: Geometry
  modelMatrix: mat4
  material: Material
  children: Array<Entity> 

  constructor() {
    this.geometry = new Geometry()
    this.modelMatrix = mat4.create()
    this.children = new Array<Entity>()
  }
}