import Geometry, { parseUnindexedVertexPositions, parseUnindexedVertexUvs } from "../components/geometry/geometry";

export type GlftLoadResponse = {
  geometry: Array<Geometry>
}

const parseGeometry = async (gltf: any, bufferData: Array<ArrayBuffer>): Promise<Array<Geometry>> => {
  const { meshes, accessors, bufferViews } = gltf
  const geometries = new Array<Geometry>()

  for(const mesh of meshes) {
    const { primitives, name } = mesh

    for(const primitive of primitives) {
      const { attributes, indices } = primitive

      const indiciesAccessor = accessors[indices]
      const {
        bufferView,
        componentType,
        count,
        type,
      } = indiciesAccessor

      const indiciesBufferView = bufferViews[bufferView]
      const {
        buffer,
        byteLength,
        byteOffset,
      } = indiciesBufferView

      const indiciesArray = new Uint16Array(bufferData[buffer], byteOffset, count)

      const geometry = new Geometry()
      let positions = null
      let normals = null
      let uvs = null

      for(const [key, value] of Object.entries(attributes as object)) {
        switch (key) {
          case "POSITION": {
            const positionAccessorIndex = value as number

            const positionAccessor = accessors[positionAccessorIndex]
            const {
              bufferView,
              componentType,
              count,
              type,
            } = positionAccessor

            const positionBufferView = bufferViews[bufferView]
            const {
              buffer,
              byteLength,
              byteOffset,
            } = positionBufferView

            positions = new Float32Array(bufferData[buffer], byteOffset, count * 3)

            break
          }
          case "NORMAL": {
            const normalAccessorIndex = value as number

            const normalAccessor = accessors[normalAccessorIndex]
            const {
              bufferView,
              componentType,
              count,
              type,
            } = normalAccessor

            const normalBufferView = bufferViews[bufferView]
            const {
              buffer,
              byteLength,
              byteOffset,
            } = normalBufferView

            normals = new Float32Array(bufferData[buffer], byteOffset, count * 3)

            break
          }
          case "TEXCOORD_0": {
            const uvAccessorIndex = value as number

            const uvAccessor = accessors[uvAccessorIndex]
            const {
              bufferView,
              componentType,
              count,
              type,
            } = uvAccessor

            const uvBufferView = bufferViews[bufferView]
            const {
              buffer,
              byteLength,
              byteOffset,
            } = uvBufferView

            uvs = new Float32Array(bufferData[buffer], byteOffset, count * 2)

            break
          }
        }
      }

      geometry.setVertices({
        count,
        indices: indiciesArray,
        positions: parseUnindexedVertexPositions(indiciesArray, positions), 
        normals: parseUnindexedVertexPositions(indiciesArray, normals), 
        uvs: parseUnindexedVertexUvs(indiciesArray, uvs)
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