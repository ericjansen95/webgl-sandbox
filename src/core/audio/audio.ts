type AudioControllerState = {
  context: AudioContext
}

export default class AudioController {
  state: AudioControllerState

  constructor() {
    window.addEventListener('mousedown', this.init)
    window.addEventListener('keydown', this.init)
  }

  private init = () => {
    if(this.state) return

    window.removeEventListener('mousedown', this.init)
    window.removeEventListener('keydown', this.init)

    this.state = {
      context: new AudioContext()
    }
  }
}