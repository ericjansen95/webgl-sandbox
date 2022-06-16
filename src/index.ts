import Camera from './core/components/base/camera';
import Entity from './core/scene/entity';
import Input from './core/internal/input';
import LambertMaterial from './core/components/material/lambertMaterial';
import Debug from './core/internal/debug';
import Renderer from './core/scene/renderer';
import Time from './core/internal/time';
import Material from './core/components/material/material';
import FlyControls from './core/components/controls/flyControls';
import Terrain from './core/components/geometry/terrain';
import Client from './core/network/client';
import Scene from './core/scene/scene';
import Quad from './core/components/geometry/quad';
import UnlitMaterial from './core/components/material/unlitMaterial';
import GltfLoader from './core/loader/gltfLoader';
import Transform from './core/components/base/transform';
import { ComponentType } from './core/components/base/component';

/*

  Ideas:
  - scene skybox
  - update terrain lod
  - thirdPersonControls
  - animation => skinning matrix
  - device capibility check and lod (mesh, shader, textures, ...)
  - streaming (network and scene)
  - scene, sceneNetworkController, remoteClient Component, networkedTransfrom Component
  - ContextConsumer
  - module bundle namespace
  - app-sandbox
  - level wording
  - base-server, chat-server, scene-server

  ToDo:
  - transform local vs global
  - clientId
  - server network package verification => block unallowed
  - server client authentication
  - server append clientId
  - client do not send client id in packages
  - light rotations
  - game network manager => create local and remote client compoents for entities
  - reduce matrix multipications => cache bounding volume data
  - server connect with same client id after reload
  - come up with a dynamic networking model => check o3d engine talk (state, event, ...)
  - make component state easily serializable by adding functions to interface
  - canvas resize event
  - namespaces and core engine class that abstracts initialisation (and entity assemby?)
  - instanced mesh system
  - fix obj loader
  - camera frustrum performance
  - better material attrib pipeline
  - Component query => enum and int key resolve / handle components in array
  - abstract component constructor arguments into options objects
  - rename wording for channels to "SCENE" and "CHAT"

*/

const main = async () => {
  Time.init()
  Debug.init()
  Input.init()

  const canvas = document.getElementById('glCanvas') as HTMLCanvasElement
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight

  const renderer = new Renderer(canvas)

  const sceneCamera: Entity = new Entity()
  sceneCamera.getComponent(ComponentType.TRANSFORM).setPosition([0.0, 0.0, 10.0])
  const camera = sceneCamera.addComponent(new Camera(Math.PI * 0.3, canvas.width / canvas.height))

  const debugCamera: Entity = new Entity()
  debugCamera.getComponent(ComponentType.TRANSFORM).setPosition([0.0, 1.0, 4.0])
  debugCamera.addComponent(new FlyControls())
  debugCamera.addComponent(new Camera(Math.PI * 0.3, canvas.width / canvas.height))

  //const client: Client = new Client(dynamicCamera)
  const scene: Scene = new Scene()

  // debug vis for camera frustrum
  const debugMaterial = new UnlitMaterial([1.0, 0.0, 1.0]) as Material

  for(let posIndex = 0; posIndex < camera.frustrum.positions.length; posIndex += 4) {  
    const frustrumPlane = new Entity()

    const positions = camera.frustrum.positions.slice(posIndex, posIndex + 4)

    frustrumPlane.addComponent(new Quad(positions, true, false, false))
    frustrumPlane.addComponent(debugMaterial)

    sceneCamera.getComponent(ComponentType.TRANSFORM).addChild(frustrumPlane)
  }

  const { geometry } = await new GltfLoader().load("http://localhost:8080/res/geo/testGeo.gltf")

  const lambertMaterial: Material = new LambertMaterial([1.0, 1.0, 1.0]) as Material

  for(let geoIndex = 0; geoIndex < geometry.length; geoIndex++) {
    const entity: Entity = new Entity()
    entity.getComponent(ComponentType.TRANSFORM).setPosition([0.0, 1.0, -2.0 * geoIndex])
    entity.addComponent(geometry[geoIndex])
    entity.addComponent(lambertMaterial)

    scene.root.getComponent(ComponentType.TRANSFORM).addChild(entity)
  }

  const terrain: Entity = new Entity()
  terrain.addComponent(new Terrain())

  scene.root.getComponent(ComponentType.TRANSFORM).addChild(terrain)
  scene.root.getComponent(ComponentType.TRANSFORM).addChild(sceneCamera)

  const update = curTime => {
    Time.tick(curTime)

    //const sceneCameraTransform = sceneCamera.getComponent("Transform")
    //sceneCameraTransform.setRotation([0.0, Math.cos((Date.now() - Time.startTime) * 0.0005) * Math.PI * 0.25, 0.0])

    scene.update(sceneCamera)
    
    debugCamera.getComponent(ComponentType.CONTROLS).onUpdate(debugCamera, debugCamera)
    debugCamera.getComponent(ComponentType.TRANSFORM).onUpdate(debugCamera, debugCamera)
    debugCamera.getComponent(ComponentType.CAMERA).onUpdate(debugCamera, debugCamera)

    renderer.renderEntities(scene.getVisibleEntities(sceneCamera), debugCamera)

    requestAnimationFrame(update)
  }
  requestAnimationFrame(update)
}

window.onload = main;