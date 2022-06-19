attribute vec4 aVertexPosition;
attribute vec3 aVertexNormal;
attribute vec2 aVertexUv;

attribute vec4 aJointWeight;
attribute vec4 aJointIndices;

uniform mat4 uJointsMatrix[24];

uniform mat4 uWorldMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;

varying vec3 vVertexNormal;
varying vec2 vVertexUv;
varying vec3 vVertexPosition;

void main() {
  mat4 modelViewMatrix = uViewMatrix * uWorldMatrix;

  float height = aVertexPosition.y * 0.5;

  gl_Position = uProjectionMatrix * modelViewMatrix *
                (uJointsMatrix[0] * aVertexPosition * (1.0 - height) + 
                  uJointsMatrix[1] * aVertexPosition * height);
  /*
  (uJointsMatrix[int(aJointIndices[0])] * aVertexPosition * aJointWeight[0] +
    uJointsMatrix[int(aJointIndices[1])] * aVertexPosition * aJointWeight[1] +
    uJointsMatrix[int(aJointIndices[2])] * aVertexPosition * aJointWeight[2] +
    uJointsMatrix[int(aJointIndices[3])] * aVertexPosition * aJointWeight[3]);
  */
               
  vVertexPosition = aVertexPosition.xyz;
  vVertexNormal = mat3(uWorldMatrix) * aVertexNormal;
  vVertexUv = aVertexUv;
}