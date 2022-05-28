import Debug from "../internal/debug";
const short = require('short-uuid');
import Entity from "../scene/entity";
import { getLocalClientTransform } from "./gameNetworkController";

type ChannelType = "TEXT" | "GAME" | "GLOBAL"
 
type PackageType = "PING" | "TEXT" | "CONNECT" | "DISCONNECT" | "DELTA_STATE" | "TRANSFORM"

type PingPackage = {
  type: "PING"
  data: number
}

type TextPackage = {
  type: "TEXT"
  data: {
    message: string
    clientId: string
  }
}

export type GameConnectPackage = {
    type: "CONNECT",
    data: GameTransformPackageData
}

export type GameDisconnectPackage = {
  type: "DISCONNECT",
  data: { 
    clientId: string 
  }
}

type GameTransformPackageData = {
    clientId: string,
    position: Array<number>,
    rotation: number
}

export type GameTransformPackage = {
  type: "TRANSFORM",
  data: GameTransformPackageData
}

export type GameDeltaStatePackage = {
	type: "DELTA_STATE",
	data: Array<GameTransformPackage>
}

export type ConnectResposeBody = {
  sdp: string, 
  timeMs: number, 
  tickIntervalMs: number
}

type ClientSettings = {
  clientId: string,
  timeMs: number,
  tickIntervalMs: number
}

export type GlobalConnectPackage = {
  type: "CONNECT",
  data: {
    timeMs: ClientSettings["timeMs"],
    tickIntervalMs: ClientSettings["tickIntervalMs"]
  }
}

type GlobalPackage = GlobalConnectPackage | PingPackage
type GamePackage = GameConnectPackage | GameDisconnectPackage | GameDeltaStatePackage | GameTransformPackage
type NetworkPackage = TextPackage | GamePackage | GlobalPackage

type ListenerCallback = (data: NetworkPackage["data"]) => void

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
  settings: ClientSettings

  peerConnection: RTCPeerConnection

  channels: Map<string, RTCDataChannel> // ToDo Make callbacks asyncs
  listeners: Map<ChannelType, Map<PackageType, Set<ListenerCallback>>>

  constructor(clientEntity: Entity) {
    this.settings = {
      clientId: short.generate(),
      timeMs: -1,
      tickIntervalMs: -1,
    }

    this.channels = new Map<ChannelType, RTCDataChannel>()
    this.listeners = new Map<ChannelType, Map<PackageType, Set<ListenerCallback>>>()

    Debug.console.registerCommand({ name: "st", description: "Send text message to all remote clients. Example: st 'text'", callback: this.sendTextMessage, arg: true})
    Debug.console.registerCommand({ name: "cc", description: "Connect to server. Example: cc 'url'", callback: this.connect, arg: true})
    Debug.console.registerCommand({ name: "dc", description: "Disconnect from server. Example: ds", callback: this.disconnect})

    this.subscribe("GAME", "PING", (data: PingPackage["data"]) => {
      const ping: number = Math.ceil(Date.now() - data)
      Debug.update({client: {ping}})
    })
    this.subscribe("TEXT", "TEXT", (data: TextPackage["data"]) => {
      Debug.info(`Client::callback(): Received text = '${data.message}' from '${data.clientId}'.`)
    })
    this.subscribe("GAME", "DISCONNECT", (data: GameDisconnectPackage["data"]) => {
      Debug.warn(`Client::callback(): Remote client = '${data.clientId}' disconnected!`)
    })

    const init = async () => {
      try {
        const transform = getLocalClientTransform(clientEntity)

        Debug.info(await this.connect("localhost:6969", transform.currentPosition, transform.currentRotation))
      } catch (error) {
        Debug.error(error)
      }
    }

    init()
  }

  // ToDo: Test this!
  subscribe(channelType: ChannelType, packageType: PackageType, callback: ListenerCallback) {
    if(!this.listeners.has(channelType))
      this.listeners.set(channelType, new Map<PackageType, Set<ListenerCallback>>())

    const channelListeners = this.listeners.get(channelType)

    if(!channelListeners.has(packageType))
      channelListeners.set(packageType, new Set<ListenerCallback>())

    const packageTypeCallbacks = channelListeners.get(packageType)  

    if(!packageTypeCallbacks.has(callback))  
      packageTypeCallbacks.add(callback)
    else
      Debug.warn(`Client::subscribe(): Failed subscription because callback is already registered for channel type = ${channelType} and packageType = ${packageType}`)  
  }

  // ToDo: Test this!
  unsubscribe(callback: ListenerCallback) {
    for(const [channelType, channelListeners] of this.listeners) {
      for(const [packageType, callbacks] of channelListeners) {
        if(!callbacks.has(callback)) continue
  
        callbacks.delete(callback)
      }
    }
  }

  sendTextMessage = (message: string) => {
    if(this.peerConnection?.connectionState !== "connected") return `Client::sendText(): Failed sending text = client not connected!`
    if(!message) return `Client::sendText(): Failed sending text = invalid arguments!`

    const data = JSON.stringify({
      type: "TEXT",
      data: {
        message,
        clientId: this.settings.clientId
      }
    })

    this.channels.get("TEXT").send(data)

    return `Client::sendText(): Send text message = '${message}'.`
  }

  sendPackage(channelType: ChannelType, networkPackage: NetworkPackage) {
    const data = JSON.stringify(networkPackage)

    this.channels.get(channelType).send(data)
    // Debug.info(`Client::sendPackage(): Send text package = '${data}' to channel = '${channelType}'.`)
  }
 
  // ToDo: Wrap this into promise? => callback can be async
  // Do we need so much error handling here => performance!?
  async dispatchMessage(channelType: ChannelType, networkPackage: NetworkPackage) {
    if(!this.listeners.has(channelType)) {
      Debug.warn(`Client::dispatchMessage(): No listeners for channel = ${channelType} found!`)
      return null
    } 

    const { type, data } = networkPackage

    const packageTypeCallbacks = this.listeners.get(channelType)
    if(!packageTypeCallbacks.has(type)) {
      //Debug.warn(`Client::dispatchMessage(): No callbacks for network package type = ${type} found!`)
      return null
    } 

    const callbacks = packageTypeCallbacks.get(type)
    if(!callbacks.size) {
      //Debug.warn(`Client::dispatchMessage(): No callbacks for network package type = ${type} found!`)
      return null
    } 

    for (const callback of callbacks) {
      try {
        callback(data)
      } catch (error) {
        Debug.error(`Client::dispatchMessage(): Failed dispatching message = ${error}`)
        return null
      }
    }

    return true
  }

  handleMessage(channelType: ChannelType, raw: string): boolean | null {
    const networkPackage = JSON.parse(raw) as NetworkPackage
    const {type, data} = networkPackage

    // ToDo: Check type and payload with typeguards?
    if(!type || !data) {
      Debug.error(`Client::handleMessage(): Received invalid network package!`)
      // ToDo: Close connection here?
      return null
    }

    this.dispatchMessage(channelType, networkPackage)
    return true
  }

  addChannel(channelType: ChannelType, reliable: boolean = true) {
    const channelOptions: RTCDataChannelInit = {
      ordered: reliable,
    }

    // https://stackoverflow.com/questions/54292824/webrtc-channel-reliability
    if(!reliable) channelOptions.maxRetransmits = 0

    const channel = this.peerConnection.createDataChannel(channelType, channelOptions)
    this.channels.set(channelType, channel)

    channel.onopen = () => {
      this.handleChannelOpen(channelType)
    }
    channel.onclose = () => {
      this.handleChannelClose(channelType)
    }
    channel.onmessage = e => {
      this.handleMessage(channelType, e.data)
    }
  }

  handleChannelOpen(channelType: ChannelType) { 
    //Debug.info(`Client::handleChannelOpen(): Channel ${channelType} opened.`)

    let data: NetworkPackage = null

    switch (channelType) {
      case "TEXT": {
        data = {
          type: "TEXT",
          data: { 
            message: `Hello :)`,
            clientId: this.settings.clientId
          }
        }
        break
      }
      case "GAME": {
        return
      }
      default: {
        Debug.error(`Client::handleChannelOpen(): Invalid channel = ${channelType}!`)
        return
      }
    }

    if(this.channels?.has(channelType)) this.channels.get(channelType).send(JSON.stringify(data))
    else Debug.error(`Client::handleChannelOpen(): Failed sending package to channel = ${channelType}.`)
  }

  handleChannelClose(channelType: ChannelType) {
    Debug.warn(`Client::handleChannelClose(): Channel ${channelType} closed!`)
    this.channels.delete(channelType)
  }

  disconnect = () => {
    if(this.peerConnection?.connectionState !== "connected") return `Client::disconnect(): Client is not connected!`

    this.peerConnection.close()
    this.peerConnection = null

    this.channels.clear()

    return `Client::disconnect(): Disconnected from server!`
  }

  connect = (url: string, position: Array<number> = [0.0, -1000.0, 0.0], rotation: number = Math.PI): Promise<string> => {
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

            const connectInfo: GameTransformPackageData & {sdp: string} = {
              sdp: localSessionDescription,
              clientId: this.settings.clientId,
              position,
              rotation
            }

            const response = await fetch(url, {
              method: 'POST',
              headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(connectInfo)
            })
        
            const body: ConnectResposeBody = await response.json()
            const { sdp, timeMs, tickIntervalMs } = body

            this.settings.timeMs = timeMs
            this.settings.tickIntervalMs = tickIntervalMs
    
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
            reject(`Client::connect(): Server ${url} is not reachable!`)
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
              Debug.info('Client::connect(): Connected to server.')
              const globalConnectPackage = {type: "CONNECT", data: { timeMs: this.settings.timeMs, tickIntervalMs: this.settings.tickIntervalMs }} as GlobalConnectPackage
              this.dispatchMessage("GLOBAL", globalConnectPackage)
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
        this.addChannel("TEXT")
        this.addChannel("GAME", false)
    })
  }
}