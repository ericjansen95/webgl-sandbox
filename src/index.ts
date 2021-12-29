import { mat4 } from 'gl-matrix';
import Camera from './camera';
import Entity from './entity';
import Renderer from './renderer';

const vsDefaultSource: string = require('/public/res/shader/default.vs') as string
const fsLambertSource: string = require('/public/res/shader/lambert.fs') as string
const fsPhongSource: string = require('/public/res/shader/phong.fs') as string

const dragonObj: string = require('/public/res/geo/dragon.txt') as string
const bunnyObj: string = require('/public/res/geo/bunny.txt') as string
const teapotObj: string = require('/public/res/geo/teapot.txt') as string

const main = () => {
  const canvas: HTMLCanvasElement = document.getElementById('glCanvas') as HTMLCanvasElement

  canvas.width = window.innerWidth
  canvas.height = window.innerHeight

  const fpsCounter: HTMLBodyElement = document.getElementById('fpsCounter') as HTMLBodyElement
  
  const renderer = new Renderer(canvas)

  const camera: Camera = new Camera(45, canvas.width / canvas.height)

  const dragon: Entity = new Entity()
  dragon.geometry.load(dragonObj)
  dragon.material = renderer.createMaterial(vsDefaultSource, fsPhongSource)

  mat4.translate(dragon.modelMatrix,
                 dragon.modelMatrix,
                 [0.0, 0.0, -4.0])

  const bunny: Entity = new Entity()
  bunny.geometry.load(bunnyObj)
  bunny.material = renderer.createMaterial(vsDefaultSource, fsPhongSource)

  mat4.translate(bunny.modelMatrix,
                 bunny.modelMatrix,
                 [0.0, 1.0, 0.0])

  const teapot: Entity = new Entity()
  teapot.geometry.load(teapotObj)
  teapot.material = renderer.createMaterial(vsDefaultSource, fsPhongSource)

  mat4.translate(teapot.modelMatrix,
                 teapot.modelMatrix,
                 [0.0, -1.0, 0.0])

  dragon.children = [bunny, teapot]               

  let then = 0;

  const update = now => {
    now *= 0.001;
    const deltaTime = now - then;
    then = now;

    renderer.renderScene(dragon, camera, deltaTime)

    fpsCounter.textContent = `${Math.ceil(1 / deltaTime)} FPS`

    requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

window.onload = main;