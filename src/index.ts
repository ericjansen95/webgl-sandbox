import Camera from './core/components/camera';
import Entity from './core/scene/entity';
import Geometry from './core/components/geometry/geometry';
import Input from './core/internal/input';
import LambertMaterial from './core/components/materials/lambertMaterial';
import Debug from './core/internal/debug';
import Renderer from './core/scene/renderer';
import Time from './core/internal/time';
import Material from './core/components/material';
import FlyControls from './core/components/controls/flyControls';
import Terrain from './core/components/terrain';
import Client from './core/network/client';
import Scene from './core/scene/scene';
import Quad from './core/components/geometry/quad';
import UnlitMaterial from './core/components/materials/unlitMaterial';

const teapotObj: string = require('/public/res/geo/teapot.txt') as string
const bunnyObj: string = require('/public/res/geo/bunny.txt') as string

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
  - culling
  - light rotations
  - bounding volume abstraction with class
  - game network manager => create local and remote client compoents for entities
  - reduce matrix multipications => cache bounding volume data
  - server connect with same client id after reload
  - split build scene graph and component updates => "parralize" by updating async and building scene graph => is this possible without cache?
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

const main = () => {
  Time.init()
  Debug.init()
  Input.init()

  const canvas = document.getElementById('glCanvas') as HTMLCanvasElement
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight

  const renderer = new Renderer(canvas)

  const sceneCamera: Entity = new Entity()
  sceneCamera.getComponent("Transform").setPosition([0.0, 0.0, -200.0])
  const camera = sceneCamera.addComponent(new Camera(Math.PI * 0.3, canvas.width / canvas.height))

  const debugCamera: Entity = new Entity()
  debugCamera.getComponent("Transform").setPosition([0.0, 1.0, 4.0])
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

    sceneCamera.getComponent("Transform").addChild(frustrumPlane)
  }

  const lambertMaterial: Material = new LambertMaterial([1.0, 1.0, 1.0]) as Material

  const teapot: Entity = new Entity()
  teapot.getComponent("Transform").setPosition([0.0, 0.5, 0.0])
  const teapotGeometry: Geometry = new Geometry()
  teapotGeometry.loadFromObj(teapotObj)
  teapot.addComponent(teapotGeometry)
  teapot.addComponent(lambertMaterial)

  const bunny: Entity = new Entity()
  bunny.getComponent("Transform").setScale([0.5, 0.5, 0.5])
  bunny.getComponent("Transform").setPosition([-5.0, 0.0, 0.0])
  const bunnyGeometry: Geometry = new Geometry()
  bunnyGeometry.loadFromObj(bunnyObj)
  bunny.addComponent(bunnyGeometry)
  bunny.addComponent(lambertMaterial)

  // assemble scene hierachy
  teapot.getComponent("Transform").addChild(bunny)
  scene.root.getComponent("Transform").addChild(teapot)

  const terrain: Entity = new Entity()
  terrain.addComponent(new Terrain())

  scene.root.getComponent("Transform").addChild(terrain)
  scene.root.getComponent("Transform").addChild(sceneCamera)
  // water

  /*
  const water: Entity = new Entity()
  water.addComponent(new Plane(8))
  water.addComponent(new LambertMaterial([0.831, 0.945, 0.976]))

  water.getComponent("Transform").setScale([2000, 1.0, 2000])
  water.getComponent("Transform").setPosition([-1000.0, -0.1, -1000.0])

  sceneRoot.getComponent("Transform").addChild(water)
  */

  const update = curTime => {
    Time.tick(curTime)

    const teapotTransform = teapot.getComponent("Transform")
    teapotTransform.setRotation([0.0, teapotTransform.rotation[1] + Math.PI * 0.1 * Time.deltaTime, 0.0])

    const bunnyTransform = bunny.getComponent("Transform")
    bunnyTransform.setRotation([bunnyTransform.rotation[0] + Math.PI * 0.2 * Time.deltaTime, 0.0, 0.0])

    const sceneCameraTransform = sceneCamera.getComponent("Transform")
    sceneCameraTransform.setRotation([0.0, Math.cos((Date.now() - Time.startTime) * 0.0005) * Math.PI * 0.25, 0.0])

    scene.update(sceneCamera)
    
    debugCamera.getComponent("FlyControls").onUpdate(debugCamera, debugCamera)
    debugCamera.getComponent("Transform").onUpdate(debugCamera, debugCamera)
    debugCamera.getComponent("Camera").onUpdate(debugCamera, debugCamera)

    renderer.renderEntities(scene.getVisibleEntities(sceneCamera), debugCamera)

    requestAnimationFrame(update)
  }
  requestAnimationFrame(update)
}

window.onload = main;