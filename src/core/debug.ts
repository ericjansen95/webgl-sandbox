import Console from "./console"
import Time from "./time"

export type DebugState = {
  renderer?: {
    drawCalls: number,
    cullCount: number
  },
  client?: {
    ping: number,
  }
}

export default class Debug {
  private static root: HTMLDivElement
  static console: Console

  static init = () => {
    this.root = document.createElement('div')
    this.root.style.cssText = 'position: absolute; font-family: monospace; font-size: 10px; height: 100%; width: 100%; top: 0px; left: 0px; background: rgba(0.0, 0.0, 0.0, 0.0); z-index: 0; display: flex; flex-direction: column;'
    document.body.appendChild(this.root)

    this.createDebugStats()

    this.console = new Console(this.root)
    this.console.registerCommand("ds", { ref: this, callback: this.toggleDebugStats, arg: false })
  }

  static update = (debugState: DebugState) => {
    if(debugState.renderer) {
      const {drawCalls, cullCount} = debugState.renderer

      this.fpsCounter.textContent = `${Math.ceil(1 / Time.deltaTime)} FPS`
      this.drawCounter.textContent = `${drawCalls} Draw Calls`
      this.cullCounter.textContent = `${cullCount} Culled Entities`
    }
    if(debugState.client) {
      const { ping } = debugState.client

      this.pingCounter.textContent = `${ping} ms Ping`
    }
  }

  private static debugStats: HTMLDivElement
  private static fpsCounter: HTMLParagraphElement 
  private static drawCounter: HTMLParagraphElement
  private static cullCounter: HTMLParagraphElement
  private static pingCounter: HTMLParagraphElement

  static createDebugStats = () => {
    this.debugStats = document.createElement('div')
    this.debugStats.style.cssText = 'height: 25%; width: 100%; background: rgba(0.0, 0.0, 0.0, 0.0); display: flex; flex-direction: column; visibility: hidden;'
    this.root.appendChild(this.debugStats)

    this.fpsCounter = document.createElement('p')
    this.fpsCounter.style.cssText = 'margin: 6px; padding: 6px; background-color: black; color: lightgreen; width: fit-content;'
    this.debugStats.appendChild(this.fpsCounter)

    this.drawCounter = document.createElement('p')
    this.drawCounter.style.cssText = 'margin: 6px; padding: 6px; background-color: black; color: lightsalmon; width: fit-content;'
    this.debugStats.appendChild(this.drawCounter)

    this.cullCounter = document.createElement('p')
    this.cullCounter.style.cssText = 'margin: 6px; padding: 6px; background-color: black; color: lightblue; width: fit-content;'
    this.debugStats.appendChild(this.cullCounter)

    this.pingCounter = document.createElement('p')
    this.pingCounter.style.cssText = 'margin: 6px; padding: 6px; background-color: black; color: lemonchiffon; width: fit-content;'
    this.debugStats.appendChild(this.pingCounter)
  }

  static toggleDebugStats(ref: Debug = this): string {
    const isHidden = Debug.debugStats.style.visibility === "hidden";
    Debug.debugStats.style.visibility = isHidden ? "" : "hidden"

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
}