import "./polyfill.js"

/**
 * @author Richard Dawson
 * @classdesc involves all logic, event listeners, and more for the Gaming Trivia game
 */
class GamingTrivia {
  /**
   * @constructor
   * Initializes the game state and starts the user at the settings screen
   */
  constructor() {
    this.settingsScreen = {
      "settings-container": document.getElementById("settings-container"),
      "start-quiz-button": document.getElementById("start-quiz-button"),
    }

    this.loadingScreen = {
      "loading-container": document.getElementById("loading-container"),
      "loading-progress": document.getElementById("loading-progress"),
    }

    this.quizScreen = {
      "quiz-container": document.getElementById("quiz-container"),
      "quiz-progress": document.getElementById("quiz-progress"),
      "quiz-time-ran-out": document.getElementById("quiz-time-ran-out"),
      "quiz-question-time-left-bar": document.getElementById(
        "quiz-question-time-left-bar"
      ),
      "quiz-question-interval": "",
      "current-quiz-question-container": document.getElementById(
        "current-quiz-question-container"
      ),
      "submit-question-button": document.getElementById(
        "submit-question-button"
      ),
      "next-question-button": document.getElementById("next-question-button"),
    }

    this.summaryScreen = {
      "summary-container": document.getElementById("summary-container"),
      "summary-progress-bar": document.getElementById("summary-progress-bar"),
      "total-score-percentage": document.getElementById(
        "total-score-percentage"
      ),
      "total-correct": document.getElementById("total-correct"),
      "total-correct-progress-bar": document.getElementById(
        "total-correct-progress-bar"
      ),
      "total-incorrect": document.getElementById("total-incorrect"),
      "total-incorrect-progress-bar": document.getElementById(
        "total-incorrect-progress-bar"
      ),
      "summary-difficulty": document.getElementById("summary-difficulty"),
      "share-twitter": document.getElementById("share-twitter"),
      "share-mail": document.getElementById("share-mail"),
      "play-again-yes": document.getElementById("play-again-yes"),
    }

    /**
     * Sets the current displayed screen so the game state knows where the user is at.
     * Possible screens:
     * settings
     * loading
     * awaitingAnswer
     * questionAnswered
     * summary
     */
    this.currentScreen = "settings"

    // If they are a new user create a local storage array
    if (!localStorage.getItem("quizzes")) {
      localStorage.setItem("quizzes", JSON.stringify([]))
    }

    this.quizzes = JSON.parse(localStorage.getItem("quizzes"))
    this.currentQuiz = this.quizzes.length // 0 Indexed

    this.keyboardEvents = new Map()
      .set("Enter", () => {
        this.enterKey()
      })
      .set("y", () => {
        this.yKey()
      })

    this.initializeButtons()
    this.initializeKeyboardEvents()
    this.initializeCloseAlert()
  }

  /**
   * Adds click listeners for all buttons in the game
   */
  initializeButtons() {
    this.settingsScreen["start-quiz-button"].addEventListener("click", () =>
      this.settingsComplete()
    )
    this.quizScreen["submit-question-button"].addEventListener("click", () =>
      this.submitQuestion()
    )
    this.quizScreen["next-question-button"].addEventListener("click", () =>
      this.displayNextQuestionOrSummary()
    )
    this.summaryScreen["play-again-yes"].addEventListener("click", () =>
      this.playAgain()
    )
  }

  /**
   * Adds a keydown listener for keyboard events and runs method if the
   * key was mapped in the object's keyboardEvents
   */
  initializeKeyboardEvents() {
    document.addEventListener("keydown", (event) => {
      if (this.keyboardEvents.get(event.key)) {
        this.keyboardEvents.get(event.key)(event)
      }
    })
  }

  /**
   * Display message if user wants to leave browser or tab during a quiz
   */
  initializeCloseAlert() {
    window.onbeforeunload = () => {
      const showAlert =
        this.currentScreen === "awaitingAnswer" ||
        this.currentScreen === "questionAnswered"
          ? true
          : null

      return showAlert
    }
  }

  /**
   * Called when enter key is pressed. Decides what method to call based on what screen is currently showing
   */
  enterKey() {
    switch (this.currentScreen) {
      case "settings":
        this.settingsComplete()
        break
      case "awaitingAnswer":
        this.submitQuestion()
        break
      case "questionAnswered":
        this.displayNextQuestionOrSummary()
        break
    }
  }

  /**
   * Called when y key is pressed. Decides whether the user can play the game again
   * @param {object} event - The event object from the original fired event
   */
  yKey(event) {
    if (this.currentScreen === "summary") {
      this.playAgain()
    }
  }

  /**
   * Hides the settings screen and starts the loading of the quiz
   */
  settingsComplete() {
    this.settingsScreen["settings-container"].classList.add("hidden")
    this.currentScreen = "loading"
    this.startLoading()
  }

  /**
   * Shows the loading screen and starts the loading progress bar.
   * When the data has completed loading it starts the quiz process.
   */
  startLoading() {
    this.loadingScreen["loading-container"].classList.remove("hidden")

    const numberOfQuestions = document.querySelector(
      "input[name='number-of-questions']:checked"
    ).value
    const quizDifficulty = document.querySelector(
      "input[name='difficulty']:checked"
    ).value

    const url = `https://opentdb.com/api.php?amount=${numberOfQuestions}&difficulty=${quizDifficulty}&category=15`

    const today = new Date()
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ]

    fetch(url)
      .then((resp) => resp.json())
      .then((data) => {
        // Create a quiz object to store in the local quizzes array
        // Quiz will be loaded to localStorage object after quiz is complete
        let newQuiz = {
          questions: data.results,
          difficulty: quizDifficulty,
          "current-question": 0, // 0 Indexed
          "total-questions": data.results.length,
          "total-incorrect": 0,
          "total-correct": 0,
          date: `${
            monthNames[today.getMonth()]
          } ${today.getDate()}, ${today.getFullYear()}`,
        }

        this.quizzes = [...this.quizzes, newQuiz]

        // Will always show loading screen for at least 1 second
        setTimeout(() => {
          this.startQuiz()
        }, 1000)
      })
  }

  /**
   * Shows the quiz screen and the first question.
   * Rest of the questions will be displayed from the next question button
   */
  startQuiz() {
    this.loadingScreen["loading-container"].classList.add("hidden")
    this.quizScreen["quiz-container"].classList.remove("hidden")
    this.currentScreen = "awaitingAnswer"
    this.createNextQuestion()
  }

  /**
   * Creates a question box with the proper answer section
   */
  createNextQuestion() {
    const currentQuiz = this.quizzes[this.currentQuiz]
    const questionInformation =
      currentQuiz.questions[currentQuiz["current-question"]]

    this.quizScreen["quiz-progress"].innerText = `Question ${
      currentQuiz["current-question"] + 1
    } of ${currentQuiz["total-questions"]}`

    this.quizScreen["quiz-question-time-left-bar"].value = 100

    let questionElement = document.createElement("div")

    questionElement.appendChild(
      this.createQuestionBox(questionInformation.question)
    )

    let answersArray = []

    if (questionInformation.type === "multiple") {
      answersArray = [...answersArray, questionInformation.correct_answer]
      ;[...questionInformation.incorrect_answers].map((current) => {
        answersArray = [...answersArray, current]
      })

      answersArray = this.shuffleArray(answersArray)
    } else {
      answersArray = [...answersArray, "True", "False"]
    }

    questionElement.appendChild(this.createAnswerSection(answersArray))

    this.displayQuestion(questionElement)
    this.startQuestionTime()
  }

  /**
   * Starts 10 second countdown for the current question and updates progress bar every second
   */
  startQuestionTime() {
    this.quizScreen["quiz-question-interval"] = setInterval(() => {
      const timeLeftBar = this.quizScreen["quiz-question-time-left-bar"]

      timeLeftBar.value -= 0.25

      if (timeLeftBar.value === 0) {
        this.submitQuestion()
        this.quizScreen["quiz-time-ran-out"].classList.remove("hidden")
        clearInterval(this.quizScreen["quiz-question-interval"])
      }
    }, 25)
  }

  /**
   * Shuffles/Randomizes the contents of an array
   * @param {array} array - The array to be randomized
   * @return {array} - The array randomized/shuffled
   */
  shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[array[i], array[j]] = [array[j], array[i]]
    }

    return array
  }

  /**
   * Creates a question box
   * @param {string} question - The string of text of the current question
   * @return {element} - DOM element that contains an NES box with the question
   */
  createQuestionBox(question) {
    let div = document.createElement("div")
    div.classList =
      "nes-container is-rounded is-dark mb-2 align-question-container"

    let p = document.createElement("p")
    p.innerText = this.decodeHTML(question)

    div.appendChild(p)

    return div
  }

  /**
   * Creates an answer section
   * @param {array} answers - Array of all possible answers for the current question
   * @return {element} - DOM element that contains an NES section of radio inputs
   */
  createAnswerSection(answers) {
    let section = document.createElement("section")
    section.classList = "nes-container with-title mb-2 align-answer-container"

    let h2 = document.createElement("h2")
    h2.classList.add("title")
    h2.innerText = "Choose your answer"

    let div = document.createElement("div")
    div.classList.add("nes-field")
    ;[...answers].map((current, index) => {
      div.appendChild(this.createRadioOption(current, index === 0))
    })

    section.appendChild(h2)
    section.appendChild(div)

    return section
  }

  /**
   * Cleans a string with HTML entities
   * @param {string} html - String that contains entities such as &nbsp;
   * @return {string} - String clean of any HTML entities
   */
  decodeHTML(html) {
    var txt = document.createElement("textarea")
    txt.innerHTML = html
    return txt.value
  }

  /**
   * Creates a radio option for the answer section
   * @param {string} question - The string of text of the current question
   * @return {element} - DOM element that contains a single NES radio input
   */
  createRadioOption(answer, checked = false) {
    let label = document.createElement("label")

    let input = document.createElement("input")
    input.type = "radio"
    input.classList.add("nes-radio")
    input.name = "question-answer"
    input.checked = checked
    input.value = this.decodeHTML(answer)

    let span = document.createElement("span")
    span.innerText = this.decodeHTML(answer)

    label.appendChild(input)
    label.appendChild(span)

    return label
  }

  /**
   * Displays the current question and possible answers to the screen and focuses the answers for keyboard shortcuts
   * @param {element} element - DOM element that contains the question and answer section to display
   */
  displayQuestion(element) {
    this.quizScreen["current-quiz-question-container"].appendChild(element)
    document.querySelector("input[name='question-answer']:checked").focus()
  }

  /**
   * Current question is graded and progress is set
   */
  submitQuestion() {
    this.currentScreen = "questionAnswered"
    this.quizScreen["submit-question-button"].classList.add("hidden")
    this.quizScreen["next-question-button"].classList.remove("hidden")
    ;[...document.querySelectorAll("input[name='question-answer']")].map(
      (currentAnswer) => {
        currentAnswer.disabled = true
      }
    )

    clearInterval(this.quizScreen["quiz-question-interval"])

    this.gradeCurrentQuestion()
  }

  /**
   * Decides whether to show the next question or the summary
   * Displays "Finish" on the next button if last question
   * is about to be displayed
   */
  displayNextQuestionOrSummary() {
    // Clear child nodes of the past question
    while (this.quizScreen["current-quiz-question-container"].firstChild) {
      this.quizScreen["current-quiz-question-container"].removeChild(
        this.quizScreen["current-quiz-question-container"].firstChild
      )
    }

    this.currentScreen = "awaitingAnswer"
    this.quizScreen["submit-question-button"].classList.remove("hidden")
    this.quizScreen["next-question-button"].classList.add("hidden")
    this.quizScreen["quiz-time-ran-out"].classList.add("hidden")
    this.quizzes[this.currentQuiz]["current-question"]++

    const questionsLeft =
      this.quizzes[this.currentQuiz]["total-questions"] -
      this.quizzes[this.currentQuiz]["current-question"]

    // Quiz Is Complete
    if (questionsLeft === 0) {
      this.currentScreen = "questionAnswered"
      this.quizScreen["quiz-container"].classList.add("hidden")
      this.startSummary()
    } else {
      // Check If Last Question
      if (questionsLeft === 1) {
        this.quizScreen["next-question-button"].innerText = "Finish"
      }

      this.createNextQuestion()
    }
  }

  /**
   * Checks the answer of the user against the real answer and displays
   * a correct or incorrect styling on the label accordingly
   */
  gradeCurrentQuestion() {
    const selectedAnswerElement = document.querySelector(
      "input[name='question-answer']:checked"
    )
    const selectedAnswer = selectedAnswerElement.value

    if (
      selectedAnswer ===
      this.quizzes[this.currentQuiz].questions[
        this.quizzes[this.currentQuiz]["current-question"]
      ].correct_answer
    ) {
      selectedAnswerElement.parentElement.classList.add(
        "is-success",
        "nes-text"
      )
      this.quizzes[this.currentQuiz]["total-correct"]++
    } else {
      selectedAnswerElement.parentElement.classList.add("is-error", "nes-text")
      this.quizzes[this.currentQuiz]["total-incorrect"]++
    }
  }

  /**
   * Calculates the total scores and displays them to the user
   */
  startSummary() {
    this.summaryScreen["summary-container"].classList.remove("hidden")
    this.currentScreen = "summary"

    const correctPercentage = Math.round(
      (this.quizzes[this.currentQuiz]["total-correct"] /
        this.quizzes[this.currentQuiz]["total-questions"]) *
        100
    ).toString()
    const incorrectPercentage = 100 - correctPercentage
    const shareMessage = `I%20got%20${
      this.quizzes[this.currentQuiz]["total-correct"]
    }%20out%20of%20${
      this.quizzes[this.currentQuiz]["total-questions"]
    }%20questions%20correct%20on%20${
      this.quizzes[this.currentQuiz].difficulty
    }%20difficulty%20on%20richardtaylordawson's%20Gaming%20Trivia!%0Ahttps://gaming-trivia.richardtaylordawson.com/`

    this.summaryScreen[
      "total-score-percentage"
    ].innerText = `${correctPercentage}%`
    this.summaryScreen["summary-difficulty"].innerText =
      this.quizzes[this.currentQuiz].difficulty.charAt(0).toUpperCase() +
      this.quizzes[this.currentQuiz].difficulty.slice(1)
    this.summaryScreen["total-correct"].innerText = this.quizzes[
      this.currentQuiz
    ]["total-correct"].toString()
    this.summaryScreen["total-correct-progress-bar"].value = correctPercentage
    this.summaryScreen["total-incorrect"].innerText = this.quizzes[
      this.currentQuiz
    ]["total-incorrect"].toString()
    this.summaryScreen[
      "total-incorrect-progress-bar"
    ].value = incorrectPercentage
    this.summaryScreen["share-twitter"].setAttribute(
      "href",
      `https://twitter.com/intent/tweet?text=${shareMessage}`
    )
    this.summaryScreen["share-mail"].href = `mailto:?body=${shareMessage}`

    localStorage.setItem("quizzes", JSON.stringify(this.quizzes))

    this.currentQuiz++
  }

  /**
   * Sets values back to default and sends user back to start of the quiz
   */
  playAgain() {
    this.summaryScreen["summary-container"].classList.add("hidden")
    this.settingsScreen["settings-container"].classList.remove("hidden")
    this.quizScreen["next-question-button"].innerText = "Next"
    this.currentScreen = "settings"
    document.querySelector("input[name='number-of-questions']:checked").focus()
  }
}

const Game = new GamingTrivia()
