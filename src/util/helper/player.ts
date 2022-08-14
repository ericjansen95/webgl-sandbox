import CharacterController from "../../core/components/controls/characterController";
import { ControlsOptions } from "../../core/components/controls/controls";
import FirstPersonControls from "../../core/components/controls/firstPersonControls";
import Debug from "../../core/internal/debug";
import Entity from "../../core/scene/entity";
import { subscribe } from "./event";

export enum PlayerType {
  FIRST_PERSON,
  THIRD_PERSON
}

export type PlayerCreationOptions = {
  type: PlayerType
} & ControlsOptions

export const createPlayer = ({ type, camera }: PlayerCreationOptions): Entity => {
  const player = new Entity()
  player.add(new CharacterController())

  subscribe('triggerenter', ({ entity }) => { Debug.info(`createPlayer(): Player entered trigger.`) })
  subscribe('triggerleave', ({ entity }) => { Debug.info(`createPlayer(): Player left trigger.`) })

  switch (type) {
    case PlayerType.FIRST_PERSON: {
      player.add(new FirstPersonControls({ camera }))
      break;
    }
  }

  return player
}