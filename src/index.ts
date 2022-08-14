import Camera from './core/components/base/camera';
import Entity from './core/scene/entity';
import Material from './core/components/material/material';
import { ComponentType as Component, ComponentType } from './core/components/base/component';
import Turntable from './core/components/scripts/turntable';
import Engine from './core/engine';
import loadGltf from './util/loader/gltfLoader';
import Debug from './core/internal/debug';
import FresnelMaterial from './core/components/material/fresnelMaterial';
import SkinnedLambertMaterial from './core/components/material/skinnedLambert';
import GeometryCollider from './core/components/collider/geometryCollider';
import ThirdPersonControls from './core/components/controls/thirdPersonControls';
import Transform from './core/components/base/transform';
import Animator from './core/components/animation/animator';
import Ray from './core/components/geometry/ray';
import UnlitMaterial from './core/components/material/unlitMaterial';
import NormalMaterial from './core/components/material/normalMaterial';
import AudioSource from './core/components/audio/audioSource';
import Label from './core/components/ui/label';
import { vec3 } from 'gl-matrix';
import Terrain from './core/components/scripts/terrain';
import Collider from './core/components/collider/collider';
import UnlitTextureMaterial from './core/components/material/unlitTextureMaterial';
import Texture from './core/renderer/texture';
import GrassMaterial from './core/components/material/grassMaterial';
import Geometry from './core/components/geometry/geometry';
import { createPlayer, PlayerType } from './util/helper/player';
import Trigger from './core/components/trigger/trigger';

/*

  General Architecture:
  - wrapped state, stats, config CLOSE
  - options objects for parameters CLOSE
  - self refference by default in component
  - namespaces and modules
  - singeltons instead of static classes
  - camera creating wrapper
  - material uniform pipeline
  - event bus DONE => use vanilla js custom events

  First Playable:
  - multi hirachial joint skinning DONE
  - uv driven texture mapping DONE
  - collision => ray triangle intersection DONE
  - basic audio => emitter and listener DONE
  - third person controller => DONE
  - wall collision - sphere / circle raycaster DONE
  - entity tags DONE => for now with entity uuid DONE
  - collision info that includes enitity ref DONE
  - trigger zones (aabb) DONE
  - abstract physics raycast logic with static interface DONE

  Ideas:
  - scene skybox
  - update terrain lod
  - device capibility check and lod (mesh, shader, textures, ...)
  - streaming (network and scene)
  - scene, sceneNetworkController, remoteClient Component, networkedTransfrom Component
  - app-sandbox
  - level wording
  - base-server, chat-server, scene-server

  ToDo:
  - override collision geometry with simplified version
  - skinned geometry stats
  - heightmap performance and sample interpolation
  - firefox fixes and optimizations
  - min max from gltf and fallback calculation
  - reduce matrix multipications => cache bounding volume data
  - namespaces that abstracts initialisation (and entity assemby?)

  - clientId
  - server abstraction with base architecture that can be shared by scene, com and chat server
  - server network package verification => block unallowed
  - server client authentication
  - server append clientId
  - client do not send client id in packages
  - game network manager => create local and remote client compoents for entities
  - server connect with same client id after reload
  - come up with a dynamic networking model => check o3d engine talk (state, event, ...)

  - acceleraton velocity for third person controller ~ 0.68 m/s^2
  - instanced mesh system
  - camera frustrum performance
  - rename wording for channels to "SCENE" and "CHAT"
  - return entity ref in IntersectionInfo
  - shared physics and movement code from server => go compiled to wasm

*/

const main = () => {
  const canvas = document.getElementById('glCanvas') as HTMLCanvasElement
  canvas.width = 1024
  canvas.height = 576
  canvas.style.cssText = "width: 100%; height: 100%;"
  
  /*
  const updateCanvasSize = () => {
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
  }

  updateCanvasSize()

  window.addEventListener('resize', updateCanvasSize)
  */
  const sceneCamera: Entity = new Entity()
  sceneCamera.add(new Camera(Math.PI * 0.3))

  const engine = new Engine(canvas, sceneCamera)

  engine.scene.add(sceneCamera)

  /*
  const trigger = new Entity()
  trigger.get(ComponentType.TRANSFORM).setLocalPosition([0, 0.25, -2])
  const triggerComponent = new Trigger(vec3.fromValues(1.0, 1.0, 1.0))
  trigger.add(triggerComponent)

  triggerComponent.setVisible(true)
  engine.scene.add(trigger)
  */
 
  const audioSource = new Entity()
  audioSource.add(new AudioSource("http://localhost:8080/res/audio/song.mp3"))
  engine.scene.add(audioSource)

  /*
  const terrain: Entity = new Entity()
  terrain.add(new Terrain())
  const terrainCollider = terrain.get(Component.COLLIDER) as Collider

  engine.scene.add(terrain)
  */

  loadGltf("http://localhost:8080/res/geo/cube.gltf").then((entities) => {
    for(const entity of entities) {
      entity.add(Debug.material)
      entity.get(ComponentType.TRANSFORM).setLocalPosition(vec3.fromValues(1, 2, -2))
      entity.add(new GeometryCollider())

      engine.scene.add(entity)
    }
  }).catch((error) => Debug.error(`index::loadGltf(): Failed loading test collision geometry = ${error}`))

  loadGltf("http://localhost:8080/res/geo/testCollisionGeo.gltf").then((entities) => {
    for(const entity of entities) {
      entity.add(new UnlitTextureMaterial(new Texture("http://localhost:8080/res/map/checkerMap.png")))
      entity.add(new GeometryCollider())

      engine.scene.add(entity)
    }
  }).catch((error) => Debug.error(`index::loadGltf(): Failed loading test collision geometry = ${error}`))

  /*
  loadGltf("http://localhost:8080/res/geo/room.gltf").then((entities) => {
    for(const entity of entities) {
      entity.add(new UnlitTextureMaterial(new Texture("http://localhost:8080/res/map/checkerMap.png")))

      engine.scene.add(entity)
    }
  }).catch((error) => Debug.error(`index::loadGltf(): Failed loading test collision geometry = ${error}`))
  */

  /*
  loadGltf("http://localhost:8080/res/geo/cube.gltf").then((entities) => {
    for(const entity of entities) {
      entity.add(new UnlitTextureMaterial(new Texture("http://localhost:8080/res/map/alphaTestMap.png")))

      engine.scene.add(entity)
    }
  }).catch((error) => Debug.error(`index::loadGltf(): Failed loading test collision geometry = ${error}`))
  */

  /*
  const grassMaterial = new GrassMaterial(new Texture("http://localhost:8080/res/map/grassMaskMap.png"))

  loadGltf("http://localhost:8080/res/geo/grassChunk.gltf").then((entities) => {
    for(const entity of entities) {
      const grassGeometry = entity.get(Component.GEOMETRY) as Geometry

      for(let x = -3.5; x < 4; x++) {
        for(let z = -3.5; z < 4; z++) {
          const entity = new Entity()
          const transform = entity.get(Component.TRANSFORM) as Transform
          transform.setLocalPosition([x, 0.0, z])
          transform.setLocalEulerRotation([0.0, Math.random() * 2.0 * Math.PI, 0.0])

          entity.add(grassGeometry)
          entity.add(grassMaterial)

          engine.scene.add(entity)
        }
      }
    }
  }).catch((error) => Debug.error(`index::loadGltf(): Failed loading test collision geometry = ${error}`))
  */

  /*
  // https://bst.icons8.com/wp-content/uploads/2020/04/illustration-art-inspiration.png
  loadGltf("http://localhost:8080/res/geo/character.gltf").then((entities) => {
    for(const entity of entities) {
      entity.add(new SkinnedLambertMaterial([0.48, 0.74, 0.56]))
      const entityTransform = entity.get(Component.TRANSFORM) as Transform
      entityTransform.rotateLocalEuler([0.0, Math.PI * 0.75, 0.0])
      entityTransform.setLocalPosition([-1.0, 0.0, -1.0])
      //entityTransform.setLocalScale([0.4, 0.4, 0.4])

      entity.add(new Label({text: ':)', offset: vec3.fromValues(-0.25, 1.75, 0)}))

      engine.scene.add(entity)
    }
  }).catch((error) => Debug.error(`index::loadGltf(): Failed loading test collision geometry = ${error}`))
  */

  /*
  loadGltf("http://localhost:8080/res/geo/avatar.gltf").then((entities) => {
    const player = new Entity()
    const playerTransform = player.get(Component.TRANSFORM) as Transform

    player.add(new Label({text: '', offset: vec3.fromValues(0.0, 1.5, 0)}))

    const rayMaterial = new UnlitMaterial([0.0, 1.0, 0.0])

    const ray = new Entity()
    ray.add(new Ray())
    ray.add(rayMaterial)

    const rayTransform = ray.get(Component.TRANSFORM) as Transform
    rayTransform.setLocalPosition([0.0, 1.0, 0.0])
    rayTransform.setLocalEulerRotation([Math.PI * -0.5, 0.0, 0.0])

    playerTransform.add(ray)

    const lambertMaterial = new SkinnedLambertMaterial([1.0, 1.0, 1.0]) as Material

    for(const entity of entities) {
      player.add(new ThirdPersonControls({
        camera: sceneCamera,
        animator: entity.get(Component.ANIMATOR) as Animator, 
        collider: [geometryCollider], 
        rayMaterial }))

      entity.add(lambertMaterial)
      entity.get(Component.TRANSFORM).setLocalEulerRotation([0.0, Math.PI, 0.0])

      playerTransform.add(entity)
    }

    engine.scene.add(player)
  }).catch((error) => Debug.error(`index::loadGltf(): Failed loading test animation geometry = ${error}`))
  */

  engine.scene.add(createPlayer({ type: PlayerType.FIRST_PERSON, camera: sceneCamera }))

  /*
  loadGltf("http://localhost:8080/res/geo/testGeo.gltf").then((entities) => {
    const material = new FresnelMaterial([1.0, 1.0, 1.0]) as Material

    for(let entityIndex = 0; entityIndex < entities.length; entityIndex++) {
      const entity = entities[entityIndex]
      entity.get(Component.TRANSFORM).setLocalPosition([entityIndex - entities.length + 1 + entityIndex, 0, -4])
      entity.add(new Turntable(1, [0, 1, 0]))
      entity.add(material)

      engine.scene.add(entity)
    }
  }).catch((error) => Debug.error(`index::loadGltf(): Failed loading test geometry = ${error}`))
  */
}

window.onload = main;