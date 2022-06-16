import BoundingBox from "../components/boundingVolume/boundingBox";
import BoundingSphere from "../components/boundingVolume/boundingSphere";
import BoundingVolume from "../components/boundingVolume/boundingVolume";
import Camera from "../components/base/camera";
import Component from "../components/base/component";
import FlyControls from "../components/controls/flyControls";
import Geometry from "../components/geometry/geometry";
import Material from "../components/material/material";
import Transform from "../components/base/transform";

// object.constructor.name
// Object.getPrototypeOf(instance.constructor).name

// TMP => find proper way to do this by class type without instance?
// abstract into Type ComponentInfo {type, name}
// abstract BoundingVolume and Controls with base Component Classes
// maybe use enum here?
type ComponentName = "Transform" | "Material" | "Camera" | "Geometry" | "BoundingVolume" | "FlyControls"
type ComponentType = Transform | Material | Camera | Geometry | BoundingVolume | FlyControls

const getComponentName = <Type>(component: Type): ComponentName => {
  let componentName = component.constructor.name as ComponentName
  const parentName = Object.getPrototypeOf(component.constructor).name as ComponentName

  if(parentName.length) componentName = parentName
  // ToDo: Find better way to do this
  if(componentName.includes("Bounding")) componentName = "BoundingVolume"

  return componentName
}

export default class Entity {
  components: Map<ComponentName, Component>

  constructor() {
    this.components = new Map<ComponentName, Component>()

    this.addComponent(new Transform())
  }

  *[Symbol.iterator]() {
    const entities = new Array<Entity>()

    const traverse = (parent: Entity) => {
      for (const child of parent.getComponent("Transform").children)
        traverse(child)

      if(this === parent) return
      
      entities.push(parent)
    }

    traverse(this)

    for(const entity of entities)
      yield entity
  }

  addComponent = <Type>(component: Type): Type | null => {
    const componentName: ComponentName = getComponentName(component)

    if(this.components.has(componentName)) return null

    this.components.set(componentName, component as Component)

    // @ts-expect-error
    if(component.onAdd) component.onAdd(this)

    return component
  }

  removeComponent = (componentName: ComponentName): boolean => {
    if(!componentName || !this.components.has(componentName)) return false
 
    const component = this.components.get(componentName)
    if(component.onRemove) component.onRemove()

    this.components.delete(componentName)

    return true
  }

  getComponent = (componentName: ComponentName): any | null => {
    if(!componentName || !this.components.has(componentName)) return null
 
    return this.components.get(componentName) as any || null
  }
}