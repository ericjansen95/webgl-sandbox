attribute vec4 aVertexPosition;
attribute vec3 aVertexNormal;
attribute vec4 aVertexTangent;
attribute vec2 aVertexUv;

uniform mat4 uWorldMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;
uniform vec3 uWindDirection;

varying vec3 vWindDirection;
varying vec3 vVertexBinormal;
varying vec2 vVertexUv;

void main() {
  mat4 modelViewMatrix = uViewMatrix * uWorldMatrix;
  gl_Position = uProjectionMatrix * modelViewMatrix * aVertexPosition;

  vVertexBinormal = cross(aVertexNormal, aVertexTangent.xyz);
  vWindDirection = uWindDirection;
  vVertexUv = aVertexUv;
}