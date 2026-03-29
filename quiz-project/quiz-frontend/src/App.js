import React, { useState, useEffect } from "react";

function App() {
  const [question, setQuestion] = useState(null);
  const [score, setScore] = useState(0);

  // ✅ LOAD QUESTION FUNCTION (IMPORTANT)
  const loadQuestion = () => {
    fetch("http://127.0.0.1:8000/question")
      .then(res => res.json())
      .then(data => {
        console.log("DATA:", data);
        setQuestion(data);
      })
      .catch(err => {
        console.log("ERROR:", err);
        alert("Backend not connected!");
      });
  };

  // ✅ CALL ON FIRST LOAD
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
        loadQuestion();   // ✅ NOW WORKS
      })
      .catch(err => console.log("ERROR:", err));
  };

  // ✅ LOADING SCREEN
  if (!question) return <h2>Loading...</h2>;

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>Quiz App</h1>

      <h2>{question.q}</h2>

      {question.options.map((opt, i) => (
        <button
          key={i}
          onClick={() => handleAnswer(opt)}
          style={{
            display: "block",
            margin: "10px auto",
            padding: "10px 20px",
            cursor: "pointer"
          }}
        >
          {opt}
        </button>
      ))}

      <h3>Score: {score}</h3>
    </div>
  );
}

export default App;