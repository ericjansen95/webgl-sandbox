import { Component } from "./components/component";
import Transform from "./components/transform";

export default class Entity {
  components: Array<Component>

  constructor() {
    this.components = new Array<Component>()

    this.addComponent(new Transform())
  }

  addComponent = (component: any) => {
    this.components.push(component)

    // ToDo(Eric) Handle callbacks in map?
    // Make callback argument type save
    if(component.onAdd)
      component.onAdd(this)
  }

  removeComponent = (interfaceType: any) => {
    this.components.forEach(curComponent => {
      // ToDo(Eric) Handle multipe components with same type
      // ToDo(Eric) Handle internal component cleanup
      // @ts-expect-error
      if(curComponent instanceof interfaceType || curComponent.prototype instanceof interfaceType) {
        this.components.splice(this.components.indexOf(curComponent), 1);

        if(curComponent.onRemove)
          curComponent.onRemove(this)
      }
    })
  }

  getComponent = (interfaceType: any): any | null => {
    /*

    ToDo(Eric) Error handling => invalid type / instance of interface

    if(interfaceType as Component) return null

    console.log(interfaceType as Component)
    */

    let component: any | null = null

    this.components.forEach(curComponent => {
      // ToDo(Eric) Handle multipe component returns if type matches
      // @ts-expect-error
      if(curComponent instanceof interfaceType || curComponent.prototype instanceof interfaceType)
        component = curComponent
    })

    return component
  }
}