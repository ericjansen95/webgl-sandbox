import { mat4, vec3 } from 'gl-matrix';
import Camera from './camera';
import Entity from './entity';
import Geometry from './components/geometry';
import Input from './input';
import LambertMaterial from './components/materials/lambertMaterial';
import Plane from './plane';
import Console from './console';
import Renderer from './renderer';
import Time from './time';
import Material from './material';
import Terrain from './components/terrain';
import { Component } from './components/component';
import Transform from './components/transform';
import Aabb from './components/aabb';

const dragonObj: string = require('/public/res/geo/dragon.txt') as string

const CAMERA_SPEED = 1;

const main = () => {
  
  const canvas: HTMLCanvasElement = document.getElementById('glCanvas') as HTMLCanvasElement

  canvas.width = window.innerWidth
  canvas.height = window.innerHeight

  const fpsCounter: HTMLParagraphElement = document.getElementById('fpsCounter') as HTMLParagraphElement
  const drawCounter: HTMLParagraphElement = document.getElementById('drawCounter') as HTMLParagraphElement

  const renderer = new Renderer(canvas)

  const camera: Camera = new Camera(45, canvas.width / canvas.height)


  const dragonGeometry: Geometry = new Geometry()
  dragonGeometry.load(dragonObj)

  const dragonMaterial: Material = new LambertMaterial([1.0, 1.0, 1.0]) as Material

  const dragonAabb: Aabb = new Aabb()
  
  const dragonAabb2: Aabb = new Aabb()

  const dragon: Entity = new Entity()
  dragon.addComponent(dragonGeometry)
  dragon.addComponent(dragonMaterial)
  dragon.addComponent(dragonAabb)

  const dragon2: Entity = new Entity()
  dragon2.addComponent(dragonGeometry)
  dragon2.addComponent(dragonMaterial)
  dragon2.addComponent(dragonAabb2)
    
  dragon2.getComponent(Aabb).setVisible(false)

  dragon.getComponent(Transform).setRotation([0.0, Math.PI * 0.5, 0.0])
  dragon.getComponent(Transform).setPosition([-1.0, 0.0, 0.0])

  dragon2.getComponent(Transform).setScale([0.25, 0.25, 0.25])
  dragon2.getComponent(Transform).setRotation([0.0, Math.PI * 0.5, 0.0])
  dragon2.getComponent(Transform).setPosition([-1.0, 0.0, 0.0])

  dragon.getComponent(Transform).addChild(dragon2)
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
  Input.init(document)
  Time.init(Date.now())
  Console.init(document)
  //Console.setVisible(true) 

  // ToDo(Eric) Move this into global input system which allows keybinds               
  let inputDir: vec3 = vec3.create();  

  const update = curTime => {
    Time.tick(curTime)

    // ToDo(Eric) Handle multi key down event
    // ToDo(Eric) Handle single shot get key down vs is key pressed
    inputDir = [Input.isKeyDown('a') ? 1.0 : Input.isKeyDown('d') ? -1.0 : 0.0,
                Input.isKeyDown('q') ? 1.0 : Input.isKeyDown('e') ? -1.0 : 0.0,
                Input.isKeyDown('w') ? 1.0 : Input.isKeyDown('s') ? -1.0 : 0.0]           

    // move camera
    mat4.translate(camera.viewMatrix,
                   camera.viewMatrix,
                   vec3.scale(vec3.create(), 
                              inputDir, 
                              CAMERA_SPEED * Time.deltaTime))

    const transform = dragon.getComponent(Transform)
    transform.setRotation([0.0, transform.rotation[1] + Math.PI * 0.1 * Time.deltaTime, 0.0])
    console.log("dragon y rotation =", transform.rotation[1])

    renderer.renderScene(dragon, camera)

    // ToDo(Eric) Wrap this in Debug static class
    fpsCounter.textContent = `${Math.ceil(1 / Time.deltaTime)} FPS`

    // ToDo(Eric) Wrap this in Debug static class
    drawCounter.textContent = `${renderer.drawCalls} Draw Calls >:[`

    requestAnimationFrame(update)
  }
  requestAnimationFrame(update)
}

window.onload = main;