import Geometry from "../../core/components/geometry/geometry"
import SkinnedGeometry from "../../core/components/geometry/skinnedGeometry"

export type GlftLoadResponse = {
  geometry: Array<Geometry>
}

const componentByteCount = {
  SCALAR: 1,
  VEC2: 2,
  VEC3: 3,
  VEC4: 4
}

// https://www.khronos.org/registry/glTF/specs/2.0/glTF-2.0.html#accessor-data-types
const componentPrimitiveType = {
  U_INT_8: 5121,
  U_INT_16: 5123,
  FLOAT_32: 5126
}

const parseGeometry = async (gltf: any, bufferData: Array<ArrayBuffer>): Promise<Array<Geometry>> => {
  const { meshes, accessors, bufferViews } = gltf
  const geometries = new Array<Geometry>()

  const getBufferViewFromAccessorIndex = (accessorIndex: number) => {
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

  for(const mesh of meshes) {
    const { primitives, name } = mesh

    for(const primitive of primitives) {
      const { attributes } = primitive

      const vertex = {} as any

      const indicesAccessorIndex = primitive.indices as number
      vertex.INDICES = getBufferViewFromAccessorIndex(indicesAccessorIndex) as Uint16Array

      for(const [key, value] of Object.entries(attributes as object)) {
        const accessorIndex = value as number
        vertex[key] = getBufferViewFromAccessorIndex(accessorIndex)
      }

      const isSkinnedGeometry = vertex.JOINTS_0

      const geometry = isSkinnedGeometry ? new SkinnedGeometry() : new Geometry()
      geometry.setVAO(vertex)
  
      geometries.push(geometry)
    }
  }

  return geometries
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

    resolve({
      geometry: await parseGeometry(gltf, bufferData)
    })
  })
}