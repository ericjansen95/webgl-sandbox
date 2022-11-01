import { vec3 } from "gl-matrix";
import Time from "../../internal/time";
import Texture from "../../renderer/texture";
import Entity from "../../scene/entity";
import Component, { ComponentType } from "../base/component";
import Transform from "../base/transform";
import SkydomeMaterial from "../material/skydomeMaterial";
import UnlitTextureMaterial from "../material/unlitTextureMaterial";

export default class Skybox implements Component {
  type: ComponentType

  texture: Texture
  
  cameraTransform: Transform
  skyboxTransform: Transform

  constructor(textureUri: string, camera: Entity) {
    this.type = ComponentType.SCRIPT

    this.texture = new Texture(textureUri)
    this.cameraTransform = camera.getComponent(ComponentType.TRANSFORM) as Transform
  }

  onUpdate = (self: Entity, camera: Entity) => {
    const playerPosition = vec3.clone(this.cameraTransform.getGlobalPosition())
    playerPosition[1] = -10.0
    
    this.skyboxTransform.setLocalPosition(playerPosition)
  }

  onAdd = (self: Entity) => {
    const material = new SkydomeMaterial(this.texture)
    self.add(material)

    this.skyboxTransform = self.getComponent(ComponentType.TRANSFORM) as Transform
  }
}