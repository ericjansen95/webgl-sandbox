import { roundNumber } from "../../util/math/round"
import Collider from "../components/collider/collider"
import Rigidbody from "../components/collider/rigidbody"
import Debug from "./debug"

type PhysicsControllerState = {
  colliders: Array<Collider>
  rigidbodies: Array<Rigidbody>
}

export type PhysicStats = {
  rigidbodyCount: number,
  updateTime: number
}

export default class PhysicsController {
  state: PhysicsControllerState
  stats: PhysicStats

  constructor() {
    this.reset()
    this.stats = {
      rigidbodyCount: 0,
      updateTime: 0
    }
  }

  reset = () => {
    this.state = {
      colliders: new Array<Collider>(),
      rigidbodies: new Array<Rigidbody>()
    }
  }

  addCollider = (collider: Collider) => {
    this.state.colliders.push(collider)
  }

  addRigidbody = (rigidbody: Rigidbody) => {
    this.state.rigidbodies.push(rigidbody)
  }

  update = (): boolean => {
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