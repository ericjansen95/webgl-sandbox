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

const isValidHttpUrl = (input: string) => {
  let url;
  
  try {
    url = new URL(input);
  } catch (_) {
    return false;
  }

  return url.protocol === "http:" || url.protocol === "https:";
}

export default class Client {
  peerConnection: RTCPeerConnection
  channels: Map<string, RTCDataChannel>

  constructor() {
    this.channels = new Map<string, RTCDataChannel>()

    Debug.console.registerCommand({ name: "st", description: "Send text to clients. Example: st 'text'", ref: this, callback: this.sendText, arg: true})
    Debug.console.registerCommand({ name: "cs", description: "Connect to server. Example: cs 'url'", ref: this, callback: this.connect, arg: true})
    Debug.console.registerCommand({ name: "ds", description: "Disconnect from server. Example: ds", ref: this, callback: this.disconnect})

    const init = async () => {
      try {
        Debug.info(await this.connect("localhost:6969"))
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

  disconnect(self: Client = this) {
    self.peerConnection.close()
    self.peerConnection = null

    self.channels.clear()

    return `Client::constructor(): Disconnected from server!`
  }

  connect(url: string, self: Client = this): Promise<string> {
    return new Promise(async (resolve, reject) => {
        if(!url) {
          reject(`Client::connect(): Invalid server url!`)
          return
        }  

        url = `http://${url}/connect`

        if(!isValidHttpUrl(url))  {
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
              self.peerConnection.setRemoteDescription(new RTCSessionDescription(JSON.parse(atob(sdp))))
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

        self.peerConnection = new RTCPeerConnection({
          iceServers: [
            {
              urls: 'stun:stun.l.google.com:19302'
            }
          ]
        })
    
        self.peerConnection.onnegotiationneeded = e => 
          self.peerConnection.createOffer().then(d => 
            self.peerConnection.setLocalDescription(d)).catch(error => 
              Debug.error(`Client::connect(): Failed getting local session description = ${error}`
            )
          )
    
        self.peerConnection.onicecandidate = async event => {
          if (event.candidate === null) {
            try {
              const localSessionDescription = btoa(JSON.stringify(self.peerConnection.localDescription))
              await handleConnection(localSessionDescription)
            } catch (error) {
              reject(error)
              return
            }
          }
        }
    
        self.peerConnection.onconnectionstatechange = async event => {
          const connectionState = self.peerConnection.connectionState
    
          switch (connectionState) {
            case "connected": {
              Debug.info('Client::constructor(): Connected to server.')
              break;
            }
            case "connecting": {
              break;
            }
            default: {
              self.disconnect()
              break;
            }
          }
        }

        // onicecandidate is not called before a channel is added
        self.addChannel("default")
    })
  }
}