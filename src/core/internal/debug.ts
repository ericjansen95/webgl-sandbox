import { vec2, vec3 } from "gl-matrix"
import Camera from "../components/base/camera"
import { ComponentType } from "../components/base/component"
import Transform from "../components/base/transform"
import FlyControls from "../components/controls/flyControls"
import Material from "../components/material/material"
import UnlitMaterial from "../components/material/unlitMaterial"
import { MainStats } from "../engine"
import Entity from "../scene/entity"
import { RenderStats } from "../renderer/webGlRenderer"
import { SceneStats } from "../scene/scene"
import Console from "./console"
import FrameInspector from "./fameInspector"
import { ControlsStats } from "../components/controls/controls"
import { formatObjectToString } from "../../util/helper/string"
import { PhysicStats } from "./physics"

export type DebugStats = {
  scene?: SceneStats
  render?: RenderStats
  main?: MainStats
  controls?: ControlsStats
  physics?: PhysicStats
  client?: {
    ping: number
  }
}

export default class Debug {
  static console: Console
  static frameInspector: FrameInspector

  static cameraEnabled: boolean
  static camera: Entity

  static material: Material

  private static sceneCamera: Entity

  private static root: HTMLDivElement

  private static stats: DebugStats

  private static statsRoot: HTMLDivElement
  private static statsElement: HTMLParagraphElement 

  static init = (sceneCamera: Entity) => {
    this.root = document.createElement('div')
    this.root.style.cssText = 'position: absolute; font-family: monospace; font-size: 10px; height: 100%; width: 100%; top: 0px; left: 0px; background: rgba(0.0, 0.0, 0.0, 0.0); z-index: 0; display: flex; flex-direction: column;'
    document.body.appendChild(this.root)

    this.initStats()

    this.console = new Console(this.root)
    this.frameInspector = new FrameInspector(this.root)

    this.cameraEnabled = false
    this.sceneCamera = sceneCamera

    this.material = new UnlitMaterial([1.0, 0.0, 1.0])

    this.console.registerCommand({ name: "ds", description: "Display debug statistics.", callback: this.toggleStats })
    this.console.registerCommand({ name: "fi", description: "Display frame inspector.", callback: this.frameInspector.toggleVisible })
    this.console.registerCommand({name: "dc", description: "Toggle debug fly camera.", callback: this.toggleCamera})
  }

  static initStats = () => {
    this.stats = {}

    this.statsRoot = document.createElement('div')
    this.statsRoot.style.cssText = 'background: rgba(0.0, 0.0, 0.0, 0.0); display: flex; flex-direction: column; visibility: hidden;'
    this.root.appendChild(this.statsRoot)

    this.statsElement = document.createElement('p')
    this.statsElement.style.cssText = 'min-width: 150px; padding: 6px; margin-top: 0px; background-color: rgba(0.0, 0.0, 0.0, 0.5); color: lightgray; width: fit-content; white-space: pre;'
    this.statsRoot.appendChild(this.statsElement)
  }

  static updateStats = (stats: DebugStats) => {
    for(const [name, entry] of Object.entries(stats)) {
      this.stats[name] = entry
    }

    this.statsElement.textContent = formatObjectToString(this.stats)
  }

  static toggleStats = (): string => {
    const isHidden = Debug.statsRoot.style.visibility === "hidden";
    Debug.statsRoot.style.visibility = isHidden ? "" : "hidden"

    return `Debug::toggleDebugStats(): ${isHidden ? "Enabled" : "Disabled"} debug stats.`
  }

  static info = (message: string) => {
    this.console.log(message, "INFO");
  }
  static warn = (message: string) => {
    this.console.log(message, "WARN");
  }
  static error = (message: string) => {
    this.console.log(message, "ERROR");
  } 

  private static createCamera = (sceneCamera: Entity) => {
    const sceneCameraComponent = sceneCamera.get(ComponentType.CAMERA) as Camera

    this.camera = new Entity()
    this.camera.add(new FlyControls())
    this.camera.add(new Camera(sceneCameraComponent.fov))
  }

  static update = () => {
    this.frameInspector.update(this.stats)
    
    if(!this.cameraEnabled) return

    this.camera.get(ComponentType.CONTROLS).onUpdate(this.camera, this.camera)
    this.camera.get(ComponentType.TRANSFORM).onUpdate(this.camera, this.camera)
    this.camera.get(ComponentType.CAMERA).onUpdate(this.camera, this.camera)
  }

  static toggleCamera = (): string => {
    this.cameraEnabled = !this.cameraEnabled

    if(!this.cameraEnabled) return "Engine::toggleDebugCamera(): Disabled debug camera."

    const sceneCameraTransform = this.sceneCamera.get(ComponentType.TRANSFORM) as Transform

    // create debug camera if none exists
    if(!this.camera)
      this.createCamera(this.sceneCamera)

    const debugCameraControls = this.camera.get(ComponentType.CONTROLS) as FlyControls
    const debugCameraTransform = this.camera.get(ComponentType.TRANSFORM) as Transform

    // set debug camera position to scene camera
    debugCameraTransform.setLocalPosition(sceneCameraTransform.getGlobalPosition())
    debugCameraTransform.onUpdate()
    debugCameraControls.angleRotation = vec2.create()

    return "Engine::toggleDebugCamera(): Enabled debug camera."
  }
}