import { SceneStats } from "../scene/scene"
import Console from "./console"
import FrameInspector from "./fameInspector"

export type DebugStats = {
  scene?: SceneStats,
  client?: {
    ping: number,
  }
}

export default class Debug {
  static console: Console
  static frameInspector: FrameInspector

  private static root: HTMLDivElement

  private static stats: DebugStats

  private static statsRoot: HTMLDivElement
  private static statsElement: HTMLParagraphElement 

  static init = () => {
    this.root = document.createElement('div')
    this.root.style.cssText = 'position: absolute; font-family: monospace; font-size: 10px; height: 100%; width: 100%; top: 0px; left: 0px; background: rgba(0.0, 0.0, 0.0, 0.0); z-index: 0; display: flex; flex-direction: column;'
    document.body.appendChild(this.root)

    this.initStats()

    this.console = new Console(this.root)
    this.frameInspector = new FrameInspector(this.root)

    this.console.registerCommand({ name: "ds", description: "Display debug statistics.", callback: this.toggleStats })
    this.console.registerCommand({ name: "fi", description: "Display frame inspector.", callback: this.frameInspector.toggleVisible })
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

    let output: string = ""

    for(const [statSectionName, statSectionValue] of Object.entries(this.stats)) {
      output += statSectionName + ':\r\n\r\n'

      for(const [statName, statValue] of Object.entries(statSectionValue))
        output += '  ' + statName + ' = ' + statValue.toString() + '\r\n'

      output += '\r\n'  
    }

    this.statsElement.textContent = output
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
}