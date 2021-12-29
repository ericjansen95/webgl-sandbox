export type Material = {
  program: WebGLProgram
  attributeLocations: Map<string, number>
  uniformLocations: Map<string, WebGLUniformLocation>
}