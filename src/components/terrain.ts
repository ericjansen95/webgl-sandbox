import Entity from "../entity";
import Material from "../material";
import Plane from "../plane";
import { Component } from "./component";
import Geometry from "./geometry";
import TerrainMaterial from "./materials/terrainMaterial";

const TERRAIN_PLANE_SUBDEVISIONS: number = 1024
const TERRAIN_HEIGHTMAP_URI: string = "/res/tex/antarticaHeightmap.png"

export default class Terrain implements Component {
  geometry: Geometry
  material: Material

  constructor() {
    this.geometry = new Plane(TERRAIN_PLANE_SUBDEVISIONS) as Geometry
    this.material = new TerrainMaterial(TERRAIN_HEIGHTMAP_URI) as Material
    this.material.wireframe = true
  }

  onAdd = (entity: Entity) => {
    entity.addComponent(this.geometry)
    entity.addComponent(this.material)    
  }

  onRemove = (entity: Entity) => {
    entity.removeComponent(this.geometry)
    entity.removeComponent(this.material)
  }
}