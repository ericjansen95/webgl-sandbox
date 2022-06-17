import { vec3 } from "gl-matrix"
import Material from "../components/material/material"
import Entity from "./entity"
import Geometry from "../components/geometry/geometry"
import { ComponentEnum } from "../components/base/component"
import Debug from "../internal/debug"

export type RendererStats = {
  drawTime: number
  drawCalls: number
}

export type RenderList = Array<Entity>

const DEFAULT_CLEAR_COLOR: vec3 = vec3.fromValues(0.549, 0.745, 0.839)

export default class Renderer {
  gl: WebGL2RenderingContext
  stats: RendererStats

  constructor(canvas: HTMLCanvasElement) {
    this.gl = canvas.getContext('webgl2') as WebGL2RenderingContext
    this.stats = {
      drawTime: 0,
      drawCalls: 0
    }

    if(!this.gl) {
      console.error('Failed to initialize WebGL!') 
      return
    }

    this.gl.enable(this.gl.DEPTH_TEST)
    this.gl.depthFunc(this.gl.LEQUAL)

    this.gl.clearColor(DEFAULT_CLEAR_COLOR[0], DEFAULT_CLEAR_COLOR[1], DEFAULT_CLEAR_COLOR[2], 1.0)
    this.gl.clearDepth(1.0)
  }

  renderEntity = (entity: Entity, camera: Entity) => {
    const geometry = entity.get(ComponentEnum.GEOMETRY) as Geometry
    const material = entity.get(ComponentEnum.MATERIAL) as Material

    if(!material?.bindBase(this.gl, entity, camera) || 
      !geometry?.bind(this.gl, material)) return

    this.gl.drawArrays(geometry.drawMode, 0, geometry.vertex.componentCount)
    this.stats.drawCalls++
  }

  renderEntities = (renderList: RenderList, camera: Entity) => {
    const startTime = Date.now()

    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT)

    this.stats.drawCalls = 0

    for(const entity of renderList)
      this.renderEntity(entity, camera)

    this.stats.drawTime = Math.ceil(Date.now() - startTime)
    Debug.updateStats({renderer: this.stats})
  }
}