# 📘 QuizEngine - AI-Based Quiz Generator from PDFs

QuizEngine is a powerful AI-driven web application that lets you generate quizzes from your study material. Just upload a PDF (like a textbook, notes, or lecture slides), and the app will automatically generate multiple-choice questions using Google Gemini via Genkit. It’s perfect for students, educators, and self-learners who want to test their understanding of content.

---

## ✨ Features

- 📄 Upload any PDF document (lecture notes, books, handouts)
- 🤖 Automatically generate intelligent quizzes using Google Gemini (via Genkit)
- 🔢 Choose the number of quiz questions (up to 50)
- 🔐 Secure login with Firebase Authentication
- ☁️ Store uploaded PDFs in Firebase Storage
- 🧠 Quiz is generated strictly based on the content in the uploaded PDF
- 🚀 Built with the latest technologies like Next.js 14, TypeScript, and Genkit

---

## 🛠 Tech Stack

| Technology | Purpose |
|------------|---------|
| **Next.js 14 (App Router)** | React framework for frontend and backend |
| **TypeScript** | Type safety across the project |
| **Genkit** | Defines AI flows and prompt interaction with Gemini |
| **Google Gemini (via Genkit)** | AI model to generate quiz questions |
| **Firebase** | Auth, Storage, Firestore support |
| **Tailwind CSS** | Styling and responsive UI |
| **Vercel** | Hosting and deployment (optional)

---

## 🚀 Getting Started

### 📦 Prerequisites

- Node.js v18 or above
- Firebase project (with Authentication, Storage, and Firestore enabled)
- A Google AI API key (for Gemini)
- Genkit CLI installed (`npm install -g @genkit-ai/cli`)

---

### 🔧 Installation Steps

```bash
# Clone the repository
git clone https://github.com/kashnx/quiz-engine
cd quizengine

# Install dependencies
npm install
