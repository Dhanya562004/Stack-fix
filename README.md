<div align="center">

# ⚡ StackFix AI — Debugging Assistant SaaS Platform

### *Paste your error. Get instant AI root cause analysis, actionable fix steps, and corrected code.*

[![Live Demo](https://img.shields.io/badge/🚀_Live_Demo-Streamlit_App-ff4b4b.svg?style=for-the-badge)](https://stack-fix-kp5papbbbthu5pf8uzvkpz.streamlit.app/)
[![GitHub CI/CD](https://img.shields.io/github/actions/workflow/status/Dhanya562004/Stack-fix/ci.yml?branch=main&style=for-the-badge&logo=githubactions&logoColor=white&label=CI%2FCD)](https://github.com/Dhanya562004/Stack-fix/actions)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

[![Node.js](https://img.shields.io/badge/Node.js-v20-339933?style=flat-square&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-v4.21-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com/)
[![React](https://img.shields.io/badge/React-v18.3-61DAFB?style=flat-square&logo=react&logoColor=black)](https://reactjs.org/)
[![Gemini AI](https://img.shields.io/badge/Gemini_1.5_Flash-8E75B2?style=flat-square&logo=googlegemini&logoColor=white)](https://aistudio.google.com/)
[![AWS S3](https://img.shields.io/badge/AWS_S3-FF9900?style=flat-square&logo=amazons3&logoColor=white)](https://aws.amazon.com/s3/)
[![Jest](https://img.shields.io/badge/Jest-C21325?style=flat-square&logo=jest&logoColor=white)](https://jestjs.io/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white)](https://www.docker.com/)

</div>

---

## 🌟 Live Application & Quick Links

- 🌐 **Live Web Application:** [https://stack-fix-kp5papbbbthu5pf8uzvkpz.streamlit.app/](https://stack-fix-kp5papbbbthu5pf8uzvkpz.streamlit.app/)
- 📦 **GitHub Repository:** [https://github.com/Dhanya562004/Stack-fix.git](https://github.com/Dhanya562004/Stack-fix.git)
- ⚙️ **CI/CD Pipeline:** [GitHub Actions Workflow Status](https://github.com/Dhanya562004/Stack-fix/actions)

---

## 📊 Repository Languages & Code Composition

![JavaScript](https://img.shields.io/badge/JavaScript-63.8%25-f7df1e?style=for-the-badge&logo=javascript&logoColor=black)
![Python](https://img.shields.io/badge/Python-33.1%25-3776ab?style=for-the-badge&logo=python&logoColor=white)
![HTML](https://img.shields.io/badge/HTML5-1.3%25-e34f26?style=for-the-badge&logo=html5&logoColor=white)
![CSS](https://img.shields.io/badge/CSS3-1.1%25-1572b6?style=for-the-badge&logo=css3&logoColor=white)
![Dockerfile](https://img.shields.io/badge/Dockerfile-0.7%25-2496ed?style=for-the-badge&logo=docker&logoColor=white)

---

## 📌 Overview

**StackFix AI** is an enterprise-grade AI debugging SaaS platform designed to analyze programming errors, runtime exceptions, and compiler stack traces across multiple languages (*Python, JavaScript, TypeScript, Java, C++, Go, Rust*).

It pairs Large Language Models (**Google Gemini 1.5 Flash**) with a deterministic heuristic fallback engine, an **AWS S3 cloud storage abstraction layer**, structured Winston logging, and comprehensive automated testing.

---

## ✨ Key Features

- 🧠 **Dual AI Engine Architecture:** Primary analysis powered by Google Gemini 1.5 Flash API, with seamless automatic fallback to a local deterministic heuristic engine ensuring **100% system uptime**.
- 🔍 **4-Part Diagnostic Output:** Every analysis produces:
  1. **Root Cause:** Exact line and logic flaw breakdown.
  2. **Issue Explanation:** Plain English, developer-friendly explanation.
  3. **Action Plan:** Step-by-Step resolution checklist.
  4. **Corrected Code:** Complete, ready-to-use replacement code.
- ☁️ **Cloud Storage Integration (AWS S3):** Every analysis session log is saved directly to AWS S3 (or local cloud storage abstraction layer).
- 🎨 **Modern Glassmorphism UI:** React 18 frontend with dark-mode aesthetic, sample preset picker, side-by-side code diff viewer, copy-to-clipboard, and history drawer.
- 🛡️ **Enterprise Security & DevOps:** Helmet HTTP security headers, CORS origin protection, IP rate limiting, input validation (`express-validator`), and Winston JSON logging.
- 🧪 **Automated Testing Suite:** Jest + Supertest integration and unit tests covering API endpoints, input validation, and storage layer.
- 🔄 **Automated CI/CD Pipeline:** GitHub Actions workflow executing build, test matrix (Node 18 & 20), and artifact archiving on every push.

---

## 🏗️ System Architecture

```mermaid
graph TD
    User([Developer / User]) -->|HTTP REST API| ReactFE[React 18 Frontend - Vite]
    ReactFE -->|POST /analyze| ExpressAPI[Express API Backend]

    subgraph Express Backend Microservice
        ExpressAPI --> MW[Helmet / CORS / RateLimiter / Validator]
        MW --> Controller[Analyze Controller]
        
        Controller -->|Invoke| AIService[AI Engine Service Layer]
        Controller -->|Persist Log| StorageService[AWS S3 Storage Abstraction]
        
        AIService -->|Primary| GeminiAPI[Google Gemini 1.5 API]
        AIService -->|Fallback| HeuristicEngine[Deterministic Rule Engine]
        
        StorageService -->|If Credentials Set| AWSS3[AWS S3 Bucket]
        StorageService -->|Default / Local| LocalStorage[Local Cloud File Storage]
    end

    Controller -->|Structured JSON Response| ReactFE
```

---

## 🛠️ Technology Stack

| Layer | Technology & Tools |
|---|---|
| **Frontend UI** | React 18, Vite, Tailwind CSS, Lucide Icons |
| **Backend API** | Node.js (v20), Express.js, Helmet, Morgan, Winston |
| **AI Integration** | Google Gemini API (`gemini-1.5-flash`) + Heuristic Fallback Engine |
| **Cloud Storage** | AWS S3 (`@aws-sdk/client-s3`) & Local Abstraction |
| **Testing** | Jest, Supertest |
| **DevOps & Infrastructure** | Docker, Docker Compose, GitHub Actions |

---

## 📁 Repository Structure

```
StackFix/
├── .github/
│   └── workflows/
│       └── ci.yml             # GitHub Actions CI/CD Pipeline Workflow
├── backend/
│   ├── package.json
│   └── src/
│       ├── config/            # Centralized Configuration Manager
│       ├── controllers/       # API Controllers (Analyze, Health, History)
│       ├── middleware/        # Error Handler, Validation, Logger Middleware
│       ├── routes/            # Express API Routes (/analyze, /health)
│       ├── services/          # Gemini AI Engine & AWS S3 Storage Service
│       ├── utils/             # Winston Structured Logger Utility
│       └── server.js          # Express Server Entrypoint
├── frontend/                  # React + Vite Web Application
│   ├── src/
│   │   ├── components/        # Header, CodeEditor, AnalysisResult, HistoryDrawer
│   │   ├── services/          # API Client Layer
│   │   ├── App.jsx
│   │   └── index.css          # Glassmorphism Styling System
│   ├── vercel.json            # Vercel Deployment Routing Config
│   └── vite.config.js
├── tests/                     # Automated Jest + Supertest Suites
│   ├── analyze.test.js        # POST /analyze Integration Tests
│   ├── health.test.js         # GET /health System Check Tests
│   └── storage.test.js        # Storage Layer Unit Tests
├── Dockerfile                 # Multi-Stage Production Container Build
├── docker-compose.yml         # Container Orchestration
├── jest.config.js             # Jest Configuration
├── package.json               # Root Dependencies & Script Orchestration
├── .env.example               # Environment Configuration Template
└── README.md                  # Comprehensive Documentation
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** (v18.x or v20.x)
- **npm** (v9+ or yarn)

### 2. Environment Setup
Create a `.env` file in the root directory:
```bash
cp .env.example .env
```
Configure your environment variables:
```env
PORT=5000
NODE_ENV=development
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-flash
```

### 3. Install Dependencies
```bash
npm run install:all
```

### 4. Run Development Servers
Start both Express Backend API and React Frontend concurrently:
```bash
npm run dev
```
- 🖥️ **Frontend:** `http://localhost:5173`
- ⚙️ **Backend API:** `http://localhost:5000`

---

## 🧪 Automated Testing & Quality Assurance

StackFix AI includes a comprehensive, production-grade automated testing suite using **Jest** and **Supertest** to ensure reliability across all microservice layers.

```bash
# Run all automated test suites
npm test

# Run tests with coverage report
npm run test:coverage
```

### Verified Test Suite Breakdown (100% Pass Rate)

```text
PASS  tests/storage.test.js
  StorageService Cloud Abstraction Unit Tests
    ✓ should successfully save and retrieve an analysis record
    ✓ should return storage status information

PASS  tests/health.test.js
  GET /health - System Health Check API
    ✓ should return 200 OK with server health metrics and integration status
    ✓ should also respond at /api/health

PASS  tests/analyze.test.js
  POST /analyze - AI Debugging Analysis API
    ✓ should return 200 OK and valid response structure for valid code and error
    ✓ should return 400 Bad Request when code is missing
    ✓ should return 400 Bad Request when error stack is missing
    ✓ should return 400 Bad Request when code is empty whitespace
    ✓ should allow fetching analysis history via GET /analyze/history

Test Suites: 3 passed, 3 total
Tests:       9 passed, 9 total
Time:        21.49 s
```

---

## 🐳 Docker Containerization

StackFix AI supports containerized deployment via Docker and Docker Compose.

```bash
# Build and launch unified service
docker-compose up --build -d
```
The unified application will be accessible at `http://localhost:5000`.

---

## 📡 REST API Reference

### `POST /analyze`
Analyzes code and error message.

**Request Body:**
```json
{
  "code": "name = \"Alex\"\nprint(\"Hello \" + username)",
  "error": "NameError: name 'username' is not defined",
  "language": "python"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "analysis-8f3a1b2c",
    "timestamp": "2026-09-27T12:00:00.000Z",
    "analysis": {
      "rootCause": "The variable 'username' is referenced but was not defined in the current scope.",
      "explanation": "You defined 'name' on assignment, but referenced 'username' in the print statement.",
      "fixSteps": [
        "Replace 'username' with 'name' in print statement.",
        "Ensure variable is initialized before reading."
      ],
      "fixedCode": "name = \"Alex\"\nprint(\"Hello \" + name)",
      "confidenceScore": 0.95
    },
    "metadata": {
      "executionTimeMs": 24,
      "mode": "gemini_ai",
      "model": "gemini-1.5-flash"
    }
  },
  "storage": {
    "storage": "aws_s3",
    "key": "analyses/2026-09-27/analysis-8f3a1b2c.json"
  }
}
```

### `GET /health`
Returns live server uptime, system memory stats, Gemini API status, and Cloud S3 storage configuration status.

---

## 👤 Author & Contributor

<div align="center">

| [<img src="https://github.com/Dhanya562004.png" width="100px;" alt="Dhanya k"/><br /><sub><b>Dhanya k</b></sub>](https://github.com/Dhanya562004)<br />[![GitHub](https://img.shields.io/badge/GitHub-Dhanya562004-181717?style=flat-square&logo=github)](https://github.com/Dhanya562004) |
| :---: |

**Dhanya k** ([@Dhanya562004](https://github.com/Dhanya562004)) — Creator & Lead Software Engineer

</div>

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for details.
