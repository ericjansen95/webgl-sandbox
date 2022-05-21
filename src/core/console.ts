import Input from "./input"

type CommandName = string
type CommandCallback = Function
type CommandInfo = { ref: any, callback: CommandCallback }

export default class Console {
  root: HTMLDivElement

  commands: Map<CommandName, CommandInfo>
  visible: boolean

  constructor(root: HTMLDivElement) {
    this.visible = false
    this.root = root

    this.init()
    this.registerCommand("help", { ref: this, callback: this.getCommandList})
  }

  private console: HTMLDivElement
  private consoleWrapper: HTMLDivElement
  private consolePrompt: HTMLParagraphElement
  private consoleInput: HTMLInputElement
  private consoleOutputList: HTMLUListElement

  init() {
    this.commands = new Map<CommandName, CommandInfo>()

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

    this.consoleOutputList = document.createElement('ul')
    this.consoleOutputList.style.cssText = 'color: white; font-family: monospace; font-size: 10px; list-style-type: none; margin: 10px 8px 0px 0px; padding-left: 24px; overflow:hidden; overflow-y:scroll; display: flex; flex-direction: column-reverse;'; 
    this.console.appendChild(this.consoleOutputList)

    window.onkeydown = (event) => {
      switch (event.key.toLowerCase()) {
        case "dead": {
          this.toggleVisible()
          break
        }
      }
    }
  }

  log(message: string, type: "INFO" | "WARN" | "ERROR" = "INFO") {
    const consoleOutputItem: HTMLLIElement = document.createElement('li')

    consoleOutputItem.style.cssText = 'margin: 0px 0px 6px 0px; color: lightgray;'
    consoleOutputItem.innerHTML = `<span>${new Date().toLocaleTimeString()}</span> <b>${type}</b><span>: ${message}</span>`

    this.consoleOutputList.insertBefore(consoleOutputItem, this.consoleOutputList.firstChild)
  }

  registerCommand(name: CommandName, info: CommandInfo) {
    this.commands.set(name, info)
  }

  getCommandList(): string {
    // @ts-expect-error
    const { ref, callback } = this
    return `Available commands: ${Array.from(ref.commands.keys()).join(', ')}`
  }

  executeCommand(value) {
    if(!this.commands.has(value)) {
      this.log("Invalid command!", "ERROR")
      this.executeCommand("help")
      return;
    }

    this.log(this.commands.get(value).callback())
  }
  
  toggleVisible() {
    this.visible = !this.visible

    Input.locked = this.visible
    this.visible ? this.root.insertBefore(this.console, this.root.firstChild) : this.root.removeChild(this.console)

    this.visible ? this.consoleInput.focus() : this.consoleInput.blur()    
  }
}