import Camera from './components/camera';
import Entity from './core/entity';
import Geometry from './components/geometry/geometry';
import Input from './core/input';
import LambertMaterial from './components/materials/lambertMaterial';
import Debug from './core/debug';
import Renderer from './core/renderer';
import Time from './core/time';
import Material from './components/material';
import UnlitMaterial from './components/materials/unlitMaterial';
import FlyControls from './components/controls/flyControls';
import Grid from './components/geometry/grid';
import Terrain from './components/terrain';

const teapotObj: string = require('/public/res/geo/teapot.txt') as string
const bunnyObj: string = require('/public/res/geo/bunny.txt') as string

const main = () => {
  
  const canvas: HTMLCanvasElement = document.getElementById('glCanvas') as HTMLCanvasElement
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight

  const renderer = new Renderer(canvas)

  const camera: Entity = new Entity()
  camera.getComponent("Transform").setPosition([0.0, 1.0, 4.0])

  camera.addComponent(new FlyControls())
  const cameraComponent = camera.addComponent(new Camera(Math.PI * 0.3, canvas.width / canvas.height))

  const debugMaterial: Material = new UnlitMaterial([0.0, 0.75, 0.75]) as Material

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

  //bunny.getComponent("Transform").setScale([0.25, 0.25, 0.25])
  bunny.getComponent("Transform").setPosition([-6.0, 0.0, 0.0])

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
  Time.init(Date.now())
  Debug.init()

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