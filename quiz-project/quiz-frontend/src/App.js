import React, { useState, useEffect } from "react";

function App() {
  const [question, setQuestion] = useState(null);
  const [score, setScore] = useState(0);

  // ✅ LOAD QUESTION (CONNECT HERE)
  const loadQuestion = () => {
    fetch("http://127.0.0.1:8000/question")
      .then(res => res.json())
      .then(data => setQuestion(data))
      .catch(err => console.log("ERROR:", err));
  };

  useEffect(() => {
    loadQuestion();
  }, []);

  // ✅ SEND ANSWER
  const handleAnswer = (opt) => {
    fetch(`http://127.0.0.1:8000/answer?user_answer=${opt}&correct_answer=${question.answer}`, {
      method: "POST"
    })
      .then(res => res.json())
      .then(data => {
        setScore(data.score);
        loadQuestion();
      })
      .catch(err => console.log("ERROR:", err));
  };

  if (!question) return <h2>Loading...</h2>;

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>Quiz App</h1>

      <h2>{question.q}</h2>

      {question.options.map((opt, i) => (
        <button key={i} onClick={() => handleAnswer(opt)}>
          {opt}
        </button>
      ))}

      <h3>Score: {score}</h3>
    </div>
  );
}

export default App;