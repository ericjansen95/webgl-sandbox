import { vec3 } from 'gl-matrix';
import Camera from './components/camera';
import Entity from './core/entity';
import Geometry from './components/geometry/geometry';
import Input from './core/input';
import LambertMaterial from './components/materials/lambertMaterial';
import Console from './core/console';
import Renderer from './core/renderer';
import Time from './core/time';
import Material from './components/material';
import Transform from './components/transform';
import Quad from './components/geometry/quad';
import UnlitMaterial from './components/materials/unlitMaterial';
import FlyControls from './components/controls/flyControls';
import Grid from './components/geometry/grid';

const teapotObj: string = require('/public/res/geo/teapot.txt') as string
const bunnyObj: string = require('/public/res/geo/bunny.txt') as string

const CAMERA_SPEED = 1;

// pipeline for gl draw lines
// cleanup frustrum code
// line vis for frustrum and bounding sphere / box

// add ui for culled object count

// update frustrum with camera
// camera fly controls

const main = () => {
  
  const canvas: HTMLCanvasElement = document.getElementById('glCanvas') as HTMLCanvasElement
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight

  const fpsCounter: HTMLParagraphElement = document.getElementById('fpsCounter') as HTMLParagraphElement
  const drawCounter: HTMLParagraphElement = document.getElementById('drawCounter') as HTMLParagraphElement
  const cullCounter: HTMLParagraphElement = document.getElementById('cullCounter') as HTMLParagraphElement

  const renderer = new Renderer(canvas)

  const camera: Entity = new Entity()
  camera.getComponent("Transform").setPosition([0.0, 1.0, 4.0])

  camera.addComponent(new FlyControls())
  const cameraComponent = camera.addComponent(new Camera(Math.PI * 0.5, canvas.width / canvas.height))

  const debugMaterial: Material = new UnlitMaterial([0.0, 0.75, 0.75]) as Material
  debugMaterial.wireframe = true

  const sceneRoot: Entity = new Entity()

  const grid: Entity = new Entity()
  grid.getComponent("Transform").setScale([20.0, 20.0, 20.0])
  grid.getComponent("Transform").setPosition([-5.0, 0.0, -5.0])

  grid.addComponent(new Grid(10))
  grid.addComponent(new UnlitMaterial([0.75, 0.75, 0.75])).wireframe = true

  sceneRoot.getComponent("Transform").addChild(grid)

  for(let posIndex = 0; posIndex < cameraComponent.frustrum.positions.length; posIndex += 4) {  
    const frustrumPlane = new Entity()

    const positions = cameraComponent.frustrum.positions.slice(posIndex, posIndex + 4)

    frustrumPlane.addComponent(new Quad(positions, true, false, false))
    frustrumPlane.addComponent(debugMaterial)

    sceneRoot.getComponent("Transform").addChild(frustrumPlane)
  }

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

  bunny.getComponent("Transform").setScale([0.25, 0.25, 0.25])
  bunny.getComponent("Transform").setPosition([-6.0, 0.0, 0.0])

  // assemble scene hierachy
  teapot.getComponent("Transform").addChild(bunny)
  sceneRoot.getComponent("Transform").addChild(teapot)

  /*
  const planeMaterial: Material = new UnlitMaterial([0.0, 1.0, 1.0]) as Material
  planeMaterial.wireframe = true

  const farPlane = new Entity()

  farPlane.getComponent("Transform").setPosition([1.0, 0.0, 0.0])
  farPlane.getComponent("Transform").setRotation([0.0, Math.PI * 0.5, 0.0])

  const farPlaneGeometry: Geometry = new Quad([[-0.5, -0.5, 0.0], [-0.5, 0.5, 0.0], [0.5, 0.5, 0.0], [0.5, -0.5, 0.0]]) as Geometry
  farPlane.addComponent(farPlaneGeometry)
  farPlane.addComponent(planeMaterial)

  dragon1.getComponent("Transform").addChild(farPlane);
  */

  /*

  // TERRAIN
  const terrain: Entity = new Entity()
  const terrainComponent: Component = new Terrain() as Component
  terrain.addComponent(terrainComponent)

  // WATER
  const water: Entity = new Entity()
  const waterGeometry: Geometry = new Plane(8) as Geometry
  water.addComponent(waterGeometry)
  const waterMaterial: Material = new LambertMaterial([0.831, 0.945, 0.976]) as Material
  water.addComponent(waterMaterial)

  mat4.translate(water.modelMatrix,
                 water.modelMatrix,
                 [0.0, 20.0, 0.0])

  mat4.scale(water.modelMatrix,
             water.modelMatrix,
             [100.0, 1.0, 100.0])

  terrain.children.push(water)
  */

  // register input events
  Input.init()
  Time.init(Date.now())
  Console.init(document)
  //Console.setVisible(true) 

  const update = curTime => {
    Time.tick(curTime)

    const teapotTransform = teapot.getComponent("Transform")
    teapotTransform.setRotation([0.0, teapotTransform.rotation[1] + Math.PI * 0.1 * Time.deltaTime, 0.0])

    const bunnyTransform = bunny.getComponent("Transform")
    bunnyTransform.setRotation([bunnyTransform.rotation[0] + Math.PI * 0.2 * Time.deltaTime, 0.0, 0.0])

    renderer.renderScene(sceneRoot, camera)

    // ToDo(Eric) Wrap this in Debug static class
    fpsCounter.textContent = `${Math.ceil(1 / Time.deltaTime)} FPS`

    // ToDo(Eric) Wrap this in Debug static class
    drawCounter.textContent = `${renderer.drawCalls} Draw Calls`
    cullCounter.textContent = `${renderer.cullCount} Culled Entities`

    requestAnimationFrame(update)
  }
  requestAnimationFrame(update)
}

window.onload = main;