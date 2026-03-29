import React, { useState, useEffect } from "react";

function App() {
  const [question, setQuestion] = useState(null);



  useEffect(() => {
    fetch("http://127.0.0.1:8000/question")
      .then(res => res.json())
      .then(data => {
        console.log("DATA:", data);
        setQuestion(data);
      })
      .catch(err => {
        console.log("ERROR:", err);
      });
  }, []);

  if (!question) return <h2>Loading...</h2>;

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>{question.q}</h1>
    </div>
  );
}

export default App;