/**
 * @author Richard Dawson
 * @classdesc involves all logic to calculate and display the user's all time stats
 */
class Stats {
  /**
   * @constructor
   * Initializes the local storage and starts to calculate the data
   */
  constructor() {
    this.stats = {
      "total-questions": document.getElementById("total-questions"),
      "total-incorrect": document.getElementById("total-incorrect"),
      "total-correct": document.getElementById("total-correct"),
      "avg-correct": document.getElementById("avg-correct"),
      "last-quiz": document.getElementById("last-quiz"),
      "high-score": document.getElementById("high-score"),
    }

    this.quizzes = JSON.parse(localStorage.getItem("quizzes")) || []

    this.displayTotalQuestions()
    this.displayTotalCorrect()
    this.displayTotalIncorrect()
    this.displayAvgCorrect()
    this.displayLastQuiz()
    this.displayHighScore()
  }

  /**
   * Displays the total questions the user has answered
   */
  displayTotalQuestions() {
    this.stats["total-questions"].innerText = this.getTotalQuestions()
  }

  /**
   * @return {number} - returns the total questions the user has answered
   */
  getTotalQuestions() {
    return this.quizzes.reduce(
      (acc, item) => (acc += item["total-questions"]),
      0
    )
  }

  /**
   * Displays the total questions the user has answered correct
   */
  displayTotalCorrect() {
    this.stats["total-correct"].innerText = this.getTotalCorrect()
  }

  /**
   * @return {number} - returns the total questions the user has answered correct
   */
  getTotalCorrect() {
    return this.quizzes.reduce((acc, item) => (acc += item["total-correct"]), 0)
  }

  /**
   * Displays the total questions the user has answered incorrect
   */
  displayTotalIncorrect() {
    this.stats["total-incorrect"].innerText = this.getTotalIncorrect()
  }

  /**
   * @return {number} - returns the total questions the user has answered incorrect
   */
  getTotalIncorrect() {
    return this.quizzes.reduce(
      (acc, item) => (acc += item["total-incorrect"]),
      0
    )
  }

  /**
   * Displays the total average correct
   */
  displayAvgCorrect() {
    this.stats["avg-correct"].innerText = this.getAvgCorrect()
  }

  /**
   * @return {string} - returns the total average correct
   */
  getAvgCorrect() {
    return this.getTotalQuestions() === 0
      ? "0%"
      : `${this.computeAverage(
          this.getTotalCorrect(),
          this.getTotalQuestions()
        )}%`
  }

  /**
   * Displays the date of the last quiz the user took
   */
  displayLastQuiz() {
    this.stats["last-quiz"].innerText = this.getLastQuiz()
  }

  /**
   * @return {string} - returns the date of the last quiz the user took
   */
  getLastQuiz() {
    return this.getTotalQuestions() === 0
      ? "N/A"
      : this.quizzes[this.quizzes.length - 1].date
  }

  /**
   * Displays the highest score based on avg score and difficulty
   */
  displayHighScore() {
    this.stats["high-score"].innerText = this.getHighScore()
  }

  /**
   * @return {string} - returns the highest score based on avg score and difficulty
   */
  getHighScore() {
    if (
      this.getTotalQuestions() === 0 ||
      (this.getTotalQuestions() > 0 && this.getTotalCorrect() === 0)
    ) {
      return "N/A"
    } else {
      return this.quizzes.reduce(
        (accumulator, item) => {
          const average = this.computeAverage(
            item["total-correct"],
            item["total-questions"]
          )
          const currentAdjustedScore = this.adjustScore(
            item.difficulty,
            average
          )

          if (currentAdjustedScore > accumulator.adjustedScore) {
            accumulator = {
              adjustedScore: currentAdjustedScore,
              score: `${
                item.difficulty.charAt(0).toUpperCase() +
                item.difficulty.slice(1)
              } - ${average}%`,
            }
          }

          return accumulator
        },
        { adjustedScore: 0, score: "" }
      ).score
    }
  }

  /**
   * @param {string} difficulty - the quiz difficulty used to adjust the score
   * @param {number} score - current score before being adjusted
   * @return {number} - adjusted score
   */
  adjustScore(difficulty, score) {
    switch (difficulty) {
      case "easy":
        return score
      case "medium":
        return score * 1.5
      case "hard":
        return score * 2
    }
  }

  /**
   * Computes an average with a given numerator and denominator rounded to the nearest integer
   * @param {number} numerator
   * @param {number} denominator
   * @return {number} computer average rounded to nearest integer
   */
  computeAverage(numerator, denominator) {
    return Math.round((numerator / denominator) * 100)
  }
}

const AllTimeStats = new Stats()

// Register service worker
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js")
}
