# Anubhava

# 🎓 AI-Powered Personalized Learning Path Generator

An intelligent, adaptive learning platform that diagnoses a learner’s knowledge level, generates a personalized roadmap, and continuously adapts based on performance — built using **MERN Stack + GraphQL + AI (RAG)**.

---

## 🚀 Project Overview

Traditional online learning platforms follow a **one-size-fits-all** approach. Learners are forced to go through entire courses even if they already understand parts of the content, and they receive little to no instant academic support.

This project solves that problem by creating an **AI-driven personalized learning experience** that:
- Assesses what a learner already knows
- Generates a **custom learning roadmap**
- Adapts the roadmap in real time based on quiz performance
- Provides **context-aware AI explanations** using verified learning material

---

## 🎯 Problem Statement

- Static, linear courses waste learners’ time
- No real-time academic assistance when learners get stuck
- No adaptive mechanism based on learner performance

---

## 💡 Our Solution

An **AI-powered learning system** that:
1. Diagnoses learner knowledge using AI-generated assessments
2. Builds a personalized learning path
3. Uses **Retrieval-Augmented Generation (RAG)** to ensure accurate and trusted explanations
4. Dynamically adjusts content when learners struggle

---

## 🧠 Core Technologies

### 🏗️ Tech Stack
- **Frontend:** React.js, Apollo Client
- **Backend:** Node.js, Express.js
- **API Layer:** GraphQL (Apollo Server)
- **Database:** MongoDB Atlas
- **AI Models:** Google Gemini 1.5 Flash
- **Vector Database:** Pinecone
- **Hosting:** Vercel (Frontend), Render (Backend)

---

## 🧩 System Architecture

| Layer | Technology | Responsibility |
|------|----------|---------------|
| Frontend | React + Apollo Client | User dashboard, quizzes, AI chat |
| API Gateway | GraphQL | Unified data access layer |
| Backend | Node.js + Express | Business logic & AI orchestration |
| Data Layer | MongoDB | User data & learning progress |
| AI Knowledge Base | Pinecone | Vector search over verified content |

---

## 🔄 System Workflow

### Phase A: User Onboarding
1. User selects a learning goal (e.g., *Master React*)
2. AI generates a baseline assessment quiz
3. Quiz results are analyzed
4. AI returns a **personalized roadmap (JSON-based)**

---

### Phase B: Learning Loop
1. User studies lesson content
2. User asks doubts via AI chat
3. System retrieves relevant lesson context from Pinecone
4. Gemini responds **only using verified data**

---

### Phase C: Adaptive Evaluation
- **Score ≥ 80%**
  - Progress updated in MongoDB
  - Next module unlocked

- **Score < 80%**
  - AI identifies weak areas
  - Inserts remedial lessons into the learning path
  - Roadmap dynamically adapts

---

## ✨ Key Features

- 📊 Personalized AI-generated learning roadmap
- 🧪 Dynamic quizzes and assessments
- 🤖 Context-aware AI tutor (RAG-based)
- 🔄 Adaptive learning paths
- ⏱️ Time-based schedule compression
- 🖼️ Multi-modal learning (text + image understanding)

---

## 🧪 AI & RAG Implementation

- **Gemini AI** handles:
  - Quiz generation
  - Concept explanations
  - Roadmap creation

- **Pinecone** ensures:
  - Retrieval of only trusted educational content
  - Prevention of AI hallucinations
  - Accurate, lesson-specific responses

