attribute vec4 aVertexPosition;
attribute vec3 aVertexNormal;
attribute vec2 aVertexUv;

uniform mat4 uWorldMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;

varying vec3 vVertexNormal;
varying vec2 vVertexUv;
varying vec3 vVertexPosition;

void main() {
  mat4 modelViewMatrix = uViewMatrix * uWorldMatrix;
  gl_Position = uProjectionMatrix * modelViewMatrix * aVertexPosition;

  vVertexPosition = aVertexPosition.xyz;
  vVertexNormal = mat3(uWorldMatrix) * aVertexNormal;
  vVertexUv = aVertexUv;
}