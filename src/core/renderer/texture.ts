import Debug from "../internal/debug"

export type TextureOptions = {
}

export default class Texture {
  srcUri: string
  buffer: WebGLTexture

  constructor(srcUri: string, options: TextureOptions = {}) {
    this.srcUri = srcUri
  }

  private load = (gl: WebGL2RenderingContext): boolean => {
    if(this.buffer) return true

    this.buffer = gl.createTexture()

    const startTime = Date.now()

    const image = new Image()
    image.src = this.srcUri

    image.onload = () => {
      gl.bindTexture(gl.TEXTURE_2D, this.buffer)

      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)

      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image)

      Debug.info(`Texture::load(): Loaded texture in = ${Date.now() - startTime}ms`)
    }

    return true
  }

  bind = (gl: WebGL2RenderingContext): boolean => {
    this.load(gl)

    if(!this.buffer) return false
    gl.bindTexture(gl.TEXTURE_2D, this.buffer)

    return true
  }
}