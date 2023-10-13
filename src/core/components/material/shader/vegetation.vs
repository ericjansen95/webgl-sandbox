attribute vec4 aVertexPosition;
attribute vec3 aVertexNormal;
attribute vec2 aVertexUv;

uniform mat4 uWorldMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;
uniform float uTime;

varying vec3 vVertexNormal;
varying vec2 vVertexUv;
varying vec3 vVertexPosition;

#define SWAY_STRENGHT 0.001
#define SWAY_SPEED 0.0005

void main() {
  mat4 modelViewMatrix = uViewMatrix * uWorldMatrix;
  vec4 position = uProjectionMatrix * modelViewMatrix * aVertexPosition;

  float heightMask = 0.5 * pow(aVertexPosition.y, 2.0);
  float swayOffset = sin(uTime * SWAY_SPEED) * SWAY_STRENGHT * heightMask;
  position.x += swayOffset;
  
  gl_Position = position;

  vVertexPosition = aVertexPosition.xyz;
  vVertexNormal = mat3(uWorldMatrix) * aVertexNormal;
  vVertexUv = aVertexUv;
}