import { vec3, mat4 } from "gl-matrix"
import Camera from "./camera"
import { Material } from "./material"
import Entity from "./entity"

const DEFAULT_CLEAR_COLOR_LUMINANCE = 0.25

export default class Renderer {
  gl: WebGL2RenderingContext
  clearColor: vec3

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

  bind = (entity: Entity): boolean => {
    if(!entity.geometry) return false
    if(entity.geometry.buffer) return true

    entity.geometry.buffer = {
      position: this.gl.createBuffer(),
      normal: this.gl.createBuffer()
    }

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, entity.geometry.buffer.position)
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(entity.geometry.vertex.positions), this.gl.STATIC_DRAW)
    
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, entity.geometry.buffer.normal)
    // vertex normals => normalized vertex positions
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(entity.geometry.vertex.normals), this.gl.STATIC_DRAW)
  
    return true
  }

  renderScene = (root: Entity, camera: Camera, deltaTime: number) => {
    this.gl.clearColor(this.clearColor[0], this.clearColor[1], this.clearColor[2], 1.0)
    this.gl.clearDepth(1.0)
    this.gl.enable(this.gl.DEPTH_TEST)
    this.gl.depthFunc(this.gl.LEQUAL)
  
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT)

      if(!this.bind(root)) return

      {
        const numComponents: number = 3
        const type: number = this.gl.FLOAT
        const normalize: boolean = false
        const stride: number = 0
        const offset: number = 0
    
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, root.geometry.buffer.position)
        this.gl.vertexAttribPointer(
          root.material.attributeLocations.get('aVertexPosition'),
          numComponents,
          type,
          normalize,
          stride,
          offset)
        this.gl.enableVertexAttribArray(
          root.material.attributeLocations.get('aVertexPosition')
        )
      }   
      
      {
        const numComponents: number = 3
        const type: number = this.gl.FLOAT
        const normalize: boolean = false
        const stride: number = 0
        const offset: number = 0
    
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, root.geometry.buffer.normal)
        this.gl.vertexAttribPointer(
          root.material.attributeLocations.get('aVertexNormal'),
          numComponents,
          type,
          normalize,
          stride,
          offset)
        this.gl.enableVertexAttribArray(
          root.material.attributeLocations.get('aVertexNormal')
        )
      } 

      this.gl.useProgram(root.material.program)

      mat4.rotate(root.modelMatrix,
                  root.modelMatrix,
                  Math.PI * 0.1 * deltaTime,
                  [0.0, 1.0, 0.0])          

      this.gl.uniformMatrix4fv(
        root.material.uniformLocations.get('uProjectionMatrix'),
        false,
        camera.projectionMatrix
      )

      this.gl.uniformMatrix4fv(
        root.material.uniformLocations.get('uModelViewMatrix'),
        false,
        mat4.mul(mat4.create(), root.modelMatrix, camera.viewMatrix)
      )

      this.gl.uniform3fv(root.material.uniformLocations.get('uLightDir'), vec3.normalize(vec3.create(), [-1.0, 1.0, 1.0]))
      this.gl.uniform3fv(root.material.uniformLocations.get('uViewDir'), vec3.normalize(vec3.create(), mat4.getTranslation(vec3.create(), camera.viewMatrix)))
      this.gl.uniform1f(root.material.uniformLocations.get('uAmbientLight'), 0.1)

      {
        const offset: number = 0
        this.gl.drawArrays(this.gl.TRIANGLES, offset, root.geometry.vertex.count / 3.0)
      }    
  }

  createMaterial = (vsSource: string, fsSource: string): Material | null => {
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

    uniformLocations.set('uProjectionMatrix', this.gl.getUniformLocation(program, 'uProjectionMatrix'))
    uniformLocations.set('uModelViewMatrix', this.gl.getUniformLocation(program, 'uModelViewMatrix'))
    uniformLocations.set('uLightDir', this.gl.getUniformLocation(program, 'uLightDir'))
    uniformLocations.set('uViewDir', this.gl.getUniformLocation(program, 'uViewDir'))
    uniformLocations.set('uAmbientLight', this.gl.getUniformLocation(program, 'uAmbientLight'))
    
    return {
      program,
      attributeLocations,
      uniformLocations
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