export const subscribe = (eventName: string, callback: (data: any) => void) => {
  window.addEventListener(eventName, ({detail}: CustomEvent) => callback(detail), false)
}

export const dispatch = (eventName: string, data: any) => {
  const event = new CustomEvent(eventName, { detail: data });
  window.dispatchEvent(event)
}