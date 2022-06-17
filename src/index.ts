import Camera from './core/components/base/camera';
import Entity from './core/scene/entity';
import LambertMaterial from './core/components/material/lambertMaterial';
import Material from './core/components/material/material';
import FlyControls from './core/components/controls/flyControls';
import Terrain from './core/components/geometry/terrain';
import Quad from './core/components/geometry/quad';
import UnlitMaterial from './core/components/material/unlitMaterial';
import GltfLoader from './core/loader/gltfLoader';
import { ComponentEnum as Component } from './core/components/base/component';
import Turntable from './core/components/scripts/turntable';
import Engine from './core/engine';
import PhongMaterial from './core/components/material/phongMaterial';

/*

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
  - transform local vs global
  - clientId
  - server network package verification => block unallowed
  - server client authentication
  - server append clientId
  - client do not send client id in packages
  - game network manager => create local and remote client compoents for entities
  - reduce matrix multipications => cache bounding volume data
  - server connect with same client id after reload
  - come up with a dynamic networking model => check o3d engine talk (state, event, ...)
  - make component state easily serializable by adding functions to interface
  - canvas resize event
  - namespaces that abstracts initialisation (and entity assemby?)
  - instanced mesh system
  - camera frustrum performance
  - better material attrib pipeline
  - abstract component constructor arguments into options objects
  - rename wording for channels to "SCENE" and "CHAT"

*/

const main = async () => {
  const canvas = document.getElementById('glCanvas') as HTMLCanvasElement
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight

  const sceneCamera: Entity = new Entity()
  sceneCamera.get(Component.TRANSFORM).setPosition([0.0, 0.0, 10.0])
  const camera = sceneCamera.add(new Camera(Math.PI * 0.3, canvas.width / canvas.height))

  const debugCamera: Entity = new Entity()
  debugCamera.get(Component.TRANSFORM).setPosition([0.0, 1.0, 4.0])
  debugCamera.add(new FlyControls())
  debugCamera.add(new Camera(Math.PI * 0.3, canvas.width / canvas.height))

  const engine = new Engine(canvas, sceneCamera, debugCamera)

  // debug vis for camera frustrum
  const debugMaterial = new UnlitMaterial([1.0, 0.0, 1.0]) as Material

  for(let posIndex = 0; posIndex < camera.frustrum.positions.length; posIndex += 4) {  
    const frustrumPlane = new Entity()

    const positions = camera.frustrum.positions.slice(posIndex, posIndex + 4)

    frustrumPlane.add(new Quad(positions, true, false, false))
    frustrumPlane.add(debugMaterial)

    sceneCamera.get(Component.TRANSFORM).add(frustrumPlane)
  }

  const { geometry } = await new GltfLoader().load("http://localhost:8080/res/geo/testGeo.gltf")

  const phongMaterial = new PhongMaterial([0.698, 0.133, 0.133]) as Material

  for(let geoIndex = 0; geoIndex < geometry.length; geoIndex++) {
    const entity: Entity = new Entity()
    entity.get(Component.TRANSFORM).setPosition([geoIndex - 3 + geoIndex, 0.5, 0.0])
    entity.add(geometry[geoIndex])
    entity.add(new Turntable(1, [0, 1, 0]))
    entity.add(phongMaterial)

    engine.scene.add(entity)
  }

  const terrain: Entity = new Entity()
  terrain.add(new Terrain())

  engine.scene.add(terrain)
  engine.scene.add(sceneCamera)
}

window.onload = main;