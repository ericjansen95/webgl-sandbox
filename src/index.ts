import Camera from './core/components/camera';
import Entity from './core/scene/entity';
import Geometry from './core/components/geometry/geometry';
import Input from './core/internal/input';
import LambertMaterial from './core/components/materials/lambertMaterial';
import Debug from './core/internal/debug';
import Renderer from './core/scene/renderer';
import Time from './core/internal/time';
import Material from './core/components/material';
import UnlitMaterial from './core/components/materials/unlitMaterial';
import FlyControls from './core/components/controls/flyControls';
import Grid from './core/components/geometry/grid';
import Terrain from './core/components/terrain';
import Client from './core/network/client';
import GameNetworkController from './core/network/gameNetworkController';
import Transform from './core/components/transform';

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

  ToDo:
  - clientId
  - server network package verification => block unallowed
  - server client authentication
  - server append clientId
  - client do not send client id in packages
  - culling
  - light rotations
  - terrain normal lookup
  - terrain border
  - bounding volume abstraction with class
  - game network manager => create local and remote client compoents for entities
  - reduce matrix multipications => cache bounding volume data
  - server delta compression
  - server client tick negotation
  - server game client connect inital transform
  - server connect with same client id after reload
  - monorepo => frontend, game-server (chat-server, auth-server, ...), engine, cms, tools (blender, pipeline)
  - name for project
  - split build scene graph and component updates => "parralize" by updating async and building scene graph => is this possible without cache?
  - come up with a dynamic networking model => check o3d engine talk (state, event, ...)
  - make component state easily serializable by adding functions to interface
  - canvas resize event
  - namespaces and core engine class that abstracts initialisation (and entity assemby?)
  - instanced mesh system
  - fix obj loader
  - camera frustrum performance
  - network entity interpolation
  - better material attrib pipeline
  - webgl2.0
  - Component query
  - abstract component constructor arguments into options objects

*/

const main = () => {
  
  const canvas: HTMLCanvasElement = document.getElementById('glCanvas') as HTMLCanvasElement
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight

  Debug.init()
  const renderer = new Renderer(canvas)

  const camera: Entity = new Entity()
  camera.getComponent("Transform").setPosition([0.0, 1.0, 4.0])

  camera.addComponent(new FlyControls())
  camera.addComponent(new Camera(Math.PI * 0.3, canvas.width / canvas.height))

  const sceneRoot: Entity = new Entity()

  const grid: Entity = new Entity()
  grid.getComponent("Transform").setScale([10.0, 10.0, 10.0])
  grid.getComponent("Transform").setPosition([-5.0, 0.0, -5.0])

  grid.addComponent(new Grid(10))
  grid.addComponent(new UnlitMaterial([0.75, 0.75, 0.75]))

  sceneRoot.getComponent("Transform").addChild(grid)

  // debug vis for camera frustrum

  /*
  for(let posIndex = 0; posIndex < cameraComponent.frustrum.positions.length; posIndex += 4) {  
    const frustrumPlane = new Entity()

    const positions = cameraComponent.frustrum.positions.slice(posIndex, posIndex + 4)

    frustrumPlane.addComponent(new Quad(positions, true, false, false))
    frustrumPlane.addComponent(debugMaterial)

    camera.getComponent("Transform").addChild(frustrumPlane)
  }
  */

  const lambertMaterial: Material = new LambertMaterial([1.0, 1.0, 1.0]) as Material

  const teapot: Entity = new Entity()
  const teapotGeometry: Geometry = new Geometry()
  teapotGeometry.loadFromObj(teapotObj)
  teapot.addComponent(teapotGeometry)
  teapot.addComponent(lambertMaterial)

  teapot.getComponent("Transform").setPosition([0.0, 0.5, 0.0])

  const bunny: Entity = new Entity()
  const bunnyGeometry: Geometry = new Geometry()
  bunnyGeometry.loadFromObj(bunnyObj)
  bunny.addComponent(bunnyGeometry)
  
  bunny.addComponent(lambertMaterial)

  bunny.getComponent("Transform").setScale([0.5, 0.5, 0.5])
  bunny.getComponent("Transform").setPosition([-5.0, 0.0, 0.0])

  // assemble scene hierachy
  teapot.getComponent("Transform").addChild(bunny)
  sceneRoot.getComponent("Transform").addChild(teapot)

  const terrain: Entity = new Entity()
  terrain.addComponent(new Terrain())

  sceneRoot.getComponent("Transform").addChild(terrain)

  // water

  /*
  const water: Entity = new Entity()
  water.addComponent(new Plane(8))
  water.addComponent(new LambertMaterial([0.831, 0.945, 0.976]))

  water.getComponent("Transform").setScale([2000, 1.0, 2000])
  water.getComponent("Transform").setPosition([-1000.0, -0.1, -1000.0])

  sceneRoot.getComponent("Transform").addChild(water)
  */
 
  // register input events
  Input.init()
  Time.init()

  const client: Client = new Client(camera.getComponent("Transform") as Transform)
  const gameNetworkController: GameNetworkController = new GameNetworkController(client, sceneRoot, camera)

  const update = curTime => {
    Time.tick(curTime)

    const teapotTransform = teapot.getComponent("Transform")
    teapotTransform.setRotation([0.0, teapotTransform.rotation[1] + Math.PI * 0.1 * Time.deltaTime, 0.0])

    const bunnyTransform = bunny.getComponent("Transform")
    bunnyTransform.setRotation([bunnyTransform.rotation[0] + Math.PI * 0.2 * Time.deltaTime, 0.0, 0.0])

    renderer.renderScene(sceneRoot, camera)

    Debug.update({renderer: {drawCalls: renderer.drawCalls, cullCount: renderer.cullCount}})

    requestAnimationFrame(update)
  }
  requestAnimationFrame(update)
}

window.onload = main;