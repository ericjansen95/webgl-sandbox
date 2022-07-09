import { mat4, vec3 } from "gl-matrix";
import Texture from "../../renderer/texture";
import Material, { compileProgram, DEFAULT_AMBIENT_LIGHT_INTENSITY, LightData } from "./material";

const vsTerrainSource: string = require('/src/core/components/material/shader/terrain.vs') as string
const fsTerrainSorce: string = require('/src/core/components/material/shader/terrain.fs') as string

export default class TerrainMaterial extends Material {
  heightmap: Texture
  terrainmap: Texture

  height: number
  offsetMatrix: mat4

  constructor(heightmap: Texture, terrainmap: Texture, height: number) {
    super()

    this.height = height
    this.heightmap = heightmap
    this.terrainmap = terrainmap
  }

  compile = (gl: WebGL2RenderingContext): boolean => {
    if(!this.compileBase(gl, fsTerrainSorce, vsTerrainSource)) return true

    this.uniformLocations.set('uOffsetMatrix', gl.getUniformLocation(this.program, 'uOffsetMatrix'))

    this.uniformLocations.set('uAmbientLight', gl.getUniformLocation(this.program, 'uAmbientLight'))
    this.uniformLocations.set('uLightDir', gl.getUniformLocation(this.program, 'uLightDir'))

    this.uniformLocations.set('uHeightmap', gl.getUniformLocation(this.program, 'uHeightmap'))
    this.uniformLocations.set('uTerrain', gl.getUniformLocation(this.program, 'uTerrain'))

    this.uniformLocations.set('uHeight', gl.getUniformLocation(this.program, 'uHeight'))

    return true
  }

  bind = (gl: WebGL2RenderingContext, light: LightData, viewDir: vec3, offsetMatrix: mat4) => {
    const { mainDirection } = light

    gl.uniform1f(this.uniformLocations.get('uAmbientLight'), DEFAULT_AMBIENT_LIGHT_INTENSITY)
    gl.uniform3fv(this.uniformLocations.get('uLightDir'), mainDirection)

    gl.activeTexture(gl.TEXTURE0)
    this.heightmap.bind(gl)
    gl.uniform1i(this.uniformLocations.get('uHeightmap'), 0)
    
    gl.activeTexture(gl.TEXTURE1)
    this.terrainmap.bind(gl)
    gl.uniform1i(this.uniformLocations.get('uTerrain'), 1)

    gl.uniform1f(this.uniformLocations.get('uHeight'), this.height)
    gl.uniformMatrix4fv(this.uniformLocations.get('uOffsetMatrix'), false, offsetMatrix)

    return true
  }
}