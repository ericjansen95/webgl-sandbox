import { ComponentEnum } from "../../core/components/base/component";
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

export const createPlayer = ({ type, camera, collider }: PlayerCreationOptions): Entity => {
  const player = new Entity()

  switch (type) {
    case PlayerType.FIRST_PERSON: {
      player.add(new FirstPersonControls({ camera, collider}))
      break;
    }
  }

  return player
}