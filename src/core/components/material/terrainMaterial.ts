import { mat4, vec3 } from "gl-matrix";
import Material, { compileProgram, LightData } from "./material";
import { GL } from "../../scene/renderer"

const vsTerrainSource: string = require('/src/core/components/material/shader/terrain.vs') as string
const fsTerrainSorce: string = require('/src/core/components/material/shader/terrain.fs') as string

export default class TerrainMaterial extends Material {
  heightmap: WebGLTexture
  terrainmap: WebGLTexture

  height: number
  offsetMatrix: mat4

  constructor(heightmapUri: string, terrainmapUri: string, height: number) {
    super()

    this.height = height

    const {program, attributeLocations, uniformLocations} = compileProgram(vsTerrainSource, fsTerrainSorce)
    
    this.program = program
    this.attributeLocations = attributeLocations
    this.uniformLocations = uniformLocations

    this.uniformLocations.set('uOffsetMatrix', GL.getUniformLocation(program, 'uOffsetMatrix'))

    this.uniformLocations.set('uAmbientLight', GL.getUniformLocation(program, 'uAmbientLight'))
    this.uniformLocations.set('uLightDir', GL.getUniformLocation(program, 'uLightDir'))

    this.uniformLocations.set('uHeightmap', GL.getUniformLocation(program, 'uHeightmap'))
    this.uniformLocations.set('uTerrain', GL.getUniformLocation(program, 'uTerrain'))

    this.uniformLocations.set('uHeight', GL.getUniformLocation(program, 'uHeight'))

    // ToDo Abstract this into function

    var heightmap = new Image();
    heightmap.src = heightmapUri;

    heightmap.addEventListener('load', () => {
      this.heightmap = GL.createTexture();
      GL.bindTexture(GL.TEXTURE_2D, this.heightmap);

      GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, GL.LINEAR);
      GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MAG_FILTER, GL.LINEAR);

      GL.texImage2D(GL.TEXTURE_2D, 0, GL.RGBA, GL.RGBA, GL.UNSIGNED_BYTE, heightmap);
    });

    var terrainmap = new Image();
    terrainmap.src = terrainmapUri;

    terrainmap.addEventListener('load', () => {
      this.terrainmap = GL.createTexture();
      GL.bindTexture(GL.TEXTURE_2D, this.terrainmap);
  
      GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, GL.LINEAR);
      GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MAG_FILTER, GL.LINEAR);
  
      GL.texImage2D(GL.TEXTURE_2D, 0, GL.RGBA, GL.RGBA, GL.UNSIGNED_BYTE, terrainmap);
    });
  }

  bind = (light: LightData, offsetMatrix: mat4) => {
    const { mainDirection } = light

    GL.uniform1f(this.uniformLocations.get('uAmbientLight'), 0.25)
    GL.uniform3fv(this.uniformLocations.get('uLightDir'), mainDirection)

    GL.activeTexture(GL.TEXTURE0)
    GL.bindTexture(GL.TEXTURE_2D, this.heightmap)
    GL.uniform1i(this.uniformLocations.get('uHeightmap'), 0)
    
    GL.activeTexture(GL.TEXTURE1)
    GL.bindTexture(GL.TEXTURE_2D, this.terrainmap)
    GL.uniform1i(this.uniformLocations.get('uTerrain'), 1)

    GL.uniform1f(this.uniformLocations.get('uHeight'), this.height)
    GL.uniformMatrix4fv(this.uniformLocations.get('uOffsetMatrix'), false, offsetMatrix)
  }
}