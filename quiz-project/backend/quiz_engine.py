class QuizEngine:
    def __init__(self):
        self.level = "easy"
        self.score = 0
        self.consecutive_correct = 0
        self.consecutive_wrong = 0

    def update_score(self, correct):
        if correct:
            self.score += 1
            self.consecutive_correct += 1
            self.consecutive_wrong = 0
        else:
            self.consecutive_correct = 0
            self.consecutive_wrong += 1

    def get_next_level(self, correct):
        """Adaptive difficulty: level changes based on consecutive correct/wrong answers."""
        if correct:
            if self.level == "easy" and self.consecutive_correct >= 1:
                self.level = "medium"
            elif self.level == "medium" and self.consecutive_correct >= 1:
                self.level = "hard"
        else:
            if self.level == "hard":
                self.level = "medium"
            elif self.level == "medium":
                self.level = "easy"
            # Already easy, stay easy

        return self.level

    def get_result(self):
        """Return a result badge based on performance."""
        if self.score >= 5:
            return "🔥 Quiz Master"
        elif self.score >= 4:
            return "⭐ Expert"
        elif self.score >= 3:
            return "👍 Intermediate"
        elif self.score >= 2:
            return "📚 Learner"
        else:
            return "🌱 Beginner"