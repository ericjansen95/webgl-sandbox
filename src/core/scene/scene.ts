import BoundingVolume from "../components/boundingVolume/boundingVolume";
import Camera from "../components/base/camera";
import Debug from "../internal/debug";
import WebRTCClient from "../network/webRTCClient";
import SceneNetworkController from "../network/sceneNetworkController";
import Entity from "./entity";
import { ComponentType } from "../components/base/component";
import Transform from "../components/base/transform";
import Geometry from "../components/geometry/geometry";
import AudioController from "../internal/audio";
import Physics from "../internal/physics";
import { roundNumber } from "../../util/math/round";
import Trigger from "../components/trigger/trigger";
import GridGeometry from "../components/geometry/grid";
import UnlitMaterial from "../components/material/unlitMaterial";

export type SceneStats = {
  updateTime: number
  localMatrixUpdates: number
  entityCount: number
  cullTime: number
  cullCount: number
}

export default class Scene {
  stats: SceneStats

  root: Entity
  camera: Entity

  entities: Array<Entity>
  trigger: Array<Trigger>

  audioController: AudioController
  networkController: SceneNetworkController

  constructor(camera: Entity, clientEntity: Entity | null = null, client: WebRTCClient | null = null) {
    this.root = new Entity()
    this.camera = camera
    // ToDo: Add entities with scene.add() instead while update loop?
    // handle entity passing with integer id?
    this.entities = new Array<Entity>()
    this.stats = {
      updateTime: 0,
      localMatrixUpdates: 0,
      entityCount: 0,
      cullTime: 0,
      cullCount: 0
    }

    const grid: Entity = new Entity()
    grid.get(ComponentType.TRANSFORM).setLocalScale([10.0, 10.0, 10.0])
    grid.get(ComponentType.TRANSFORM).setLocalPosition([-5.0, 0.0, -5.0])
    grid.add(new GridGeometry(10))
    grid.add(new UnlitMaterial([0.75, 0.75, 0.75]))
    this.root.get(ComponentType.TRANSFORM).add(grid)

    Debug.console.registerCommand({ name: "bv", description: "Visualize bounding volumes.", callback: this.toggleBoundingVolumes })
    Debug.console.registerCommand({ name: "cf", description: "Visualize camera frustrum.", callback: this.toggleCameraFrustrum })

    this.audioController = new AudioController()

    if(!clientEntity || !client) return

    this.networkController = new SceneNetworkController(this.root, clientEntity, client.userId)
  }

  update = () => {
    this.stats.localMatrixUpdates = 0

    this.entities = []
    this.trigger = []
    Physics.reset()

    const startTime = window.performance.now()

    this.updateEntity(this.root, this.camera, true)

    this.stats.updateTime = roundNumber(window.performance.now() - startTime)
    this.stats.entityCount = this.entities.length

    Physics.update()

    for(const trigger of this.trigger)
      trigger.update(this.entities)

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
    if(entity.get(ComponentType.TRANSFORM).onUpdate()) this.stats.localMatrixUpdates++
  }

  updateEntityComponents = (entity: Entity, camera: Entity): void => {
    const { components } = entity

    for(let componentType = 1; componentType < components.length; componentType++) {
      const component: any = components[componentType]
      if(!component) continue

      if(component.onUpdate) component.onUpdate(entity, camera)

      switch (componentType) {
        case ComponentType.COLLIDER:
          Physics.addCollider(component)
          break
        case ComponentType.RIGIDBODY:
          Physics.addRigidbody(component)
          break
        case ComponentType.AUDIO_SOURCE:
          component.bind(this.audioController.state?.context) //ToDo: Change this to be handled in controller?
          break
        case ComponentType.TRIGGER:
          this.trigger.push(component)
          break
      }
    }
  }

  // this returns a "display list" for all visible entities that are in the camera frustrum
  getVisibleEntities = (): Array<Entity> => {
    const startTime = window.performance.now()

    const cameraComponent = this.camera.get(ComponentType.CAMERA) as Camera

    const visibleEnties = this.getEntities().filter(entity => cameraComponent.isEntityInFrustrum(entity))

    this.stats.cullTime = roundNumber(window.performance.now() - startTime)
    this.stats.cullCount = this.stats.entityCount - visibleEnties.length

    Debug.updateStats({scene: this.stats})

    return visibleEnties
  }

  getEntities = (): Array<Entity> => {
    return this.entities
  }

  add = (entity: Entity): Entity => {
    const rootTransform = this.root.get(ComponentType.TRANSFORM) as Transform
    rootTransform.add(entity)
    return entity
  }

  toggleBoundingVolumes = (): string => {
    if(!this.root) return "Failed toggeling bounding volumes = no scene root found!"

    const toggleBoundingVolume = (entity: Entity) => {
      const boundingVolume = entity.get(ComponentType.BOUNDING_VOLUME) as BoundingVolume
      if(!boundingVolume) return

      boundingVolume.setVisible(!boundingVolume.visible)
    }

    for(const entity of this.entities)
      toggleBoundingVolume(entity)

    return "Renderer::toggleBondingVolumes(): Toggled bounding volumes."
  }

  toggleCameraFrustrum = (): string => {
    if(!this.root) return "Failed toggeling camera frustrum = no scene root found!"

    const toggleFrustrumPlane = (frustrumPlane: Entity) => {
      const frustrumPlaneGeometry = frustrumPlane.get(ComponentType.GEOMETRY) as Geometry
      frustrumPlaneGeometry.visible = !frustrumPlaneGeometry.visible
    }

    for(const frustrumPlane of this.camera)
      toggleFrustrumPlane(frustrumPlane)

    return "Renderer::toggleBondingVolumes(): Toggled camera frustrum."
  }
}