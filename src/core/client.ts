import Debug from "./debug";
import { v4 as uuidv4 } from 'uuid';

type ChannelType = "TEXT" | "GAME"

type PingPackage = {
  type: "PING"
  data: string
}

type TextPackage = {
  type: "TEXT"
  data: {
    message: string
    clientId: string
  }
}

type GameConnectPackage = {
    type: "CONNECT",
    data: { 
      clientId: string 
    }
}

type GameDisconnectPackage = {
  type: "DISCONNECT",
  data: { 
    clientId: string 
  }
}

type GamePackage = GameConnectPackage | GameDisconnectPackage
type NetworkPackage = PingPackage | TextPackage | GamePackage

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
  clientId: string
  peerConnection: RTCPeerConnection
  channels: Map<string, RTCDataChannel>

  constructor() {
    this.clientId = uuidv4()
    this.channels = new Map<string, RTCDataChannel>()

    Debug.console.registerCommand({ name: "st", description: "Send text to clients. Example: st 'text'", ref: this, callback: this.sendText, arg: true})
    Debug.console.registerCommand({ name: "cc", description: "Connect to server. Example: cs 'url'", ref: this, callback: this.connect, arg: true})
    Debug.console.registerCommand({ name: "dc", description: "Disconnect from server. Example: ds", ref: this, callback: this.disconnect})

    const init = async () => {
      try {
        Debug.info(await this.connect("localhost:6969"))
      } catch (error) {
        Debug.error(error)
      }
    }

    init()
  }

  sendText(message: string, ref: Client = this) {
    if(ref.peerConnection?.connectionState !== "connected") return `Client::sendText(): Failed sending text = client not connected!`
    if(!message) return `Client::sendText(): Failed sending text = invalid arguments!`

    const data = JSON.stringify({
      type: "TEXT",
      data: {
        message,
        clientId: ref.clientId
      }
    })

    ref.channels.get("TEXT").send(data)

    return `Client::sendText(): Send text message = '${message}'`
  }

  handleMessage(raw: string): boolean | null {
    const {type, data} = JSON.parse(raw) as any

    if(!type || !data) return null

    switch (type) {
      case "PING": {
        // can this be negativ based on system time differences?
        const ping: number = Math.max(0, Math.ceil(Date.now() - parseInt(data, 10)))
        Debug.update({client: {ping}})
        return true
      }
      case "TEXT": {
        Debug.info(`Client::handleMessage(): Received text = '${data.message}' from '${data.clientId}'.`)
        return true
      }
      case "CONNECT": {
        Debug.info(`Client::handleMessage(): Remote client with id = '${data.clientId}' connected.`)
        return true
      }
      case "DISCONNECT": {
        Debug.warn(`Client::handleMessage(): Remote client with id = ${data.clientId} disconnected!`)
        return true
      }
      default: {
        Debug.info(`Client::handleMessage(): Invalid message type = ${type}!`)
        return null
      }
    }
  }

  addChannel(channelType: ChannelType) {
    const channel = this.peerConnection.createDataChannel(channelType)
    this.channels.set(channelType, channel)

    channel.onopen = () => {
      this.handleChannelOpen(channelType)
    }
    channel.onclose = () => {
      this.handleChannelClose(channelType)
    }
    channel.onmessage = e => {
      this.handleMessage(e.data)
    }
  }

  handleChannelOpen(channelType: ChannelType) { 
    Debug.info(`Client::handleChannelOpen(): Channel ${channelType} opened.`)

    let data: NetworkPackage = null

    switch (channelType) {
      case "TEXT": {
        data = {
          type: "TEXT",
          data: { 
            message: `Hello :)`,
            clientId: this.clientId
          }
        }
        break
      }
      case "GAME": {
        return
      }
      default: {
        Debug.error(`Client::handleChannelOpen(): Invalid channel = ${channelType}`)
        return
      }
    }

    if(this.channels?.has(channelType)) this.channels.get(channelType).send(JSON.stringify(data))
    else Debug.error(`Client::handleChannelOpen(): Failed sending package to channel = ${channelType}`)
  }

  handleChannelClose(channelType: ChannelType) {
    Debug.warn(`Client::handleChannelClose(): Channel ${channelType} closed!`)
    this.channels.delete(channelType)
  }

  disconnect(self: Client = this) {
    if(self.peerConnection?.connectionState !== "connected") return `Client::disconnect(): Client is not connected.`

    self.peerConnection.close()
    self.peerConnection = null

    self.channels.clear()

    return `Client::disconnect(): Disconnected from server!`
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
              body: JSON.stringify({
                sdp: localSessionDescription,
                clientId: this.clientId
              })
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
            reject(`Client::connect(): Server ${url} is not available!`)
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
              Debug.info('Client::connect(): Connected to server.')
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
        self.addChannel("TEXT")
        self.addChannel("GAME")
    })
  }
}