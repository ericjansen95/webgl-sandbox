export default class Time {
  static startTime: number
  static deltaTime: number
  private static prevTime: number

  static init = (startTime: number) => {
    this.startTime = startTime
    this.deltaTime = 0.0
    this.prevTime = startTime
  }

  static tick = (curTime: number) => {
    this.deltaTime = Math.round((curTime - this.prevTime) * 100 ) / 100000
    this.prevTime = curTime
  }
}