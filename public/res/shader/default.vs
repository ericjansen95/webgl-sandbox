attribute vec4 aVertexPosition;
attribute vec3 aVertexNormal;

uniform mat4 uModelMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;

varying vec3 vVertexNormal;

void main() {
  mat4 modelViewMatrix = uViewMatrix * uModelMatrix;
  gl_Position = uProjectionMatrix * modelViewMatrix * aVertexPosition;
  vVertexNormal = mat3(modelViewMatrix) * aVertexNormal;
}