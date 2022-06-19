import Camera from './core/components/base/camera';
import Entity from './core/scene/entity';
import LambertMaterial from './core/components/material/lambertMaterial';
import Material from './core/components/material/material';
import FlyControls from './core/components/controls/flyControls';
import Terrain from './core/components/geometry/terrain';
import Quad from './core/components/geometry/quad';
import UnlitMaterial from './core/components/material/unlitMaterial';
import GltfLoader from './util/loader/gltfLoader';
import { ComponentEnum as Component } from './core/components/base/component';
import Turntable from './core/components/scripts/turntable';
import Engine from './core/engine';
import PhongMaterial from './core/components/material/phongMaterial';
import UvMaterial from './core/components/material/uvMaterial';
import loadGltf from './util/loader/gltfLoader';
import Debug from './core/internal/debug';
import NormalMaterial from './core/components/material/normalMaterial';
import PositionMaterial from './core/components/material/positionMaterial';
import OutlineMaterial from './core/components/material/fresnelMaterial';
import FresnelMaterial from './core/components/material/fresnelMaterial';
import Bone from './core/components/geometry/bone';
import Transform from './core/components/base/transform';

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
  - transform local matrix
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

/*
  ### Skinning ###

  Components:
  
  - Animator => keyframe, animation 
  - SkinnedGeometry => joint, rig 
*/


const main = () => {
  const canvas = document.getElementById('glCanvas') as HTMLCanvasElement
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight

  const sceneCamera: Entity = new Entity()
  sceneCamera.get(Component.TRANSFORM).setLocalPosition([0.0, 1.0, 6.0])
  sceneCamera.add(new Camera(Math.PI * 0.3, canvas.width / canvas.height))

  const engine = new Engine(canvas, sceneCamera)

  const rootBone: Entity = new Entity()

  rootBone.add(new Bone())
  rootBone.add(Debug.material)

  let prevBoneTransform = rootBone.get(Component.TRANSFORM)
  prevBoneTransform.setLocalPosition([-1, 0, 0])

  for(let boneIndex = 1; boneIndex < 6; boneIndex++) {
    const bone: Entity = new Entity()

    bone.add(new Bone())
    bone.add(Debug.material)

    const boneTransform = bone.get(Component.TRANSFORM) as Transform
    boneTransform.setLocalPosition([0, 1, 0])
    boneTransform.setLocalEulerRotation([0, 0, Math.PI * 0.1])

    prevBoneTransform.add(bone)
    prevBoneTransform = boneTransform
  }

  engine.scene.add(rootBone)

  loadGltf("http://localhost:8080/res/geo/testAnimGeo.gltf").then(({geometry}) => {
    const lambertMaterial = new LambertMaterial([1.0, 1.0, 1.0]) as Material

    const entity: Entity = new Entity()
    entity.add(geometry[0])
    entity.add(lambertMaterial)
  
    engine.scene.add(entity)
  }).catch((error) => Debug.error(`index::loadGltf(): Failed loading test animation geometry = ${error}`))

  loadGltf("http://localhost:8080/res/geo/testGeo.gltf").then(({geometry}) => {
    const material = new FresnelMaterial([1.0, 1.0, 1.0]) as Material

    for(let geoIndex = 0; geoIndex < geometry.length; geoIndex++) {
      const entity: Entity = new Entity()
      entity.get(Component.TRANSFORM).setLocalPosition([geoIndex - 3 + geoIndex, 0, -4])
      entity.add(geometry[geoIndex])
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