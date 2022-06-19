import { mat4 } from "gl-matrix"
import { ComponentEnum } from "../../core/components/base/component"
import Transform from "../../core/components/base/transform"
import Bone from "../../core/components/geometry/bone"
import Geometry from "../../core/components/geometry/geometry"
import SkinnedGeometry, { Skeleton } from "../../core/components/geometry/skinnedGeometry"
import SkinnedUnlitMaterial from "../../core/components/material/skinnedUnlitMaterial"
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
  U_INT_8: 5121,
  U_INT_16: 5123,
  FLOAT_32: 5126
}

const parseEntity = (gltf: any, bufferData: Array<ArrayBuffer>, node: any): Entity | null => {
  const { mesh, skin } = node
  if(mesh == null) return null

  const entity = new Entity()
  entity.add(parseGeometry(gltf, bufferData, mesh, skin))

  return entity
}

// ToDo: Validate this data
const parseInverseBindPose = (gltf: any, bufferData: Array<ArrayBuffer>, inverseBindMatricesAccessorIndex: number): Skeleton["inverseBindPose"] => {
  const inverseBindPose = new Array<mat4>()

  const uniformMatrixBuffer = getBufferViewFromAccessorIndex(gltf, bufferData, inverseBindMatricesAccessorIndex) as Float32Array
  for(let matrixIndex = 0; matrixIndex < uniformMatrixBuffer.length / 16; matrixIndex++) {
    inverseBindPose.push(new Float32Array(uniformMatrixBuffer.buffer, 64 * matrixIndex, 16) as mat4)
  }

  return inverseBindPose
}

const parseSkeleton = (gltf: any, bufferData: Array<ArrayBuffer>, skinIndex: number): Skeleton => {
  const { inverseBindMatrices, joints } = gltf.skins[skinIndex]
  const { nodes } = gltf

  const inverseBindPose = parseInverseBindPose(gltf, bufferData, inverseBindMatrices)

  const addJointEntityToParent = (nodeIndex, parentEntity) => {
    const { children, translation } = nodes[nodeIndex]

    const joint = new Entity()
    const jointTransform = joint.get(ComponentEnum.TRANSFORM) as Transform
    if(translation) jointTransform.setLocalPosition(translation)
    joint.add(new Bone())
    joint.add(new SkinnedUnlitMaterial([1.0, 0.0, 1.0]))

    const parentTransform = parentEntity.get(ComponentEnum.TRANSFORM) as Transform
    parentTransform.add(joint)

    if(!children) return

    for(const childNodeIndex of children) 
      addJointEntityToParent(childNodeIndex, joint)
  }
  
  const skeletonRoot = new Entity()
  addJointEntityToParent(joints[0], skeletonRoot)

  const skeleton: Skeleton = {
    root: skeletonRoot,
    inverseBindPose,
    joints: new Array<mat4>()
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
    case componentPrimitiveType.U_INT_8:
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
  
  if(!isSkinnedGeometry)
    geometry = new Geometry()
  else {
    geometry = new SkinnedGeometry()
    geometry.setSkeleton(parseSkeleton(gltf, bufferData, skinIndex))
  }

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
    for(const node of nodes) {
      const entity = parseEntity(gltf, bufferData, node)
      if(!entity) continue

      entities.push(entity)
    }

    resolve(entities)
  })
}