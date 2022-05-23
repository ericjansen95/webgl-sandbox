import { vec3 } from "gl-matrix";
import vec3ToRoundedArray, { roundNumber } from "../../util/math/vector";
import FlyControls from "../components/controls/flyControls";
import Geometry from "../components/geometry/geometry";
import Material from "../components/material";
import LambertMaterial from "../components/materials/lambertMaterial";
import Transform from "../components/transform";
import Debug from "../internal/debug";
import Entity from "../scene/entity";
import Client, { GameConnectPackage, GameDisconnectPackage, GameTransformPackage } from "./client";

const humanObj: string = require('/public/res/geo/human.txt') as string

type RemoteClientTransform = {
  currentPosition: Array<number>,
  targetPosition: Array<number>

  currentRotation: number,
  targetRotation: number
}

type RemoteClient = {
  clientId: string,
  transform: RemoteClientTransform,
  entity: Entity
}

export default class GameNetworkController {
  localClient: Client
  remoteClients: Map<string, RemoteClient>

  sceneRoot: Entity

  constructor(client: Client, sceneRoot: Entity, camera: Entity) {
    this.localClient = client
    this.sceneRoot = sceneRoot
    this.remoteClients = new Map<string, RemoteClient>()

    this.localClient.subscribe("GAME", "CONNECT", this.onRemoteClientConnect)
    this.localClient.subscribe("GAME", "DISCONNECT", this.onRemoteClientDisconnect)
    this.localClient.subscribe("GAME", "TRANSFORM", this.onRemoteClientTransformUpdate)

    // TMP test => send 4 times a second local camera position to remote clients^
    // add only send data when transform diry / changed
    setInterval(() => {
      const transform = camera.getComponent("Transform") as Transform
      const controls = camera.getComponent("FlyControls") as FlyControls

      const position = vec3ToRoundedArray(transform.getPosition())
      position[1] -= 1.3

      const rotation = roundNumber(controls.angleRotation[0] + Math.PI)

      this.onLocalClientTransformUpdate(position, rotation)
    }, 167)
  }

  onRemoteClientConnect = (data: GameConnectPackage["data"]) => {
    const {clientId, position, rotation} = data

    // ToDo: Decide when to spawn client => after first transform package received?
    // can this be part of the inital connect package?

    const lambertMaterial: Material = new LambertMaterial([Math.random(), Math.random(), Math.random()]) as Material
    const entity: Entity = new Entity()
    const transform = entity.getComponent("Transform") as Transform
    transform.setPosition(vec3.fromValues(position[0], position[1], position[2]))
    transform.setRotation(vec3.fromValues(0.0, rotation, 0.0))

    const humanGeometry = new Geometry()
    humanGeometry.loadFromObj(humanObj)
    
    entity.addComponent(humanGeometry)
    entity.addComponent(lambertMaterial)

    this.sceneRoot.getComponent("Transform").addChild(entity)

    const remoteClient: RemoteClient = {
      clientId,
      entity,
      transform: {
        currentPosition: position,
        targetPosition: position,

        currentRotation: rotation,
        targetRotation: rotation
      }
    }

    console.log(JSON.parse(JSON.stringify(remoteClient)))

    this.remoteClients.set(clientId, remoteClient)

    Debug.info(`gameNetworkService::onRemoteClientConnect(): Remote client = '${data.clientId}' connected.`)
  }
  onRemoteClientDisconnect = (data: GameDisconnectPackage["data"]) => {
    const {clientId} = data

    const {entity} = this.remoteClients.get(clientId);
    (this.sceneRoot.getComponent("Transform") as Transform).removeChild(entity)

    this.remoteClients.delete(clientId)
    
    Debug.warn(`gameNetworkService::onRemoteClientDisconnect(): Remote client = '${data.clientId}' disconnected!`)
  }
  onRemoteClientTransformUpdate = (data: GameTransformPackage["data"]) => {
    const {clientId, position, rotation} = data

    // ToDo: Check error handling => this should not happen?
    if(!this.remoteClients.has(clientId)) {
      Debug.error(`gameNetworkService::onRemoteClientTransformUpdate(): Received tranform update for client = '${data.clientId}' who does not exists!`)
      return
    }

    const {transform, entity} = this.remoteClients.get(clientId)

    transform.targetPosition = position
    transform.targetRotation = rotation;

    const transformComponent = entity.getComponent("Transform") as Transform
    transformComponent.setPosition(vec3.fromValues(transform.targetPosition[0], transform.targetPosition[1], transform.targetPosition[2]))
    transformComponent.setRotation(vec3.fromValues(0.0, transform.targetRotation, 0.0));
  } 
  onLocalClientTransformUpdate = (position: Array<number>, rotation: number) => {
    const networkPackage: GameTransformPackage = {
      type: "TRANSFORM",
      data: {
        clientId: this.localClient.clientId,
        position,
        rotation
      }
    }

    this.localClient.sendPackage("GAME", networkPackage)
  }
}