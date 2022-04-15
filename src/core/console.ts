import Input from "./input"

export default class Console {
  private static visible: boolean
  private static domRoot: HTMLDivElement
  private static commandPrompt: HTMLParagraphElement
  private static commandInput: HTMLInputElement

  static init = (document: Document) => {
    this.visible = false

    this.domRoot = document.createElement('div')
    this.domRoot.style.cssText = 'position: absolute; height: 25%; width: 100%; top: 0px; left: 0px; background: rgba(0.0, 0.0, 0.0, 0.5); z-index: 0; visibility: hidden; display: flex;'
    document.body.appendChild(this.domRoot)

    this.commandPrompt = document.createElement('p')
    this.commandPrompt.style.cssText = 'font-family: monospace; margin: 6px; color: white; align-self: flex-end;'
    this.commandPrompt.innerText = "$ "
    this.domRoot.appendChild(this.commandPrompt)

    this.commandInput = document.createElement('input')
    this.commandInput.style.cssText = 'font-family: monospace; margin: 6px; color: white; align-self: flex-end; padding: 0px; border: 0px; background: rgba(0.0, 0.0, 0.0, 0.0); outline: none;'
    this.commandInput.onkeydown = (event) => {
      if(event.key !== 'Enter') return
      this.handleInput(this.commandInput.value) 
      this.commandInput.value = ''
    }
    this.domRoot.appendChild(this.commandInput)
  }

  static handleInput = (value) => {
    console.log(`Console::handleInput(): Input = ${value}`)
  }
  
  static setVisible = (visible: boolean) => {
    if(this.visible === visible) return
    
    this.visible = visible

    Input.locked = this.visible
    this.domRoot.style.visibility = this.visible ? "" : "hidden"

    this.visible ? this.commandInput.focus() : this.commandInput.blur()    
  }
}