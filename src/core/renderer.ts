import { vec3, mat4 } from "gl-matrix"
import Camera from "../components/camera"
import Material from "../components/material"
import Entity from "./entity"
import Geometry from "../components/geometry/geometry"
import Transform from "../components/transform"
import FlyControls from "../components/controls/flyControls"

const DEFAULT_CLEAR_COLOR_LUMINANCE = 0.25

export let GL: WebGL2RenderingContext;

export default class Renderer {
  clearColor: vec3
  drawCalls: number
  cullCount: number

  constructor(canvas: HTMLCanvasElement) {
    // ToDo(Eric) Use webgl2 here instead of webgl 1.0
    GL = canvas.getContext('webgl') as WebGL2RenderingContext

    //this.clearColor = vec3.create()
    //this.clearColor.fill(DEFAULT_CLEAR_COLOR_LUMINANCE)

    this.clearColor = vec3.fromValues(0.549, 0.745, 0.839)

    if(!GL) {
      console.error('Failed to initialize WebGL!') 
      return
    }

    GL.clearColor(this.clearColor[0], this.clearColor[1], this.clearColor[2], 1.0)
    GL.clearDepth(1.0)
    GL.enable(GL.DEPTH_TEST)
    GL.depthFunc(GL.LEQUAL)
  }

  bindGeometry = (geometry: Geometry): boolean => {
    if(!geometry) return false
    if(geometry.buffer) return true

    geometry.buffer = {
      position: GL.createBuffer(),
      normal: GL.createBuffer()
    }

    GL.bindBuffer(GL.ARRAY_BUFFER, geometry.buffer.position)
    GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(geometry.vertex.positions), GL.STATIC_DRAW)
    
    GL.bindBuffer(GL.ARRAY_BUFFER, geometry.buffer.normal)
    // vertex normals => normalized vertex positions
    GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(geometry.vertex.normals), GL.STATIC_DRAW)
  
    return true
  }

  bindMaterial = (entity: Entity, viewMatrix: mat4, projectionMatrix: mat4, lightDir: vec3): boolean => {
    const transform: Transform = entity.getComponent("Transform") as Transform
    const material: Material = entity.getComponent("Material") as Material
  
    if(!transform || !material) return false

    GL.useProgram(material.program)       

    GL.uniformMatrix4fv(
      material.uniformLocations.get('uWorldMatrix'),
      false,
      transform.worldMatrix
    )

    // ToDo: Cache inverted view matrix in camera?
    GL.uniformMatrix4fv(
      material.uniformLocations.get('uViewMatrix'),
      false,
      mat4.invert(mat4.create(), viewMatrix)
    )

    GL.uniformMatrix4fv(
      material.uniformLocations.get('uProjectionMatrix'),
      false,
      projectionMatrix
    )

    switch(material.type) {
      case "LAMBERT": {
        material.bind(lightDir)
        break
      }
      case "TERRAIN": {
        material.bind(lightDir, 0, transform.modelMatrix)
        break
      }
      case "UNLIT": {
        material.bind()
        break
      }
      default:
        throw new Error("Renderer::bindMaterial(): Invalid or unimplemented material type!")
    }

    return true
  }

  renderEntity = (entity: Entity, camera: Entity) => {
    const geometry: Geometry | null = entity.getComponent("Geometry")

    if(!geometry?.visible) return;

    if(geometry.cull) {
      const cameraComponent: Camera | null = camera.getComponent("Camera")
      if(!cameraComponent.isEntityInFrustrum(entity)) {
        this.cullCount++
        return
      }
    }

    const material: Material | null = entity.getComponent("Material")

    if(!material || !this.bindGeometry(geometry)) return

    this.drawCalls++

    const numComponents: number = 3
    const type: number = GL.FLOAT
    const normalize: boolean = false
    const stride: number = 0
    const offset: number = 0

    // POSITION

    GL.bindBuffer(GL.ARRAY_BUFFER, geometry.buffer.position)
    GL.vertexAttribPointer(
      material.attributeLocations.get('aVertexPosition'),
      numComponents,
      type,
      normalize,
      stride,
      offset)
    GL.enableVertexAttribArray(
      material.attributeLocations.get('aVertexPosition')
    )
 
    // NORMAL

    GL.bindBuffer(GL.ARRAY_BUFFER, geometry.buffer.normal)
    GL.vertexAttribPointer(
      material.attributeLocations.get('aVertexNormal'),
      numComponents,
      type,
      normalize,
      stride,
      offset)
    GL.enableVertexAttribArray(
      material.attributeLocations.get('aVertexNormal')
    ) 

    if(!this.bindMaterial(entity,
                          camera.getComponent("Transform").worldMatrix,
                          camera.getComponent("Camera").projectionMatrix,
                          vec3.normalize(vec3.create(), [-0.75, 0.5, 0.0]))) return

    let mode: number | null = null
    let count: number | null = null
    
    switch(geometry.type) {
      case "LINE":
        mode = GL.LINES
        count = geometry.vertex.count / 2.0
        break
      case "TRIANGLE":
        mode = GL.TRIANGLES
        count = geometry.vertex.count / 3.0
        break
      default:
        throw new Error("renderer::renderEntity(): Invalid geometry type!")
    }

    GL.drawArrays(mode, offset, count)
  }

  renderScene = (root: Entity, camera: Entity) => {  
    GL.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT)

    this.drawCalls = 0
    this.cullCount = 0

    camera.getComponent("FlyControls").onUpdate(camera, camera)
    camera.getComponent("Transform").onUpdate(camera, camera)
    camera.getComponent("Camera").onUpdate(camera, camera)

    this.renderChildren(root, camera)
  }

  renderChildren = (self: Entity, camera: Entity) => {

    //ToDo(Eric) Split update and render loop => how to handle worldMatrix for update?
    self.components.forEach(curComponent => {
      if(curComponent.onUpdate)
        curComponent.onUpdate(self, camera)
    })

    this.renderEntity(self, camera)              

    self.getComponent("Transform").children.forEach(child => {
      this.renderChildren(child, camera)
    })
  }
}