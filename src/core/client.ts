import { resolve } from "path";
import Debug from "./debug";

// ToDo Improve types and add origin id / info?

type PingPackage = {
  type: "PING"
  data: string
}

type TextPackage = {
  type: "TEXT"
  data: string
}

type NetworkPackage = PingPackage | TextPackage

export default class Client {
  peerConnection: RTCPeerConnection
  channels: Map<string, RTCDataChannel>

  constructor() {
    this.channels = new Map<string, RTCDataChannel>()
    Debug.console.registerCommand({ name: "st", description: "Send text to clients. Example: st 'text'", ref: this, callback: this.sendText, arg: true})

    const init = async () => {
      try {
        Debug.info(await this.connect("http://localhost:6969/connect"))
      } catch (error) {
        Debug.error(error)
      }
    }

    init()
  }

  sendText(text: string, ref: Client = this) {
    if(!text) return `Client::sendText(): Failed sending text = invalid arguments!`

    const data = JSON.stringify({
      type: "TEXT",
      data: text
    })

    const label: string = "default"
    ref.channels.get(label).send(data)

    return `Client::sendText(): Send text = ${text}`
  }

  handleMessage(raw: string): boolean | null {
    const {type, data} = JSON.parse(raw) as NetworkPackage

    if(!type || !data) return null

    switch (type) {
      case "PING": {
        // can this be negativ based on system time differences?
        const ping: number = Math.max(0, Math.ceil(Date.now() - parseInt(data, 10)))
        Debug.update({client: {ping}})
        return true
      }
      case "TEXT": {
        Debug.info(`Client::handleMessage(): Received text = ${data}`)
        return true
      }
      default: {
        Debug.info(`Client::handleMessage(): Invalid message type = ${type}!`)
        return null
      }
    }
  }

  addChannel(label: string) {
    const channel = this.peerConnection.createDataChannel(label)
    this.channels.set(label, channel)

    channel.onopen = () => {
      this.handleChannelOpen(label)
    }
    channel.onclose = () => {
      this.handleChannelClose(label)
    }
    channel.onmessage = e => {
      this.handleMessage(e.data)
    }
  }

  handleChannelOpen(label: string) { 
    Debug.info(`Client::handleChannelOpen(): Channel ${label} opened.`)

    try {
      const data = JSON.stringify({
        type: "TEXT",
        data: `Hello from client! ${Math.floor(Math.random() * 1000)}`
      })

      this.channels.get(label).send(data)
    } catch (error) {
      Debug.info(`Client::handleChannelOpen(): Failed sending message = ${error}`)
    }
  }

  handleChannelClose(label: string) {
    Debug.warn(`Client::handleChannelClose(): Channel ${label} closed!`)
    this.channels.delete(label)
  }

  disconnect() {
    this.peerConnection.close()
    this.peerConnection = null

    this.channels.clear()

    Debug.warn('Client::constructor(): Disconnected from server!')
  }

  connect(url: string): Promise<string> {
    console.log("connect")
    return new Promise(async (resolve, reject) => {
        if(!url) {
          reject(`Client::connect(): Invalid server url!`)
          return
        }  

        const handleConnection = async (localSessionDescription: string) => {
          try {
            const response = await fetch(url, {
              method: 'POST',
              headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({sdp: localSessionDescription})
            })
        
            const body: { sdp: string } = await response.json()
            const { sdp } = body
    
            if(!body.sdp) {
              reject(`Client::connect(): Failed connecting to server ${url} = invalid remote session description!`)
              return
            }  
    
            try {
              this.peerConnection.setRemoteDescription(new RTCSessionDescription(JSON.parse(atob(sdp))))
              resolve(`Client::connect(): Connecting to server ${url} ...`)
              return
            } catch (error) {
              reject(`Client::connect(): Failed to set remote session description = ${error}!`)
              return
            }
          } catch (error) {
            reject(`Client::connect(): Failed connecting to server ${url} = ${error}`)
            return
          }
        }

        this.peerConnection = new RTCPeerConnection({
          iceServers: [
            {
              urls: 'stun:stun.l.google.com:19302'
            }
          ]
        })
    
        this.peerConnection.onnegotiationneeded = e => 
          this.peerConnection.createOffer().then(d => 
            this.peerConnection.setLocalDescription(d)).catch(error => 
              Debug.error(`Client::connect(): Failed getting local session description = ${error}`
            )
          )
    
        this.peerConnection.onicecandidate = async event => {
          if (event.candidate === null) {
            try {
              const localSessionDescription = btoa(JSON.stringify(this.peerConnection.localDescription))
              await handleConnection(localSessionDescription)
            } catch (error) {
              reject(error)
              return
            }
          }
        }
    
        this.peerConnection.onconnectionstatechange = async event => {
          const connectionState = this.peerConnection.connectionState
    
          switch (connectionState) {
            case "connected": {
              Debug.info('Client::constructor(): Connected to server.')
              break;
            }
            case "connecting": {
              break;
            }
            default: {
              this.disconnect()
              break;
            }
          }
        }

        // onicecandidate is not called before a channel is added
        this.addChannel("default")
    })
  }
}