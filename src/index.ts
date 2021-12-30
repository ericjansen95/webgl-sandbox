import { mat4, quat } from 'gl-matrix';
import Camera from './camera';
import Entity from './entity';
import Geometry from './geometry';
import Plane from './plane';
import Renderer from './renderer';
import Time from './time';

// Shader imports
const vsDefaultSource: string = require('/public/res/shader/default.vs') as string
const fsLambertSource: string = require('/public/res/shader/lambert.fs') as string
const fsPhongSource: string = require('/public/res/shader/phong.fs') as string

// Geometry imports => obj vertex and index buffers
const dragonObj: string = require('/public/res/geo/dragon.txt') as string
const bunnyObj: string = require('/public/res/geo/bunny.txt') as string
const teapotObj: string = require('/public/res/geo/teapot.txt') as string

const main = () => {
  const canvas: HTMLCanvasElement = document.getElementById('glCanvas') as HTMLCanvasElement

  canvas.width = window.innerWidth
  canvas.height = window.innerHeight

  const fpsCounter: HTMLParagraphElement = document.getElementById('fpsCounter') as HTMLParagraphElement
  
  const renderer = new Renderer(canvas)

  const camera: Camera = new Camera(45, canvas.width / canvas.height)

  // DRAGON

  const dragon: Entity = new Entity()

  const dragonGeometry: Geometry = new Geometry()
  dragonGeometry.load(dragonObj)

  //dragon.addComponent(dragonGeometry)

  dragon.material = renderer.createMaterial(vsDefaultSource, fsPhongSource)

  mat4.translate(dragon.modelMatrix,
                 dragon.modelMatrix,
                 [-2.0, 0, 0.0])

  // BUNNY

  const bunny: Entity = new Entity()

  const bunnyGeometry: Geometry = new Geometry()
  bunnyGeometry.load(bunnyObj)

  //bunny.addComponent(bunnyGeometry)

  bunny.material = renderer.createMaterial(vsDefaultSource, fsPhongSource)

  mat4.translate(bunny.modelMatrix,
                 bunny.modelMatrix,
                 [-4.0, 0, 0.0])

  bunny.children.push(dragon)   

  const plane: Entity = new Entity()

  const planeGeometry: Geometry = new Plane(32) as Geometry
  
  plane.addComponent(planeGeometry)

  plane.material = renderer.createMaterial(vsDefaultSource, fsPhongSource)

  mat4.translate(plane.modelMatrix,
                 plane.modelMatrix,
                 [0.0, 0.0, -4.0])

  console.log(plane)

  // TEAPOT               

  const teapot: Entity = new Entity()

  const teapotGeometry: Geometry = new Geometry()
  teapotGeometry.load(teapotObj)

  //teapot.addComponent(teapotGeometry)

  teapot.material = renderer.createMaterial(vsDefaultSource, fsPhongSource)

  mat4.translate(teapot.modelMatrix,
                 teapot.modelMatrix,
                 [0.0, 0.0, -4.0])

  teapot.children.push(bunny) 
  teapot.children.push(plane)  

  const update = curTime => {
    Time.tick(curTime)

    // WHY IS CURRENT TIME NOT WORKING?!

    /*
    mat4.rotate(teapot.modelMatrix,
      teapot.modelMatrix,
      Math.PI * 0.016,
      [0.0, 1.0, 0.0])

    mat4.rotate(bunny.modelMatrix,
        bunny.modelMatrix,
        Math.PI * 0.016,
        [0.0, 1.0, 0.0])
    */

    renderer.renderScene(plane, camera)

    // ToDo(Eric) Wrap this in Debug static class
    fpsCounter.textContent = `${Math.ceil(1 / Time.deltaTime)} FPS`

    requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

window.onload = main;