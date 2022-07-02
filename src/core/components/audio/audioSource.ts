import Component, { ComponentEnum } from "../base/component";

type AudioSourceState = {
  element: HTMLAudioElement
  track: MediaElementAudioSourceNode | null
}

export default class AudioSource implements Component {
  type: ComponentEnum
  state: AudioSourceState

  constructor(sourceUri: string) {
    this.type = ComponentEnum.AUDIO_SOURCE

    const element = document.createElement('audio') as HTMLAudioElement
    element.src = sourceUri
    element.load()

    element.onloadeddata = () => {
      this.state = {
        element,
        track: null
      }
    }
  }

  bind = (context: AudioContext): boolean => {
    if(!this.state || !context) return false
    if(this.state.track) return true

    this.state.track = context.createMediaElementSource(this.state.element)
    this.state.track.connect(context.destination)

    this.state.element.play()

    return true
  }
}