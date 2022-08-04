import { vec3 } from "gl-matrix";
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

    const geometry = this.box.get(ComponentType.GEOMETRY) as Geometry
    geometry.visible = visible
  }

  createBoxBuffer = (min: vec3, max: vec3): Float32Array => {
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

  createBox = (): boolean => {
    if(!this.visible || this.box || !this.self) return false;

    this.box = new Entity()

    const boxGeometry = new Geometry(DrawMode.LINE, true, false, false)
    const positions = this.createBoxBuffer(this.min, this.max)
    boxGeometry.setVAO({
      POSITION: positions
    })

    this.box.add(boxGeometry)
    this.box.add(Debug.material)

    this.self.get(ComponentType.TRANSFORM).add(this.box)

    return true
  }

  onAdd = (self: Entity) => {
    this.self = self

    const geometry = self.get(ComponentType.GEOMETRY) as Geometry

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

    this.createBox()
  }
}