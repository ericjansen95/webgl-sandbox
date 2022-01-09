import { mat4, vec2, vec3 } from "gl-matrix";
import Camera from "../camera";
import Entity from "../entity";
import Material from "../material";
import Plane from "../plane";
import { Component } from "./component";
import Geometry from "./geometry";
import TerrainMaterial from "./materials/terrainMaterial";

const TERRAIN_HEIGHTMAP_URI: string = "/res/tex/antarticaHeightmap.png"

const TERRAIN_CHUNK_LOW_SUBDEVISIONS: number = 32
const TERRAIN_CHUNK_HIGH_SUBDEVISIONS: number = 512

const TERRAIN_CHUNK_SIZE = 200

export default class Terrain implements Component {
  size: number
  height: number

  material: Material
  lowGeometry: Geometry
  highGeometry: Geometry

  chunkCount: number
  chunks: Array<{entity: Entity, active: boolean}>

  // size is in units / m
  constructor(size: number = 2000, height: number = 80) {
    this.size = size + size % TERRAIN_CHUNK_SIZE
    this.height = height

    this.chunkCount = this.size / TERRAIN_CHUNK_SIZE
    this.chunks = new Array<{entity: Entity, active: boolean}>()

    this.lowGeometry = new Plane(TERRAIN_CHUNK_LOW_SUBDEVISIONS) as Geometry
    this.highGeometry = new Plane(TERRAIN_CHUNK_HIGH_SUBDEVISIONS) as Geometry
    this.material = new TerrainMaterial(TERRAIN_HEIGHTMAP_URI, this.height) as Material

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

        const entity: Entity = new Entity()
        entity.modelMatrix = chunkModelMatrix
        entity.addComponent(this.lowGeometry)
        entity.addComponent(this.material)

        this.chunks.push({entity, active: false})
      }
    }
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
    
    this.chunks.forEach(chunk => {
      // ToDo(Eric) Create bounding box class and store it in geometry component
      // => calculate only on geo update and not every frame!
      const chunkModelMatrix: mat4 = mat4.create()
      mat4.multiply(chunkModelMatrix, entity.modelMatrix, chunk.entity.modelMatrix)

      const chunkPos: vec3 = vec3.create()
      mat4.getTranslation(chunkPos, chunkModelMatrix)
      
      // ToDo(Eric) Transform bb check in 0-1 range on both axis
      const chunkCornerLowerLeft: vec2 = [chunkPos[0] - TERRAIN_CHUNK_SIZE + this.size, chunkPos[2] + TERRAIN_CHUNK_SIZE + this.size]      
      const chunkCornerUpperRight: vec2 = [chunkPos[0] + TERRAIN_CHUNK_SIZE + this.size, chunkPos[2] - TERRAIN_CHUNK_SIZE + this.size]

      const material: Material = chunk.entity.getComponent(Material) as Material

      // ToDo(Eric) Create method on bb class to handle checks
      if(cameraPos[0] >= chunkCornerLowerLeft[0] && 
        cameraPos[0] <= chunkCornerUpperRight[0] && 
        cameraPos[2] <= chunkCornerLowerLeft[1] && 
        cameraPos[2] >= chunkCornerUpperRight[1]) {
        if(!chunk.active) {
          chunk.active = true
          // TMP
          chunk.entity.components[0] = this.highGeometry as Component
        }  
      } else if (chunk.active) {
        chunk.active = false
        // TMP
        chunk.entity.components[0] = this.lowGeometry as Component
      }
    })
  }

  onAdd = (entity: Entity) => {
    
    entity.children = this.chunks.map(({entity}) => entity)

    mat4.scale(entity.modelMatrix,
               entity.modelMatrix,
               [this.size, 1.0, this.size])
  }
}