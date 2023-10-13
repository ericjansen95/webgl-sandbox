import Component, { ComponentType } from "../components/base/component";
import Transform from "../components/base/transform";
import * as short from 'short-uuid';

export type ID = string
export type Tag = string

export type EntityMetadata = {
  name: string,
  id: ID,
  tags: Array<Tag>
}

export default class Entity {
  components: Array<Component>
  meta: EntityMetadata

  constructor() {
    this.components = new Array<Component>()

    this.meta = {
      name: '',
      id: short.generate(),
      tags: new Array()
    }
    
    this.add(new Transform())
  }

  *[Symbol.iterator]() {
    const entities = new Array<Entity>()

    const traverse = (parent: Entity) => {
      for (const child of (parent.getComponent(ComponentType.TRANSFORM) as Transform).children)
        traverse(child)

      if(this === parent) return
      
      entities.push(parent)
    }

    traverse(this)

    for(const entity of entities)
      yield entity
  }

  add = (component: Component): any | null => {
    const { type } = component as Component

    // TMP allow component override
    // if(this.components[type]) return null

    this.components[type] = component
    if(component.onAdd) component.onAdd(this)

    return component
  }

  remove = (type: ComponentType): boolean => {
    if(!this.components[type]) return false
 
    this.components[type] = null
    return true
  }

  getComponent = (type: ComponentType): any | null => {
    return this.components[type] || null
  }
}