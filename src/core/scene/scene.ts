import Camera from "../components/camera";
import Grid from "../components/geometry/grid";
import UnlitMaterial from "../components/materials/unlitMaterial";
import Debug from "../internal/debug";
import Client from "../network/client";
import GameNetworkController from "../network/gameNetworkController";
import Entity from "./entity";

export default class Scene {
  root: Entity
  entities: Array<Entity>
  networkController: GameNetworkController

  constructor(clientEntity: Entity | null = null, client: Client | null = null) {
    this.root = new Entity()
    this.entities = new Array<Entity>()

    const grid: Entity = new Entity()
    grid.getComponent("Transform").setScale([10.0, 10.0, 10.0])
    grid.getComponent("Transform").setPosition([-5.0, 0.0, -5.0])
    grid.addComponent(new Grid(10))
    grid.addComponent(new UnlitMaterial([0.75, 0.75, 0.75]))
    this.root.getComponent("Transform").addChild(grid)

    if(!clientEntity || !client) return

    this.networkController = new GameNetworkController(client, this.root, clientEntity)
  }

  update = (camera: Entity) => {
    camera.getComponent("FlyControls").onUpdate(camera, camera)
    camera.getComponent("Transform").onUpdate(camera, camera)
    camera.getComponent("Camera").onUpdate(camera, camera)

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

    const transform = entity.getComponent("Transform")

    for(const child of transform.children)
      this.updateEntity(child, camera, recursive)
  }

  updateEntityTransform = (entity: Entity): void => {
    entity.getComponent("Transform").onUpdate()
  }

  updateEntityComponents = (entity: Entity, camera: Entity): void => {
    entity.components.forEach((component, name) => {
      if(component.onUpdate && name !== "Transform")
        component.onUpdate(entity, camera)
    })
  }

  getVisibleEntities = (camera: Entity): Array<Entity> => {
    const cameraComponent = camera.getComponent("Camera") as Camera

    const visibleEnties = this.entities.filter(entity => cameraComponent.isEntityInFrustrum(entity))

    return visibleEnties
  }

  getEntities = (): Array<Entity> => {
    return this.entities
  }
}