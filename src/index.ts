import Camera from './core/components/base/camera';
import Entity from './core/scene/entity';
import Material from './core/components/material/material';
import Terrain from './core/components/scripts/terrain';
import { ComponentEnum as Component } from './core/components/base/component';
import Turntable from './core/components/scripts/turntable';
import Engine from './core/engine';
import loadGltf from './util/loader/gltfLoader';
import Debug from './core/internal/debug';
import FresnelMaterial from './core/components/material/fresnelMaterial';
import SkinnedLambertMaterial from './core/components/material/skinnedLambert';
import GeometryCollider from './core/components/collider/geometryCollider';

/*

  First Playable:
  - multi hirachial joint skinning
  - uv driven texture mapping
  - collision => ray triangle intersection
  - first person controls
  - basic audio => emitter and listener

  Ideas:
  - scene skybox
  - update terrain lod
  - thirdPersonControls
  - animation => skinning matrix
  - device capibility check and lod (mesh, shader, textures, ...)
  - streaming (network and scene)
  - scene, sceneNetworkController, remoteClient Component, networkedTransfrom Component
  - module bundle namespace
  - app-sandbox
  - level wording
  - base-server, chat-server, scene-server

  ToDo:
  - min max from gltf and fallback calculation

  - this in component callbacks
  - transform rotation as quaternions
  - reduce matrix multipications => cache bounding volume data
  - make component state easily serializable by adding functions to interface
  - canvas resize event
  - namespaces that abstracts initialisation (and entity assemby?)
  - abstract component constructor arguments into options objects

  - clientId
  - server network package verification => block unallowed
  - server client authentication
  - server append clientId
  - client do not send client id in packages
  - game network manager => create local and remote client compoents for entities
  - server connect with same client id after reload
  - come up with a dynamic networking model => check o3d engine talk (state, event, ...)

  - instanced mesh system
  - camera frustrum performance
  - rename wording for channels to "SCENE" and "CHAT"

*/

const main = () => {
  const canvas = document.getElementById('glCanvas') as HTMLCanvasElement
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight

  const sceneCamera: Entity = new Entity()
  sceneCamera.get(Component.TRANSFORM).setLocalPosition([0.0, 1.0, 6.0])
  sceneCamera.add(new Camera(Math.PI * 0.3, canvas.width / canvas.height))

  const engine = new Engine(canvas, sceneCamera)

  loadGltf("http://localhost:8080/res/geo/testCollisionGeo.gltf").then((entities) => {
    for(const entity of entities) {
      entity.add(Debug.material)
      entity.add(new GeometryCollider())

      engine.scene.add(entity)
    }
  }).catch((error) => Debug.error(`index::loadGltf(): Failed loading test collision geometry = ${error}`))


  loadGltf("http://localhost:8080/res/geo/avatar.gltf").then((entities) => {
    const lambertMaterial = new SkinnedLambertMaterial([1.0, 1.0, 1.0]) as Material

    for(const entity of entities) {
      entity.add(lambertMaterial)

      engine.scene.add(entity)
    }
  }).catch((error) => Debug.error(`index::loadGltf(): Failed loading test animation geometry = ${error}`))

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

  const terrain: Entity = new Entity()
  terrain.add(new Terrain())
  engine.scene.add(terrain)
  
  engine.scene.add(sceneCamera)
}

window.onload = main;