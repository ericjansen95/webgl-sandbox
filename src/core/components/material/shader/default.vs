attribute vec4 aVertexPosition;
attribute vec3 aVertexNormal;
attribute vec2 aVertexUv;

uniform mat4 uWorldMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;

varying vec3 vVertexNormal;
varying vec2 vVertexUv;

void main() {
  mat4 modelViewMatrix = uViewMatrix * uWorldMatrix;
  gl_Position = uProjectionMatrix * modelViewMatrix * aVertexPosition;
  vVertexNormal = mat3(uWorldMatrix) * aVertexNormal;
  vVertexUv = aVertexUv;
}