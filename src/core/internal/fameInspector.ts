import { DebugStats } from "./debug"

export default class FrameInspector {
  root: HTMLDivElement

  visible: boolean

  constructor(root: HTMLDivElement) {
    this.visible = false
    this.root = root

    this.init()
  }

  private frameInspector: HTMLDivElement

  init() {
    this.frameInspector = document.createElement('div')
    this.frameInspector.style.cssText = 'height: 25%; width: 100%; background: rgba(0.0, 0.0, 0.0, 0.5); display: flex; flex-direction: row;'

    this.frameInspector.innerHTML = `
      <div style="background-color:blue; width: 48px; height: 12px"></div>
      <div style="background-color:red; width: 48px; height: 12px"></div>
    `
  }

  update(stats: DebugStats) {

  }
 
  toggleVisible = (): string => {
    if(!this.frameInspector) return "frameInspector::toggleVisible(): No element found!"

    this.visible = !this.visible

    this.visible ? this.root.insertBefore(this.frameInspector, this.root.firstChild) : this.root.removeChild(this.frameInspector)   
  
    return `frameInspector::toggleVisible(): ${this.visible ? "Enabled" : "Disabled"} frame inspector.`
  }
}