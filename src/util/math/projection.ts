import { mat4, vec2, vec4 } from "gl-matrix";
import Camera from "../../core/components/base/camera";
import { ComponentType } from "../../core/components/base/component";
import Transform from "../../core/components/base/transform";
import Entity from "../../core/scene/entity";

export const globalToScreenSpace = (globalPosition: vec4, entity: Entity, camera: Entity): vec2 => {
  // ToDo: cache the refs in onAdd callback
  const transformComponent = entity.get(ComponentType.TRANSFORM) as Transform
  const cameraComponent = camera.get(ComponentType.CAMERA) as Camera

  const mvpMatrix = mat4.clone(transformComponent.globalMatrix)
  mat4.multiply(mvpMatrix, cameraComponent.viewMatrix, mvpMatrix)
  mat4.multiply(mvpMatrix, cameraComponent.projectionMatrix, mvpMatrix)

  // project label entity position to clip space
  const projectedPosition = vec4.transformMat4(vec4.create(), globalPosition, mvpMatrix)

  // return if point is behind screen
  if(projectedPosition[3] < 0) return null

  // transform point into normalized screen space
  const normalizedPosition = vec2.fromValues(projectedPosition[0] / projectedPosition[2], -projectedPosition[1] / projectedPosition[2])
  vec2.add(normalizedPosition, normalizedPosition, [1, 1])
  vec2.scale(normalizedPosition, normalizedPosition, 0.5)

  // return if point is outside of view
  if(normalizedPosition[0] < 0 || normalizedPosition[0] > 1 || normalizedPosition[1] < 0 || normalizedPosition[2] > 1) return null

  // transform point into pixel coordinates
  return vec2.fromValues(Math.round(normalizedPosition[0] * window.innerWidth), Math.round(normalizedPosition[1] * window.innerHeight))
}