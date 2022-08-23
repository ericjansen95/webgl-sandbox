import { SceneReceiveDeltaStatePackage, SceneReceivePackageType, SceneReceiveServerConfigPackage, SceneSendPackageType, SceneSendTransformPackage, SceneUserTransformCache, SceneUserTransformPackageBody } from "../../core/network/sceneNetworkController";
import { ReceivePackageType, SharedPingReceivePackage } from "../../core/network/webRTCClient";
import { floatToScaledInt, scaledIntToFloat } from "../math/convert";

export const parseSharedReceivePingPackage = (rawPingPackage: ArrayBuffer): SharedPingReceivePackage | null => {
  if(!rawPingPackage?.byteLength) return null

  const packageView = new DataView(rawPingPackage)

  const packageType = extractPackageType(rawPingPackage)
  if(packageType !== ReceivePackageType.Shared.PING as any) return null

  const timeMs = Number(packageView.getBigInt64(1)) as SharedPingReceivePackage['timeMs']

  return {
    type: ReceivePackageType.Shared.PING as any,
    timeMs
  } as SharedPingReceivePackage
}

export const extractPackageType = (rawPackage: ArrayBuffer): ReceivePackageType | null => {
  if(!rawPackage?.byteLength) return null

  const packageType = Number(new Uint8Array(rawPackage, 0, 1)) as unknown as ReceivePackageType
  if(packageType === undefined) return null

  return packageType
}

// ToDo: Create higher level helper for all package types
export const parseTransformPackage = (transform: SceneUserTransformCache): SceneSendTransformPackage | null => {
  if(!transform) return null
  
  return {
    type: SceneSendPackageType.TRANSFORM,
    position: transform.targetPosition,
    rotation: transform.targetRotation
  }
}

export const parseSceneReceiveServerConfigPackage = (rawServerConfigPackage: ArrayBuffer): SceneReceiveServerConfigPackage | null => {
  if(!rawServerConfigPackage?.byteLength) return null

  const packageView = new DataView(rawServerConfigPackage)

  const type = extractPackageType(rawServerConfigPackage) as unknown as ReceivePackageType['Scene']
  if(type as any !== SceneReceivePackageType.SERVER_CONFIG) return null

  const timeMs = Number(packageView.getBigInt64(1))
  const tickIntervalMs = Number(packageView.getUint16(9))

  return {
    type,
    timeMs,
    tickIntervalMs
  }
}

export const parseSceneSendTransformPackage = (transformPackage: SceneSendTransformPackage): ArrayBuffer | null => {
  if(!transformPackage) return null

  const { type, position, rotation } = transformPackage

  const rawTransformPackage = new ArrayBuffer(15)
  const transformPackageView = new DataView(rawTransformPackage)

  transformPackageView.setUint8(0, type)

  transformPackageView.setInt32(1, floatToScaledInt(position[0]))
  transformPackageView.setInt32(5, floatToScaledInt(position[1]))
  transformPackageView.setInt32(9, floatToScaledInt(position[2]))

  transformPackageView.setUint16(13, rotation)

  return rawTransformPackage
}

export const parseSceneReceiveDeltaStatePackage = (rawDeltaStatePackage: ArrayBuffer): SceneReceiveDeltaStatePackage | null => {
  if(!rawDeltaStatePackage?.byteLength) return null

  const type = extractPackageType(rawDeltaStatePackage) as unknown as ReceivePackageType['Scene']
  if(type as any !== SceneReceivePackageType.DELTA_STATE) return null

  const rawPackageBodyByteLength = rawDeltaStatePackage.byteLength - 1
  const userTransforms = new Array<SceneUserTransformPackageBody>()

  // start at by 1 to skip package type
  for(let byteOffset = 1; byteOffset < rawPackageBodyByteLength; byteOffset += 18) {
    const rawTransformPackageBody = rawDeltaStatePackage.slice(byteOffset, byteOffset + 18)

    const transformPackageBody = parseSceneReceiveTransformPackageBody(rawTransformPackageBody)
    if(!transformPackageBody) continue

    userTransforms.push(transformPackageBody)
  }

  return {
    type,
    userTransforms
  }
}

export const parseSceneReceiveTransformPackageBody = (rawTransformPackageBody: ArrayBuffer): SceneUserTransformPackageBody | null => {
  if(!rawTransformPackageBody?.byteLength) return null

  const packageView = new DataView(rawTransformPackageBody)

  const userId = Number(packageView.getUint32(0)) as SceneUserTransformPackageBody['userId']

  const position = new Array<number>(scaledIntToFloat(packageView.getInt32(4)), 
                                     scaledIntToFloat(packageView.getInt32(8)), 
                                     scaledIntToFloat(packageView.getInt32(12))) as SceneUserTransformPackageBody['position']

  const rotation = scaledIntToFloat(packageView.getUint16(12)) as SceneUserTransformPackageBody['rotation']

  return {
    userId,
    position,
    rotation
  }
}