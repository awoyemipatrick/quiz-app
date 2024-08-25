document.addEventListener("DOMContentLoaded", function () {
    const startButton = document.getElementById("startQuizBtn");
    const startBtnRmv = document.getElementById(".start_btn");
    const infoBox = document.querySelector(".info_box"); //
    const quizContainer = document.querySelector(".quiz_container"); //
    const questionElement = document.querySelector(".quiz_question .question");
    const optionsListElement = document.querySelector(".options_list");
    const nextButton = document.getElementById("next");
    const scoreElement = document.getElementById("score");
    const resultElement = document.getElementById("result");
    const footerElement = document.querySelector("footer");
    const timerElement = document.querySelector(".time_reading");
    const progressBarFill = document.querySelector(".progress-bar-fill");
    const errorMessage = document.querySelector(".error_message");
  
    // Sound effects
    const correctSound = new Audio(""); // 
    const incorrectSound = new Audio(""); //
  
    let questions = []; // Array to hold quiz questions fetched from JSON
    let currentQuestionIndex = 0;
    let score = 0;
    let timeLeft = 15; // Time per question in seconds
    let timer;
    let answerSelected = false; // Flag to track if an answer has been selected
  
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
        startButton.addEventListener("click", startQuiz);
        nextButton.addEventListener("click", loadNextQuestion);
      })
      .catch((error) => {
        console.error("Error fetching questions:", error);
        errorMessage.classList.remove("hide");
      });
  
    function startQuiz() {
      infoBox.classList.add("hide");
      quizContainer.classList.remove("hide");
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
      footerElement.classList.remove("hide");
      scoreElement.textContent = score;
      resultElement.querySelector(".total").textContent = questions.length;
      saveScoreToLocalStorage(score); // Save score to local storage
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
          }
          setTimeout(loadNextQuestion, 2000); // Wait 2 seconds before moving to the next question
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
  