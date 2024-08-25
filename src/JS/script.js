document.addEventListener("DOMContentLoaded", function () {
  const startButton = document.getElementById("startQuizBtn");
  const infoBox = document.querySelector(".info_box");
  const quizContainer = document.querySelector(".quiz_container");
  const questionElement = document.querySelector(".quiz_question .question");
  const optionsListElement = document.querySelector(".options_list");
  const nextButton = document.getElementById("next");
  const scoreElement = document.getElementById("score");
  const totalQuestionsElement = document.getElementById("total");
  const resultContainer = document.querySelector(".result_container");
  const timerElement = document.querySelector(".time_reading");
  const progressBarFill = document.querySelector(".progress-bar-fill");
  const errorMessage = document.querySelector(".error_message");
  const continueQuizButton = document.getElementById("continueQuizBtn");
  const feedbackContainer = document.querySelector(".feedback_container");
  const feedbackList = document.getElementById("feedbackList");
  const viewFeedbackButton = document.getElementById("viewFeedbackBtn");
  const viewLeaderboardButton = document.getElementById("viewLeaderboardBtn");
  const leaderboardContainer = document.querySelector(".leaderboard_container");
  const leaderboardList = document.getElementById("leaderboardList");
  const backToQuizButton = document.getElementById("backToQuizBtn");
  const backToQuizFromLeaderboardButton = document.getElementById("backToQuizFromLeaderboardBtn");

  // Sound effects
  const correctSound = new Audio("/media/correct-answer.mp3");
  const incorrectSound = new Audio("/media/wrong-answer.mp3");

  let questions = []; // Array to hold quiz questions fetched from data.json
  let currentQuestionIndex = 0;
  let score = 0;
  let timeLeft = 15; // Time per question in seconds
  let timer;
  let answerSelected = false; // Flag to track if an answer has been selected
  let userAnswers = []; // Store user's answers for feedback

  // Fetch questions from data.json
  fetch("/data/data.json")
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    })
    .then((data) => {
      questions = data;
      startButton.addEventListener("click", showInstructions);
      continueQuizButton.addEventListener("click", startQuiz);
      nextButton.addEventListener("click", loadNextQuestion);
      viewFeedbackButton.addEventListener("click", showFeedback);
      viewLeaderboardButton.addEventListener("click", showLeaderboard);
      backToQuizButton.addEventListener("click", backToQuiz);
      backToQuizFromLeaderboardButton.addEventListener("click", backToQuiz);
    })
    .catch((error) => {
      console.error("Error fetching questions:", error);
      errorMessage.classList.remove("hide");
    });

  function showInstructions() {
    startButton.classList.add("hide"); // Hide start button
    infoBox.classList.remove("hide"); // Show quiz instructions
  }

  function startQuiz() {
    infoBox.classList.add("hide"); // Hide instructions
    quizContainer.classList.remove("hide"); // Show quiz container
    loadQuestion(currentQuestionIndex);
    startTimer();
  }

  function loadQuestion(index) {
    const questionData = questions[index];
    questionElement.textContent = questionData.question;
    optionsListElement.innerHTML = ""; // Clear previous options
    answerSelected = false; // Reset answer selected flag

    questionData.options.forEach((option, i) => {
      const optionLabel = document.createElement("label");
      optionLabel.innerHTML = `
        <div>
          <input type="radio" name="option" class="option" value="${i}" />
          <span>${option}</span>
        </div>
      `;
      optionsListElement.appendChild(optionLabel);
    });

    updateProgressBar(index);
    handleOptionSelection();
  }

  function handleOptionSelection() {
    const optionInputs = document.querySelectorAll('input[name="option"]');
    optionInputs.forEach((input) => {
      input.addEventListener("change", (event) => {
        answerSelected = true;
        const selectedOption = parseInt(event.target.value);
        userAnswers[currentQuestionIndex] = selectedOption; // Store the user's answer for feedback
        if (selectedOption === questions[currentQuestionIndex].answer) {
          score++;
          correctSound.play(); // Play correct answer sound
        } else {
          incorrectSound.play(); // Play incorrect answer sound
        }
        showCorrectAnswer();
        clearInterval(timer); // Stop timer on selection
        setTimeout(loadNextQuestion, 2000); // Wait 2 seconds before moving to the next question
      });
    });
  }

  function showCorrectAnswer() {
    const optionInputs = document.querySelectorAll('input[name="option"]');
    optionInputs.forEach((input, index) => {
      input.disabled = true; // Disable all options after an answer is selected or time runs out
      const parentLabel = input.parentElement;
      if (index === questions[currentQuestionIndex].answer) {
        parentLabel.style.backgroundColor = "lightgreen"; // Highlight the correct answer
      } else {
        parentLabel.style.backgroundColor = "lightcoral"; // Highlight incorrect answers
      }
    });
  }

  function loadNextQuestion() {
    currentQuestionIndex++;
    if (currentQuestionIndex < questions.length) {
      loadQuestion(currentQuestionIndex);
      resetTimer();
      startTimer();
    } else {
      endQuiz();
    }
  }

  function endQuiz() {
    quizContainer.classList.add("hide");
    resultContainer.classList.remove("hide");

    // Update and display the score and total questions
    scoreElement.textContent = score;
    totalQuestionsElement.textContent = questions.length;

    saveScoreToLocalStorage(score); // Save score to local storage
  }

  function showFeedback() {
    resultContainer.classList.add("hide");
    feedbackContainer.classList.remove("hide");
    feedbackList.innerHTML = ""; // Clear previous feedback

    questions.forEach((question, index) => {
      const userAnswer = userAnswers[index];
      const correctAnswer = question.answer;
      const feedbackItem = document.createElement("li");
      feedbackItem.innerHTML = `
        <strong>Question ${index + 1}:</strong> ${question.question}<br>
        <span style="color: ${userAnswer === correctAnswer ? 'green' : 'red'};">
          Your Answer: ${question.options[userAnswer] !== undefined ? question.options[userAnswer] : "No answer"}
        </span><br>
        <span style="color: green;">Correct Answer: ${question.options[correctAnswer]}</span>
      `;
      feedbackList.appendChild(feedbackItem);
    });
  }

  function showLeaderboard() {
    resultContainer.classList.add("hide");
    leaderboardContainer.classList.remove("hide");
    leaderboardList.innerHTML = ""; // Clear previous leaderboard entries

    const scoreHistory = JSON.parse(localStorage.getItem('quizScoreHistory')) || [];
    scoreHistory.sort((a, b) => b.score - a.score); // Sort by high score

    scoreHistory.forEach((entry, index) => {
      const leaderboardItem = document.createElement("li");
      leaderboardItem.textContent = `#${index + 1}: ${entry.date} - ${entry.score} / ${entry.totalQuestions}`;
      leaderboardList.appendChild(leaderboardItem);
    });
  }

  function backToQuiz() {
    feedbackContainer.classList.add("hide");
    leaderboardContainer.classList.add("hide");
    resultContainer.classList.remove("hide");
  }

  function startTimer() {
    timeLeft = 15;
    timerElement.textContent = timeLeft;
    timer = setInterval(() => {
      timeLeft--;
      timerElement.textContent = timeLeft;
      if (timeLeft <= 0) {
        clearInterval(timer);
        if (!answerSelected) {
          incorrectSound.play(); // Play incorrect sound when time runs out without selection
          showCorrectAnswer();
          setTimeout(loadNextQuestion, 2000); // Wait 2 seconds before moving to the next question
        }
      }
    }, 1000);
  }

  function resetTimer() {
    clearInterval(timer);
    timerElement.textContent = "15";
  }

  function updateProgressBar(index) {
    const progress = ((index + 1) / questions.length) * 100;
    progressBarFill.style.width = `${progress}%`;
  }

  function saveScoreToLocalStorage(score) {
    let scoreHistory = JSON.parse(localStorage.getItem('quizScoreHistory')) || [];
    scoreHistory.push({
      date: new Date().toLocaleString(),
      score: score,
      totalQuestions: questions.length
    });
    localStorage.setItem('quizScoreHistory', JSON.stringify(scoreHistory));
  }
});
