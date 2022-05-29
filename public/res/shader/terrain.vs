attribute vec4 aVertexPosition;
attribute vec3 aVertexNormal;

uniform mat4 uOffsetMatrix;

varying vec2 vUvPosition;
varying vec4 vVertexNormal;

uniform sampler2D uHeightmap;
uniform float uHeight;

uniform mat4 uWorldMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;

void main() {
  vUvPosition = (uOffsetMatrix * aVertexPosition).xz + vec2(2.0, 2.0);
  vVertexNormal = texture2D(uHeightmap, vUvPosition);
  
  vec4 position = vec4(aVertexPosition.x, aVertexPosition.y + vVertexNormal.w * uHeight, aVertexPosition.z, aVertexPosition.w);
  gl_Position = uProjectionMatrix * uViewMatrix * uWorldMatrix * position;  
}