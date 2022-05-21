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
  dataChannel: RTCDataChannel
  sessionDescription: string

  constructor() {
    this.peerConnection = new RTCPeerConnection({
      iceServers: [
        {
          urls: 'stun:stun.l.google.com:19302'
        }
      ]
    })

    this.dataChannel = this.peerConnection.createDataChannel('default')

    this.dataChannel.onopen = () => {
      Debug.console.registerCommand({ name: "st", description: "Send text to clients. Example: st 'text'", ref: this, callback: this.sendText, arg: true})

      try {
        const data = JSON.stringify({
          type: "TEXT",
          data: `Hello from client! ${Math.floor(Math.random() * 1000)}`
        })

        this.dataChannel.send(data)
      } catch (error) {
        Debug.info(`Client::connect(): Failed sending message = ${error}`)
      }
    }
    this.dataChannel.onclose = () => Debug.info('Client(): Disconnected.')

    this.dataChannel.onmessage = e => {this.handleMessage(e.data)}
    
    this.peerConnection.onnegotiationneeded = e => 
      this.peerConnection.createOffer().then(d => 
        this.peerConnection.setLocalDescription(d)).catch(error => 
          Debug.error(`Client::constructor(): Failed setting session description = ${error}`
        )
      )

    this.peerConnection.onconnectionstatechange = event => {
      const connectionState = this.peerConnection.connectionState

      switch (connectionState) {
        case "connected": {
          Debug.info('Client::constructor(): Connected to server.')
          break;
        }
        case "connecting": {
          Debug.info('Client::constructor(): Connecting to server ...')
          break;
        }
        default: {
          Debug.warn('Client::constructor(): Disconnected from server!')
          break;
        }
      }
    }

    this.peerConnection.onicecandidate = async event => {
      if (event.candidate === null) {
        this.sessionDescription = btoa(JSON.stringify(this.peerConnection.localDescription))
        
        try {
          this.connect("http://localhost:6969/connect")
        } catch (error) {
          Debug.info(error)
        }
      }
    }
  }

  sendText(text: string, ref: Client = this) {
    if(!text) return `Client::sendText(): Failed sending text = invalid input!`

    const data = JSON.stringify({
      type: "TEXT",
      data: text
    })
    ref.dataChannel.send(data)

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

  async connect(url: string) {
    try {
      if(!url) throw new Error("Client::connect(): Invalid parameters!")

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({sdp: this.sessionDescription})
      })
  
      const body: {sdp: string} = await response.json()
      const { sdp } = body

      try {
        this.peerConnection.setRemoteDescription(new RTCSessionDescription(JSON.parse(atob(sdp))))
      } catch (error) {
        throw new Error(`Client::connect(): Failed to set remote session description  = ${error}`)
      }
    } catch (error) {
      throw new Error(`Client::connect(): Failed connecting = ${error}`)
    }
  }
}