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
import WebRTCClient, { ReceivePackageType } from "./webRTCClient";
import { ComponentType } from "../components/base/component";
import { roundNumber } from "../../util/math/round";
import loadGltf from "../../util/loader/gltfLoader";
import SkinnedLambertMaterial from "../components/material/skinnedLambert";
import { dispatch, subscribe } from "../../util/helper/event";
import { equalPosition } from "../../util/math/compare";
import { extractPackageType, parseSceneReceiveDeltaStatePackage, parseSceneReceiveServerConfigPackage, parseSceneSendTransformPackage, parseTransformPackage } from "../../util/network/package";

// ToDo: Create SendPackageType wrapper
export enum SceneSendPackageType {
  TRANSFORM = 0
}

export type SceneSendPackageBase = {
  type: SceneSendPackageType
}

export type SceneSendTransformPackage = SceneSendPackageBase & {
  position: Array<number>,
  rotation: number
}

export enum SceneReceivePackageType {
  SERVER_CONFIG = 0,
  DELTA_STATE
}

export type SceneReceivePackageBase = {
  type: ReceivePackageType['Scene']
}

export type SceneUserTransformPackageBody = {
    userId: SceneUser['userId'],
    position: Array<number>,
    rotation: number
}

export type SceneReceiveDeltaStatePackage = SceneReceivePackageBase & {
  userTransforms: Array<SceneUserTransformPackageBody>
}

export type SceneUserTransformCache = {
  currentPosition: Array<number>,
  targetPosition: Array<number>

  currentRotation: number,
  targetRotation: number
}

enum SceneUserState {
  ACTIVE = 0,
  INACTIVE,
  OFFLINE
}

type SceneUser = {
  userId: number,

  entity: Entity,
  transform: SceneUserTransformCache,

  lastActivity: number,
  lastActivityTimeoutId: NodeJS.Timeout,

  state: SceneUserState
}

// This is nice the reduce state management on service side => no connect and disconnect package / inital user state
// but it comes with a few downsides
// user can still be inactive and marked as offline after timeout
// disconnect is not immidiate
const SCENE_USER_INACTIVE_TIMEOUT_MS = 16000
const SCENE_USER_OFFLINE_TIMEOUT_MS = 64000

export const extractTransformCache = (entity: Entity): SceneUserTransformCache => {
  const transform = entity.getComponent(ComponentType.TRANSFORM) as Transform
  //const controls = entity.get(ComponentType.CONTROLS) as FlyControls

  const position = Array.from(transform.getGlobalPosition())
  //const rotation = roundNumber(controls.angleRotation[0])

  return {
    currentPosition: position,
    targetPosition: position,
  
    currentRotation: 0,
    targetRotation: 0 
  }
}

const createSceneUser = (userId: SceneUser['userId'], entity: Entity): SceneUser => {
  return {
    userId,

    entity,
    transform: extractTransformCache(entity),

    lastActivity: Date.now(),
    lastActivityTimeoutId: null,
  
    state: SceneUserState.ACTIVE    
  }
}

export type SceneReceiveServerConfigPackage = {
  type: ReceivePackageType['Scene']
  timeMs: number,
  tickIntervalMs: number
}

export type SceneServerConfig = {
  timeMs: SceneReceiveServerConfigPackage['timeMs'],
  tickIntervalMs: SceneReceiveServerConfigPackage['tickIntervalMs']
}

export default class SceneNetworkController {
  serverConfig: SceneServerConfig | null
  localUserTransformUpdateTimerId: NodeJS.Timer

  localSceneUser: SceneUser
  remoteSceneUsers: Map<SceneUser['userId'], SceneUser>

  sceneRoot: Entity

  constructor(sceneRoot: Entity, entity: Entity, userId: number) {
    this.sceneRoot = sceneRoot
    this.serverConfig = null

    // TMP userId
    this.localSceneUser = createSceneUser(userId, entity)
    this.remoteSceneUsers = new Map()

    subscribe('pce:client.rawpackagereceive', data => this.handleRawPackageReceive(data))
  }

  updateLocalUserTransform = () => {
    // ToDo Log tick time

    // get current transform
    const currentTransform = extractTransformCache(this.localSceneUser.entity)

    // update transform cache
    const { transform } = this.localSceneUser
    transform.currentPosition = currentTransform.currentPosition
    transform.currentRotation = currentTransform.currentRotation

    // send transform package and update cache if position or rotation changed
    if(transform.targetRotation === transform.currentRotation && equalPosition(transform.targetPosition, transform.currentPosition)) return
          
    transform.targetPosition = transform.currentPosition
    transform.targetRotation = transform.currentRotation

    this.handleLocalUserTransformUpdate(transform)
  }

  update = () => {
    // ToDo: Handle connection state or set server config to null
    if(!this.serverConfig) return

    const { deltaTime } = Time
    const { tickIntervalMs } = this.serverConfig

    const INTERPOLATION_SPEED = 0.35 * (1000 / tickIntervalMs)

    // ToDo Log interpolation time and make this async
    for(const user of this.remoteSceneUsers.values()) {
      const {transform, entity} = user

      const targetPosition = vec3.fromValues(transform.targetPosition[0], transform.targetPosition[1], transform.targetPosition[2])
      const currentPosition = vec3.lerp(vec3.create(), 
                                        vec3.fromValues(transform.currentPosition[0], transform.currentPosition[1], transform.currentPosition[2]), 
                                        targetPosition, 
                                        INTERPOLATION_SPEED * deltaTime)
      transform.currentPosition = Array.from(currentPosition)
      
      /*
      const TWO_PI = Math.PI
     
      const currentRotation = quat.fromEuler(quat.create(), 0.0, transform.currentRotation / TWO_PI, 0.0) 
      const targetRotation = vec3.create()
      quat.getAxisAngle(targetRotation, quat.slerp(quat.create(), currentRotation, quat.fromEuler(quat.create(), 0.0, transform.targetRotation / TWO_PI, 0.0), INTERPOLATION_SPEED * deltaTime))
      targetRotation[1] *= TWO_PI
      */

      // ToDo: Add interpolation gate for when target != current
      // Send events pce:scene.userstarttranslate / pce:scene.userstoptranslate
      // => can be picked up by timeout system => active / inactive / offline after timeout triggered

      transform.currentRotation = transform.targetRotation
  
      const transformComponent = entity.getComponent(ComponentType.TRANSFORM) as Transform

      transformComponent.setLocalPosition(currentPosition)
      transformComponent.setLocalEulerRotation(vec3.fromValues(0.0, transform.targetRotation, 0.0))
    }
  }

  handleRawPackageReceive = (rawPackage: ArrayBuffer) => {
    if(!rawPackage?.byteLength) return

    const packageType = extractPackageType(rawPackage)
    if(packageType === null) return

    switch(packageType as any) {
      case SceneReceivePackageType.SERVER_CONFIG: {
        this.handleServerConfigUpdate(rawPackage)
        break
      }
      case SceneReceivePackageType.DELTA_STATE: {
        this.handleDeltaStateUpdate(rawPackage)
        break
      }
    }
  }

  handleServerConfigUpdate = (rawServerConfigPackage: ArrayBuffer) => {
    if(!rawServerConfigPackage?.byteLength) return

    const serverConfigPackage = parseSceneReceiveServerConfigPackage(rawServerConfigPackage)
    if(!serverConfigPackage) return

    console.log('server config package =', serverConfigPackage)

    const { timeMs, tickIntervalMs } = serverConfigPackage
    
    this.serverConfig = {
      timeMs,
      tickIntervalMs
    }

    const timeDifferenceMs = Date.now() - timeMs

    // TMP Come up with a solution that is validated
    // Right now we sync the local message loop to send every 0.25 * tickIntervalMs from the server tick start time
    const syncDelayMs = Math.floor((tickIntervalMs * 0.25) - timeDifferenceMs)

    setTimeout(() => {
      this.localUserTransformUpdateTimerId = setInterval(this.updateLocalUserTransform, tickIntervalMs)
    }, syncDelayMs)
  }

  handleRemoteUserConnect = (transformPackageBody: SceneUserTransformPackageBody) => {
    const {userId, position, rotation} = transformPackageBody

    // ToDo: Load this sync from cache?
    loadGltf("http://localhost:8080/res/geo/character.gltf").then((entities) => {
      const entity = entities[0]

      entity.add(new SkinnedLambertMaterial([0.48, 0.74, 0.56]))
      this.sceneRoot.getComponent(ComponentType.TRANSFORM).addChild(entity)

      const sceneUser = {
        userId,

        entity,
        transform: {
          currentPosition: position,
          targetPosition: position,
  
          currentRotation: rotation,
          targetRotation: rotation
        },

        lastActivity: Date.now(),
        lastActivityTimeoutId: null,

        state: SceneUserState.ACTIVE
      } as SceneUser
  
      this.remoteSceneUsers.set(userId, sceneUser)
    }).catch((error) => Debug.error(`gameNetworkController::onRemoteClientConnect(): Failed loading character entity = ${error}`))

    Debug.info(`gameNetworkService::onRemoteClientConnect(): Remote scene user = '${userId}' connected.`)
  }

  handleRemoteUserDisconnect = (userId: SceneUser['userId']) => {
    const { entity } = this.remoteSceneUsers.get(userId)
    this.sceneRoot.getComponent(ComponentType.TRANSFORM).removeChild(entity)

    this.remoteSceneUsers.delete(userId)
    
    Debug.warn(`gameNetworkService::handleRemoteUserDisconnect(): Disconnected user = ${userId}`)
  }

  handleDeltaStateUpdate = (rawDeltaStatePackage: ArrayBuffer) => {
    const deltaStatePackage = parseSceneReceiveDeltaStatePackage(rawDeltaStatePackage)
    if(!deltaStatePackage) return

    const now = Date.now()

    for(const userTransform of deltaStatePackage.userTransforms) {
      const { userId, position, rotation } = userTransform

      if(this.localSceneUser.userId === userId) continue

      console.log(this.localSceneUser.userId, userId)

      if(!this.remoteSceneUsers.has(userId)) {
        this.handleRemoteUserConnect(userTransform)
        continue
      }
      // ToDo: send this package to event bus to be picked up by 'NetworkedTransform' component
      // do interpolation in entity update 'RemoteUserController' script

      const user = this.remoteSceneUsers.get(userId)
  
      user.transform.targetPosition = position
      user.transform.targetRotation = rotation

      user.lastActivity = now
      if(user.lastActivityTimeoutId) clearTimeout(user.lastActivityTimeoutId)

      user.lastActivityTimeoutId = setTimeout(() => { 
        user.state = SceneUserState.INACTIVE

        user.lastActivityTimeoutId = setTimeout(() => {
          user.state = SceneUserState.OFFLINE

          this.handleRemoteUserDisconnect(userId)
        }, SCENE_USER_OFFLINE_TIMEOUT_MS)
      }, SCENE_USER_INACTIVE_TIMEOUT_MS)

      user.state = SceneUserState.ACTIVE
    }
  } 
  handleLocalUserTransformUpdate = (transform: SceneUserTransformCache) => {
    const rawTransformPackage = parseSceneSendTransformPackage(parseTransformPackage(transform))
    if(!rawTransformPackage) return

    dispatch('pce:scene.rawpackagesend', rawTransformPackage)
  }
}