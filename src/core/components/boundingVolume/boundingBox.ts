import { vec3 } from "gl-matrix";
import { createWireframeBox } from "../../../util/helper/box";
import { createBoxBuffer } from "../../../util/helper/geometry";
import Debug from "../../internal/debug";
import Entity from "../../scene/entity";
import { ComponentType } from "../base/component";
import Geometry, { DrawMode } from "../geometry/geometry";
import BoundingVolume from "./boundingVolume";

export default class BoundingBox extends BoundingVolume {
  box: Entity | null

  min: vec3 
  max: vec3

  corners: Array<vec3>

  self: Entity | null
  visible: boolean
  
  constructor(visible: boolean = false) {
    super(visible)

    this.corners = new Array<vec3>()
  }

  setVisible = (visible: boolean) => {
    this.visible = visible

    this.createBox()

    const geometry = this.box.getComponent(ComponentType.GEOMETRY) as Geometry
    geometry.visible = visible
  }

  createBox = (): boolean => {
    if(!this.visible || this.box || !this.self) return false;

    this.box = createWireframeBox(this.min, this.max)
    this.self.getComponent(ComponentType.TRANSFORM).addChild(this.box)

    return true
  }

  onAdd = (self: Entity) => {
    this.self = self

    const geometry = self.getComponent(ComponentType.GEOMETRY) as Geometry

    this.min = geometry.vao.min
    this.max = geometry.vao.max

    this.corners.push([this.min[0], this.min[1], this.min[2]])
    this.corners.push([this.max[0], this.min[1], this.min[2]])
    this.corners.push([this.min[0], this.max[1], this.min[2]])
    this.corners.push([this.min[0], this.min[1], this.max[2]])
    this.corners.push([this.max[0], this.max[1], this.min[2]])
    this.corners.push([this.min[0], this.max[1], this.max[2]])
    this.corners.push([this.max[0], this.min[1], this.max[2]])
    this.corners.push([this.max[0], this.max[1], this.max[2]])
  }
}