import Component, { ComponentType } from "../components/base/component";
import Transform from "../components/base/transform";
const short = require('short-uuid');

export type ID = string;

export default class Entity {
  components: Array<Component>
  id: ID

  constructor() {
    this.components = new Array<Component>()
    this.id = short.generate()

    this.add(new Transform())
  }

  *[Symbol.iterator]() {
    const entities = new Array<Entity>()

    const traverse = (parent: Entity) => {
      for (const child of (parent.get(ComponentType.TRANSFORM) as Transform).children)
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

    if(this.components[type]) return null

    this.components[type] = component
    if(component.onAdd) component.onAdd(this)

    return component
  }

  remove = (type: ComponentType): boolean => {
    if(!this.components[type]) return false
 
    this.components[type] = null
    return true
  }

  get = (type: ComponentType): any | null => {
    return this.components[type] || null
  }
}