import { mat4, vec3 } from "gl-matrix";
import Entity from "../entity";
import Material from "../material";
import Plane from "../plane";
import { Component } from "./component";
import Geometry from "./geometry";
import LambertMaterial from "./materials/lambertMaterial";
import TerrainMaterial from "./materials/terrainMaterial";

const TERRAIN_PLANE_SUBDEVISIONS: number = 1024
const TERRAIN_HEIGHTMAP_URI: string = "/res/tex/antarticaHeightmap.png"

const TERRAIN_CHUNK_SIZE = 200

export default class Terrain implements Component {
  //geometry: Geometry
  //material: Material

  size: number
  height: number

  chunkCount: number

  constructor(size: number = 1000, height: number = 0) {
    this.size = size + size % TERRAIN_CHUNK_SIZE
    this.height = height

    this.chunkCount = this.size / TERRAIN_CHUNK_SIZE

    //this.geometry = new Plane(TERRAIN_PLANE_SUBDEVISIONS) as Geometry
    //this.material = new TerrainMaterial(TERRAIN_HEIGHTMAP_URI) as Material
  }

  onAdd = (entity: Entity) => {
    //entity.addComponent(this.geometry)
    //entity.addComponent(this.material)    

    let chunkModelMatrix: mat4 = mat4.create()

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

        const terrainChunkGeometry: Geometry = new Plane() as Geometry
        terrainChunk.addComponent(terrainChunkGeometry)

        const terrainChunkMaterial: Material = new LambertMaterial([1.0, 0.0, 1.0]) as Material
        terrainChunkMaterial.wireframe = true
        terrainChunk.addComponent(terrainChunkMaterial)

        entity.children.push(terrainChunk)
      }
    }

    mat4.scale(entity.modelMatrix,
               entity.modelMatrix,
               [this.size, 1.0, this.size])
  }
}