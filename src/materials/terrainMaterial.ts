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

  constructor(renderer: Renderer, heightmapUri: string) {
    this.type = "TERRAIN"

    const {program, attributeLocations, uniformLocations} = renderer.compileProgram(vsTerrainSource, fsTerrainSorce)
    
    this.program = program
    this.attributeLocations = attributeLocations
    this.uniformLocations = uniformLocations

    this.uniformLocations.set('uAmbientLight', renderer.gl.getUniformLocation(program, 'uAmbientLight'))
    this.uniformLocations.set('uLightDir', renderer.gl.getUniformLocation(program, 'uLightDir'))

    this.uniformLocations.set('uTexture', renderer.gl.getUniformLocation(program, 'uTexture'))

    this.heightmap = renderer.gl.createTexture();
    renderer.gl.bindTexture(renderer.gl.TEXTURE_2D, this.heightmap);

    // ToDo(Eric) Manage texture level / position!
    renderer.gl.texImage2D(renderer.gl.TEXTURE_2D, 0, renderer.gl.RGBA, 1, 1, 0, renderer.gl.RGBA, renderer.gl.UNSIGNED_BYTE,
                            new Uint8Array([0, 0, 255, 255]));
      
    var image = new Image();
    image.src = heightmapUri;

    image.addEventListener('load', () => {
      renderer.gl.bindTexture(renderer.gl.TEXTURE_2D, this.heightmap);
      renderer.gl.texImage2D(renderer.gl.TEXTURE_2D, 0, renderer.gl.RGBA, renderer.gl.RGBA, renderer.gl.UNSIGNED_BYTE, image);
      renderer.gl.generateMipmap(renderer.gl.TEXTURE_2D);
    });
  }

  bind = (gl: WebGL2RenderingContext, lightDir: vec3, textureLocation: number) => {
    gl.uniform1f(this.uniformLocations.get('uAmbientLight'), 0.1)
    gl.uniform3fv(this.uniformLocations.get('uLightDir'), lightDir)

    gl.uniform1i(this.uniformLocations.get('uTexture'), textureLocation)
  }
}