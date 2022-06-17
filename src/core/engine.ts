import { vec2, vec3 } from "gl-matrix"
import Camera from "./components/base/camera"
import { ComponentEnum } from "./components/base/component"
import Transform from "./components/base/transform"
import FlyControls from "./components/controls/flyControls"
import Debug from "./internal/debug"
import Input from "./internal/input"
import Time from "./internal/time"
import Entity from "./scene/entity"
import Renderer from "./scene/renderer"
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
  sceneCamera: Entity

  debugCameraEnabled: boolean
  debugCamera: Entity

  constructor(canvas: HTMLCanvasElement, sceneCamera: Entity) {
    this.stats = null

    Time.init()
    Debug.init()
    Input.init()

    this.canvas = canvas
    this.renderer = new Renderer(this.canvas)

    this.sceneCamera = sceneCamera
    this.scene = new Scene()

    this.debugCameraEnabled = false
    Debug.console.registerCommand({name: "dc", description: "Toggle debug fly camera.", callback: this.toggleDebugCamera})

    const sceneCameraTransform = sceneCamera.get(ComponentEnum.TRANSFORM) as Transform

    const update = curTime => {
      const startTime = Date.now()
      Time.tick(curTime)
  
      sceneCameraTransform.setRotation([0.0, Math.cos((Date.now() - Time.startTime) * 0.00075) * Math.PI * 0.05, 0.0])
      this.scene.update(sceneCamera)

      if(this.debugCameraEnabled)
        this.updateDebugCamera()
  
      this.renderer.renderEntities(
        this.scene.getVisibleEntities(sceneCamera), 
        this.debugCameraEnabled ? this.debugCamera : sceneCamera)
  
      this.stats = {
        frameTime: Math.ceil(Date.now() - startTime),
        FPS: Math.ceil(1 / Time.deltaTime)
      }
      Debug.updateStats({main: this.stats})
  
      requestAnimationFrame(update)
    }
    requestAnimationFrame(update)
  }

  private createDebugCamera = (canvas: HTMLCanvasElement, sceneCameraPosition: vec3) => {
    this.debugCamera = new Entity()
    this.debugCamera.add(new FlyControls())
    this.debugCamera.add(new Camera(Math.PI * 0.3, canvas.width / canvas.height))
  }

  private updateDebugCamera = () => {
    this.debugCamera.get(ComponentEnum.CONTROLS).onUpdate(this.debugCamera, this.debugCamera)
    this.debugCamera.get(ComponentEnum.TRANSFORM).onUpdate(this.debugCamera, this.debugCamera)
    this.debugCamera.get(ComponentEnum.CAMERA).onUpdate(this.debugCamera, this.debugCamera)
  }

  toggleDebugCamera = (): string => {
    this.debugCameraEnabled = !this.debugCameraEnabled

    if(!this.debugCameraEnabled) return "Engine::toggleDebugCamera(): Disabled debug camera."

    const sceneCameraTransform = this.sceneCamera.get(ComponentEnum.TRANSFORM) as Transform

    // create debug camera if none exists
    if(!this.debugCamera)
      this.createDebugCamera(this.canvas, sceneCameraTransform.getPosition())

    // set debug camera position to scene camera
    this.debugCamera.get(ComponentEnum.TRANSFORM).setPosition(sceneCameraTransform.getPosition())
    this.debugCamera.get(ComponentEnum.CONTROLS).angleRotation = vec2.create()

    return "Engine::toggleDebugCamera(): Enabled debug camera."
  }
}