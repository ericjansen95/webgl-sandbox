import Grid from "../components/geometry/grid";
import UnlitMaterial from "../components/materials/unlitMaterial";
import Client from "../network/client";
import GameNetworkController from "../network/gameNetworkController";
import Entity from "./entity";

export default class Scene {
  root: Entity
  networkController: GameNetworkController

  constructor(clientEntity: Entity | null = null, client: Client | null = null) {
    this.root = new Entity()

    const grid: Entity = new Entity()
    grid.getComponent("Transform").setScale([10.0, 10.0, 10.0])
    grid.getComponent("Transform").setPosition([-5.0, 0.0, -5.0])
    grid.addComponent(new Grid(10))
    grid.addComponent(new UnlitMaterial([0.75, 0.75, 0.75]))
    this.root.getComponent("Transform").addChild(grid)

    if(!clientEntity || !client) return

    this.networkController = new GameNetworkController(client, this.root, clientEntity)
  }
}