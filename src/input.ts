export default class Input {
  static keyState: Map<string, boolean>
  static locked: boolean

  static init = (document: Document) => {
    this.keyState = new Map<string, boolean>()

    document.onkeyup = (event) => {
      this.keyState.set(event.key, false)
    }
  
    document.onkeydown = (event) => {
      this.keyState.set(event.key, true)
    }

    this.locked = false
  }

  static isKeyDown = (keyName: string) => {
    const key: string = keyName.toLowerCase()

    if(!this.keyState.has(key) || this.locked)
      return false

    return this.keyState.get(key)  
  }
}