import { mat4, vec2, vec3 } from "gl-matrix";
import Entity from "../../scene/entity";
import Material from "../material/material";
import PlaneGeometry from "../geometry/plane";
import Component, { ComponentType } from "../base/component";
import Geometry from "../geometry/geometry";
import TerrainMaterial from "../material/terrainMaterial";
import UnlitMaterial from "../material/unlitMaterial";
import Transform from "../base/transform";
import HeightmapCollider from "../collider/heightmapCollider";
import Texture from "../../renderer/texture";

const TERRAIN_HEIGHTMAP_URI: string = "/res/map/heightcombined.png"
const TERRAIN_MAP_COMBINED: string = "/res/map/terrainCombined.jpg"

// these settings are also related to the heightmap resolution
// going to high with a low heightmap makes not much sense

// high subdevisions ~= heightmap resolution / (terrain size / chunk size)
// 64 ~= 41 = 2048 / (10000 / 200)
const TERRAIN_CHUNK_LOW_SUBDEVISIONS: number = 32
const TERRAIN_CHUNK_HIGH_SUBDEVISIONS: number = 128

const TERRAIN_CHUNK_SIZE: number = 100.0

export default class Terrain implements Component {
  type: ComponentType
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
  constructor(heightmapUri: string = TERRAIN_HEIGHTMAP_URI, size: number = 1000) {
    this.type = ComponentType.TERRAIN
    this.size = size

    this.height = 75.0

    this.activeChunkIndex = null
    this.chunks = new Array<Entity>()

    this.lowMaterial = new UnlitMaterial([1.0, 0.0, 1.0]) as Material
    this.lowGeometry = new PlaneGeometry(TERRAIN_CHUNK_LOW_SUBDEVISIONS) as Geometry

    this.highMaterial = new TerrainMaterial(new Texture(heightmapUri), new Texture(TERRAIN_MAP_COMBINED), this.height) as Material
    this.highGeometry = new PlaneGeometry(TERRAIN_CHUNK_HIGH_SUBDEVISIONS) as Geometry

    const step: number = TERRAIN_CHUNK_SIZE / this.size
    const chunkScale: vec3 = [step, 1.0, step]
    let chunkPos: vec3 = vec3.create()

    for(let xPos = 0.0; xPos <= 1.0 - step; xPos += step) {
      for(let zPos = 0.0; zPos <= 1.0 - step; zPos += step) {
        chunkPos = vec3.fromValues(xPos, 0.0, zPos)
        const chunk: Entity = new Entity()

        chunk.getComponent(ComponentType.TRANSFORM).setLocalPosition(chunkPos)
        chunk.getComponent(ComponentType.TRANSFORM).setLocalScale(chunkScale)

        chunk.add(this.highGeometry)
        chunk.add(this.highMaterial)
        /*
        const randomLuma: number = Math.random()
        chunk.addComponent(new UnlitMaterial([randomLuma, randomLuma, randomLuma]))
        */
        this.chunks.push(chunk)
      }
    }
  }

  onUpdate = (self: Entity, camera: Entity) => {
    return;
    const cameraPos: vec3 = (camera.getComponent(ComponentType.TRANSFORM) as Transform).getGlobalPosition()
    // ToDo(Eric) Check why we have to make this transform
    // => this seems wrong
    vec3.multiply(cameraPos, cameraPos, [-1.0, 1.0, -1.0])
    // ToDo(Eric) Transform bb check in 0-1 range on both axis
    cameraPos[0] += this.size
    cameraPos[2] += this.size
    
    for(let chunkIndex = 0; chunkIndex < this.chunks.length; chunkIndex++) {
      const chunk: Entity = this.chunks[chunkIndex]

      const chunkPos: vec3 = vec3.create()
      mat4.getTranslation(chunkPos, chunk.getComponent(ComponentType.TRANSFORM).globalMatrix)
      
      // ToDo(Eric) Transform bb check in 0-1 range on both axis
      const chunkCornerLowerLeft: vec2 = [chunkPos[0] - 1.0 + this.size, chunkPos[2] + 1.0 + this.size]      
      const chunkCornerUpperRight: vec2 = [chunkPos[0] + 1.0 + this.size, chunkPos[2] - 1.0 + this.size]

      // ToDo(Eric) Create method on bb class to handle checks
      if(cameraPos[0] >= chunkCornerLowerLeft[0] && 
        cameraPos[0] <= chunkCornerUpperRight[0] && 
        cameraPos[2] <= chunkCornerLowerLeft[1] && 
        cameraPos[2] >= chunkCornerUpperRight[1]) {

        if(chunkIndex === this.activeChunkIndex) return  

        // TMP
        this.chunks.forEach(chunk => {
          //chunk.components[0] = this.lowGeometry
          //chunk.components[1] = this.lowMaterial 
        })

        this.activeChunkIndex = chunkIndex

        for(let offsetScalar = -1; offsetScalar <= 1; offsetScalar++) {
          const chunkIndex: number = this.activeChunkIndex + this.chunkCount * offsetScalar

          // ToDo(Eric) Find a real solution
          // this is trash!
          try { 
            this.chunks[chunkIndex - 1].components[1] = this.highGeometry as Component
            //this.chunks[chunkIndex - 1].components[1] = this.highMaterial as Component
          } catch {}
          try { 
            this.chunks[chunkIndex].components[0] = this.highGeometry as Component
            //this.chunks[chunkIndex].components[1] = this.highMaterial as Component
          } catch {}
          try { 
            this.chunks[chunkIndex + 1].components[0] = this.highGeometry as Component
            //this.chunks[chunkIndex + 1].components[1] = this.highMaterial as Component
          } catch {}
        }
      }
    }

    this.chunks.forEach(chunk => {chunk.components[0] = this.lowGeometry as Component })
    this.activeChunkIndex = null
  }

  onAdd = (self: Entity) => {
    const position = vec3.fromValues(this.size * -0.5, -25.0, this.size * -0.5)

    this.chunks.forEach(chunk => self.getComponent(ComponentType.TRANSFORM).addChild(chunk))
    self.getComponent(ComponentType.TRANSFORM).setLocalScale([this.size, 1.0, this.size])

    self.getComponent(ComponentType.TRANSFORM).setLocalPosition(position)

    self.add(new HeightmapCollider(TERRAIN_HEIGHTMAP_URI, this.height, this.size, position))
  }
}