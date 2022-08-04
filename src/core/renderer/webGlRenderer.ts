import { vec3 } from "gl-matrix"
import Material from "../components/material/material"
import Entity from "../scene/entity"
import Geometry from "../components/geometry/geometry"
import { ComponentType } from "../components/base/component"
import Debug from "../internal/debug"
import { roundNumber } from "../../util/math/round"

export type RenderStats = {
  drawTime: number
  drawCalls: number
  vertexCount: number
}

export type RenderList = Array<Entity>

const DEFAULT_CLEAR_COLOR = vec3.fromValues(0.5, 0.5, 0.5) //vec3.fromValues(0.549, 0.745, 0.839)

export default class WebGlRenderer {
  gl: WebGL2RenderingContext
  stats: RenderStats

  constructor(canvas: HTMLCanvasElement) {
    this.gl = canvas.getContext('webgl2') as WebGL2RenderingContext
    this.stats = {
      drawTime: 0,
      drawCalls: 0,
      vertexCount: 0
    }

    if(!this.gl) {
      console.error('Failed to initialize WebGL!') 
      return
    }

    this.gl.enable(this.gl.DEPTH_TEST)
    this.gl.depthFunc(this.gl.LESS)

    this.gl.clearColor(DEFAULT_CLEAR_COLOR[0], DEFAULT_CLEAR_COLOR[1], DEFAULT_CLEAR_COLOR[2], 1.0)
    this.gl.clearDepth(1.0)

    //this.gl.enable(this.gl.CULL_FACE);
    //this.gl.cullFace(this.gl.BACK);

    this.gl.enable(this.gl.BLEND);
    this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA)

    const requestPointerLock = () => canvas.requestPointerLock()

    window.addEventListener('mousedown', requestPointerLock)
    window.addEventListener('keydown', requestPointerLock)
  }

  renderEntity = (entity: Entity, camera: Entity) => {
    const geometry = entity.get(ComponentType.GEOMETRY) as Geometry

    if(!geometry) return

    const material = entity.get(ComponentType.MATERIAL) as Material

    if(!material) Debug.material.bindBase(this.gl, entity, camera)
    else material.bindBase(this.gl, entity, camera)

    if(!geometry.bind(this.gl, material)) return

    if(geometry.vbo.INDICES) this.gl.drawElements(geometry.drawMode, geometry.vao.INDICES.length, this.gl.UNSIGNED_SHORT, 0)
    else this.gl.drawArrays(geometry.drawMode, 0, geometry.vao.count)

    this.stats.drawCalls++
    this.stats.vertexCount += geometry.vao.count
  }

  renderEntities = (renderList: RenderList, camera: Entity) => {
    const startTime = window.performance.now()

    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT)

    this.stats.drawCalls = 0
    this.stats.vertexCount = 0

    for(const entity of renderList)
      this.renderEntity(entity, camera)

    this.stats.drawTime = roundNumber(window.performance.now() - startTime)
    Debug.updateStats({render: this.stats})
  }
}