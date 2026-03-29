import React, { useState, useEffect, useCallback, useRef } from "react";
import "./App.css";

const API_URL = "http://127.0.0.1:8000";

// ─── CONFETTI COMPONENT ───
function Confetti({ active }) {
  if (!active) return null;
  const pieces = Array.from({ length: 50 }, (_, i) => {
    const colors = ["#6366f1", "#a78bfa", "#f59e0b", "#10b981", "#ef4444", "#ec4899", "#3b82f6"];
    const style = {
      left: `${Math.random() * 100}%`,
      animationDelay: `${Math.random() * 0.5}s`,
      animationDuration: `${1.5 + Math.random() * 2}s`,
      backgroundColor: colors[Math.floor(Math.random() * colors.length)],
      width: `${6 + Math.random() * 8}px`,
      height: `${6 + Math.random() * 8}px`,
      borderRadius: Math.random() > 0.5 ? "50%" : "2px",
      transform: `rotate(${Math.random() * 360}deg)`,
    };
    return <div key={i} className="confetti-piece" style={style} />;
  });
  return <div className="confetti-container">{pieces}</div>;
}

// ─── FLOATING PARTICLES ───
function FloatingParticles() {
  const particles = Array.from({ length: 20 }, (_, i) => {
    const style = {
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      animationDelay: `${Math.random() * 8}s`,
      animationDuration: `${6 + Math.random() * 10}s`,
      width: `${2 + Math.random() * 4}px`,
      height: `${2 + Math.random() * 4}px`,
      opacity: 0.1 + Math.random() * 0.3,
    };
    return <div key={i} className="floating-particle" style={style} />;
  });
  return <div className="particles-container">{particles}</div>;
}

// ─── TIMER COMPONENT ───
function Timer({ timeLimit, onTimeout, isActive }) {
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    setTimeLeft(timeLimit);
    startTimeRef.current = Date.now();
  }, [timeLimit]);

  useEffect(() => {
    if (!isActive) return;
    const interval = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      const remaining = Math.max(0, timeLimit - elapsed);
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        onTimeout();
      }
    }, 50);
    return () => clearInterval(interval);
  }, [isActive, timeLimit, onTimeout]);

  const percentage = (timeLeft / timeLimit) * 100;
  const isWarning = timeLeft <= 5;
  const isCritical = timeLeft <= 3;

  return (
    <div className="timer-wrapper">
      <div className={`timer-ring ${isWarning ? "warning" : ""} ${isCritical ? "critical" : ""}`}>
        <svg viewBox="0 0 100 100" className="timer-svg">
          <circle className="timer-bg" cx="50" cy="50" r="44" />
          <circle
            className="timer-progress"
            cx="50"
            cy="50"
            r="44"
            style={{
              strokeDashoffset: 276.46 - (276.46 * percentage) / 100,
            }}
          />
        </svg>
        <span className={`timer-text ${isCritical ? "critical-text" : ""}`}>
          {Math.ceil(timeLeft)}
        </span>
      </div>
    </div>
  );
}

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
  const [streak, setStreak] = useState(0);
  const [timeLimit, setTimeLimit] = useState(15);
  const [timerActive, setTimerActive] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [animateScore, setAnimateScore] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

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
      setStreak(0);
      setSelected(null);
      setFeedback(null);
      setResult(null);
      setTimeLimit(data.time_limit || 15);
      setTimerActive(true);
      setQuestionStartTime(Date.now());
      setShowConfetti(false);
      setShowLeaderboard(false);
      setScreen("quiz");
    } catch (err) {
      setError("Cannot connect to backend. Make sure the FastAPI server is running on port 8000.");
      console.error("Start error:", err);
    }
    setLoading(false);
  };

  const handleTimeout = useCallback(() => {
    if (selected !== null) return;
    // Auto-submit with empty answer on timeout
    submitAnswer("__TIMEOUT__");
  }, [selected]);

  const submitAnswer = async (option) => {
    if (selected !== null && option !== "__TIMEOUT__") return;
    const timeTaken = questionStartTime ? (Date.now() - questionStartTime) / 1000 : 0;
    setSelected(option === "__TIMEOUT__" ? "__TIMEOUT__" : option);
    setTimerActive(false);
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/quiz/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          question_id: question.id,
          selected_answer: option === "__TIMEOUT__" ? "" : option,
          time_taken: Math.round(timeTaken * 10) / 10,
        }),
      });
      const data = await res.json();

      setStreak(data.streak || 0);

      if (data.is_correct) {
        setAnimateScore(true);
        setTimeout(() => setAnimateScore(false), 600);
      }

      setFeedback({
        isCorrect: data.is_correct,
        correctAnswer: data.correct_answer,
        explanation: data.explanation || "",
        speedBonus: data.speed_bonus || 0,
        timedOut: option === "__TIMEOUT__",
      });
      setScore(data.score);

      if (data.finished) {
        setResult({
          score: data.score,
          total: data.total,
          badge: data.result,
          maxStreak: data.max_streak,
          avgTime: data.avg_time,
          totalTime: data.total_time,
          accuracy: data.accuracy,
          history: data.answers_history || [],
        });
        setScreen("feedback");
      } else {
        setFeedback((prev) => ({
          ...prev,
          nextQuestion: data.question,
          nextLevel: data.level,
          nextNum: data.question_number,
          nextTimeLimit: data.time_limit || 15,
        }));
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
      setShowConfetti(true);
      setScreen("result");
      setTimeout(() => setShowConfetti(false), 4000);
    } else if (feedback && feedback.nextQuestion) {
      setQuestion(feedback.nextQuestion);
      setLevel(feedback.nextLevel);
      setQuestionNum(feedback.nextNum);
      setTimeLimit(feedback.nextTimeLimit || 15);
      setSelected(null);
      setFeedback(null);
      setTimerActive(true);
      setQuestionStartTime(Date.now());
      setScreen("quiz");
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch(`${API_URL}/leaderboard`);
      const data = await res.json();
      setLeaderboard(data.leaderboard || []);
      setShowLeaderboard(true);
    } catch (err) {
      console.error("Leaderboard error:", err);
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

  const getAccuracyColor = (acc) => {
    if (acc >= 80) return "#10b981";
    if (acc >= 60) return "#f59e0b";
    return "#ef4444";
  };

  // ─── START SCREEN ───
  if (screen === "start") {
    return (
      <div className="app">
        <FloatingParticles />
        <div className="container start-screen">
          <div className="glow-orb orb-1" />
          <div className="glow-orb orb-2" />
          <div className="logo-icon">🧠</div>
          <h1 className="title">Adaptive Quiz</h1>
          <p className="subtitle">
            Test your tech knowledge! Questions adapt to your skill level in real-time.
            Beat the timer and build streaks for the best score!
          </p>
          <div className="features">
            <div className="feature">
              <span className="feature-icon">📈</span>
              <span>Adaptive Difficulty</span>
            </div>
            <div className="feature">
              <span className="feature-icon">⏱️</span>
              <span>Timed Questions</span>
            </div>
            <div className="feature">
              <span className="feature-icon">🔥</span>
              <span>Streak Bonuses</span>
            </div>
            <div className="feature">
              <span className="feature-icon">🏆</span>
              <span>Leaderboard</span>
            </div>
          </div>
          <div className="stats-preview">
            <div className="stat-item">
              <span className="stat-value">5</span>
              <span className="stat-label">Questions</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <span className="stat-value">15s</span>
              <span className="stat-label">Per Question</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <span className="stat-value">3</span>
              <span className="stat-label">Difficulty Levels</span>
            </div>
          </div>
          {error && <div className="error-msg">{error}</div>}
          <button className="btn-start" onClick={startQuiz} disabled={loading}>
            {loading ? (
              <span className="btn-loading">
                <span className="spinner" /> Starting...
              </span>
            ) : (
              "Start Quiz 🚀"
            )}
          </button>
        </div>
      </div>
    );
  }

  // ─── FEEDBACK SCREEN ───
  if (screen === "feedback") {
    return (
      <div className="app">
        <FloatingParticles />
        <div className="container feedback-screen">
          <div className={`feedback-icon-wrapper ${feedback.isCorrect ? "correct" : "wrong"}`}>
            <div className={`feedback-icon ${feedback.isCorrect ? "correct" : "wrong"}`}>
              {feedback.timedOut ? "⏰" : feedback.isCorrect ? "✅" : "❌"}
            </div>
            {feedback.isCorrect && (
              <div className="feedback-sparkles">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="sparkle" style={{ "--i": i }} />
                ))}
              </div>
            )}
          </div>

          <h2 className={`feedback-title ${feedback.isCorrect ? "correct-title" : "wrong-title"}`}>
            {feedback.timedOut ? "Time's Up!" : feedback.isCorrect ? "Correct!" : "Wrong!"}
          </h2>

          {!feedback.isCorrect && (
            <p className="correct-answer">
              Correct answer: <strong>{feedback.correctAnswer}</strong>
            </p>
          )}

          {feedback.explanation && (
            <div className="explanation-box">
              <div className="explanation-header">
                <span className="explanation-icon">💡</span>
                <span>Did you know?</span>
              </div>
              <p className="explanation-text">{feedback.explanation}</p>
            </div>
          )}

          <div className="feedback-stats">
            <div className="feedback-stat">
              <span className="feedback-stat-value">{score}</span>
              <span className="feedback-stat-label">Score</span>
            </div>
            <div className="feedback-stat">
              <span className="feedback-stat-value">{streak > 0 ? `${streak}🔥` : "0"}</span>
              <span className="feedback-stat-label">Streak</span>
            </div>
            <div className="feedback-stat">
              <span className="feedback-stat-value">{questionNum}/{totalQuestions}</span>
              <span className="feedback-stat-label">Progress</span>
            </div>
          </div>

          {feedback.speedBonus > 0 && (
            <div className="speed-bonus">⚡ Speed Bonus! +{feedback.speedBonus}</div>
          )}

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
        <FloatingParticles />
        <Confetti active={showConfetti} />
        <div className="container result-screen">
          <div className="result-badge-wrapper">
            <div className="result-badge">{result.badge}</div>
          </div>
          <h2 className="result-title">Quiz Complete!</h2>

          <div className="result-score-ring">
            <svg viewBox="0 0 120 120" className="score-ring-svg">
              <circle className="score-ring-bg" cx="60" cy="60" r="52" />
              <circle
                className="score-ring-progress"
                cx="60"
                cy="60"
                r="52"
                style={{
                  strokeDashoffset: 326.73 - (326.73 * result.accuracy) / 100,
                }}
              />
            </svg>
            <div className="score-ring-text">
              <span className="score-ring-value">{result.score}</span>
              <span className="score-ring-total">/ {result.total}</span>
            </div>
          </div>

          <div className="result-stats-grid">
            <div className="result-stat-card">
              <div className="result-stat-icon">🎯</div>
              <div className="result-stat-value" style={{ color: getAccuracyColor(result.accuracy) }}>
                {result.accuracy}%
              </div>
              <div className="result-stat-label">Accuracy</div>
            </div>
            <div className="result-stat-card">
              <div className="result-stat-icon">🔥</div>
              <div className="result-stat-value">{result.maxStreak}</div>
              <div className="result-stat-label">Max Streak</div>
            </div>
            <div className="result-stat-card">
              <div className="result-stat-icon">⏱️</div>
              <div className="result-stat-value">{result.avgTime}s</div>
              <div className="result-stat-label">Avg. Time</div>
            </div>
            <div className="result-stat-card">
              <div className="result-stat-icon">⏳</div>
              <div className="result-stat-value">{result.totalTime}s</div>
              <div className="result-stat-label">Total Time</div>
            </div>
          </div>

          {/* Answer History */}
          <div className="answer-history">
            <h3 className="history-title">Question Review</h3>
            {result.history.map((item, idx) => (
              <div key={idx} className={`history-item ${item.is_correct ? "history-correct" : "history-wrong"}`}>
                <span className="history-num">Q{idx + 1}</span>
                <span className="history-icon">{item.is_correct ? "✅" : "❌"}</span>
                <span className="history-time">{item.time_taken}s</span>
              </div>
            ))}
          </div>

          {showLeaderboard && leaderboard.length > 0 && (
            <div className="leaderboard">
              <h3 className="leaderboard-title">🏆 Leaderboard</h3>
              {leaderboard.map((entry, idx) => (
                <div key={idx} className="leaderboard-entry">
                  <span className="lb-rank">#{idx + 1}</span>
                  <span className="lb-score">{entry.score}/{entry.total}</span>
                  <span className="lb-streak">🔥{entry.max_streak}</span>
                  <span className="lb-time">{entry.avg_time}s</span>
                </div>
              ))}
            </div>
          )}

          <div className="result-actions">
            <button className="btn-start" onClick={startQuiz} disabled={loading}>
              {loading ? (
                <span className="btn-loading">
                  <span className="spinner" /> Starting...
                </span>
              ) : (
                "Play Again 🔄"
              )}
            </button>
            <button className="btn-leaderboard" onClick={fetchLeaderboard}>
              View Leaderboard 🏆
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── QUIZ SCREEN ───
  return (
    <div className="app">
      <FloatingParticles />
      <div className="container quiz-screen">
        {/* Header */}
        <div className="quiz-header">
          <div className="level-badge" style={{ background: getLevelColor(level) }}>
            {getLevelEmoji(level)} {level.toUpperCase()}
          </div>
          <Timer
            timeLimit={timeLimit}
            onTimeout={handleTimeout}
            isActive={timerActive}
            key={`timer-${questionNum}`}
          />
          <div className="header-right">
            {streak >= 2 && (
              <div className="streak-badge">
                🔥 {streak}
              </div>
            )}
            <div className="progress-text">
              {questionNum} / {totalQuestions}
            </div>
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
        <div className="question-card" key={`q-${question.id}`}>
          <div className="question-number">Question {questionNum}</div>
          <h2 className="question-text">{question.q}</h2>
        </div>

        {/* Options */}
        <div className="options-grid">
          {question.options.map((option, idx) => (
            <button
              key={idx}
              className={`option-btn ${
                selected === option ? "selected" : ""
              } ${selected === "__TIMEOUT__" ? "timed-out" : ""}`}
              onClick={() => submitAnswer(option)}
              disabled={selected !== null || loading}
              style={{ animationDelay: `${idx * 0.08}s` }}
            >
              <span className="option-letter">
                {String.fromCharCode(65 + idx)}
              </span>
              <span className="option-text">{option}</span>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="quiz-footer">
          <div className="footer-left">
            <span className={`score-display-inline ${animateScore ? "score-pop" : ""}`}>
              ⭐ {score}
            </span>
          </div>
          <div className="footer-right">
            <span className="level-text" style={{ color: getLevelColor(level) }}>
              {level.charAt(0).toUpperCase() + level.slice(1)} Level
            </span>
          </div>
        </div>

        {error && <div className="error-msg">{error}</div>}
      </div>
    </div>
  );
}

export default App;