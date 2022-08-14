import { Ray } from "../../util/math/raycast"
import { roundNumber } from "../../util/math/round"
import Collider, { getClosestIntersection, IntersectionInfo } from "../components/collider/collider"
import CharacterController from "../components/controls/characterController"
import Debug from "./debug"

type PhysicsControllerState = {
  colliders: Array<Collider>
  colliderBackbuffer: Array<Collider>
  rigidbodies: Array<CharacterController>
}

export type PhysicStats = {
  rigidbodyCount: number,
  updateTime: number
}

export default class Physics {
  static state: PhysicsControllerState
  static stats: PhysicStats

  static init = () => {
    this.reset()
    this.stats = {
      rigidbodyCount: 0,
      updateTime: 0
    }
  }

  static reset = () => {
    // TMP collider backbuffer for getIntersection
    this.state = {
      colliderBackbuffer: this.state ? this.state.colliders : new Array<Collider>(),
      colliders: new Array<Collider>(),
      rigidbodies: new Array<CharacterController>()
    }
  }

  static addCollider = (collider: Collider) => {
    this.state.colliders.push(collider)
  }

  static addRigidbody = (rigidbody: CharacterController) => {
    this.state.rigidbodies.push(rigidbody)
  }

  static getIntersection = (ray: Ray): IntersectionInfo | null => {
    return getClosestIntersection(ray, this.state.colliderBackbuffer)
  }

  static update = (): boolean => {
    if(!this.state.rigidbodies.length || !this.state.colliders.length) return false

    const startTime = window.performance.now()

    for(const rigidbody of this.state.rigidbodies)
      rigidbody.update(this.state.colliders)

    this.stats.rigidbodyCount = this.state.rigidbodies.length
    this.stats.updateTime = roundNumber(window.performance.now() - startTime)

    Debug.updateStats({physics: this.stats})

    return true
  }
}