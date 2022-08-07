export type EventName = 'triggerenter';

export const subscribe = (eventName: EventName, callback: (data: Object) => {}) => {
  window.addEventListener(eventName, ({detail}: CustomEvent) => callback(detail), false)
}

export const dispatch = (eventName: EventName, data: Object) => {
  const event = new CustomEvent(eventName, { detail: data });
  window.dispatchEvent(event)
}