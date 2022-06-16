import ComponentInterface, { Component } from "../components/base/component";
import Transform from "../components/base/transform";

export default class Entity {
  components: Array<ComponentInterface>

  constructor() {
    this.components = new Array<ComponentInterface>()
    this.add(new Transform())
  }

  *[Symbol.iterator]() {
    const entities = new Array<Entity>()

    const traverse = (parent: Entity) => {
      for (const child of (parent.get(Component.TRANSFORM) as Transform).children)
        traverse(child)

      if(this === parent) return
      
      entities.push(parent)
    }

    traverse(this)

    for(const entity of entities)
      yield entity
  }

  add = (component: any): any | null => {
    const { type } = component as ComponentInterface

    if(this.components[type]) return null

    this.components[type] = component
    if(component.onAdd) component.onAdd(this)

    return component
  }

  remove = (type: Component): boolean => {
    if(!this.components[type]) return false
 
    this.components[type] = null
    return true
  }

  get = (type: Component): any | null => {
    return this.components[type] || null
  }
}