import React, { useState } from "react";
import "./App.css";

const API_URL = "http://127.0.0.1:8000";

function App() {
  const [screen, setScreen] = useState("start"); // start, quiz, feedback, result
  const [sessionId, setSessionId] = useState(null);
  const [question, setQuestion] = useState(null);
  const [level, setLevel] = useState("");
  const [questionNum, setQuestionNum] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const startQuiz = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/quiz/start`);
      const data = await res.json();
      setSessionId(data.session_id);
      setQuestion(data.question);
      setLevel(data.level);
      setQuestionNum(data.question_number);
      setTotalQuestions(data.total_questions);
      setScore(0);
      setSelected(null);
      setFeedback(null);
      setResult(null);
      setScreen("quiz");
    } catch (err) {
      setError("Cannot connect to backend. Make sure the FastAPI server is running on port 8000.");
      console.error("Start error:", err);
    }
    setLoading(false);
  };

  const submitAnswer = async (option) => {
    if (selected !== null) return; // prevent double-click
    setSelected(option);
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/quiz/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          question_id: question.id,
          selected_answer: option,
        }),
      });
      const data = await res.json();

      setFeedback({
        isCorrect: data.is_correct,
        correctAnswer: data.correct_answer,
      });
      setScore(data.score);

      if (data.finished) {
        setResult({
          score: data.score,
          total: data.total,
          badge: data.result,
        });
        setScreen("feedback");
      } else {
        // Store next question data for after feedback
        setFeedback({
          isCorrect: data.is_correct,
          correctAnswer: data.correct_answer,
          nextQuestion: data.question,
          nextLevel: data.level,
          nextNum: data.question_number,
        });
        setScreen("feedback");
      }
    } catch (err) {
      setError("Failed to submit answer. Check backend connection.");
      console.error("Answer error:", err);
    }
    setLoading(false);
  };

  const nextQuestion = () => {
    if (result) {
      setScreen("result");
    } else if (feedback && feedback.nextQuestion) {
      setQuestion(feedback.nextQuestion);
      setLevel(feedback.nextLevel);
      setQuestionNum(feedback.nextNum);
      setSelected(null);
      setFeedback(null);
      setScreen("quiz");
    }
  };

  const getLevelColor = (lvl) => {
    switch (lvl) {
      case "easy": return "#10b981";
      case "medium": return "#f59e0b";
      case "hard": return "#ef4444";
      default: return "#6366f1";
    }
  };

  const getLevelEmoji = (lvl) => {
    switch (lvl) {
      case "easy": return "🟢";
      case "medium": return "🟡";
      case "hard": return "🔴";
      default: return "⚪";
    }
  };

  // ─── START SCREEN ───
  if (screen === "start") {
    return (
      <div className="app">
        <div className="container start-screen">
          <div className="logo-icon">🧠</div>
          <h1 className="title">Adaptive Quiz</h1>
          <p className="subtitle">
            Test your tech knowledge! Questions adapt to your skill level in real-time.
          </p>
          <div className="features">
            <div className="feature">
              <span className="feature-icon">📈</span>
              <span>Adaptive Difficulty</span>
            </div>
            <div className="feature">
              <span className="feature-icon">⚡</span>
              <span>4 Questions</span>
            </div>
            <div className="feature">
              <span className="feature-icon">🏆</span>
              <span>Skill Rating</span>
            </div>
          </div>
          {error && <div className="error-msg">{error}</div>}
          <button className="btn-start" onClick={startQuiz} disabled={loading}>
            {loading ? "Starting..." : "Start Quiz 🚀"}
          </button>
        </div>
      </div>
    );
  }

  // ─── FEEDBACK SCREEN ───
  if (screen === "feedback") {
    return (
      <div className="app">
        <div className="container feedback-screen">
          <div className={`feedback-icon ${feedback.isCorrect ? "correct" : "wrong"}`}>
            {feedback.isCorrect ? "✅" : "❌"}
          </div>
          <h2 className="feedback-title">
            {feedback.isCorrect ? "Correct!" : "Wrong!"}
          </h2>
          {!feedback.isCorrect && (
            <p className="correct-answer">
              Correct answer: <strong>{feedback.correctAnswer}</strong>
            </p>
          )}
          <div className="score-display">
            Score: <strong>{score}</strong> / {totalQuestions}
          </div>
          <button className="btn-next" onClick={nextQuestion}>
            {result ? "See Results 🏆" : "Next Question →"}
          </button>
        </div>
      </div>
    );
  }

  // ─── RESULT SCREEN ───
  if (screen === "result") {
    return (
      <div className="app">
        <div className="container result-screen">
          <div className="result-badge">{result.badge}</div>
          <h2 className="result-title">Quiz Complete!</h2>
          <div className="result-score">
            <span className="score-big">{result.score}</span>
            <span className="score-sep">/</span>
            <span className="score-total">{result.total}</span>
          </div>
          <div className="result-bar-container">
            <div
              className="result-bar"
              style={{ width: `${(result.score / result.total) * 100}%` }}
            />
          </div>
          <button className="btn-start" onClick={startQuiz} disabled={loading}>
            {loading ? "Starting..." : "Play Again 🔄"}
          </button>
        </div>
      </div>
    );
  }

  // ─── QUIZ SCREEN ───
  return (
    <div className="app">
      <div className="container quiz-screen">
        {/* Header */}
        <div className="quiz-header">
          <div className="level-badge" style={{ background: getLevelColor(level) }}>
            {getLevelEmoji(level)} {level.toUpperCase()}
          </div>
          <div className="progress-text">
            {questionNum} / {totalQuestions}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="progress-bar-container">
          <div
            className="progress-bar"
            style={{ width: `${((questionNum - 1) / totalQuestions) * 100}%` }}
          />
        </div>

        {/* Question */}
        <div className="question-card">
          <h2 className="question-text">{question.q}</h2>
        </div>

        {/* Options */}
        <div className="options-grid">
          {question.options.map((option, idx) => (
            <button
              key={idx}
              className={`option-btn ${selected === option ? "selected" : ""}`}
              onClick={() => submitAnswer(option)}
              disabled={selected !== null || loading}
            >
              <span className="option-letter">
                {String.fromCharCode(65 + idx)}
              </span>
              <span className="option-text">{option}</span>
            </button>
          ))}
        </div>

        {/* Score */}
        <div className="quiz-footer">
          <span>Score: {score}</span>
        </div>

        {error && <div className="error-msg">{error}</div>}
      </div>
    </div>
  );
}

export default App;