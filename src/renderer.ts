import { vec3, mat4 } from "gl-matrix"
import Camera from "./camera"
import Material from "./material"
import Entity from "./entity"
import Time from "./time"
import Geometry from "./components/geometry"
import TerrainMaterial from "./components/materials/terrainMaterial"

const DEFAULT_CLEAR_COLOR_LUMINANCE = 0.25

export let GL: WebGL2RenderingContext;

export default class Renderer {
  clearColor: vec3

  constructor(canvas: HTMLCanvasElement) {
    // ToDo(Eric) Use webgl2 here instead of webgl 1.0
    GL = canvas.getContext('webgl') as WebGL2RenderingContext

    this.clearColor = vec3.create()
    this.clearColor.fill(DEFAULT_CLEAR_COLOR_LUMINANCE)

    if(!GL) {
      console.error('Failed to initialize WebGL!') 
      return
    }
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

  bindMaterial = (material: Material, modelMatrix: mat4, viewMatrix: mat4, projectionMatrix: mat4, lightDir: vec3): boolean => {
    
    GL.useProgram(material.program)       

    GL.uniformMatrix4fv(
      material.uniformLocations.get('uModelMatrix'),
      false,
      modelMatrix
    )

    GL.uniformMatrix4fv(
      material.uniformLocations.get('uViewMatrix'),
      false,
      viewMatrix
    )

    GL.uniformMatrix4fv(
      material.uniformLocations.get('uProjectionMatrix'),
      false,
      projectionMatrix
    )

    switch(material.type) {
      case "LAMBERT": {
        material.bind(lightDir)
        return true
      }
      case "TERRAIN": {
        material.bind(lightDir, 0)
        return true
      }
      default: {
        console.error("Renderer::bindMaterial(): Invalid or unimplemented material type!")
        return false
      }
    }
  }

  renderEntity = (entity: Entity, worldMatrix: mat4, camera: Camera) => {
    //ToDo(Eric) Split update and render loop => how to handle worldMatrix for update?
    entity.components.forEach(curComponent => {
      if(curComponent.onUpdate)
        curComponent.onUpdate(entity, camera)
    })

    const geometry: Geometry | null = entity.getComponent(Geometry)
    const material: Material | null = entity.getComponent(Material)

    if(!this.bindGeometry(geometry) || !material) return

    {
      const numComponents: number = 3
      const type: number = GL.FLOAT
      const normalize: boolean = false
      const stride: number = 0
      const offset: number = 0
  
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
    }   
    
    {
      const numComponents: number = 3
      const type: number = GL.FLOAT
      const normalize: boolean = false
      const stride: number = 0
      const offset: number = 0
  
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
    } 

    this.bindMaterial(material, 
                      worldMatrix,
                      camera.viewMatrix,
                      camera.projectionMatrix,
                      vec3.normalize(vec3.create(), [-0.75, 0.5, 0.0]))

    {
      const offset: number = 0
      const mode: number = material.wireframe ? GL.LINE_LOOP : GL.TRIANGLES
      GL.drawArrays(mode, offset, geometry.vertex.count / 3.0)
    }
  }

  renderScene = (root: Entity, camera: Camera) => {
    GL.clearColor(this.clearColor[0], this.clearColor[1], this.clearColor[2], 1.0)
    GL.clearDepth(1.0)
    GL.enable(GL.DEPTH_TEST)
    GL.depthFunc(GL.LEQUAL)
  
    GL.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT)

    this.renderChildren(root, mat4.create(), camera)
  }

  renderChildren = (parent: Entity, parentWorldMatrix: mat4, camera: Camera) => {

    const worldMatrix: mat4 = mat4.create()

    mat4.multiply(worldMatrix,
                  parentWorldMatrix,
                  parent.modelMatrix)    

    this.renderEntity(parent, worldMatrix, camera)              

    parent.children.forEach(child => {
      this.renderChildren(child, worldMatrix, camera)
    })
  }
}