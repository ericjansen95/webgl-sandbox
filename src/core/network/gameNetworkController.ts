import { vec3 } from "gl-matrix";
import vec3ToRoundedArray from "../../util/math/vector";
import Geometry from "../components/geometry/geometry";
import Material from "../components/material";
import LambertMaterial from "../components/materials/lambertMaterial";
import Transform from "../components/transform";
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

    const onRemoteClientConnect = (data: GameConnectPackage["data"]) => {
      console.log(this)
      const {clientId} = data
  
      // ToDo: Decide when to spawn client => after first transform package received?
      // can this be part of the inital connect package?
  
      const INITIAL_POSITION: Array<number> = [0.0, -1000.0, 0.0]
  
      const lambertMaterial: Material = new LambertMaterial([Math.random(), Math.random(), Math.random()]) as Material
      const entity: Entity = new Entity()
      const humanGeometry = new Geometry()
      humanGeometry.loadFromObj(humanObj)
      entity.addComponent(humanGeometry)
      entity.addComponent(lambertMaterial)
      sceneRoot.getComponent("Transform").addChild(entity)

      const remoteClient: RemoteClient = {
        clientId,
        entity,
        transform: {
          currentPosition: INITIAL_POSITION,
          targetPosition: INITIAL_POSITION,
  
          currentRotation: 0,
          targetRotation: 0
        }
      }
  
      this.remoteClients.set(clientId, remoteClient)
    }
    const onRemoteClientDisconnect = (data: GameDisconnectPackage["data"]) => {
      const {clientId} = data
  
      const {entity} = this.remoteClients.get(clientId);
      (this.sceneRoot.getComponent("Transform") as Transform).removeChild(entity)

      this.remoteClients.delete(clientId)
    }
    const onRemoteClientTransformUpdate = (data: GameTransformPackage["data"]) => {
      const {clientId, position, rotation} = data
  
      const {transform, entity} = this.remoteClients.get(clientId)
  
      transform.targetPosition = position
      transform.targetRotation = rotation;

      (entity.getComponent("Transform") as Transform).setPosition(vec3.fromValues(transform.targetPosition[0], transform.targetPosition[1], transform.targetPosition[2]))
    } 
    const onLocalClientTransformUpdate = (position: Array<number>) => {
      const networkPackage: GameTransformPackage = {
        type: "TRANSFORM",
        data: {
          clientId: this.localClient.clientId,
          position,
          rotation: 0
        }
      }
  
      this.localClient.sendPackage("GAME", networkPackage)
    }

    this.localClient.subscribe("GAME", "CONNECT", onRemoteClientConnect)
    this.localClient.subscribe("GAME", "DISCONNECT", onRemoteClientDisconnect)
    this.localClient.subscribe("GAME", "TRANSFORM", onRemoteClientTransformUpdate)

    // TMP test => send 4 times a second local camera position to remote clients^
    // add only send data when transform diry / changed
    setInterval(() => {
      const position = camera.getComponent("Transform").getPosition()
      onLocalClientTransformUpdate(vec3ToRoundedArray(position))
    }, 250)
  }
}