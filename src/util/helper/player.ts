import Rigidbody from "../../core/components/collider/rigidbody";
import { ControlsOptions } from "../../core/components/controls/controls";
import FirstPersonControls from "../../core/components/controls/firstPersonControls";
import Entity from "../../core/scene/entity";

export enum PlayerType {
  FIRST_PERSON,
  THIRD_PERSON
}

export type PlayerCreationOptions = {
  type: PlayerType
} & ControlsOptions

export const createPlayer = ({ type, camera }: PlayerCreationOptions): Entity => {
  const player = new Entity()
  player.add(new Rigidbody())

  switch (type) {
    case PlayerType.FIRST_PERSON: {
      player.add(new FirstPersonControls({ camera }))
      break;
    }
  }

  return player
}