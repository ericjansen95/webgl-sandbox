import { vec3 } from "gl-matrix";
import { compileProgram, Material, MaterialType } from "../material";
import Renderer, { GL } from "../renderer"

const vsTerrainSource: string = require('/public/res/shader/terrain.vs') as string
const fsTerrainSorce: string = require('/public/res/shader/terrain.fs') as string

export default class TerrainMaterial implements Material {
  type: MaterialType
  program: WebGLProgram
  attributeLocations: Map<string, number>
  uniformLocations: Map<string, WebGLUniformLocation>
  heightmap: WebGLTexture

  constructor(heightmapUri: string) {
    this.type = "TERRAIN"

    const {program, attributeLocations, uniformLocations} = compileProgram(vsTerrainSource, fsTerrainSorce)
    
    this.program = program
    this.attributeLocations = attributeLocations
    this.uniformLocations = uniformLocations

    this.uniformLocations.set('uAmbientLight', GL.getUniformLocation(program, 'uAmbientLight'))
    this.uniformLocations.set('uLightDir', GL.getUniformLocation(program, 'uLightDir'))

    this.uniformLocations.set('uTexture', GL.getUniformLocation(program, 'uTexture'))

    this.heightmap = GL.createTexture();
    GL.bindTexture(GL.TEXTURE_2D, this.heightmap);

    // ToDo(Eric) Manage texture level / position!
    GL.texImage2D(GL.TEXTURE_2D, 0, GL.RGBA, 1, 1, 0, GL.RGBA, GL.UNSIGNED_BYTE,
                            new Uint8Array([0, 0, 255, 255]));
      
    var image = new Image();
    image.src = heightmapUri;

    image.addEventListener('load', () => {
      GL.bindTexture(GL.TEXTURE_2D, this.heightmap);
      GL.texImage2D(GL.TEXTURE_2D, 0, GL.RGBA, GL.RGBA, GL.UNSIGNED_BYTE, image);
      GL.generateMipmap(GL.TEXTURE_2D);
    });
  }

  bind = (gl: WebGL2RenderingContext, lightDir: vec3, textureLocation: number) => {
    gl.uniform1f(this.uniformLocations.get('uAmbientLight'), 0.25)
    gl.uniform3fv(this.uniformLocations.get('uLightDir'), lightDir)

    gl.uniform1i(this.uniformLocations.get('uTexture'), textureLocation)
  }
}