import Input from "./input"

type CommandName = string
type CommandCallback = Function
type CommandInfo = { 
  name: CommandName,
  description?: string,
  ref: any, 
  arg?: boolean,
  callback: CommandCallback,
}

export default class Console {
  root: HTMLDivElement

  commands: Map<CommandName, CommandInfo>
  visible: boolean

  constructor(root: HTMLDivElement) {
    this.visible = false
    this.root = root

    this.init()
    this.registerCommand({
      name: "help", 
      ref: this, 
      callback: this.help, 
      arg: true,
    })
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

    let color: string = "lightgreen"

    switch (type) {
      case "WARN":
        color = "lightyellow"
        break
      case "ERROR":
        color = "lightsalmon"
        break
    }

    consoleOutputItem.innerHTML = `<small>${new Date().toLocaleTimeString()}</small> <b style="color:${color};">${type}</b><span>: ${message}</span>`

    this.consoleOutputList.insertBefore(consoleOutputItem, this.consoleOutputList.firstChild)
  }

  registerCommand(info: CommandInfo) {
    if(!info.description)
      info.description = "No description available!"
    if(!info.arg)
      info.arg = false  

    this.commands.set(info.name, info)
  }

  help(name: CommandName = null, ref: Console = this): string {
    if(!name) return `Console::help(): Available commands: ${Array.from(ref.commands.keys()).join(', ')}, help 'command'`

    const commandInfo: CommandInfo = ref.commands.get(name)
    if(!commandInfo) {
      ref.executeCommand("help")
      return `Console::help(): Invalid command name!`
    }

    return `Console::help(): ${name} command description = ${commandInfo.description}`
  }

  executeCommand(input: string) {
    const inputParts: Array<string> = input.split(" ")
    const name: CommandName = inputParts[0]

    if(!this.commands.has(name)) {
      this.log("Console::executeCommand(): Invalid command!", "ERROR")
      this.executeCommand("help")
      return;
    }

    const { ref, callback, arg } = this.commands.get(name) 

    if(!arg) {
      this.log(callback(ref))
      return
    }

    inputParts.shift()
    const text: string = inputParts.join(" ")
    this.log(callback(text, ref))
  }
  
  toggleVisible() {
    this.visible = !this.visible

    Input.locked = this.visible
    this.visible ? this.root.insertBefore(this.console, this.root.firstChild) : this.root.removeChild(this.console)

    this.visible ? this.consoleInput.focus() : this.consoleInput.blur()    
  }
}