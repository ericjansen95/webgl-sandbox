import Component, { ComponentType } from "../components/base/component";
import Transform from "../components/base/transform";

export default class Entity {
  components: Array<Component>

  constructor() {
    this.components = new Array<Component>()
    this.addComponent(new Transform())
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

  addComponent = (component: any): any | null => {
    const { componentType } = component as Component

    if(this.components[componentType]) return null

    this.components[componentType] = component
    if(component.onAdd) component.onAdd(this)

    return component
  }

  removeComponent = (componentType: ComponentType): boolean => {
    if(!this.components[componentType]) return false
 
    this.components[componentType] = null
    return true
  }

  getComponent = (componentType: ComponentType): any | null => {
    return this.components[componentType] || null
  }
}