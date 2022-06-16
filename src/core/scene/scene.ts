import BoundingVolume from "../components/boundingVolume/boundingVolume";
import Camera from "../components/base/camera";
import Grid from "../components/geometry/grid";
import UnlitMaterial from "../components/material/unlitMaterial";
import Debug from "../internal/debug";
import Client from "../network/client";
import GameNetworkController from "../network/gameNetworkController";
import Entity from "./entity";
import { ComponentType } from "../components/base/component";

export type SceneStats = {
  entityCount: number
  cullCount: number
}

export default class Scene {
  root: Entity
  entities: Array<Entity>
  stats: SceneStats
  networkController: GameNetworkController

  constructor(clientEntity: Entity | null = null, client: Client | null = null) {
    this.root = new Entity()
    // ToDo: Add entities with scene.add() instead while update loop?
    // handle entity passing with integer id?
    this.entities = new Array<Entity>()
    this.stats = {
      entityCount: 0,
      cullCount: 0
    }

    const grid: Entity = new Entity()
    grid.getComponent(ComponentType.TRANSFORM).setScale([10.0, 10.0, 10.0])
    grid.getComponent(ComponentType.TRANSFORM).setPosition([-5.0, 0.0, -5.0])
    grid.addComponent(new Grid(10))
    grid.addComponent(new UnlitMaterial([0.75, 0.75, 0.75]))
    this.root.getComponent(ComponentType.TRANSFORM).addChild(grid)

    Debug.console.registerCommand({ name: "bv", description: "Visualize bounding volumes.", callback: this.toggleBoundingVolumes })

    if(!clientEntity || !client) return

    this.networkController = new GameNetworkController(client, this.root, clientEntity)
  }

  update = (camera: Entity) => {
    this.entities = []
    this.updateEntity(this.root, camera, true)

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
    entity.getComponent(ComponentType.TRANSFORM).onUpdate()
  }

  updateEntityComponents = (entity: Entity, camera: Entity): void => {
    entity.components.forEach((component) => {
      if(component.onUpdate && component.componentType !== ComponentType.TRANSFORM)
        component.onUpdate(entity, camera)
    })
  }

  // this returns a "display list" for all visible entities that are in the camera frustrum
  getVisibleEntities = (camera: Entity): Array<Entity> => {
    const cameraComponent = camera.getComponent(ComponentType.CAMERA) as Camera

    const visibleEnties = this.getEntities().filter(entity => cameraComponent.isEntityInFrustrum(entity))

    this.stats.cullCount = this.stats.entityCount - visibleEnties.length
    Debug.updateStats({scene: this.stats})

    return visibleEnties
  }

  getEntities = (): Array<Entity> => {
    this.stats.entityCount = this.entities.length

    return this.entities
  }

  toggleBoundingVolumes = (): string => {
    if(!this.root) return "Failed toggeling bounding volumes = no scene root found!"

    const toggleBoundingVolume = (entity: Entity) => {
      const boundingVolume = entity.getComponent(ComponentType.BOUNDING_VOLUME) as BoundingVolume
      if(!boundingVolume) return

      boundingVolume.setVisible(!boundingVolume.visible)
    }

    for(const entity of this.entities)
      toggleBoundingVolume(entity)

    return "Renderer::toggleBondingVolumes(): Toggled bounding volumes."
  }
}