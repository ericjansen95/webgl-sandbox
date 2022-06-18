import { mat4, vec3 } from "gl-matrix";
import Material, { compileProgram, DEFAULT_AMBIENT_LIGHT_INTENSITY, LightData } from "./material";

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
    if(!this.compileBase(gl, fsTerrainSorce, vsTerrainSource)) return true

    this.uniformLocations.set('uOffsetMatrix', gl.getUniformLocation(this.program, 'uOffsetMatrix'))

    this.uniformLocations.set('uAmbientLight', gl.getUniformLocation(this.program, 'uAmbientLight'))
    this.uniformLocations.set('uLightDir', gl.getUniformLocation(this.program, 'uLightDir'))

    this.uniformLocations.set('uHeightmap', gl.getUniformLocation(this.program, 'uHeightmap'))
    this.uniformLocations.set('uTerrain', gl.getUniformLocation(this.program, 'uTerrain'))

    this.uniformLocations.set('uHeight', gl.getUniformLocation(this.program, 'uHeight'))

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

  bind = (gl: WebGL2RenderingContext, light: LightData, viewDir: vec3, offsetMatrix: mat4): boolean => {
    const { mainDirection } = light

    gl.uniform1f(this.uniformLocations.get('uAmbientLight'), DEFAULT_AMBIENT_LIGHT_INTENSITY)
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