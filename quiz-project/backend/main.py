from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import random

app = FastAPI()

# ✅ VERY IMPORTANT (CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

questions = [
    {
        "q": "What is HTML?",
        "options": ["Language", "Markup", "Database"],
        "answer": "Markup"
    },
    {
        "q": "React is?",
        "options": ["Library", "Language", "Tool"],
        "answer": "Library"
    }
]

score = 0

@app.get("/question")
def get_question():
    return random.choice(questions)

@app.post("/answer")
def check_answer(user_answer: str, correct_answer: str):
    global score

    if user_answer == correct_answer:
        score += 1
        return {"result": "correct", "score": score}
    else:
        return {"result": "wrong", "score": score}