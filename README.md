# Graph Visualizer Pro - SRM Full Stack Engineering Challenge

A full-stack application that processes interconnected alphabetic arrays into hierarchical graph trees, rendering cycle detections and structure depth dynamically. Built for the SRM Full Stack Engineering Challenge.

## Technology Stack
- **Frontend**: Built with React, Vite, and CSS. Showcases premium "Glassmorphism" UI panels layering over a custom animated Keyframe background.
- **Backend / API**: Built with Node.js and Express to cleanly solve complex graphical data loops within a sub-3 second constraint.
- **Algorithm Architecture**: Utilizes an iterative Depth-First-Search logic mapping to detect multi-parent "diamonds" (via first-parent logic constraints), strict self-loop validation, duplicate node handlers, and connected-component cycle checking.

## How to Run Locally

### 1. Backend API Local Setup
Navigate to the `backend` folder, install dependencies, and run:
```bash
cd backend
npm install
npm start
```
The API server will launch and listen for JSON POST payloads at `http://localhost:3000/bfhl`.

### 2. Frontend React Local Setup
Navigate to the `frontend` folder, install dependencies, and run the dev server:
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser. The UI allows you to paste the payload directly and automatically calls the local backend API server you launched in step 1.

## Expected API Specification
**Endpoint**: `POST /bfhl`
**Headers**: `Content-Type: application/json`

**Sample Payload**:
```json
{
  "data": ["A->B", "A->C", "B->D", "C->E", "hello", "1->2", "A->", "X->Y", "Y->Z", "Z->X"]
}
```

The system automatically responds with valid Node hierarchies mapping roots exactly to their deepest paths, separating out completely cyclic groups, isolating duplicate edges, and tracking individual user properties accordingly.
