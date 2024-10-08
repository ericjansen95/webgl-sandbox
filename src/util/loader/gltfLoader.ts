import { mat4, quat, vec3 } from "gl-matrix"
import Animator, { Animation, Joint, JointTransfrom, KeyFrame, Skeleton } from "../../core/components/animation/animator"
import { ComponentType } from "../../core/components/base/component"
import Transform from "../../core/components/base/transform"
import Geometry from "../../core/components/geometry/geometry"
import SkinnedGeometry from "../../core/components/geometry/skinned"
import SphereGeometry from "../../core/components/geometry/sphere"
import Material from "../../core/components/material/material"
import UnlitMaterial from "../../core/components/material/unlitMaterial"
import UnlitTextureMaterial from "../../core/components/material/unlitTextureMaterial"
import Debug from "../../core/internal/debug"
import Texture from "../../core/renderer/texture"
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

const parseEntity = (gltf: any, bufferData: Array<ArrayBuffer>, nodeIndex: any, baseUri: string): Entity | null => {
  const { mesh: meshIndex, skin } = gltf.nodes[nodeIndex]
  if(meshIndex == null) return null

  const isSkinnedEntity = skin != undefined

  const entity = new Entity()
  entity.add(parseGeometry(gltf, bufferData, meshIndex, skin))

  const material = parseMaterial(gltf, meshIndex, baseUri)
  if(material) entity.add(material)

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
    const { channels, samplers, name } = animation
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

    const keyframes = new Array<KeyFrame>()

    const keyframeCount = rotationKeyframes[0].length
    for(let keyframeIndex = 0; keyframeIndex < keyframeCount; keyframeIndex++) {
      const keyframe: KeyFrame = new Array<JointTransfrom>()

      for(let jointIndex = 0; jointIndex < rotationKeyframes.length; jointIndex++)
        keyframe[jointIndex] = {
          rotation: rotationKeyframes[jointIndex][keyframeIndex],
          translation: translationKeyframes[jointIndex][keyframeIndex]
        }

      keyframes.push(keyframe)  
    }

    parsedAnimations.push({
      name,
      weight: 1.0,
      speed: 0.1,
      length: keyframes.length,
      keyframes
    })
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
  const bindPose = inverseBindPose.map((jointMatrix) => mat4.invert(mat4.create(), jointMatrix))

  const jointGeometry = new SphereGeometry(0.075, false)
  const jointDebugMaterial = new UnlitMaterial([1.0, 0.0, 1.0])

  let jointCount = 0

  const buildJointHirachy = (jointNodeIndex: number, parentEntityTransform: Transform | null = null) => {
    ++jointCount

    let { children, translation, rotation } = nodes[jointNodeIndex]

    if(!translation) translation = vec3.create()
    if(!rotation) rotation = quat.create() 

    const entity = new Entity()
    entity.add(jointGeometry)
    entity.add(jointDebugMaterial)

    if(parentEntityTransform)
      parentEntityTransform.addChild(entity)

    const entityTransform = entity.getComponent(ComponentType.TRANSFORM) as Transform

    const childJoints = new Array<Joint>()

    if(children)
      for(const childNodeIndex of children)
        childJoints.push(buildJointHirachy(childNodeIndex, entityTransform))

    const joint: Joint = {
      children: childJoints,
      translation,
      rotation,
      entity
    }

    return joint
  }

  const root: Joint = buildJointHirachy(joints[0])

  const skeleton: Skeleton = {
    jointCount,
    inverseBindPose,
    bindPose,
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
    type
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

  const vao = {} as any

  const indicesAccessorIndex = primitive.indices as number
  vao.INDICES = getBufferViewFromAccessorIndex(gltf, bufferData, indicesAccessorIndex) as Uint16Array

  for(const [attribute, accessorIndex] of Object.entries(attributes as object)) {
    vao[attribute] = getBufferViewFromAccessorIndex(gltf, bufferData, accessorIndex)

    if(attribute !== 'POSITION') continue

    const {
      min,
      max
    } = gltf.accessors[accessorIndex]
    
    vao.min = min
    vao.max = max
  }

  let geometry = null
  
  if(!isSkinnedGeometry) geometry = new Geometry()
  else geometry = new SkinnedGeometry()

  geometry.setVAO(vao)

  return geometry
}

const parseMaterial = (gltf: any, meshIndex: number, baseUri: string): Material | null => {
  const { meshes, materials, textures, images, samplers } = gltf

  const { primitives } = meshes[meshIndex]
  const { material: materialIndex } = primitives[0]

  if(materialIndex == null) return null
  
  const { emissiveTexture: {index: textureIndex} } = materials[materialIndex]
  const { source: imageIndex, sampler: samplerIndex } = textures[textureIndex]
  const { minFilter, magFilter } = samplers[samplerIndex]
  const { uri: textureName } = images[imageIndex]

  const textureUri = baseUri + '/' + textureName
  // TMP Hardcoded texture filter options until mip mapping is supported
  return new UnlitTextureMaterial(new Texture(textureUri, { minFilter: 0x2601, magFilter: 0x2601 }))
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
    console.log('gltf =', gltf)

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
      const entity = parseEntity(gltf, bufferData, parseInt(nodeIndex, 10), baseUri)
      if(!entity) continue

      const transform = entity.getComponent(ComponentType.TRANSFORM) as Transform

      const { translation, name } = nodes[nodeIndex]
      
      if(translation) transform.setLocalPosition(translation)

      entity.meta.name = name

      entities.push(entity)
    }

    resolve(entities)
  })
}