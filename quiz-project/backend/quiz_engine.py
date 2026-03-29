class QuizEngine:
    def __init__(self):
        self.level = "easy"
        self.score = 0

    def update_score(self, correct):
        if correct:
            self.score += 1

    def get_next_level(self, correct):
        if correct:
            if self.level == "easy":
                self.level = "medium"
            elif self.level == "medium":
                self.level = "hard"
        else:
            self.level = "easy"

        return self.level

    def get_result(self):
        if self.score >= 3:
            return "Expert 🔥"
        elif self.score >= 2:
            return "Intermediate 👍"
        else:
            return "Beginner 😊"