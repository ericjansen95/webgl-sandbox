import { vec3, mat4 } from "gl-matrix"
import Camera from "./camera"
import { Material } from "./material"
import Entity from "./entity"
import Time from "./time"
import Geometry from "./geometry"

const DEFAULT_CLEAR_COLOR_LUMINANCE = 0.25

export default class Renderer {
  gl: WebGL2RenderingContext
  clearColor: vec3
  heightmap: WebGLTexture

  constructor(canvas: HTMLCanvasElement) {
    // ToDo(Eric) Use webgl2 here instead of webgl 1.0
    this.gl = canvas.getContext('webgl') as WebGL2RenderingContext

    this.clearColor = vec3.create()
    this.clearColor.fill(DEFAULT_CLEAR_COLOR_LUMINANCE)

    if(!this.gl) {
      console.error('Failed to initialize WebGL!') 
      return
    }
  }

  bindGeometry = (geometry: Geometry): boolean => {
    if(!geometry) return false
    if(geometry.buffer) return true

    geometry.buffer = {
      position: this.gl.createBuffer(),
      normal: this.gl.createBuffer()
    }

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, geometry.buffer.position)
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(geometry.vertex.positions), this.gl.STATIC_DRAW)
    
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, geometry.buffer.normal)
    // vertex normals => normalized vertex positions
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(geometry.vertex.normals), this.gl.STATIC_DRAW)
  
    return true
  }

  bindMaterial = (material: Material, modelMatrix: mat4, viewMatrix: mat4, projectionMatrix: mat4, lightDir: vec3): boolean => {
    
    this.gl.useProgram(material.program)       

    this.gl.uniformMatrix4fv(
      material.uniformLocations.get('uModelMatrix'),
      false,
      modelMatrix
    )

    this.gl.uniformMatrix4fv(
      material.uniformLocations.get('uViewMatrix'),
      false,
      viewMatrix
    )

    this.gl.uniformMatrix4fv(
      material.uniformLocations.get('uProjectionMatrix'),
      false,
      projectionMatrix
    )

    switch(material.type) {
      case "LAMBERT": {
        material.bind(this.gl, lightDir)
        return true
      }
      case "TERRAIN": {
        material.bind(this.gl, lightDir, 0)
        return true
      }
      default: {
        console.error("Renderer::bindMaterial(): Invalid or unimplemented material type!")
        return false
      }
    }
  }

  renderEntity = (entity: Entity, worldMatrix: mat4, camera: Camera) => {
    const geometry: Geometry | null = entity.getComponent(Geometry)

    if(!this.bindGeometry(geometry)) return

    {
      const numComponents: number = 3
      const type: number = this.gl.FLOAT
      const normalize: boolean = false
      const stride: number = 0
      const offset: number = 0
  
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, geometry.buffer.position)
      this.gl.vertexAttribPointer(
        entity.material.attributeLocations.get('aVertexPosition'),
        numComponents,
        type,
        normalize,
        stride,
        offset)
      this.gl.enableVertexAttribArray(
        entity.material.attributeLocations.get('aVertexPosition')
      )
    }   
    
    {
      const numComponents: number = 3
      const type: number = this.gl.FLOAT
      const normalize: boolean = false
      const stride: number = 0
      const offset: number = 0
  
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, geometry.buffer.normal)
      this.gl.vertexAttribPointer(
        entity.material.attributeLocations.get('aVertexNormal'),
        numComponents,
        type,
        normalize,
        stride,
        offset)
      this.gl.enableVertexAttribArray(
        entity.material.attributeLocations.get('aVertexNormal')
      )
    } 

    this.bindMaterial(entity.material, 
                      worldMatrix,
                      camera.viewMatrix,
                      camera.projectionMatrix,
                      vec3.normalize(vec3.create(), [-0.75, 0.5, 0.0]))

    {
      const offset: number = 0
      this.gl.drawArrays(this.gl.TRIANGLES, offset, geometry.vertex.count / 3.0)
    }
  }

  renderScene = (root: Entity, camera: Camera) => {
    this.gl.clearColor(this.clearColor[0], this.clearColor[1], this.clearColor[2], 1.0)
    this.gl.clearDepth(1.0)
    this.gl.enable(this.gl.DEPTH_TEST)
    this.gl.depthFunc(this.gl.LEQUAL)
  
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT)

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

  compileProgram = (vsSource: string, fsSource: string): {program: Material["program"], uniformLocations: Material["uniformLocations"], attributeLocations: Material["attributeLocations"]} | null => {
    const vertexShader = this.loadShader(this.gl.VERTEX_SHADER, vsSource)
    const fragmentShader = this.loadShader(this.gl.FRAGMENT_SHADER, fsSource)
  
    const program: WebGLProgram = this.gl.createProgram()
    this.gl.attachShader(program, vertexShader)
    this.gl.attachShader(program, fragmentShader)
    this.gl.linkProgram(program)
  
    if(!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
      console.error(`Failed to initialize shader program: ${this.gl.getProgramInfoLog(program)}`)
      return null
    }
  
    const attributeLocations: Map<string, number> = new Map<string, number>();

    attributeLocations.set('aVertexPosition', this.gl.getAttribLocation(program, 'aVertexPosition'))
    attributeLocations.set('aVertexNormal', this.gl.getAttribLocation(program, 'aVertexNormal'))

    const uniformLocations: Map<string, WebGLUniformLocation> = new Map<string, WebGLUniformLocation>();

    uniformLocations.set('uModelMatrix', this.gl.getUniformLocation(program, 'uModelMatrix'))
    uniformLocations.set('uViewMatrix', this.gl.getUniformLocation(program, 'uViewMatrix'))
    uniformLocations.set('uProjectionMatrix', this.gl.getUniformLocation(program, 'uProjectionMatrix'))
        
    return {
      program,
      attributeLocations,
      uniformLocations,
    }
  }

  loadShader = (type: number, source: string): WebGLShader | null => {

    const shader: WebGLShader = this.gl.createShader(type)
  
    this.gl.shaderSource(shader, source)
    this.gl.compileShader(shader)
  
    if(!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      console.error(`Failed to compile shader: ${this.gl.getShaderInfoLog(shader)}`)
      this.gl.deleteShader(shader)
      return null
    }
  
    return shader
  }
}