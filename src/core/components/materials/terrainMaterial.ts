import { mat4, vec3 } from "gl-matrix";
import Material, { compileProgram, MaterialType } from "../material";
import { GL } from "../../scene/renderer"

const vsTerrainSource: string = require('/public/res/shader/terrain.vs') as string
const fsTerrainSorce: string = require('/public/res/shader/terrain.fs') as string

export default class TerrainMaterial extends Material {
  heightmap: WebGLTexture
  grassmap: WebGLTexture
  cliffmap: WebGLTexture

  height: number
  offsetMatrix: mat4

  constructor(heightmapUri: string, grassmapUri: string, cliffmapUri: string, height: number) {
    super()

    this.height = height
    this.type = "TERRAIN"

    const {program, attributeLocations, uniformLocations} = compileProgram(vsTerrainSource, fsTerrainSorce)
    
    this.program = program
    this.attributeLocations = attributeLocations
    this.uniformLocations = uniformLocations

    this.uniformLocations.set('uOffsetMatrix', GL.getUniformLocation(program, 'uOffsetMatrix'))

    this.uniformLocations.set('uAmbientLight', GL.getUniformLocation(program, 'uAmbientLight'))
    this.uniformLocations.set('uLightDir', GL.getUniformLocation(program, 'uLightDir'))

    this.uniformLocations.set('uHeightmap', GL.getUniformLocation(program, 'uHeightmap'))
    this.uniformLocations.set('uGrassmap', GL.getUniformLocation(program, 'uGrassmap'))  
    this.uniformLocations.set('uCliffmap', GL.getUniformLocation(program, 'uCliffmap'))

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

    var grassmap = new Image();
    grassmap.src = grassmapUri;

    grassmap.addEventListener('load', () => {
      this.grassmap = GL.createTexture();
      GL.bindTexture(GL.TEXTURE_2D, this.grassmap);
  
      GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, GL.LINEAR);
      GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MAG_FILTER, GL.LINEAR);
  
      GL.texImage2D(GL.TEXTURE_2D, 0, GL.RGBA, GL.RGBA, GL.UNSIGNED_BYTE, grassmap);
    });

    var cliffmap = new Image();
    cliffmap.src = cliffmapUri;

    cliffmap.addEventListener('load', () => {
      this.cliffmap = GL.createTexture();
      GL.bindTexture(GL.TEXTURE_2D, this.cliffmap);
  
      GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, GL.LINEAR);
      GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MAG_FILTER, GL.LINEAR);
  
      GL.texImage2D(GL.TEXTURE_2D, 0, GL.RGBA, GL.RGBA, GL.UNSIGNED_BYTE, cliffmap);
    });
  }

  bind = (lightDir: vec3, offsetMatrix: mat4) => {
    GL.uniform1f(this.uniformLocations.get('uAmbientLight'), 0.25)
    GL.uniform3fv(this.uniformLocations.get('uLightDir'), lightDir)

    GL.activeTexture(GL.TEXTURE0)
    GL.bindTexture(GL.TEXTURE_2D, this.heightmap)
    GL.uniform1i(this.uniformLocations.get('uHeightmap'), 0)
    
    GL.activeTexture(GL.TEXTURE1)
    GL.bindTexture(GL.TEXTURE_2D, this.grassmap)
    GL.uniform1i(this.uniformLocations.get('uGrassmap'), 1)

    GL.activeTexture(GL.TEXTURE2)
    GL.bindTexture(GL.TEXTURE_2D, this.cliffmap)
    GL.uniform1i(this.uniformLocations.get('uCliffmap'), 2)

    GL.uniform1f(this.uniformLocations.get('uHeight'), this.height)
    GL.uniformMatrix4fv(this.uniformLocations.get('uOffsetMatrix'), false, offsetMatrix)
  }
}