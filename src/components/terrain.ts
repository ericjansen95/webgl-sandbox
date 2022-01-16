import { mat4, vec2, vec3 } from "gl-matrix";
import Camera from "../camera";
import Entity from "../entity";
import Material from "../material";
import Plane from "../plane";
import { Component } from "./component";
import Geometry from "./geometry";
import TerrainMaterial from "./materials/terrainMaterial";
import UnlitMaterial from "./materials/unlitMaterial";
import Transform from "./transform";

const TERRAIN_HEIGHTMAP_URI: string = "/res/tex/antarticaHeightmap.png"

// these settings are also related to the heightmap resolution
// going to high with a low heightmap makes not much sense

// high subdevisions ~= heightmap resolution / (terrain size / chunk size)
// 64 ~= 41 = 2048 / (10000 / 200)
const TERRAIN_CHUNK_LOW_SUBDEVISIONS: number = 1
const TERRAIN_CHUNK_HIGH_SUBDEVISIONS: number = 64

const TERRAIN_CHUNK_SIZE = 0.1

export default class Terrain implements Component {
  size: number
  height: number

  lowMaterial: Material
  lowGeometry: Geometry
  highMaterial: Material
  highGeometry: Geometry

  chunkCount: number
  activeChunkIndex: number | null
  chunks: Array<Entity>

  // size is in units / m
  constructor(size: number = 2, height: number = 1) {
    this.size = size

    console.log("size =", this.size)

    this.height = height

    this.activeChunkIndex = null
    this.chunks = new Array<Entity>()

    this.lowMaterial = new UnlitMaterial([1.0, 0.0, 1.0]) as Material
    // this.lowMaterial = new TerrainMaterial(TERRAIN_HEIGHTMAP_URI, this.height) as Material
    this.lowMaterial.wireframe = true
    this.lowGeometry = new Plane(TERRAIN_CHUNK_LOW_SUBDEVISIONS) as Geometry

    this.highMaterial = new TerrainMaterial(TERRAIN_HEIGHTMAP_URI, this.height) as Material
    this.highGeometry = new Plane(TERRAIN_CHUNK_HIGH_SUBDEVISIONS) as Geometry

    const step: number = 1.0 / (this.size / TERRAIN_CHUNK_SIZE)

    console.log("step =", step)

    const chunkScale: vec3 = [step * 0.5, 1.0, step * 0.5]

    console.log("scale =", chunkScale)

    // ToDo(Eric) Figure out how to do this in one loop!
    for(let xPos = 0.0; xPos <= 1.0; xPos += step) {
      for(let zPos = 0.0; zPos <= 1.0; zPos += step) {
        const chunkPos: vec3 = [xPos, 0.0, zPos]

        //console.log(chunkPos)

        const chunk: Entity = new Entity()

        chunk.getComponent(Transform).setPosition(chunkPos)
        chunk.getComponent(Transform).setScale(chunkScale)

        chunk.addComponent(this.lowGeometry)
        chunk.addComponent(this.lowMaterial)

        this.chunks.push(chunk)
      }
    }
  }

  onUpdate = (self: Entity, camera: Camera) => {

    //console.log(this.chunks.filter(chunk => !chunk.getComponent(Transform)))
    return

    const cameraPos: vec3 = vec3.create()
    mat4.getTranslation(cameraPos, camera.viewMatrix)
    // ToDo(Eric) Check why we have to make this transform
    // => this seems wrong
    vec3.multiply(cameraPos, cameraPos, [-1.0, 1.0, -1.0])
    // ToDo(Eric) Transform bb check in 0-1 range on both axis
    cameraPos[0] += this.size
    cameraPos[2] += this.size
    
    for(let chunkIndex = 0; chunkIndex < this.chunks.length; chunkIndex++) {
      const chunk: Entity = this.chunks[chunkIndex]

      const chunkPos: vec3 = vec3.create()
      mat4.getTranslation(chunkPos, chunk.getComponent(Transform).worldMatrix)
      
      // ToDo(Eric) Transform bb check in 0-1 range on both axis
      const chunkCornerLowerLeft: vec2 = [chunkPos[0] - TERRAIN_CHUNK_SIZE + this.size, chunkPos[2] + TERRAIN_CHUNK_SIZE + this.size]      
      const chunkCornerUpperRight: vec2 = [chunkPos[0] + TERRAIN_CHUNK_SIZE + this.size, chunkPos[2] - TERRAIN_CHUNK_SIZE + this.size]

      // ToDo(Eric) Create method on bb class to handle checks
      if(cameraPos[0] >= chunkCornerLowerLeft[0] && 
        cameraPos[0] <= chunkCornerUpperRight[0] && 
        cameraPos[2] <= chunkCornerLowerLeft[1] && 
        cameraPos[2] >= chunkCornerUpperRight[1]) {

        if(chunkIndex === this.activeChunkIndex) return  

        // TMP
        this.chunks.forEach(chunk => {
          chunk.components[0] = this.lowGeometry as Component
          chunk.components[1] = this.lowMaterial as Component 
        })

        this.activeChunkIndex = chunkIndex

        for(let offsetScalar = -1; offsetScalar <= 1; offsetScalar++) {
          const chunkIndex: number = this.activeChunkIndex + this.chunkCount * offsetScalar

          // ToDo(Eric) Find a real solution
          // this is trash!
          try { 
            this.chunks[chunkIndex - 1].components[0] = this.highGeometry as Component
            this.chunks[chunkIndex - 1].components[1] = this.highMaterial as Component
          } catch {}
          try { 
            this.chunks[chunkIndex].components[0] = this.highGeometry as Component
            this.chunks[chunkIndex].components[1] = this.highMaterial as Component
          } catch {}
          try { 
            this.chunks[chunkIndex + 1].components[0] = this.highGeometry as Component
            this.chunks[chunkIndex + 1].components[1] = this.highMaterial as Component
          } catch {}
        }
      }
    }

    /*
    this.chunks.forEach(chunk => {chunk.components[0] = this.lowGeometry as Component })
    this.activeChunkIndex = null
    */
  }

  onAdd = (self: Entity) => {
    this.chunks.forEach(chunk => self.getComponent(Transform).addChild(chunk))
    self.getComponent(Transform).setScale([this.size, 1.0, this.size])
  }
}