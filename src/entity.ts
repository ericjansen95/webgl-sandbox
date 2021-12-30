import { mat4 } from "gl-matrix";
import { Component } from "./component";
import Geometry from "./geometry";
import { Material } from "./material";

export default class Entity {
  modelMatrix: mat4
  material: Material
  children: Array<Entity> 
  components: Array<Component>

  constructor() {
    this.modelMatrix = mat4.create()
    this.children = new Array<Entity>()
    this.components = new Array<Component>()
  }

  addComponent = (component: any) => {
    this.components.push(component)
  }

  removeComponent = (interfaceType: any) => {
    this.components.forEach(component => {
      // ToDo(Eric) Handle multipe components with same type
      if(component instanceof interfaceType)
        this.components.splice(this.components.indexOf(component), 1);
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
      if(curComponent instanceof interfaceType)
        component = curComponent
    })

    return component
  }
}