import { vec2, vec3 } from "gl-matrix"
import Camera from "./components/base/camera"
import { ComponentEnum } from "./components/base/component"
import Transform from "./components/base/transform"
import FlyControls from "./components/controls/flyControls"
import Debug from "./internal/debug"
import Input from "./internal/input"
import Time from "./internal/time"
import Entity from "./scene/entity"
import Renderer from "./renderer/renderer"
import Scene from "./scene/scene"

export type MainStats = {
  frameTime: number
  FPS: number
}

export default class Engine {
  stats: MainStats | null

  canvas: HTMLCanvasElement
  renderer: Renderer

  scene: Scene

  constructor(canvas: HTMLCanvasElement, sceneCamera: Entity) {
    this.stats = null

    Time.init()
    Debug.init(sceneCamera)
    Input.init()

    this.canvas = canvas
    this.renderer = new Renderer(this.canvas)

    this.scene = new Scene(sceneCamera)

    const update = curTime => {
      const startTime = Date.now()
      Time.tick(curTime)
  
      this.scene.update()

      Debug.update()
  
      this.renderer.renderEntities(
        this.scene.getVisibleEntities(), 
        Debug.cameraEnabled ? Debug.camera : this.scene.camera)
  
      this.stats = {
        frameTime: Math.ceil(Date.now() - startTime),
        FPS: Math.ceil(1 / Time.deltaTime)
      }
      Debug.updateStats({main: this.stats})
  
      requestAnimationFrame(update)
    }
    requestAnimationFrame(update)
  }
}