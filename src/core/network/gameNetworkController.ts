import { vec3 } from "gl-matrix";
import vec3ToRoundedArray from "../../util/math/vector";
import FlyControls from "../components/controls/flyControls";
import Geometry from "../components/geometry/geometry";
import Material from "../components/material/material";
import LambertMaterial from "../components/material/lambertMaterial";
import Transform from "../components/base/transform";
import Debug from "../internal/debug";
import Time from "../internal/time";
import Entity from "../scene/entity";
import Client, { GameConnectPackage, GameDeltaStatePackage, GameDisconnectPackage, GameTransformPackage, GlobalConnectPackage } from "./client";
import { ComponentEnum } from "../components/base/component";
import { roundNumber } from "../../util/math/round";

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

export const getLocalClientTransform = (entity: Entity): ClientTransform => {
  const transform = entity.get(ComponentEnum.TRANSFORM) as Transform
  const controls = entity.get(ComponentEnum.CONTROLS) as FlyControls

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
  timerId: NodeJS.Timer

  localClient: ClientCache
  remoteClients: Map<string, ClientCache>

  sceneRoot: Entity

  constructor(client: Client, sceneRoot: Entity, entity: Entity) {
    this.client = client
    this.localClient = createLocalClient(client.settings.clientId, entity)
    this.sceneRoot = sceneRoot
    this.remoteClients = new Map<string, ClientCache>()

    this.client.subscribe("GAME", "CONNECT", this.onRemoteClientConnect)
    this.client.subscribe("GAME", "DISCONNECT", this.onRemoteClientDisconnect)
    this.client.subscribe("GAME", "DELTA_STATE", this.onDeltaStateUpdate)
    this.client.subscribe("GLOBAL", "CONNECT", this.onConnect)
  }

  tick = () => {
    // ToDo Log tick time

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
  }

  onConnect = (data: GlobalConnectPackage["data"]) => {
    const {timeMs, tickIntervalMs} = data

    const currentTimeMs = Date.now()
    const timeDifferenceMs = currentTimeMs - timeMs

    // TMP Come up with a solution that is validated
    // Right now we sync the local message loop to send every 0.25 * tickIntervalMs from the server tick start time
    const syncDelayMs = Math.floor(tickIntervalMs * 0.25 - timeDifferenceMs)

    setTimeout(() => {
      this.timerId = setInterval(this.tick, tickIntervalMs)
    }, syncDelayMs)
  }

  update = () => {
    const { deltaTime } = Time
    const { tickIntervalMs } = this.client.settings

    const INTERPOLATION_SPEED = 0.35 * (1000 / tickIntervalMs)

    // ToDo Log interpolation time and make this async
    for(const client of this.remoteClients.values()) {
      const {transform, entity} = client

      const targetPosition = vec3.fromValues(transform.targetPosition[0], transform.targetPosition[1], transform.targetPosition[2])
      const currentPosition = vec3.lerp(vec3.create(), 
                                        vec3.fromValues(transform.currentPosition[0], transform.currentPosition[1], transform.currentPosition[2]), 
                                        targetPosition, 
                                        INTERPOLATION_SPEED * deltaTime)
      transform.currentPosition = vec3ToRoundedArray(currentPosition)
      
      /*
      const TWO_PI = Math.PI
     
      const currentRotation = quat.fromEuler(quat.create(), 0.0, transform.currentRotation / TWO_PI, 0.0) 
      const targetRotation = vec3.create()
      quat.getAxisAngle(targetRotation, quat.slerp(quat.create(), currentRotation, quat.fromEuler(quat.create(), 0.0, transform.targetRotation / TWO_PI, 0.0), INTERPOLATION_SPEED * deltaTime))
      targetRotation[1] *= TWO_PI
      
      console.log(targetRotation)
      */

      transform.currentRotation = transform.targetRotation
  
      const transformComponent = entity.get(ComponentEnum.TRANSFORM) as Transform
      transformComponent.setPosition(currentPosition)
      transformComponent.setRotation(vec3.fromValues(0.0, transform.targetRotation, 0.0));
    }
  }

  onRemoteClientConnect = (data: GameConnectPackage["data"]) => {
    const {clientId, position, rotation} = data

    // ToDo: Decide when to spawn client => after first transform package received?
    // can this be part of the inital connect package?

    const lambertMaterial: Material = new LambertMaterial([Math.random(), Math.random(), Math.random()]) as Material
    const entity: Entity = new Entity()
    const transform = entity.get(ComponentEnum.TRANSFORM) as Transform
    transform.setPosition(vec3.fromValues(position[0], position[1], position[2]))
    transform.setRotation(vec3.fromValues(0.0, rotation, 0.0))

    const humanGeometry = new Geometry()
    
    entity.add(humanGeometry)
    entity.add(lambertMaterial)

    this.sceneRoot.get(ComponentEnum.TRANSFORM).add(entity)

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

    Debug.info(`gameNetworkService::onRemoteClientConnect(): Remote client = '${clientId}' connected.`)
  }
  onRemoteClientDisconnect = (data: GameDisconnectPackage["data"]) => {
    const {clientId} = data

    const {entity} = this.remoteClients.get(clientId);
    (this.sceneRoot.get(ComponentEnum.TRANSFORM) as Transform).removeChild(entity)

    this.remoteClients.delete(clientId)
    
    Debug.warn(`gameNetworkService::onRemoteClientDisconnect(): Remote client = '${clientId}' disconnected!`)
  }
  onDeltaStateUpdate = (data: GameDeltaStatePackage["data"]) => {
    const transformPackages = data as Array<GameTransformPackage>

    for(const transformPackage of transformPackages) {
      const {clientId, position, rotation} = transformPackage.data

      // ToDo: Check error handling => this should not happen?
      if(this.client.settings.clientId === clientId || !this.remoteClients.has(clientId)) {
        //Debug.error(`gameNetworkService::onRemoteClientTransformUpdate(): Received tranform update for client = '${clientId}' who does not exists!`)
        continue
      }

      const {transform} = this.remoteClients.get(clientId)

      transform.targetPosition = position
      transform.targetRotation = rotation
    }
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