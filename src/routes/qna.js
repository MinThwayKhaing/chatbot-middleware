// backend/routes/qna.js
import express from "express";

const router = express.Router();
let qnaList = [
    { id: 1, userQuestion: "What is your name?", botResponse: "I am a bot.", includeWords: "name", startWith: "What" },
    { id: 2, userQuestion: "How are you?", botResponse: "I'm fine, thanks!", includeWords: "fine, thanks", startWith: "How" },
    { id: 3, userQuestion: "Where do you live?", botResponse: "I live on the internet.", includeWords: "live", startWith: "Where" },
    { id: 4, userQuestion: "What time is it?", botResponse: "I don't have a clock.", includeWords: "time", startWith: "What" },
    { id: 5, userQuestion: "Can you help me?", botResponse: "Sure, how can I assist you?", includeWords: "help, assist", startWith: "Can" },

  ];
  
// GET all QnA
router.get("/", (req, res) => {
  res.json(qnaList);
});

// POST add QnA
router.post("/", (req, res) => {
  const newItem = { id: Date.now(), ...req.body };
  qnaList.push(newItem);
  res.status(201).json(newItem);
});

// PUT update QnA by id
router.put("/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const idx = qnaList.findIndex(q => q.id === id);
  if (idx === -1) return res.status(404).json({ error: "Not found" });
  qnaList[idx] = { ...qnaList[idx], ...req.body };
  res.json(qnaList[idx]);
});

// DELETE QnA by id
router.delete("/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const idx = qnaList.findIndex(q => q.id === id);
  if (idx === -1) return res.status(404).json({ error: "Not found" });
  const removed = qnaList.splice(idx, 1);
  res.json(removed[0]);
});

export default router;
