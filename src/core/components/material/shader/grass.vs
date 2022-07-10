attribute vec4 aVertexPosition;
attribute vec3 aVertexNormal;
attribute vec2 aVertexUv;

uniform mat4 uWorldMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;
uniform float uTime;

varying vec2 vVertexUv;

void main() {
  mat4 modelViewMatrix = uViewMatrix * uWorldMatrix;
  float xPosition = aVertexPosition.x + aVertexPosition.y * sin(uTime * 0.003) * 0.2;
  gl_Position = uProjectionMatrix * modelViewMatrix * vec4(xPosition, aVertexPosition.y, aVertexPosition.z, 1.0);

  vVertexUv = aVertexUv;
}