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

    // Create a texture.
    this.heightmap = this.gl.createTexture();
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.heightmap);
     
    // Fill the texture with a 1x1 blue pixel.
    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, 1, 1, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE,
                       new Uint8Array([0, 0, 255, 255]));
     
    // Asynchronously load an image
    var image = new Image();
    image.src = "/res/tex/antarticaHeightmap.png";
    image.addEventListener('load', () => {
      // Now that the image has loaded make copy it to the texture.
      this.gl.bindTexture(this.gl.TEXTURE_2D, this.heightmap);
      this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, image);
      this.gl.generateMipmap(this.gl.TEXTURE_2D);
    });
  }

  bind = (geometry: Geometry): boolean => {
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

  renderEntity = (entity: Entity, worldMatrix: mat4, camera: Camera) => {
    const geometry: Geometry | null = entity.getComponent(Geometry)

    if(!this.bind(geometry)) return

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

    this.gl.useProgram(entity.material.program)       

    this.gl.uniformMatrix4fv(
      entity.material.uniformLocations.get('uProjectionMatrix'),
      false,
      camera.projectionMatrix
    )

    this.gl.uniformMatrix4fv(
      entity.material.uniformLocations.get('uModelViewMatrix'),
      false,
      mat4.mul(mat4.create(), worldMatrix, camera.viewMatrix)
    )

    this.gl.uniform3fv(entity.material.uniformLocations.get('uLightDir'), vec3.normalize(vec3.create(), [-0.5, 0.5, 0.0]))
    this.gl.uniform3fv(entity.material.uniformLocations.get('uViewDir'), vec3.normalize(vec3.create(), mat4.getTranslation(vec3.create(), camera.viewMatrix)))
    this.gl.uniform1f(entity.material.uniformLocations.get('uAmbientLight'), 0.1)

    this.gl.uniform1i(entity.material.uniformLocations.get('uTexture'), 0)

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
    uniformLocations.set('uTexture', this.gl.getUniformLocation(program, 'uTexture'))
        
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