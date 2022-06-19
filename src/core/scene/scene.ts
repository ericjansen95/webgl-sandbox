import BoundingVolume from "../components/boundingVolume/boundingVolume";
import Camera from "../components/base/camera";
import Grid from "../components/geometry/grid";
import UnlitMaterial from "../components/material/unlitMaterial";
import Debug from "../internal/debug";
import Client from "../network/client";
import GameNetworkController from "../network/gameNetworkController";
import Entity from "./entity";
import { ComponentEnum } from "../components/base/component";
import Transform from "../components/base/transform";
import Geometry from "../components/geometry/geometry";

export type SceneStats = {
  updateTime: number
  entityCount: number
  cullTime: number
  cullCount: number
}

export default class Scene {
  stats: SceneStats

  root: Entity
  camera: Entity

  entities: Array<Entity>

  networkController: GameNetworkController

  constructor(camera: Entity, clientEntity: Entity | null = null, client: Client | null = null) {
    this.root = new Entity()
    this.camera = camera
    // ToDo: Add entities with scene.add() instead while update loop?
    // handle entity passing with integer id?
    this.entities = new Array<Entity>()
    this.stats = {
      updateTime: 0,
      entityCount: 0,
      cullTime: 0,
      cullCount: 0
    }

    const grid: Entity = new Entity()
    grid.get(ComponentEnum.TRANSFORM).setLocalScale([10.0, 10.0, 10.0])
    grid.get(ComponentEnum.TRANSFORM).setLocalPosition([-5.0, 0.0, -5.0])
    grid.add(new Grid(10))
    grid.add(new UnlitMaterial([0.75, 0.75, 0.75]))
    this.root.get(ComponentEnum.TRANSFORM).add(grid)

    Debug.console.registerCommand({ name: "bv", description: "Visualize bounding volumes.", callback: this.toggleBoundingVolumes })

    if(!clientEntity || !client) return

    this.networkController = new GameNetworkController(client, this.root, clientEntity)
  }

  update = () => {
    const startTime = Date.now()

    this.entities = []
    this.updateEntity(this.root, this.camera, true)

    this.stats.updateTime = Math.ceil(Date.now() - startTime)
    this.stats.entityCount = this.entities.length

    if(!this.networkController) return

    this.networkController.update()
  }

  updateEntity = (entity: Entity, camera: Entity, recursive: boolean = false): void => {
    this.updateEntityTransform(entity)
    this.updateEntityComponents(entity, camera)

    this.entities.push(entity)
    
    if(!recursive) return

    for(const child of entity)
      this.updateEntity(child, camera)
  }

  updateEntityTransform = (entity: Entity): void => {
    entity.get(ComponentEnum.TRANSFORM).onUpdate()
  }

  updateEntityComponents = (entity: Entity, camera: Entity): void => {
    entity.components.forEach((component) => {
      if(component.onUpdate && component.type !== ComponentEnum.TRANSFORM)
        component.onUpdate(entity, camera)
    })
  }

  // this returns a "display list" for all visible entities that are in the camera frustrum
  getVisibleEntities = (): Array<Entity> => {
    const startTime = Date.now()

    const cameraComponent = this.camera.get(ComponentEnum.CAMERA) as Camera

    const visibleEnties = this.getEntities().filter(entity => cameraComponent.isEntityInFrustrum(entity))

    this.stats.cullTime = Math.ceil(Date.now() - startTime)
    this.stats.cullCount = this.stats.entityCount - visibleEnties.length

    Debug.updateStats({scene: this.stats})

    return visibleEnties
  }

  getEntities = (): Array<Entity> => {
    return this.entities
  }

  add = (entity: Entity): Entity => {
    const rootTransform = this.root.get(ComponentEnum.TRANSFORM) as Transform
    rootTransform.add(entity)
    return entity
  }

  toggleBoundingVolumes = (): string => {
    if(!this.root) return "Failed toggeling bounding volumes = no scene root found!"

    const toggleBoundingVolume = (entity: Entity) => {
      const boundingVolume = entity.get(ComponentEnum.BOUNDING_VOLUME) as BoundingVolume
      if(!boundingVolume) return

      boundingVolume.setVisible(!boundingVolume.visible)
    }

    const toggleFrustrumPlane = (frustrumPlane: Entity) => {
      const frustrumPlaneGeometry = frustrumPlane.get(ComponentEnum.GEOMETRY) as Geometry
      frustrumPlaneGeometry.visible = !frustrumPlaneGeometry.visible
    }

    for(const entity of this.entities)
      toggleBoundingVolume(entity)

    for(const frustrumPlane of this.camera)
      toggleFrustrumPlane(frustrumPlane)

    return "Renderer::toggleBondingVolumes(): Toggled bounding volumes."
  }
}