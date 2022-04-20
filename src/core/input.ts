import { vec2 } from "gl-matrix"

const WINDOW_SIZE: vec2 = vec2.fromValues(window.innerWidth, window.innerHeight)

export default class Input {
  static keyState: Map<string, boolean>
  static mouseState: {
    position: vec2,
    deltaPosition: vec2
  }
  static locked: boolean

  static init = () => {
    this.keyState = new Map<string, boolean>()
    this.mouseState = {
      position: vec2.create(),
      deltaPosition: vec2.create()
    }

    document.onkeyup = (event) => {
      this.keyState.set(event.key, false)
    }
  
    document.onkeydown = (event) => {
      this.keyState.set(event.key, true)
    }

    //document.body.style.cursor = 'none'

    // handle this manually in game loop to keep synch?
    document.onmousemove = this.updateMouseState
    
    document.onmouseup = () => this.mouseState.deltaPosition.fill(0.0)

    document.onmouseenter = (event) => this.mouseState.position = vec2.fromValues(event.offsetX, event.offsetY)
    document.onmouseleave = () => this.mouseState.deltaPosition.fill(0.0)

    this.locked = false
  }

  static updateMouseState = (event) => {
    const mousePosition: vec2 = [event.offsetX, event.offsetY]

    vec2.sub(this.mouseState.deltaPosition, mousePosition, this.mouseState.position)
    vec2.div(this.mouseState.deltaPosition, this.mouseState.deltaPosition, WINDOW_SIZE)

    this.mouseState.position = mousePosition
  }

  static isKeyDown = (keyName: string) => {
    const key: string = keyName.toLowerCase()

    if(!this.keyState.has(key) || this.locked)
      return false

    return this.keyState.get(key)  
  }
}