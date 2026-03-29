from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI()

# 🔥 IMPORTANT (allow React)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/question")
def get_question():
    return {
        "q": "What is HTML?",
        "options": ["Language", "Markup", "Database"],
        "answer": "Markup"
    }
