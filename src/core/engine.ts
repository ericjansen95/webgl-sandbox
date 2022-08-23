import { vec2, vec3 } from "gl-matrix"
import Camera from "./components/base/camera"
import { ComponentType } from "./components/base/component"
import Transform from "./components/base/transform"
import FlyControls from "./components/controls/flyControls"
import Debug from "./internal/debug"
import Input from "./internal/input"
import Time from "./internal/time"
import Entity from "./scene/entity"
import WebGlRenderer from "./renderer/webGlRenderer"
import Scene from "./scene/scene"
import { roundNumber } from "../util/math/round"
import Physics from "./internal/physics"
import WebRTCClient from "./network/webRTCClient"
import { createPlayer, PlayerType } from "../util/helper/player"

export type MainStats = {
  frameTime: number
  FPS: number
}

export default class Engine {
  stats: MainStats | null

  canvas: HTMLCanvasElement
  renderer: WebGlRenderer

  scene: Scene

  constructor(canvas: HTMLCanvasElement, sceneCamera: Entity) {
    this.stats = null

    Time.init()
    Debug.init(sceneCamera)
    Input.init()
    Physics.init()

    this.canvas = canvas
    this.renderer = new WebGlRenderer(this.canvas)

    const player = createPlayer({ type: PlayerType.FIRST_PERSON, camera: sceneCamera })

    const client = new WebRTCClient()
    this.scene = new Scene(sceneCamera, player, client)
    this.scene.add(player)

    const update = curTime => {
      const startTime = window.performance.now()
      Time.tick(curTime)
  
      this.scene.update()
  
      this.renderer.renderEntities(
        this.scene.getVisibleEntities(), 
        Debug.cameraEnabled ? Debug.camera : this.scene.camera)
  
      this.stats = {
        frameTime: roundNumber(window.performance.now() - startTime),
        FPS: Math.round(1 / Time.deltaTime)
      }
      Debug.updateStats({main: this.stats})
      Debug.update()
  
      requestAnimationFrame(update)
    }
    requestAnimationFrame(update)
  }
}