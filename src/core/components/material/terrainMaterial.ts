import { mat4 } from "gl-matrix";
import Material, { compileProgram, LightData } from "./material";

const vsTerrainSource: string = require('/src/core/components/material/shader/terrain.vs') as string
const fsTerrainSorce: string = require('/src/core/components/material/shader/terrain.fs') as string

export default class TerrainMaterial extends Material {
  heightmapUri: string
  heightmap: WebGLTexture

  terrainmapUri: string
  terrainmap: WebGLTexture

  height: number
  offsetMatrix: mat4

  constructor(heightmapUri: string, terrainmapUri: string, height: number) {
    super()

    this.height = height
    this.heightmapUri = heightmapUri
    this.terrainmapUri = terrainmapUri
  }

  compile = (gl: WebGL2RenderingContext): boolean => {
    if(this.program) return true

    const {program, attributeLocations, uniformLocations} = compileProgram(gl, vsTerrainSource, fsTerrainSorce)
    
    this.program = program
    this.attributeLocations = attributeLocations
    this.uniformLocations = uniformLocations

    this.uniformLocations.set('uOffsetMatrix', gl.getUniformLocation(program, 'uOffsetMatrix'))

    this.uniformLocations.set('uAmbientLight', gl.getUniformLocation(program, 'uAmbientLight'))
    this.uniformLocations.set('uLightDir', gl.getUniformLocation(program, 'uLightDir'))

    this.uniformLocations.set('uHeightmap', gl.getUniformLocation(program, 'uHeightmap'))
    this.uniformLocations.set('uTerrain', gl.getUniformLocation(program, 'uTerrain'))

    this.uniformLocations.set('uHeight', gl.getUniformLocation(program, 'uHeight'))

    // ToDo Abstract this into function

    var heightmap = new Image();
    heightmap.src = this.heightmapUri;

    heightmap.addEventListener('load', () => {
      this.heightmap = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, this.heightmap);

      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, heightmap);
    })

    var terrainmap = new Image();
    terrainmap.src = this.terrainmapUri;

    terrainmap.addEventListener('load', () => {
      this.terrainmap = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, this.terrainmap);
  
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, terrainmap);
    })

    return true
  }

  bind = (gl: WebGL2RenderingContext, light: LightData, offsetMatrix: mat4): boolean => {
    this.compile(gl)

    const { mainDirection } = light

    gl.uniform1f(this.uniformLocations.get('uAmbientLight'), 0.25)
    gl.uniform3fv(this.uniformLocations.get('uLightDir'), mainDirection)

    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, this.heightmap)
    gl.uniform1i(this.uniformLocations.get('uHeightmap'), 0)
    
    gl.activeTexture(gl.TEXTURE1)
    gl.bindTexture(gl.TEXTURE_2D, this.terrainmap)
    gl.uniform1i(this.uniformLocations.get('uTerrain'), 1)

    gl.uniform1f(this.uniformLocations.get('uHeight'), this.height)
    gl.uniformMatrix4fv(this.uniformLocations.get('uOffsetMatrix'), false, offsetMatrix)

    return true
  }
}