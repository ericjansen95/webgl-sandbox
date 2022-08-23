import { ftruncate } from "fs";
import { format } from "path";
import { dispatch, subscribe } from "../../util/helper/event";
import { isValidHttpUrl } from "../../util/helper/url";
import { extractPackageType, parseSharedReceivePingPackage } from "../../util/network/package";
import Debug from "../internal/debug";
import { SceneReceivePackageType } from "./sceneNetworkController";

export type SendPackageBase = {
  type: number,
  [key: string]: number | Array<number>
}

// shared, scene, text, voice, video, user, game => ~ 36
// 25, 50, 25, 25, 25, 25, 50 => 225 => 20 as backup

enum SharedReceivePackageType {
  PING = 200
}

export const ReceivePackageType = { Shared: SharedReceivePackageType, Scene: SceneReceivePackageType }
export type ReceivePackageType = typeof ReceivePackageType

export type SharedPingReceivePackage = {
  type: ReceivePackageType['Shared']
  timeMs: number
}

export type ConnectResposeBody = {
  sdp: string
}

export type ConnectRequestBody = {
  sdp: string
  userId: number
  token: string
}

export type ChannelLabel = string

export default class WebRTCClient {
  connection: RTCPeerConnection
  channels: Map<ChannelLabel, RTCDataChannel> // ToDo Make callbacks asyncs

  userId: number

  constructor() {
    this.channels = new Map<ChannelLabel, RTCDataChannel>()

    Debug.console.registerCommand({ name: "sc", description: "Connect to server. Example: cc 'url'", callback: this.connect, arg: true})
    Debug.console.registerCommand({ name: "sd", description: "Disconnect from server. Example: ds", callback: this.disconnect})

    subscribe('pce:scene.rawpackagesend', (rawPackage: ArrayBuffer) => this.handleRawPackageSend('SCENE', rawPackage))

    this.userId = Math.round(Math.random() * 1000)

    const init = async () => {
      try {
        Debug.info(await this.connect("localhost:6969"))
      } catch (error) {
        Debug.error(error)
      }
    }

    init()
  }

  handleRawPackageSend(channelLabel: ChannelLabel, rawSendPackage: ArrayBuffer): boolean | null {
    if(!rawSendPackage?.byteLength || !this.channels.has(channelLabel)) return null

    this.channels.get(channelLabel).send(rawSendPackage)

    return true
  }

  handleRawPackageReceive(channelLabel: ChannelLabel, rawReceivePackage: ArrayBuffer): boolean | null {
    if(!rawReceivePackage?.byteLength) return null

    const packageType = extractPackageType(rawReceivePackage)
    if(packageType === null) return null


    switch(packageType) {
      case ReceivePackageType.Shared.PING as any: {

        const pingPackage = parseSharedReceivePingPackage(rawReceivePackage)
        if(!pingPackage) return null
    
        const ping = Math.round(Date.now() - pingPackage.timeMs)
        Debug.updateStats({client: {ping}})

        return true
      }
      default: {
        // forward package to event bus and let network controllers handle content
        dispatch('pce:client.rawpackagereceive', rawReceivePackage)

        return true
      }
    }
  }

  addChannel(channelLabel: ChannelLabel, reliable: boolean = true) {
    const channelOptions = {
      ordered: reliable,
    } as RTCDataChannelInit

    // https://stackoverflow.com/questions/54292824/webrtc-channel-reliability
    if(!channelOptions.ordered) channelOptions.maxRetransmits = 0

    const channel = this.connection.createDataChannel(channelLabel, channelOptions)
    this.handleChannelAdd(channel)
  }

  handleChannelAdd(channel: RTCDataChannel) {
    const channelLabel = channel.label as ChannelLabel
    this.channels.set(channelLabel, channel)

    channel.onopen = () => this.handleChannelOpen(channelLabel)
    channel.onclose = () => this.handleChannelClose(channelLabel)
    channel.onmessage = ({data}) => this.handleRawPackageReceive(channelLabel, data)
  }

  handleChannelOpen(channelLabel: ChannelLabel) { 
    //Debug.info(`Client::handleChannelOpen(): Opened channel with label = ${channelLabel}`)
  }

  handleChannelClose(channelLabel: ChannelLabel) {
    //Debug.warn(`Client::handleChannelClose(): Closed channel with label = ${channelLabel}`)

    this.channels.delete(channelLabel)
  }

  disconnect = () => {
    if(this.connection?.connectionState !== "connected") return `Client::disconnect(): Client is not connected!`

    this.connection.close()
    this.connection = null

    this.channels.clear()

    return `Client::disconnect(): Disconnected from server!`
  }

  connect = (url: string): Promise<string> => {
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
            const connectRequestBody = {
              sdp: localSessionDescription,
              userId: this.userId,
              token: ''
            } as ConnectRequestBody

            const response = await fetch(url, {
              method: 'POST',
              headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(connectRequestBody)
            })
        
            const { sdp: remoteSessionDescription } = await response.json() as ConnectResposeBody
    
            if(!remoteSessionDescription) {
              reject(`Client::connect(): Failed connecting to server ${url} = invalid remote session description!`)
              return
            }  
    
            try {
              this.connection.setRemoteDescription(new RTCSessionDescription(JSON.parse(atob(remoteSessionDescription))))
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

        this.connection = new RTCPeerConnection({
          iceServers: [
            {
              urls: 'stun:stun.l.google.com:19302'
            }
          ]
        })
    
        this.connection.onnegotiationneeded = e => 
          this.connection.createOffer().then(d => 
            this.connection.setLocalDescription(d)).catch(error => 
              Debug.error(`Client::connect(): Failed getting local session description = ${error}`
            )
          )
    
        this.connection.onicecandidate = async event => {
          if (event.candidate === null) {
            try {
              // ToDo Switch out depricated functions
              const localSessionDescription = btoa(JSON.stringify(this.connection.localDescription))
              await handleConnection(localSessionDescription)
            } catch (error) {
              reject(error)
              return
            }
          }
        }

        this.connection.ondatachannel = async event => this.handleChannelAdd(event.channel)
    
        this.connection.onconnectionstatechange = async event => {
          // ToDo: Extract connection state from event?
          const connectionState = this.connection.connectionState
    
          switch (connectionState) {
            case "connected": {
              Debug.info('Client::connect(): Connected to server.')
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

        // this is necissary to trigger the sinaling and find the nat hole
        // see => onicecandidate
        this.addChannel('SHARED', true)
    })
  }
}