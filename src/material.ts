export type MaterialType = "LAMBERT" | "TERRAIN"

export interface Material {
  type: MaterialType
  program: WebGLProgram
  attributeLocations: Map<string, number>
  uniformLocations: Map<string, WebGLUniformLocation>
  bind: Function
}