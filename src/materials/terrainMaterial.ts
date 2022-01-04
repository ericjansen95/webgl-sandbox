import { vec3 } from "gl-matrix";
import { Material, MaterialType } from "../material";
import Renderer from "../renderer"

const vsTerrainSource: string = require('/public/res/shader/terrain.vs') as string
const fsTerrainSorce: string = require('/public/res/shader/terrain.fs') as string

export default class TerrainMaterial implements Material {
  type: MaterialType
  program: WebGLProgram
  attributeLocations: Map<string, number>
  uniformLocations: Map<string, WebGLUniformLocation>
  heightmap: WebGLTexture
  errosionMap: WebGLTexture

  constructor(renderer: Renderer, heightmapUri: string) {
    this.type = "TERRAIN"

    const {program, attributeLocations, uniformLocations} = renderer.compileProgram(vsTerrainSource, fsTerrainSorce)
    
    this.program = program
    this.attributeLocations = attributeLocations
    this.uniformLocations = uniformLocations

    this.uniformLocations.set('uAmbientLight', renderer.gl.getUniformLocation(program, 'uAmbientLight'))
    this.uniformLocations.set('uLightDir', renderer.gl.getUniformLocation(program, 'uLightDir'))

    this.uniformLocations.set('uTexture', renderer.gl.getUniformLocation(program, 'uTexture'))

    this.heightmap = renderer.gl.createTexture()
    renderer.gl.bindTexture(renderer.gl.TEXTURE_2D, this.heightmap)

    // ToDo(Eric) Manage texture level / position!
    renderer.gl.texImage2D(renderer.gl.TEXTURE_2D, 0, renderer.gl.RGBA, 1, 1, 0, renderer.gl.RGBA, renderer.gl.UNSIGNED_BYTE,
                            new Uint8Array([0, 0, 255, 255]))
      
    const heightmap: HTMLImageElement = new Image()
    heightmap.src = heightmapUri

    heightmap.addEventListener('load', () => {
      renderer.gl.bindTexture(renderer.gl.TEXTURE_2D, this.heightmap);
      renderer.gl.texImage2D(renderer.gl.TEXTURE_2D, 0, renderer.gl.RGBA, renderer.gl.RGBA, renderer.gl.UNSIGNED_BYTE, heightmap);
      renderer.gl.generateMipmap(renderer.gl.TEXTURE_2D);

      this.createErrosionMap(heightmap)
    });
  }

  createErrosionMap = (heightmap: HTMLImageElement): WebGLTexture | null => {
    if(!heightmap) return null

    const canvasErrosion: HTMLCanvasElement = document.createElement('canvas')

    canvasErrosion.width = heightmap.width
    canvasErrosion.height = heightmap.height

    const canvasErroision2dContext = canvasErrosion.getContext('2d')

    canvasErroision2dContext.beginPath();
    canvasErroision2dContext.rect(0, 0, heightmap.height, heightmap.width);
    canvasErroision2dContext.fillStyle = "transparent";
    canvasErroision2dContext.fill();

    canvasErrosion.style.cssText = 'position: absolute; width: 256px; height: 256px; right: 0px; top: 0px; z-index: 300;'
    document.body.appendChild(canvasErrosion)

    const canvasHeightmap: HTMLCanvasElement = document.createElement('canvas')

    canvasHeightmap.width = heightmap.width
    canvasHeightmap.height = heightmap.height

    canvasHeightmap.getContext('2d').drawImage(heightmap, 0, 0, heightmap.width, heightmap.height);

    canvasHeightmap.style.cssText = 'position: absolute; width: 256px; height: 256px; right: 0px; top: 0px; z-index: 200;'
    document.body.appendChild(canvasHeightmap)

    const MIN_ERROSION_TRAIN_COUNT: number = 64
    let errosionTrailCount: number = 0

    const MIN_START_HEIGHT = Math.ceil(255 * 0.25)

    const pixelData: Uint8ClampedArray = new Uint8ClampedArray([255, 0, 0, 255])
    const imageData: ImageData = new ImageData(pixelData, 1.0)

    while(errosionTrailCount < MIN_ERROSION_TRAIN_COUNT) {
      let height: number = 0.0

      let xPos: number = 0.0
      let yPos: number = 0.0
  
      while(height <= MIN_START_HEIGHT) {
        xPos = Math.ceil(Math.random() * heightmap.height)
        yPos = Math.ceil(Math.random() * heightmap.width)
    
        height = canvasHeightmap.getContext('2d').getImageData(xPos, yPos, 1, 1).data[0]
      }
  
      //console.log(`Start position = [${xPos}, ${yPos}]`)
      //console.log(`Height at start position = ${height}`)
  
      let prevHeight: number = height + 1

      const positions: Array<{x: number, y: number}> = new Array<{x: number, y: number}>()

      let iterration: number = 0

      let deltaHeightX: number = 1
      let deltaHeightY: number = 1

      while(height < prevHeight && height > 1 && (deltaHeightX !== 0 || deltaHeightY !== 0)) {
        const heightLeft: number = canvasHeightmap.getContext('2d').getImageData(xPos + 1, yPos, 1, 1).data[0]
        const heightTop: number = canvasHeightmap.getContext('2d').getImageData(xPos, yPos + 1, 1, 1).data[0]
        const heightRight: number = canvasHeightmap.getContext('2d').getImageData(xPos - 1, yPos, 1, 1).data[0]
        const heightBottom: number = canvasHeightmap.getContext('2d').getImageData(xPos, yPos - 1, 1, 1).data[0]
  
        deltaHeightX = heightLeft - heightRight
        deltaHeightY = heightTop - heightBottom
  
        // console.log(`Delta height = [${deltaHeightX}, ${deltaHeightY}]`)

        if(Math.abs(deltaHeightY) <= Math.abs(deltaHeightX))
          xPos -= Math.sign(deltaHeightX)
        else
          yPos -= Math.sign(deltaHeightY)
  
        prevHeight = height
        height = canvasHeightmap.getContext('2d').getImageData(xPos, yPos, 1, 1).data[0]

        // console.log(`Previous height = ${prevHeight} | Current height = ${height}`)
        // console.log(`Itertation = ${++iterration} at position = [${xPos}, ${yPos}] with height = ${height}`)
        
        positions.push({x: xPos, y: yPos})
      }

      if(positions.length > 4) {
        errosionTrailCount++
        console.log(`Errosion trails ${errosionTrailCount} / ${MIN_ERROSION_TRAIN_COUNT}`)
        positions.forEach(position => canvasErrosion.getContext('2d').putImageData(imageData, position.x, position.y))
      }
    }
  }

  bind = (gl: WebGL2RenderingContext, lightDir: vec3, textureLocation: number) => {
    gl.uniform1f(this.uniformLocations.get('uAmbientLight'), 0.25)
    gl.uniform3fv(this.uniformLocations.get('uLightDir'), lightDir)

    gl.uniform1i(this.uniformLocations.get('uTexture'), textureLocation)
  }
}