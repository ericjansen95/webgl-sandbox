import { DebugStats } from "./debug"

/*
  - scene
    - component update
    - culling
  - renderer
    - static geometry
    - skinned geometry
*/

const frameInspectorStyle = (value: number, contrast: boolean = false): string => `background-color: ${contrast ? 'burlywood' : 'bisque'}; width: ${100 + value * 100}px; height: 12px; padding-left: 2px; font-family: monospace; font-size: 10px; color: dimgray; font-weight: bold;`
const frameInspectorElement = (text: string, value: number, contrast: boolean = false): string => `<span style="${frameInspectorStyle(value, contrast)}" title="${value}ms">${text}</span>`

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
    this.frameInspector.style.cssText = 'width: 100%; background: rgba(0.0, 0.0, 0.0, 0.5); display: flex; flex-direction: row;'
  }

  update(stats: DebugStats) {
    if(!this.visible) return;

    this.frameInspector.innerHTML = ''

    // ToDo: Loop over key / values instead of hard coding
    if(stats.scene) {
      this.frameInspector.innerHTML += `
        ${frameInspectorElement('update time', stats.scene.updateTime, false)}
        ${frameInspectorElement('cull time', stats.scene.cullTime, true)}
        `
    }
    if(stats.physics) {
      this.frameInspector.innerHTML += `
      ${frameInspectorElement('physics time', stats.physics.updateTime, false)}
      ` 
    }
    if(stats.render) {
      this.frameInspector.innerHTML += `
      ${frameInspectorElement('draw time', stats.render.drawTime, true)}
      ` 
    }
  }
 
  toggleVisible = (): string => {
    if(!this.frameInspector) return "frameInspector::toggleVisible(): No element found!"

    this.visible = !this.visible

    this.visible ? this.root.insertBefore(this.frameInspector, this.root.firstChild) : this.root.removeChild(this.frameInspector)   
  
    return `frameInspector::toggleVisible(): ${this.visible ? "Enabled" : "Disabled"} frame inspector.`
  }
}