import { vec3 } from "gl-matrix";
import Entity from "../../scene/entity";
import BoundingVolume from "./boundingVolume";
import Geometry, { DrawMode } from "../geometry/geometry";
import UnlitMaterial from "../material/unlitMaterial";
import { ComponentType } from "../base/component";
import Transform from "../base/transform";

export default class BoundingSphere extends BoundingVolume {
  sphere: Entity | null

  radius: number
  min: vec3
  max: vec3

  self: Entity | null
  
  constructor(visible: boolean = false) {
    super(visible)
  }

  setVisible = (visible: boolean) => {
    this.visible = visible

    this.createSphere()

    const geometry = this.sphere.getComponent(ComponentType.GEOMETRY) as Geometry
    geometry.visible = visible
  }

  createSphereBuffer = (radius: number): Float32Array => {
    const positions: Array<number> = new Array<number>()
    
    const UNIT_CIRCUMFERENCE = 2 * Math.PI
    const SECTIONS = 32
    const step = UNIT_CIRCUMFERENCE / SECTIONS

    // tmp => offset entity transform?
    const yOffset = (this.max[1] + this.min[1]) * 0.5

    for(let radiant = 0.0; radiant < UNIT_CIRCUMFERENCE; radiant += step) {
      const pos1 = Math.cos(radiant) * radius
      const pos2 = Math.sin(radiant) * radius
      const pos3 = Math.cos(radiant + step) * radius
      const pos4 = Math.sin(radiant + step) * radius

      positions.push(pos1, pos2 + yOffset, 0.0)
      positions.push(pos3, pos4 + yOffset, 0.0)

      positions.push(0.0, pos1 + yOffset, pos2)
      positions.push(0.0, pos3 + yOffset, pos4)

      positions.push(pos1, yOffset, pos2)
      positions.push(pos3, yOffset, pos4)
    }

    return new Float32Array(positions)
  }

  createSphere = (): boolean => {
    if(!this.visible || this.sphere || !this.self) return false

    const sphereGeometry: Geometry = new Geometry(DrawMode.LINE, true, false, false)
    const positions = this.createSphereBuffer(this.radius)
    sphereGeometry.setVAO({
      POSITION: positions,
      min: this.min,
      max: this.max
    });

    this.sphere = new Entity()
    const transform = this.sphere.getComponent(ComponentType.TRANSFORM) as Transform
    this.sphere.add(sphereGeometry)
    this.sphere.add(new UnlitMaterial([1.0, 0.0, 1.0]))
    this.self.getComponent(ComponentType.TRANSFORM).addChild(this.sphere)

    return true
  }

  onAdd = (self: Entity) => {
    this.self = self

    const { vao } = self.getComponent(ComponentType.GEOMETRY) as Geometry

    this.min = vao.min
    this.max = vao.max

    const { min, max } = this

    const size = vec3.fromValues(max[0] - min[0], max[1] - min[1], max[2] - min[2])
    this.radius = Math.max(size[0], Math.max(size[1], size[2]))

    this.createSphere()
  }
}