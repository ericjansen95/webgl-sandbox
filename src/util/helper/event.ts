export type EventName = 'triggerenter' | 'triggerleave';

export const subscribe = (eventName: EventName, callback: (data: any) => void) => {
  window.addEventListener(eventName, ({detail}: CustomEvent) => callback(detail), false)
}

export const dispatch = (eventName: EventName, data: any) => {
  const event = new CustomEvent(eventName, { detail: data });
  window.dispatchEvent(event)
}