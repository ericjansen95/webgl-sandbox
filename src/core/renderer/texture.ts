export type TextureOptions = {
}

export default class Texture {
  srcUri: string
  buffer: WebGLTexture

  constructor(srcUri: string, options: TextureOptions = {}) {
    this.srcUri = srcUri
  }

  private load = (gl: WebGL2RenderingContext): Promise<boolean> => {
    return new Promise((resolve) => {
      if(this.buffer) resolve(true)

      const image = new Image()
      image.src = this.srcUri
  
      image.onload = () => {
        this.buffer = gl.createTexture()
        gl.bindTexture(gl.TEXTURE_2D, this.buffer)
  
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image)

        resolve(true)
      }
    })
  }

  bind = async (gl: WebGL2RenderingContext) => {
    await this.load(gl)

    gl.bindTexture(gl.TEXTURE_2D, this.buffer)
  }
}