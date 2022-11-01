import { vec2 } from "gl-matrix"

export default class Input {
  static keyState: Map<string, boolean>
  static mouseState: {
    deltaTranslation: vec2,
    isDown: boolean
  }
  static locked: boolean

  static init = () => {
    this.keyState = new Map<string, boolean>()
    this.mouseState = {
      deltaTranslation: vec2.create(),
      isDown: false
    }

    document.onkeyup = (event) => this.keyState.set(event.key.toLowerCase(), false)
    document.onkeydown = (event) => this.keyState.set(event.key.toLowerCase(), true)

    // handle this manually in game loop to keep synch?
    document.onmousemove = this.updateMouseState
    
    document.onmouseleave = () => this.mouseState.deltaTranslation.fill(0.0)

    document.onmousedown = () => this.mouseState.isDown = true
    document.onmouseup = () => this.mouseState.isDown = false

    this.locked = false
  }

  static mouseMoveTimeout: NodeJS.Timeout

  static updateMouseState = (event) => {
    if(this.locked) return

    if(this.mouseMoveTimeout) clearTimeout(this.mouseMoveTimeout)

    this.mouseState.deltaTranslation = [event.movementX, event.movementY] as vec2
   
    this.mouseMoveTimeout = setTimeout(() => this.mouseState.deltaTranslation.fill(0.0), 17)
  }

  static isKeyDown = (keyName: string) => {
    const key: string = keyName.toLowerCase()

    if(!this.keyState.has(key) || this.locked)
      return false

    return this.keyState.get(key)  
  }
}