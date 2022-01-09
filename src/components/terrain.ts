import { mat4, vec2, vec3 } from "gl-matrix";
import Camera from "../camera";
import Entity from "../entity";
import Material from "../material";
import Plane from "../plane";
import { Component } from "./component";
import Geometry from "./geometry";
import LambertMaterial from "./materials/lambertMaterial";
import TerrainMaterial from "./materials/terrainMaterial";

const TERRAIN_HEIGHTMAP_URI: string = "/res/tex/antarticaHeightmap.png"

const TERRAIN_CHUNK_SUBDEVISIONS: number = 32
const TERRAIN_CHUNK_SIZE = 200

export default class Terrain implements Component {
  size: number
  height: number
  activeTerrainMaterial: Material

  chunkCount: number

  // size is in units / m
  constructor(size: number = 2000, height: number = 80) {
    this.size = size + size % TERRAIN_CHUNK_SIZE
    this.height = height

    this.chunkCount = this.size / TERRAIN_CHUNK_SIZE
  }

  onUpdate = (entity: Entity, camera: Camera) => {
    const cameraPos: vec3 = vec3.create()
    mat4.getTranslation(cameraPos, camera.viewMatrix)
    // ToDo(Eric) Check why we have to make this transform
    // => this seems wrong
    vec3.multiply(cameraPos, cameraPos, [-1.0, 1.0, -1.0])
    // ToDo(Eric) Transform bb check in 0-1 range on both axis
    cameraPos[0] += this.size
    cameraPos[2] += this.size
    
    entity.children.forEach(chunk => {
      // ToDo(Eric) Create bounding box class and store it in geometry component
      // => calculate only on geo update and not every frame!
      const chunkModelMatrix: mat4 = mat4.create()
      mat4.multiply(chunkModelMatrix, entity.modelMatrix, chunk.modelMatrix)

      const chunkPos: vec3 = vec3.create()
      mat4.getTranslation(chunkPos, chunkModelMatrix)
      
      // ToDo(Eric) Transform bb check in 0-1 range on both axis
      const chunkCornerLowerLeft: vec2 = [chunkPos[0] - TERRAIN_CHUNK_SIZE + this.size, chunkPos[2] + TERRAIN_CHUNK_SIZE + this.size]      
      const chunkCornerUpperRight: vec2 = [chunkPos[0] + TERRAIN_CHUNK_SIZE + this.size, chunkPos[2] - TERRAIN_CHUNK_SIZE + this.size]

      const material: Material = chunk.getComponent(Material) as Material

      // ToDo(Eric) Create method on bb class to handle checks
      if(cameraPos[0] >= chunkCornerLowerLeft[0] && 
        cameraPos[0] <= chunkCornerUpperRight[0] && 
        cameraPos[2] <= chunkCornerLowerLeft[1] && 
        cameraPos[2] >= chunkCornerUpperRight[1]) {
        if(!material.wireframe)
          material.wireframe = true
      } else if(material.wireframe) {
        material.wireframe = false
      }
    })
  }

  onAdd = (entity: Entity) => {
    const step: number = 2.0 / this.chunkCount
    const scale: vec3 = [step * 0.5, 1.0, step * 0.5]

    // ToDo(Eric) Figure out how to do this in one loop!
    for(let xOffset = -1.0; xOffset < 1.0; xOffset += step) {
      for(let zOffset = 1.0; zOffset > -1.0; zOffset -= step) {
        const chunkOffset: vec3 = [xOffset + step * 0.5, 0.0, zOffset - step * 0.5]

        const chunkModelMatrix: mat4 = mat4.create()
        mat4.translate(chunkModelMatrix,
                       chunkModelMatrix, 
                       chunkOffset)
        mat4.scale(chunkModelMatrix,
                   chunkModelMatrix,
                   scale)

        const terrainChunk: Entity = new Entity()
        terrainChunk.modelMatrix = chunkModelMatrix

        const terrainChunkGeometry: Geometry = new Plane(TERRAIN_CHUNK_SUBDEVISIONS) as Geometry
        terrainChunk.addComponent(terrainChunkGeometry)

        // ToDo(Eric) Use shared material stored in terrain component?
        // Set offset dynamically in material bind function
        const terrainChunkMaterial: Material = new TerrainMaterial(TERRAIN_HEIGHTMAP_URI, this.height, chunkModelMatrix) as Material
        terrainChunk.addComponent(terrainChunkMaterial)

        entity.children.push(terrainChunk)
      }
    }

    mat4.scale(entity.modelMatrix,
               entity.modelMatrix,
               [this.size, 1.0, this.size])
  }
}