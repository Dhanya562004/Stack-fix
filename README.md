# ⚡ AI Debug Agent (StackFix)

> **Tagline:** Paste your error. Get the fix instantly.

AI Debug Agent is a fast, production-quality developer web app built with **Streamlit** and powered by **LLMs (Gemini / OpenAI)** and a custom **Smart Offline Rule Engine**. It analyzes programming errors, stack traces, and code snippets to deliver immediate issue explanations, root cause identification, actionable fix suggestions, and corrected code blocks.

---

## 🚀 Features

- **🧠 Deep Error Analysis:**
  - **Issue Explanation:** Clear, beginner-friendly explanation of what broke.
  - **Root Cause:** Technical explanation of why the failure occurred.
  - **Fix Suggestion:** Step-by-step actionable instructions to resolve it.
  - **Corrected Code:** Formatted, production-ready replacement snippet.
  - **Confidence Level:** High 🟢 / Medium 🟡 / Low 🔴 visual meter.

- **🎭 Dual Tone Mode:**
  - **Normal Mode 😇:** Clear, professional senior-engineer mentorship.
  - **Savage Mode 😈:** Witty, funny developer roast with accurate fixes ("This code runs on hope and broken assumptions 💀").

- **⚙️ Dual AI Engine Support:**
  - **LLM Mode:** Powered by **Gemini 2.5/1.5** or **GPT-4o-mini**.
  - **Offline Rule Engine:** Custom pattern-recognition fallback that works 100% locally **without an API key**!

- **⚡ Productivity Bonus Features:**
  - **Preset Example Loader:** Instant sample errors for Python NameError, JS TypeError, Async/Await Promise bugs, Indentation Errors, etc.
  - **Session History:** Replay and inspect recent fixes from your current session.
  - **Side-by-Side Diff View:** Compare original broken code against the fixed code.
  - **Copy to Clipboard:** Native 1-click code copying.

---

## 🛠️ Tech Stack

- **Framework:** Streamlit (Python)
- **Styling:** Custom Glassmorphic Dark CSS Design System
- **AI Integrations:** `google-genai`, `google-generativeai`, `openai`
- **Pattern Matching Engine:** Python Regex & Sequence Matcher (`difflib`)

---

## 📦 Quick Start & Installation

### 1. Clone the Repository
```bash
git clone https://github.com/Dhanya562004/Stack-fix.git
cd Stack-fix
```

### 2. Set Up Virtual Environment & Install Dependencies
```bash
python -m venv venv
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
```

### 3. (Optional) Configure Environment Variables
Create a `.env` file from `.env.example`:
```bash
GEMINI_API_KEY=your_gemini_api_key_here
# or
OPENAI_API_KEY=your_openai_api_key_here
```
*Note: The app runs completely fine without any API key using the built-in Smart Rule Engine!*

### 4. Run the Streamlit Application
```bash
streamlit run app.py
```

Open `http://localhost:8501` in your browser.

---

## 🎨 UI Preview & Aesthetics

Designed with a modern dark mode, glassmorphism cards, vibrant status badges, responsive layout, and smooth animations built specifically for daily developer use.

---

## 📝 License

Distributed under the MIT License. See `LICENSE` for details.
