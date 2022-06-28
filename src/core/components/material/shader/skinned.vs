attribute vec4 aVertexPosition;
attribute vec3 aVertexNormal;
attribute vec2 aVertexUv;

attribute vec4 aJointWeight;
attribute vec4 aJointIndices;

uniform mat4 uJointsMatrix[24];

uniform mat4 uWorldMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;

varying vec3 vVertexPosition;
varying vec3 vVertexNormal;
varying vec2 vVertexUv;

void main() {
  mat4 modelViewMatrix = uViewMatrix * uWorldMatrix;

  mat4 skinningMatrix = aJointWeight.x * uJointsMatrix[int(aJointIndices.x)] +
                        aJointWeight.y * uJointsMatrix[int(aJointIndices.y)] +
                        aJointWeight.z * uJointsMatrix[int(aJointIndices.z)] +
                        aJointWeight.w * uJointsMatrix[int(aJointIndices.w)];

  gl_Position = uProjectionMatrix * modelViewMatrix * skinningMatrix * aVertexPosition;
               
  vVertexPosition = aVertexPosition.xyz;
  vVertexNormal = mat3(uWorldMatrix) * mat3(skinningMatrix) * aVertexNormal;
  vVertexUv = aVertexUv;
}