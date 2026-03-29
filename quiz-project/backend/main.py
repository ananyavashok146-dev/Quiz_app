from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from data import questions
from quiz_engine import QuizEngine
import uuid
import time
import random

app = FastAPI(title="Adaptive Quiz API", version="2.0")

# 🔥 Allow React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory sessions
sessions = {}

# Leaderboard (in-memory)
leaderboard = []

QUESTIONS_PER_QUIZ = 5
TIME_PER_QUESTION = 15  # seconds


class AnswerRequest(BaseModel):
    session_id: str
    question_id: int
    selected_answer: str
    time_taken: float = 0  # seconds taken to answer


@app.get("/quiz/start")
def start_quiz():
    """Start a new quiz session and return the first question."""
    session_id = str(uuid.uuid4())
    engine = QuizEngine()

    # Pick random questions for each level to avoid repetition
    used_questions = []

    sessions[session_id] = {
        "engine": engine,
        "used_question_ids": set(),
        "answered": 0,
        "total_questions": QUESTIONS_PER_QUIZ,
        "streak": 0,
        "max_streak": 0,
        "start_time": time.time(),
        "total_time": 0,
        "answers_history": [],
    }

    # Get first question (easy level)
    level = engine.level
    question = _pick_question(session_id, level)

    return {
        "session_id": session_id,
        "question": _format_question(question),
        "level": level,
        "question_number": 1,
        "total_questions": QUESTIONS_PER_QUIZ,
        "score": 0,
        "streak": 0,
        "time_limit": TIME_PER_QUESTION,
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
    explanation = ""
    for level_questions in questions.values():
        for q in level_questions:
            if q["id"] == req.question_id:
                correct_answer = q["answer"]
                explanation = q.get("explanation", "")
                break

    is_correct = req.selected_answer == correct_answer
    engine.update_score(is_correct)
    session["answered"] += 1
    session["total_time"] += req.time_taken

    # Track streak
    if is_correct:
        session["streak"] += 1
        session["max_streak"] = max(session["max_streak"], session["streak"])
    else:
        session["streak"] = 0

    # Track answer history
    session["answers_history"].append({
        "question_id": req.question_id,
        "selected": req.selected_answer,
        "correct": correct_answer,
        "is_correct": is_correct,
        "time_taken": req.time_taken,
    })

    # Calculate bonus points for speed
    speed_bonus = 0
    if is_correct and req.time_taken < TIME_PER_QUESTION * 0.5:
        speed_bonus = 1  # fast answer bonus

    # Check if quiz is finished
    if session["answered"] >= session["total_questions"]:
        result = engine.get_result()
        avg_time = session["total_time"] / session["answered"] if session["answered"] > 0 else 0
        correct_count = sum(1 for a in session["answers_history"] if a["is_correct"])

        # Calculate accuracy percentage
        accuracy = round((correct_count / session["total_questions"]) * 100)

        final_data = {
            "finished": True,
            "is_correct": is_correct,
            "correct_answer": correct_answer,
            "explanation": explanation,
            "score": engine.score,
            "total": session["total_questions"],
            "result": result,
            "streak": session["streak"],
            "max_streak": session["max_streak"],
            "avg_time": round(avg_time, 1),
            "total_time": round(session["total_time"], 1),
            "accuracy": accuracy,
            "answers_history": session["answers_history"],
        }

        # Add to leaderboard
        leaderboard.append({
            "score": engine.score,
            "total": session["total_questions"],
            "max_streak": session["max_streak"],
            "avg_time": round(avg_time, 1),
            "result": result,
            "timestamp": time.time(),
        })
        leaderboard.sort(key=lambda x: (-x["score"], x["avg_time"]))
        # Keep top 10
        while len(leaderboard) > 10:
            leaderboard.pop()

        # Clean up session
        del sessions[req.session_id]
        return final_data

    # Get next level and question
    next_level = engine.get_next_level(is_correct)
    next_q = _pick_question(req.session_id, next_level)

    return {
        "finished": False,
        "is_correct": is_correct,
        "correct_answer": correct_answer,
        "explanation": explanation,
        "question": _format_question(next_q),
        "level": next_level,
        "question_number": session["answered"] + 1,
        "total_questions": session["total_questions"],
        "score": engine.score,
        "streak": session["streak"],
        "max_streak": session["max_streak"],
        "speed_bonus": speed_bonus,
        "time_limit": TIME_PER_QUESTION,
    }


@app.get("/leaderboard")
def get_leaderboard():
    """Get top 10 scores."""
    return {"leaderboard": leaderboard[:10]}


@app.get("/health")
def health_check():
    return {"status": "ok", "version": "2.0"}


def _pick_question(session_id: str, level: str):
    """Pick a random unused question from the given level."""
    session = sessions[session_id]
    level_questions = questions.get(level, questions["easy"])

    available = [q for q in level_questions if q["id"] not in session["used_question_ids"]]

    if not available:
        # All questions in this level have been used, reset
        available = level_questions

    question = random.choice(available)
    session["used_question_ids"].add(question["id"])
    return question


def _format_question(question: dict):
    """Format question for the frontend (without the answer)."""
    # Shuffle options
    options = question["options"][:]
    random.shuffle(options)
    return {
        "id": question["id"],
        "q": question["q"],
        "options": options,
    }
