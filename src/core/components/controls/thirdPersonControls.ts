import { vec3, vec2, quat } from "gl-matrix"
import Entity from "../../scene/entity"
import Component, { ComponentEnum } from "../base/component"
import Input from "../../internal/input"
import Time from "../../internal/time"
import Transform from "../base/transform"
import Debug from "../../internal/debug"
import Animator from "../animation/animator"
import Collider from "../collider/collider"
import UnlitMaterial from "../material/unlitMaterial"
import getIntersectionPoints from "../../../util/math/raycast"

const GLOBAL_FORWARD: vec3 = vec3.fromValues(0.0, 0.0, -1.0)

const ROTATE_SPEED: number = 2.0
const TRANSLATE_SPEED: number = 1.5 // in m/s => "preferred" walking speed is around 1.42 m/s

export default class ThirdPersonControls implements Component {
  type: ComponentEnum

  rotation: number
  position: vec3

  animator: Animator
  collider: Array<Collider>
  rayMaterial: UnlitMaterial

  constructor(animator: Animator, collider: Array<Collider>, rayMaterial: UnlitMaterial) {
    this.type = ComponentEnum.CONTROLS

    this.rotation = 0
    this.position = vec3.create()

    this.animator = animator

    this.collider = collider
    this.rayMaterial = rayMaterial
  }

  onUpdate = (self: Entity, camera: Entity) => {
    if(Debug.cameraEnabled) return

    // ROTATION
    const inputDirection: vec2 = [Input.isKeyDown('a') ? 1.0 : Input.isKeyDown('d') ? -1.0 : 0.0,
                                  Input.isKeyDown('w') ? 1.0 : Input.isKeyDown('s') ? -1.0 : 0.0]

    const transform = self.get(ComponentEnum.TRANSFORM) as Transform                              

    const rotateSpeed = inputDirection[0] * ROTATE_SPEED * Time.deltaTime;    
    this.rotation += rotateSpeed 

    const rotation = quat.create()
    quat.rotateY(rotation, rotation, this.rotation)

    if(rotateSpeed) transform.setLocalRotation(rotation)

    const forward = vec3.transformQuat(vec3.create(), GLOBAL_FORWARD, rotation)

    const translateSpeed = inputDirection[1] * TRANSLATE_SPEED * Time.deltaTime
    this.position = transform.getGlobalPosition()
    vec3.scaleAndAdd(this.position, this.position, forward,  translateSpeed)

    if(translateSpeed) {
      const points = getIntersectionPoints({
        origin: vec3.add(vec3.create(), this.position, [0.0, 1.0, 0.0]),
        direction: vec3.fromValues(0, -1, 0),
        length: 2
      }, this.collider)

      const onCollider = points.length
      this.position[1] = onCollider ? points[0][1] : 0.0
      this.rayMaterial.color = onCollider ? [0.0, 1.0, 0.0] : [1.0, 0.0, 0.0]

      transform.setLocalPosition(this.position)
    }

    this.animator.animations[1].weight = translateSpeed ? 0.35 : 0.0
  }
}