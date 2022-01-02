import { mat4, vec3 } from 'gl-matrix';
import Camera from './camera';
import Entity from './entity';
import Geometry from './geometry';
import Input from './input';
import LambertMaterial from './materials/lambertMaterial';
import TerrainMaterial from './materials/terrainMaterial';
import Plane from './plane';
import Renderer from './renderer';
import Time from './time';

const main = () => {
  const canvas: HTMLCanvasElement = document.getElementById('glCanvas') as HTMLCanvasElement

  canvas.width = window.innerWidth
  canvas.height = window.innerHeight

  const fpsCounter: HTMLParagraphElement = document.getElementById('fpsCounter') as HTMLParagraphElement
  
  const renderer = new Renderer(canvas)

  const camera: Camera = new Camera(45, canvas.width / canvas.height)

  // TERRAIN
  const terrain: Entity = new Entity()

  const terrainGeometry: Geometry = new Plane(1024) as Geometry
  terrain.addComponent(terrainGeometry)

  terrain.material = new TerrainMaterial(renderer, "/res/tex/antarticaHeightmap.png")       

  // WATER
  const water: Entity = new Entity()

  const waterGeometry: Geometry = new Plane(8) as Geometry
  water.addComponent(waterGeometry)

  water.material = new LambertMaterial(renderer, [0.831, 0.945, 0.976])

  mat4.translate(water.modelMatrix,
                 water.modelMatrix,
                 [0.0, 0.001, 0.0])

  mat4.scale(water.modelMatrix,
             water.modelMatrix,
             [100.0, 1.0, 100.0])

  terrain.children.push(water)

  // register input events
  Input.init(document)
  Time.init(Date.now())

  // ToDo(Eric) Move this into global input system which allows keybinds               
  let inputDir: vec3 = vec3.create();  

  const update = curTime => {
    Time.tick(curTime)

    // ToDo(Eric) Handle multi key down event
    inputDir = [Input.isKeyDown('a') ? 1.0 : Input.isKeyDown('d') ? -1.0 : 0.0,
                Input.isKeyDown('q') ? 1.0 : Input.isKeyDown('e') ? -1.0 : 0.0,
                Input.isKeyDown('w') ? 1.0 : Input.isKeyDown('s') ? -1.0 : 0.0]

    // WHY IS CURRENT TIME NOT WORKING?!

    // move camera
    mat4.translate(camera.viewMatrix,
                   camera.viewMatrix,
                   vec3.scale(vec3.create(), 
                              inputDir, 
                              0.25 * Time.deltaTime))

    renderer.renderScene(terrain, camera)

    // ToDo(Eric) Wrap this in Debug static class
    fpsCounter.textContent = `${Math.ceil(1 / Time.deltaTime)} FPS`

    requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

window.onload = main;