import Component, { ComponentEnum } from "../components/base/component";
import Transform from "../components/base/transform";

export default class Entity {
  components: Array<Component>

  constructor() {
    this.components = new Array<Component>()
    this.add(new Transform())
  }

  *[Symbol.iterator]() {
    const entities = new Array<Entity>()

    const traverse = (parent: Entity) => {
      for (const child of (parent.get(ComponentEnum.TRANSFORM) as Transform).children)
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

  remove = (type: ComponentEnum): boolean => {
    if(!this.components[type]) return false
 
    this.components[type] = null
    return true
  }

  get = (type: ComponentEnum): any | null => {
    return this.components[type] || null
  }
}