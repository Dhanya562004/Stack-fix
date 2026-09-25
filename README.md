# StackFix AI — AI Debugging Agent for Developers

Paste your error. Get the fix instantly.

## Live Demo
[Explore StackFix AI Live App](https://stack-fix-kp5papbbbthu5pf8uzvkpz.streamlit.app/)

---

## Overview
StackFix AI is a production-grade developer tool designed to analyze programming errors, runtime exceptions, and broken code snippets. It combines Large Language Models (Gemini 1.5 Pro) with a deterministic fallback engine to provide clear issue explanations, exact root causes, actionable fix steps, and corrected code.

---

## Features
- **Comprehensive Error Diagnostics:** Accepts raw error stack traces, compiler logs, or broken code snippets.
- **Clear Issue Explanation:** Translates cryptic error messages into easy-to-understand developer concepts.
- **Root Cause Analysis:** Pinpoints the exact line and logic flaw causing the breakdown.
- **Actionable Fix Guidance:** Provides step-by-step instructions to resolve the defect.
- **Corrected Code Generation:** Produces clean, production-ready replacement code.
- **Dual Engine Architecture:** Operates using Google Gemini LLM when an API key is available, with seamless fallback to a local rule-based engine when offline.

---

## How It Works
1. **Input Submission:** The developer pastes an error stack trace or code snippet into the interface.
2. **AI Analysis:** If an API key is present, the app calls Gemini 1.5 Pro to perform deep contextual analysis.
3. **Fallback Resolution:** If running without an API key, the system routes the query to an intelligent rule-based pattern matching engine.
4. **Structured Output:** The user receives a structured breakdown covering Issue Explanation, Root Cause, Fix Suggestions, and Corrected Code.

---

## Tech Stack
- **Language:** Python
- **Frontend / Framework:** Streamlit
- **AI Integration:** Google Gemini API (`gemini-1.5-pro`) & OpenAI API
- **Fallback Engine:** Deterministic Regex & Sequence Matching Engine (`difflib`, `re`)

---

## Example

### Input Code
```python
name = "Alex"
print("Hello " + username)
```

### Analysis & Output

**Issue Explanation:**  
The variable `username` is used but not defined.

**Root Cause:**  
You defined `name` on assignment, but used `username` in the print statement.

**Fix Suggestion:**  
Use the correct variable name (`name`) or define `username` before use.

**Corrected Code:**  
```python
name = "Alex"
print("Hello " + name)
```

---

## Why This Project Matters
- **Accelerates Developer Workflow:** Cuts down debugging time by immediately explaining stack traces and syntax failures.
- **Demonstrates System Reliability:** Features robust fallback logic to ensure 100% uptime even when external APIs are unreachable.
- **Highlights Product Engineering:** Combines LLM capabilities with clean UI/UX and practical utility.

---

## Setup Instructions

### 1. Clone the Repository
```bash
git clone https://github.com/Dhanya562004/Stack-fix.git
cd Stack-fix
```

### 2. Install Dependencies
```bash
python -m venv venv
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
```

### 3. Run the Application
```bash
streamlit run app.py
```

Open `http://localhost:8501` in your browser.

---

## Future Improvements
- Multi-language support expansion (Go, Rust, SQL, C#).
- GitHub repository integration for context-aware multi-file debugging.
- Advanced static analysis integration (AST analysis & linting tools).
