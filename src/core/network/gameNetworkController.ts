import { vec3 } from "gl-matrix";
import clamp from "../../util/math/clamp";
import vec3ToRoundedArray, { roundNumber } from "../../util/math/vector";
import FlyControls from "../components/controls/flyControls";
import Geometry from "../components/geometry/geometry";
import Material from "../components/material";
import LambertMaterial from "../components/materials/lambertMaterial";
import Transform from "../components/transform";
import Debug from "../internal/debug";
import Time from "../internal/time";
import Entity from "../scene/entity";
import Client, { GameConnectPackage, GameDisconnectPackage, GameTransformPackage } from "./client";

const humanObj: string = require('/public/res/geo/human.txt') as string

type ClientTransform = {
  currentPosition: Array<number>,
  targetPosition: Array<number>

  currentRotation: number,
  targetRotation: number
}

type ClientCache = {
  clientId: string,
  transform: ClientTransform,
  entity: Entity
}

const getLocalClientTransform = (entity: Entity): ClientTransform => {
  const transform = entity.getComponent("Transform") as Transform
  const controls = entity.getComponent("FlyControls") as FlyControls

  const position = vec3ToRoundedArray(transform.getPosition())
  const rotation = roundNumber(controls.angleRotation[0])

  return {
    currentPosition: position,
    targetPosition: position,
  
    currentRotation: rotation,
    targetRotation: rotation 
  }
}

const createLocalClient = (clientId: string, entity: Entity) : ClientCache => {
  return {
    clientId,
    entity,
    transform: getLocalClientTransform(entity)
  }
}

const equalPosition = (a: Array<number>, b: Array<number>) => {
  for (var i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]) return false;
  }
  return true
}

export default class GameNetworkController {
  client: Client

  localClient: ClientCache
  remoteClients: Map<string, ClientCache>

  sceneRoot: Entity

  constructor(client: Client, sceneRoot: Entity, entity: Entity) {
    this.client = client
    this.localClient = createLocalClient(client.clientId, entity)
    this.sceneRoot = sceneRoot
    this.remoteClients = new Map<string, ClientCache>()

    this.client.subscribe("GAME", "CONNECT", this.onRemoteClientConnect)
    this.client.subscribe("GAME", "DISCONNECT", this.onRemoteClientDisconnect)
    this.client.subscribe("GAME", "TRANSFORM", this.onRemoteClientTransformUpdate)

    // TMP test => send 4 times a second local camera position to remote clients
    setInterval(() => {
      // get current transform
      const currentTransform = getLocalClientTransform(this.localClient.entity)

      // update transform cache
      const { transform } = this.localClient
      transform.currentPosition = currentTransform.currentPosition
      transform.currentRotation = currentTransform.currentRotation

      // send transform package and update cache if position or rotation changed
      if(transform.targetRotation === transform.currentRotation && equalPosition(transform.targetPosition, transform.currentPosition)) return
            
      transform.targetPosition = transform.currentPosition
      transform.targetRotation = transform.currentRotation

      this.onLocalClientTransformUpdate(transform)
    }, 1000 / 4)
  }

  update = () => {
    const deltaTime = Time.deltaTime
    const INTERPOLATION_SPEED = 8 / 4

    for(const client of this.remoteClients.values()) {
      const {transform, entity} = client

      const targetPosition = vec3.fromValues(transform.targetPosition[0], transform.targetPosition[1], transform.targetPosition[2])
      const currentPosition = vec3.lerp(vec3.create(), 
                                        vec3.fromValues(transform.currentPosition[0], transform.currentPosition[1], transform.currentPosition[2]), 
                                        targetPosition, 
                                        INTERPOLATION_SPEED * deltaTime)
      transform.currentPosition = vec3ToRoundedArray(currentPosition)

      const targetRotation = transform.targetRotation
      const currentRotation = clamp(transform.currentRotation + (targetRotation - transform.currentRotation) * INTERPOLATION_SPEED * deltaTime, 0.0, Math.PI * 2.0);
      transform.currentRotation = currentRotation
  
      const transformComponent = entity.getComponent("Transform") as Transform
      transformComponent.setPosition(currentPosition)
      transformComponent.setRotation(vec3.fromValues(0.0, transform.currentRotation, 0.0));
    }
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

    const remoteClient: ClientCache = {
      clientId,
      entity,
      transform: {
        currentPosition: position,
        targetPosition: position,

        currentRotation: rotation,
        targetRotation: rotation
      }
    }

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

    const {transform} = this.remoteClients.get(clientId)

    transform.targetPosition = position
    transform.targetRotation = rotation
  } 
  onLocalClientTransformUpdate = (transform: ClientTransform) => {
    const networkPackage: GameTransformPackage = {
      type: "TRANSFORM",
      data: {
        clientId: this.localClient.clientId,
        position: transform.targetPosition,
        rotation: transform.targetRotation
      }
    }

    this.client.sendPackage("GAME", networkPackage)
  }
}