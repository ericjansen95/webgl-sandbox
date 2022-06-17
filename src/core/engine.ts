import { ComponentEnum } from "./components/base/component"
import Debug from "./internal/debug"
import Input from "./internal/input"
import Time from "./internal/time"
import Renderer from "./scene/renderer"
import Scene from "./scene/scene"

export type MainStats = {
  frameTime: number
  FPS: number
}

export default class Engine {
  stats: MainStats | null

  renderer: Renderer
  scene: Scene

  constructor(canvas: HTMLCanvasElement, sceneCamera, debugCamera) {
    this.stats = null

    Time.init()
    Debug.init()
    Input.init()

    this.renderer = new Renderer(canvas)
    this.scene = new Scene()

    const update = curTime => {
      const startTime = Date.now()
      Time.tick(curTime)
  
      //const sceneCameraTransform = sceneCamera.getComponent("Transform")
      //sceneCameraTransform.setRotation([0.0, Math.cos((Date.now() - Time.startTime) * 0.0005) * Math.PI * 0.25, 0.0])
  
      this.scene.update(sceneCamera)
      
      debugCamera.get(ComponentEnum.CONTROLS).onUpdate(debugCamera, debugCamera)
      debugCamera.get(ComponentEnum.TRANSFORM).onUpdate(debugCamera, debugCamera)
      debugCamera.get(ComponentEnum.CAMERA).onUpdate(debugCamera, debugCamera)
  
      this.renderer.renderEntities(this.scene.getVisibleEntities(sceneCamera), debugCamera)
  
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