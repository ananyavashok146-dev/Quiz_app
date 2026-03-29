from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import random

app = FastAPI()

# ✅ CORS (VERY IMPORTANT FOR REACT CONNECTION)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React app URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ QUESTIONS DATA
questions = [
    {
        "q": "What is HTML?",
        "options": ["Language", "Markup", "Database"],
        "answer": "Markup"
    },
    {
        "q": "What is CSS used for?",
        "options": ["Styling", "Logic", "Database"],
        "answer": "Styling"
    },
    {
        "q": "React is a?",
        "options": ["Library", "Language", "Framework"],
        "answer": "Library"
    },
    {
        "q": "Which is a programming language?",
        "options": ["HTML", "CSS", "Python"],
        "answer": "Python"
    },
    {
        "q": "FastAPI is used for?",
        "options": ["Backend", "Frontend", "Design"],
        "answer": "Backend"
    }
]

# ✅ SCORE VARIABLE
score = 0


# ✅ ROOT API (TEST)
@app.get("/")
def home():
    return {"message": "Quiz API Running"}


# ✅ GET QUESTION
@app.get("/question")
def get_question():
    return random.choice(questions)


# ✅ CHECK ANSWER
@app.post("/answer")
def check_answer(user_answer: str, correct_answer: str):
    global score

    if user_answer == correct_answer:
        score += 1
        return {
            "result": "correct",
            "score": score
        }
    else:
        return {
            "result": "wrong",
            "score": score
        }