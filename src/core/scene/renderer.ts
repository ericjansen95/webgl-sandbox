import { vec3, mat4 } from "gl-matrix"
import Material from "../components/material/material"
import Entity from "./entity"
import Geometry from "../components/geometry/geometry"
import Transform from "../components/base/transform"
import { Component } from "../components/base/component"
import Camera from "../components/base/camera"

export let GL: WebGL2RenderingContext;

export default class Renderer {
  clearColor: vec3
  
  drawCalls: number
  cullCount: number

  constructor(canvas: HTMLCanvasElement) {
    GL = canvas.getContext('webgl2') as WebGL2RenderingContext
    this.clearColor = vec3.fromValues(0.549, 0.745, 0.839)

    if(!GL) {
      console.error('Failed to initialize WebGL!') 
      return
    }

    GL.clearColor(this.clearColor[0], this.clearColor[1], this.clearColor[2], 1.0)
    GL.clearDepth(1.0)
    GL.enable(GL.DEPTH_TEST)
    GL.depthFunc(GL.LEQUAL)
  }

  renderEntity = (entity: Entity, camera: Entity) => {
    const geometry = entity.get(Component.GEOMETRY) as Geometry
    const material = entity.get(Component.MATERIAL) as Material

    if(!material || !geometry.load(GL)) return

    material.bindBase(GL, entity, camera)
    geometry.bind(GL, material)

    GL.drawArrays(geometry.drawMode, 0, geometry.vertex.componentCount)
    this.drawCalls++
  }

  renderEntities = (entities: Array<Entity>, camera: Entity) => {
    GL.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT)

    this.drawCalls = 0
    this.cullCount = 0

    for(const entity of entities)
      this.renderEntity(entity, camera)
  }
}