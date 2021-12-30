export default class Time {
  static startTime: number
  static deltaTime: number
  private static prevTime: number

  constructor() {

  }

  static tick = (curTime) => {
    this.deltaTime = Math.round((curTime - this.prevTime) * 100 ) / 100000
    this.prevTime = curTime
  }
}