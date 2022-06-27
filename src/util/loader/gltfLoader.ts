import { mat4, quat, vec3 } from "gl-matrix"
import Animator, { Animation, Joint, JointTransfrom, KeyFrame, Skeleton } from "../../core/components/animation/animator"
import { ComponentEnum } from "../../core/components/base/component"
import Transform from "../../core/components/base/transform"
import Geometry from "../../core/components/geometry/geometry"
import SkinnedGeometry from "../../core/components/geometry/skinned"
import SphereGeometry from "../../core/components/geometry/sphere"
import UnlitMaterial from "../../core/components/material/unlitMaterial"
import Entity from "../../core/scene/entity"

export type GlftLoadResponse = Array<Entity>

const componentByteCount = {
  SCALAR: 1,
  VEC2: 2,
  VEC3: 3,
  VEC4: 4,
  MAT4: 16
}

// https://www.khronos.org/registry/glTF/specs/2.0/glTF-2.0.html#accessor-data-types
const componentPrimitiveType = {
  U_BYTE: 5121,
  U_INT_16: 5123,
  FLOAT_32: 5126
}

const parseEntity = (gltf: any, bufferData: Array<ArrayBuffer>, nodeIndex: any): Entity | null => {
  const { mesh, skin } = gltf.nodes[nodeIndex]
  if(mesh == null) return null

  const isSkinnedEntity = skin != undefined

  const entity = new Entity()
  entity.add(parseGeometry(gltf, bufferData, mesh, skin))

  if(isSkinnedEntity) {
    const animator = new Animator(parseSkeleton(gltf, bufferData, skin), parseAnimations(gltf, bufferData, skin))

    entity.add(animator)
  }

  return entity
}

const parseAnimations = (gltf: any, bufferData: Array<ArrayBuffer>, skinIndex: number): Array<Animation> => {
  const parsedAnimations = new Array<Animation>()

  const { animations, skins } = gltf
  const { joints } = skins[skinIndex]

  for(const animation of animations) {
    const { channels, samplers } = animation
    const rotationKeyframes = Array<Array<quat>>()
    const translationKeyframes = Array<Array<vec3>>()

    for(const channel of channels) {
      const { sampler, target: { node, path} } = channel

      // TMP: check if animation corresponds to one joint of the skin and only use rotation channels
      if(!joints.includes(node)) break

      const { output } = samplers[sampler]

      switch(path) {
        case 'rotation':
          rotationKeyframes.push(parseBufferToQuaternionArray(gltf, bufferData, output))
          break;
        case 'translation':
          translationKeyframes.push(parseBufferToVector3Array(gltf, bufferData, output))
          break;  
      }      
    }

    const currentAnimation: Animation = new Array<KeyFrame>()

    const keyframeCount = rotationKeyframes[0].length
    for(let keyframeIndex = 0; keyframeIndex < keyframeCount; keyframeIndex++) {
      const keyframe: KeyFrame = new Array<JointTransfrom>()

      for(let jointIndex = 0; jointIndex < rotationKeyframes.length; jointIndex++)
        keyframe[jointIndex] = {
          rotation: rotationKeyframes[jointIndex][keyframeIndex],
          translation: translationKeyframes[jointIndex][keyframeIndex]
        }

      currentAnimation.push(keyframe)  
    }

    parsedAnimations.push(currentAnimation)
  }

  return parsedAnimations
}

const parseBufferToQuaternionArray = (gltf: any, bufferData: Array<ArrayBuffer>, accessorIndex: number): Array<quat> => {
  const quaternions = new Array<quat>()

  const uniformQuaterionBuffer = getBufferViewFromAccessorIndex(gltf, bufferData, accessorIndex) as Float32Array
  const uniformQuaterionArray = Array.from(uniformQuaterionBuffer.values()) as Array<number>

  for(let quaternionIndex = 0; quaternionIndex < uniformQuaterionArray.length; quaternionIndex += 4) {
    quaternions.push(quat.fromValues(
      uniformQuaterionArray[quaternionIndex],
      uniformQuaterionArray[quaternionIndex + 1],
      uniformQuaterionArray[quaternionIndex + 2],
      uniformQuaterionArray[quaternionIndex + 3]
    ))
  }

  return quaternions
}

const parseBufferToVector3Array = (gltf: any, bufferData: Array<ArrayBuffer>, accessorIndex: number): Array<vec3> => {
  const vectors = new Array<vec3>()

  const uniformVectorBuffer = getBufferViewFromAccessorIndex(gltf, bufferData, accessorIndex) as Float32Array
  const uniformVectorArray = Array.from(uniformVectorBuffer.values()) as Array<number>

  for(let vectorIndex = 0; vectorIndex < uniformVectorArray.length; vectorIndex += 3) {
    vectors.push(vec3.fromValues(
      uniformVectorArray[vectorIndex],
      uniformVectorArray[vectorIndex + 1],
      uniformVectorArray[vectorIndex + 2]
    ))
  }

  return vectors
}

const parseBufferToMatrixArray = (gltf: any, bufferData: Array<ArrayBuffer>, accessorIndex: number): Array<mat4> => {
  const matrices = new Array<mat4>()

  const uniformMatrixBuffer = getBufferViewFromAccessorIndex(gltf, bufferData, accessorIndex) as Float32Array
  const uniformMatrixArray = Array.from(uniformMatrixBuffer.values()) as Array<number>

  for(let matrixIndex = 0; matrixIndex < uniformMatrixArray.length; matrixIndex += 16) {
    // deep copy to avoid issues with inversing
    matrices.push(mat4.fromValues(
      uniformMatrixArray[matrixIndex],
      uniformMatrixArray[matrixIndex + 1],
      uniformMatrixArray[matrixIndex + 2],
      uniformMatrixArray[matrixIndex + 3],
      uniformMatrixArray[matrixIndex + 4],
      uniformMatrixArray[matrixIndex + 5],
      uniformMatrixArray[matrixIndex + 6],
      uniformMatrixArray[matrixIndex + 7],
      uniformMatrixArray[matrixIndex + 8],
      uniformMatrixArray[matrixIndex + 9],
      uniformMatrixArray[matrixIndex + 10],
      uniformMatrixArray[matrixIndex + 11],
      uniformMatrixArray[matrixIndex + 12],
      uniformMatrixArray[matrixIndex + 13],
      uniformMatrixArray[matrixIndex + 14],
      uniformMatrixArray[matrixIndex + 15]
    ))
  }

  return matrices
}

const parseSkeleton = (gltf: any, bufferData: Array<ArrayBuffer>, skinIndex: number): Skeleton => {
  const { inverseBindMatrices, joints } = gltf.skins[skinIndex]
  const { nodes } = gltf

  const inverseBindPose = parseBufferToMatrixArray(gltf, bufferData, inverseBindMatrices)

  const jointGeometry = new SphereGeometry(0.075)
  const jointDebugMaterial = new UnlitMaterial([1.0, 0.0, 1.0])

  let jointCount = 0

  const buildJointHirachy = (jointNodeIndex: number, parentEntityTransform: Transform | null = null) => {
    ++jointCount

    const { children } = nodes[jointNodeIndex]

    const entity = new Entity()
    entity.add(jointGeometry)
    entity.add(jointDebugMaterial)

    if(parentEntityTransform)
      parentEntityTransform.add(entity)

    const entityTransform = entity.get(ComponentEnum.TRANSFORM) as Transform

    const childJoints = new Array<Joint>()

    if(children)
      for(const childNodeIndex of children)
        childJoints.push(buildJointHirachy(childNodeIndex, entityTransform))

    const joint: Joint = {
      children: childJoints,
      entity
    }

    return joint
  }

  const root: Joint = buildJointHirachy(joints[0])

  const skeleton: Skeleton = {
    jointCount,
    inverseBindPose,
    root
  }

  return skeleton
}

const getBufferViewFromAccessorIndex = (gltf: any, bufferData: Array<ArrayBuffer>, accessorIndex: number) => {
  const { accessors, bufferViews } = gltf

  const {
    bufferView,
    componentType,
    count,
    type,
  } = accessors[accessorIndex]

  const {
    buffer,
    byteLength,
    byteOffset,
  } = bufferViews[bufferView]

  const length = count * componentByteCount[type]

  switch(componentType) {
    case componentPrimitiveType.U_BYTE:
      return new Uint8Array(bufferData[buffer], byteOffset, length)
    case componentPrimitiveType.U_INT_16:
      return new Uint16Array(bufferData[buffer], byteOffset, length)
    case componentPrimitiveType.FLOAT_32:
      return new Float32Array(bufferData[buffer], byteOffset, length)
  }    
}

const parseGeometry = (gltf: any, bufferData: Array<ArrayBuffer>, meshIndex: number, skinIndex: number | undefined = undefined): Geometry => {
  const { meshes } = gltf

  const { primitives } = meshes[meshIndex]

  const primitive = primitives[0]
  const { attributes } = primitive

  const isSkinnedGeometry = skinIndex != undefined && gltf.skins[skinIndex]

  const vertex = {} as any

  const indicesAccessorIndex = primitive.indices as number
  vertex.INDICES = getBufferViewFromAccessorIndex(gltf, bufferData, indicesAccessorIndex) as Uint16Array

  for(const [key, value] of Object.entries(attributes as object)) {
    const accessorIndex = value as number
    vertex[key] = getBufferViewFromAccessorIndex(gltf, bufferData, accessorIndex)
  }

  let geometry = null
  
  if(!isSkinnedGeometry) geometry = new Geometry()
  else geometry = new SkinnedGeometry()

  geometry.setVAO(vertex)

  return geometry
}

export default function loadGltf(uri: string): Promise<GlftLoadResponse> {
  return new Promise(async (resolve, reject) => {
    const uriParts = uri.split('/')
    uriParts.pop()

    const baseUri = uriParts.join('/')

    const gltfResponse: Response = await fetch(uri, {
      method: 'GET'
    })

    if(!gltfResponse.ok) {
      reject(new Error(`gltfLoader::load(): Failed to load from uri = ${uri}`))
      return
    }

    const gltf = await gltfResponse.json() as any

    console.log(gltf)

    const { buffers } = gltf
    const bufferData = new Array<ArrayBuffer>()

    for(const buffer of buffers) {
      const { size, uri } = buffer as any

      const bufferResponse: Response = await fetch(`${baseUri}/${uri}`, {
        method: 'GET'
      })

      if(!bufferResponse.ok) {
        reject(new Error(`gltfLoader::load(): Failed to load from uri = ${uri}`))
        return
      }

      bufferData.push(await bufferResponse.arrayBuffer())
    }

    const entities = new Array<Entity>()

    const { nodes } = gltf
    for(const nodeIndex of Object.keys(nodes)) {
      const entity = parseEntity(gltf, bufferData, parseInt(nodeIndex, 10))
      if(!entity) continue

      entities.push(entity)
    }

    resolve(entities)
  })
}