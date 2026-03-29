from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from data import questions
from quiz_engine import QuizEngine

app = FastAPI()

# 🔥 Allow React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory sessions (simple approach for learning)
sessions = {}

class AnswerRequest(BaseModel):
    session_id: str
    question_id: int
    selected_answer: str


@app.get("/quiz/start")
def start_quiz():
    """Start a new quiz session and return the first question."""
    import uuid
    session_id = str(uuid.uuid4())
    engine = QuizEngine()
    sessions[session_id] = {
        "engine": engine,
        "question_index": {},  # track which question index per level
        "answered": 0,
        "total_questions": 4,
    }

    # Get first question (easy level)
    level = engine.level
    question = questions[level][0]
    sessions[session_id]["question_index"][level] = 0

    return {
        "session_id": session_id,
        "question": {
            "id": question["id"],
            "q": question["q"],
            "options": question["options"],
        },
        "level": level,
        "question_number": 1,
        "total_questions": 4,
        "score": 0,
    }


@app.post("/quiz/answer")
def submit_answer(req: AnswerRequest):
    """Submit an answer and get the next question or final result."""
    session = sessions.get(req.session_id)
    if not session:
        return {"error": "Session not found. Please start a new quiz."}

    engine = session["engine"]

    # Find the question and check the answer
    correct_answer = None
    for level_questions in questions.values():
        for q in level_questions:
            if q["id"] == req.question_id:
                correct_answer = q["answer"]
                break

    is_correct = req.selected_answer == correct_answer
    engine.update_score(is_correct)
    session["answered"] += 1

    # Check if quiz is finished
    if session["answered"] >= session["total_questions"]:
        result = engine.get_result()
        # Clean up session
        del sessions[req.session_id]
        return {
            "finished": True,
            "is_correct": is_correct,
            "correct_answer": correct_answer,
            "score": engine.score,
            "total": session["total_questions"],
            "result": result,
        }

    # Get next level and question
    next_level = engine.get_next_level(is_correct)
    level_questions = questions.get(next_level, questions["easy"])

    # Pick next available question from that level
    idx = session["question_index"].get(next_level, -1) + 1
    if idx >= len(level_questions):
        idx = 0  # cycle back if we run out
    session["question_index"][next_level] = idx
    next_q = level_questions[idx]

    return {
        "finished": False,
        "is_correct": is_correct,
        "correct_answer": correct_answer,
        "question": {
            "id": next_q["id"],
            "q": next_q["q"],
            "options": next_q["options"],
        },
        "level": next_level,
        "question_number": session["answered"] + 1,
        "total_questions": session["total_questions"],
        "score": engine.score,
    }


@app.get("/health")
def health_check():
    return {"status": "ok"}
