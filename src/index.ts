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

  const plane: Entity = new Entity()

  // subdivide plane in 32 x 32 rects based of 2 triangles
  const planeGeometry: Geometry = new Plane(32) as Geometry
  plane.addComponent(planeGeometry)

  plane.material = renderer.createMaterial(vsDefaultSource, fsPhongSource)

  mat4.translate(plane.modelMatrix,
                 plane.modelMatrix,
                 [0.0, -0.25, -3.0])

  const update = curTime => {
    Time.tick(curTime)

    // WHY IS CURRENT TIME NOT WORKING?!

    renderer.renderScene(plane, camera)

    // ToDo(Eric) Wrap this in Debug static class
    fpsCounter.textContent = `${Math.ceil(1 / Time.deltaTime)} FPS`

    requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

window.onload = main;