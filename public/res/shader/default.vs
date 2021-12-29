attribute vec4 aVertexPosition;
attribute vec3 aVertexNormal;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;

varying vec3 vVertexNormal;

void main() {
  gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
  vVertexNormal = mat3(uModelViewMatrix) * aVertexNormal;
}