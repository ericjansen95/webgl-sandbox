import { vec3 } from "gl-matrix"
import Material from "../components/material/material"
import Entity from "./entity"
import Geometry from "../components/geometry/geometry"
import { Component } from "../components/base/component"

export default class Renderer {
  gl: WebGL2RenderingContext
  clearColor: vec3
  
  drawCalls: number
  cullCount: number

  constructor(canvas: HTMLCanvasElement) {
    this.gl = canvas.getContext('webgl2') as WebGL2RenderingContext
    this.clearColor = vec3.fromValues(0.549, 0.745, 0.839)

    if(!this.gl) {
      console.error('Failed to initialize WebGL!') 
      return
    }

    this.gl.clearColor(this.clearColor[0], this.clearColor[1], this.clearColor[2], 1.0)
    this.gl.clearDepth(1.0)
    this.gl.enable(this.gl.DEPTH_TEST)
    this.gl.depthFunc(this.gl.LEQUAL)
  }

  renderEntity = (entity: Entity, camera: Entity) => {
    const geometry = entity.get(Component.GEOMETRY) as Geometry
    const material = entity.get(Component.MATERIAL) as Material

    if(!material?.bindBase(this.gl, entity, camera) || 
      !geometry?.bind(this.gl, material)) return

    this.gl.drawArrays(geometry.drawMode, 0, geometry.vertex.componentCount)
    this.drawCalls++
  }

  renderEntities = (entities: Array<Entity>, camera: Entity) => {
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT)

    this.drawCalls = 0
    this.cullCount = 0

    for(const entity of entities)
      this.renderEntity(entity, camera)
  }
}