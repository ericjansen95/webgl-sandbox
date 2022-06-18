import Geometry, { parseUnindexedVertexPositions, parseUnindexedVertexUvs } from "../components/geometry/geometry";

export type GlftLoadResponse = {
  geometry: Array<Geometry>
}

enum ComponentType {
  VEC3 = 3,
  VEC2 = 2,
  SCALAR = 1
}

const parseGeometry = async (gltf: any, bufferData: Array<ArrayBuffer>): Promise<Array<Geometry>> => {
  const { meshes, accessors, bufferViews } = gltf
  const geometries = new Array<Geometry>()

  const getBufferViewFromAccessorIndex = (accessorIndex: number, component: ComponentType) => {
    const accessorEntry = accessors[accessorIndex]
    const {
      bufferView,
      componentType,
      count,
      type,
    } = accessorEntry

    const bufferViewEntry = bufferViews[bufferView]
    const {
      buffer,
      byteLength,
      byteOffset,
    } = bufferViewEntry

    switch(component) {
      case ComponentType.VEC3:
        return new Float32Array(bufferData[buffer], byteOffset, count * 3)
      case ComponentType.VEC2:
        return new Float32Array(bufferData[buffer], byteOffset, count * 2)
      case ComponentType.SCALAR:
        return new Uint16Array(bufferData[buffer], byteOffset, count)
    }    
  }

  for(const mesh of meshes) {
    const { primitives, name } = mesh

    for(const primitive of primitives) {
      const { attributes } = primitive

      const geometry = new Geometry()

      const indicesAccessorIndex = primitive.indices as number
      const indices = getBufferViewFromAccessorIndex(indicesAccessorIndex, ComponentType.SCALAR) as Uint16Array

      let position = null
      let normal = null

      let texcoord = null

      for(const [key, value] of Object.entries(attributes as object)) {
        switch (key) {
          case "POSITION": {
            const positionAccessorIndex = value as number
            position = getBufferViewFromAccessorIndex(positionAccessorIndex, ComponentType.VEC3)
            break
          }
          case "NORMAL": {
            const normalAccessorIndex = value as number
            normal = getBufferViewFromAccessorIndex(normalAccessorIndex, ComponentType.VEC3)
            break
          }
          case "TEXCOORD_0": {
            const texcoordAccessorIndex = value as number
            texcoord = getBufferViewFromAccessorIndex(texcoordAccessorIndex, ComponentType.VEC2)
            break
          }
        }
      }

      geometry.setVertices({
        indices,
        position, 
        normal, 
        texcoord
      })
      
      geometries.push(geometry)
    }
  }

  return geometries
}

export default class GltfLoader {
  constructor() {

  }

  load = (uri: string): Promise<GlftLoadResponse> => {
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
}