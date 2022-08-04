import { roundNumber } from "../../util/math/round"
import Collider from "../components/collider/collider"
import Rigidbody from "../components/collider/rigidbody"
import Debug from "./debug"

type PhysicsControllerState = {
  collider: Array<Collider>
  rigidbodies: Array<Rigidbody>
}

export type PhysicStats = {
  updateCount: number,
  updateTime: number
}

export default class PhysicsController {
  state: PhysicsControllerState
  stats: PhysicStats

  constructor() {
    this.reset()
    this.stats = {
      updateCount: 0,
      updateTime: 0
    }
  }

  reset = () => {
    this.state = {
      collider: new Array<Collider>(),
      rigidbodies: new Array<Rigidbody>()
    }
  }

  addCollider = (collider: Collider) => {
    this.state.collider.push(collider)
  }

  addRigidbody = (rigidbody: Rigidbody) => {
    this.state.rigidbodies.push(rigidbody)
  }

  update = (): boolean => {
    if(!this.state.rigidbodies.length || !this.state.collider.length) return false

    const startTime = window.performance.now()

    for(const rigidbody of this.state.rigidbodies)
      rigidbody.update(this.state.collider)

    this.stats.updateCount = this.state.rigidbodies.length
    this.stats.updateTime = roundNumber(window.performance.now() - startTime)

    Debug.updateStats({physics: this.stats})

    return true
  }
}