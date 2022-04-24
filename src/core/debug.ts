import BoundingBox from "../components/boundingBox"
import BoundingSphere from "../components/boundingSphere"
import { Component } from "../components/component"
import Transform from "../components/transform"
import Entity from "./entity"
import Input from "./input"
import Time from "./time"

export type DebugState = {
  renderer: {
    drawCalls: number,
    cullCount: number
  }
}

type CommandName = string
type CommandCallback = Function

export default class Debug {
  private static visible: boolean

  private static root: HTMLDivElement
  private static sceneRoot: Entity

  static init = (sceneRoot: Entity) => {
    this.visible = false
    this.sceneRoot = sceneRoot

    this.root = document.createElement('div')
    this.root.style.cssText = 'position: absolute; font-family: monospace; font-size: 10px; height: 100%; width: 100%; top: 0px; left: 0px; background: rgba(0.0, 0.0, 0.0, 0.0); z-index: 0; display: flex; flex-direction: column;'
    document.body.appendChild(this.root)

    this.createConsole()
    this.registerConsoleCommands()

    this.createDebugStats()
  }

  private static console: HTMLDivElement
  private static consoleWrapper: HTMLDivElement
  private static consolePrompt: HTMLParagraphElement
  private static consoleInput: HTMLInputElement

  private static commands: Map<CommandName, CommandCallback>

  static createConsole = () => {
    this.commands = new Map<CommandName, CommandCallback>()

    this.console = document.createElement('div')
    this.console.style.cssText = 'height: 25%; width: 100%; background: rgba(0.0, 0.0, 0.0, 0.5); display: flex; flex-direction: column-reverse;'

    this.consoleWrapper = document.createElement('div')
    this.consoleWrapper.style.cssText = 'background: rgba(0.0, 0.0, 0.0, 0.0); display: flex; flex-direction: row;'
    this.console.appendChild(this.consoleWrapper)

    this.consolePrompt = document.createElement('p')
    this.consolePrompt.style.cssText = 'margin: 6px; color: white; height: fit-content;'
    this.consolePrompt.innerText = "$ "
    this.consoleWrapper.appendChild(this.consolePrompt)

    this.consoleInput = document.createElement('input')
    this.consoleInput.type = "text"
    this.consoleInput.style.cssText = 'margin: 6px; color: white; font-family: monospace; font-size: 10px; width: 75%; height: fit-content; padding: 0px; border: 0px; background: rgba(0.0, 0.0, 0.0, 0.0); outline: none;'
    this.consoleInput.onkeydown = (event) => {
      if(!this.consoleInput.value) return
      switch (event.key.toLowerCase()) {
        case "enter": {
          this.executeCommand(this.consoleInput.value) 
          this.consoleInput.value = ''
          break
        }
      }
    }
    // This is a very nice way to filter out ^ / dead but it seems to be legacy
    this.consoleInput.onkeypress = (event) => event.keyCode !== 94
    this.consoleWrapper.appendChild(this.consoleInput)

    window.onkeydown = (event) => {
      switch (event.key.toLowerCase()) {
        case "dead": {
          this.toggleVisible()
          break
        }
      }
    }
  }

  static registerConsoleCommands = () => {
    this.commands.set("ds", this.toggleDebugStats)
    this.commands.set("bv", this.toggleBoundingVolumes)
  }

  static toggleDebugStats = () => {
    this.debugStats.style.visibility = this.debugStats.style.visibility === "hidden" ? "" : "hidden"
  } 

  static toggleBoundingVolumes = () => {
    const toggleBoundingVolume = (parent: Entity) => {
      let boundingVolume: Component | null

      // ToDo(Eric): create entity traverse function
      // ToDo(Eric): let bounding volumes inherit from centeral class or interface

      boundingVolume = parent.getComponent("BoundingSphere")
      if(boundingVolume) (boundingVolume as BoundingSphere).setVisible(!(boundingVolume as BoundingSphere).visible)
      else {
        boundingVolume = parent.getComponent("BoundingBox")
        if(boundingVolume) (boundingVolume as BoundingBox).setVisible(!(boundingVolume as BoundingBox).visible)
      }

      (parent.getComponent("Transform") as Transform).children.forEach(child => toggleBoundingVolume(child))
    }

    toggleBoundingVolume(this.sceneRoot)
  }

  private static debugStats: HTMLDivElement
  private static fpsCounter: HTMLParagraphElement 
  private static drawCounter: HTMLParagraphElement
  private static cullCounter: HTMLParagraphElement

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
  }

  static executeCommand = (value) => {
    if(!this.commands.has(value)) console.error(`Console::executeCommand(): No command found with name = ${value}`)

    console.log(`Console::executeCommand(): Executing command with name = ${value}`)
    this.commands.get(value)()
  }

  static update = (debugState: DebugState) => {
    const {drawCalls, cullCount} = debugState.renderer

    this.fpsCounter.textContent = `${Math.ceil(1 / Time.deltaTime)} FPS`
    this.drawCounter.textContent = `${drawCalls} Draw Calls`
    this.cullCounter.textContent = `${cullCount} Culled Entities`
  }
  
  static toggleVisible = () => {
    this.visible = !this.visible

    Input.locked = this.visible
    this.visible ? this.root.insertBefore(this.console, this.root.firstChild) : this.root.removeChild(this.console)

    this.visible ? this.consoleInput.focus() : this.consoleInput.blur()    
  }
}