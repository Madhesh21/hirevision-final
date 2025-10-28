// const express = require("express");
// const router = express.Router();
// const fs = require("fs");
// const { MongoClient, ObjectId } = require("mongodb");
// const PdfParser = require("pdf2json");
// const parser = new PdfParser(this, 1);
// const { createEmbeddings } = require("./embedding");
// const { GoogleGenerativeAI } = require("@google/generative-ai");

// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

// // Home page - Render the interview chatbot
// router.get("/", async (req, res) => {
//   try {
//     res.render("index.ejs", { title: "AI Interview Bot" });
//   } catch (error) {
//     console.error("Error rendering home:", error);
//     res.status(500).send("Server error");
//   }
// });

// // Generate embeddings from query text
// router.get("/embeddings", async (req, res) => {
//   const { text = "Hello World" } = req.query;
//   if (!text || typeof text !== "string") {
//     return res
//       .status(400)
//       .json({ error: 'Valid "text" query param is required' });
//   }

//   try {
//     const embedding = await createEmbeddings(text);
//     const truncatedEmbedding = embedding.slice(0, 10);
//     res.json({
//       success: true,
//       inputText: text,
//       embedding: truncatedEmbedding,
//       dimensions: embedding.length,
//     });
//   } catch (error) {
//     console.error("Embedding error:", error);
//     res.status(500).json({ success: false, error: error.message });
//   }
// });

// // Load PDF, generate embeddings, store in MongoDB
// router.post("/load-document", async (req, res) => {
//   try {
//     parser.loadPDF("./uploads/resume.pdf");

//     parser.on("pdfParser_dataReady", async (data) => {
//       await fs.writeFileSync("./context.txt", parser.getRawTextContent());
//       const content = await fs.readFileSync("./context.txt", "utf-8");
//       const connection = await MongoClient.connect(process.env.DB);
//       const db = connection.db("HireVision");
//       const collection = db.collection("docs");
//       const splitContent = content.split("\n").filter((l) => l.trim() !== "");

//       for (const line of splitContent) {
//         try {
//           const embeddings = await createEmbeddings(line);
//           await collection.insertOne({
//             text: line,
//             embedding: embeddings,
//           });
//         } catch (err) {
//           console.error("Insert error for line:", line, err.message);
//         }
//       }

//       await connection.close();
//       res.json({ message: "Done", totalLines: splitContent.length });
//     });
//   } catch (error) {
//     console.log(error);
//     res.status(500).json({ error: "Error processing document" });
//   }
// });

// // Interview conversation endpoint
// router.post("/conversation", async (req, res) => {
//   try {
//     let sessionId = req.body.sessionId;
//     const connection = await MongoClient.connect(process.env.DB);
//     const db = connection.db("HireVision");
    
//     // Create or find session
//     if (!sessionId) {
//       const collection = db.collection("sessions");
//       const sessionData = await collection.insertOne({ 
//         createdAt: new Date(),
//         difficulty: req.body.difficulty || 'medium'
//       });
//       sessionId = sessionData.insertedId.toString();
//     }

//     const msg = req.body.message;
//     const action = req.body.action;

//     // Save user message
//     const concollection = db.collection("conversations");
//     await concollection.insertOne({
//       sessionId: sessionId,
//       message: msg,
//       role: "USER",
//       action: action,
//       createdAt: new Date(),
//     });

//     // Get resume context from vector search - Use broader search for better context
//     const messageVector = await createEmbeddings("skills experience projects technologies education");
//     const docsCollection = db.collection("docs");

//     const vectorCursor = docsCollection.aggregate([
//       {
//         $vectorSearch: {
//           index: "vector",
//           path: "embedding",
//           queryVector: messageVector,
//           numCandidates: 200,
//           limit: 50,
//         },
//       },
//       {
//         $project: {
//           _id: 0,
//           text: 1,
//           score: { $meta: "vectorSearchScore" },
//         },
//       },
//     ]);

//     const vectorSearchResults = [];
//     for await (const doc of vectorCursor) {
//       vectorSearchResults.push(doc);
//     }

//     const context = vectorSearchResults.map(doc => doc.text).join("\n");

//     let prompt = '';

//     // Get previous questions to avoid repetition
//     const previousQuestions = await concollection.find({
//       sessionId: sessionId,
//       role: "ASSISTANT",
//       action: "ask_question"
//     }).toArray();
    
//     const askedQuestions = previousQuestions.map(q => q.message).join("\n");

//     // Different prompts based on action
//     if (action === 'ask_question') {
//       const difficulty = req.body.difficulty;
//       const questionNumber = req.body.questionNumber;
      
//       prompt = `You are an expert technical interviewer. 

// RESUME CONTENT:
// ${context}

// DIFFICULTY LEVEL: ${difficulty.toUpperCase()}

// PREVIOUSLY ASKED QUESTIONS (DO NOT REPEAT):
// ${askedQuestions || "None"}

// TASK: Ask question ${questionNumber} of 5.

// STRICT REQUIREMENTS:
// 1. The question MUST be DIRECTLY based on specific skills, technologies, or projects mentioned in the resume above
// 2. For ${difficulty} difficulty:
//    - EASY: Basic concepts and definitions from their listed skills
//    - MEDIUM: Practical application and problem-solving scenarios from their projects
//    - HARD: Deep technical knowledge, system design, and complex scenarios related to their experience
// 3. DO NOT ask generic questions - reference SPECIFIC items from the resume (e.g., "In your Kongu Arts project...", "Regarding your Node.js experience...", "About the MongoDB database you used...")
// 4. Ask ONLY ONE question
// 5. Make it different from previously asked questions
// 6. Be specific and technical

// YOUR QUESTION:`;
//     } 
//     else if (action === 'evaluate') {
//       const answers = req.body.answers;
      
//       prompt = `You are an interview evaluator. Based on this resume:

// ${context}

// The candidate answered 5 ${req.body.difficulty || 'medium'} difficulty questions:
// ${JSON.stringify(answers, null, 2)}

// Please evaluate their performance and provide:
// 1. Overall score out of 100
// 2. Detailed feedback on each answer
// 3. Strengths and areas for improvement
// 4. Final recommendation

// Format your response clearly with the score at the top.`;
//     }

//     // Get AI response
//     const result = await model.generateContent(prompt);
//     const answer = result.response.text();

//     // Save bot response
//     await concollection.insertOne({
//       sessionId: sessionId,
//       message: answer,
//       role: "ASSISTANT",
//       action: action,
//       createdAt: new Date(),
//     });

//     await connection.close();

//     // Send response based on action
//     if (action === 'ask_question') {
//       res.json({ 
//         question: answer,
//         sessionId: sessionId 
//       });
//     } else if (action === 'evaluate') {
//       res.json({ 
//         evaluation: answer,
//         sessionId: sessionId 
//       });
//     } else {
//       res.json(answer);
//     }

//   } catch (e) {
//     console.error("Conversation error:", e);
//     res.status(500).json({ error: e.message });
//   }
// });

// module.exports = router;


const express = require("express");
const router = express.Router();
const fs = require("fs");
const { MongoClient, ObjectId } = require("mongodb");
const PdfParser = require("pdf2json");
const { createEmbeddings } = require("./embedding");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const multer = require("multer");
const path = require("path");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = "./uploads";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "resume-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    if (path.extname(file.originalname).toLowerCase() !== ".pdf") {
      return cb(new Error("Only PDF files are allowed"));
    }
    cb(null, true);
  },
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// Home page - Render the interview chatbot
router.get("/", async (req, res) => {
  try {
    res.render("index.ejs", { title: "AI Interview Bot" });
  } catch (error) {
    console.error("Error rendering home:", error);
    res.status(500).send("Server error");
  }
});

// Generate embeddings from query text
router.get("/embeddings", async (req, res) => {
  const { text = "Hello World" } = req.query;
  if (!text || typeof text !== "string") {
    return res
      .status(400)
      .json({ error: 'Valid "text" query param is required' });
  }

  try {
    const embedding = await createEmbeddings(text);
    const truncatedEmbedding = embedding.slice(0, 10);
    res.json({
      success: true,
      inputText: text,
      embedding: truncatedEmbedding,
      dimensions: embedding.length,
    });
  } catch (error) {
    console.error("Embedding error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Load PDF, generate embeddings, store in MongoDB - NOW WITH UPLOAD
router.post("/load-document", upload.single("resume"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No PDF file uploaded" });
    }

    const pdfPath = req.file.path;
    const parser = new PdfParser(this, 1);
    
    parser.loadPDF(pdfPath);

    parser.on("pdfParser_dataReady", async (data) => {
      try {
        const contextPath = `./context-${Date.now()}.txt`;
        await fs.writeFileSync(contextPath, parser.getRawTextContent());
        const content = await fs.readFileSync(contextPath, "utf-8");
        
        const connection = await MongoClient.connect(process.env.DB);
        const db = connection.db("HireVision");
        const collection = db.collection("docs");
        
        // Create a session for this uploaded document
        const sessionCollection = db.collection("sessions");
        const session = await sessionCollection.insertOne({
          createdAt: new Date(),
          pdfPath: pdfPath,
          fileName: req.file.originalname,
        });
        
        const sessionId = session.insertedId.toString();
        
        const splitContent = content.split("\n").filter((l) => l.trim() !== "");

        for (const line of splitContent) {
          try {
            const embeddings = await createEmbeddings(line);
            await collection.insertOne({
              text: line,
              embedding: embeddings,
              sessionId: sessionId, // Link to session
            });
          } catch (err) {
            console.error("Insert error for line:", line, err.message);
          }
        }

        await connection.close();
        
        // Clean up temp context file
        fs.unlinkSync(contextPath);
        
        res.json({ 
          message: "Document processed successfully", 
          totalLines: splitContent.length,
          sessionId: sessionId,
          fileName: req.file.originalname
        });
      } catch (err) {
        console.error("Processing error:", err);
        res.status(500).json({ error: "Error processing PDF content" });
      }
    });

    parser.on("pdfParser_dataError", (err) => {
      console.error("PDF parsing error:", err);
      res.status(500).json({ error: "Error parsing PDF file" });
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error processing document" });
  }
});

// Interview conversation endpoint
router.post("/conversation", async (req, res) => {
  try {
    let sessionId = req.body.sessionId;
    const connection = await MongoClient.connect(process.env.DB);
    const db = connection.db("HireVision");
    
    // Validate session exists
    if (!sessionId) {
      return res.status(400).json({ error: "Session ID is required. Please upload a resume first." });
    }

    const msg = req.body.message;
    const action = req.body.action;

    // Save user message
    const concollection = db.collection("conversations");
    await concollection.insertOne({
      sessionId: sessionId,
      message: msg,
      role: "USER",
      action: action,
      createdAt: new Date(),
    });

    // Get resume context from vector search - FILTERED BY SESSION
    const messageVector = await createEmbeddings("skills experience projects technologies education");
    const docsCollection = db.collection("docs");

    const vectorCursor = docsCollection.aggregate([
      {
        $vectorSearch: {
          index: "vector",
          path: "embedding",
          queryVector: messageVector,
          numCandidates: 200,
          limit: 50,
        },
      },
      {
        $match: {
          sessionId: sessionId, // Only get docs from this session
        },
      },
      {
        $project: {
          _id: 0,
          text: 1,
          score: { $meta: "vectorSearchScore" },
        },
      },
    ]);

    const vectorSearchResults = [];
    for await (const doc of vectorCursor) {
      vectorSearchResults.push(doc);
    }

    const context = vectorSearchResults.map(doc => doc.text).join("\n");

    let prompt = '';

    // Get previous questions to avoid repetition
    const previousQuestions = await concollection.find({
      sessionId: sessionId,
      role: "ASSISTANT",
      action: "ask_question"
    }).toArray();
    
    const askedQuestions = previousQuestions.map(q => q.message).join("\n");

    // Different prompts based on action
    if (action === 'ask_question') {
      const difficulty = req.body.difficulty;
      const questionNumber = req.body.questionNumber;
      
      prompt = `You are an expert technical interviewer. 

RESUME CONTENT:
${context}

DIFFICULTY LEVEL: ${difficulty.toUpperCase()}

PREVIOUSLY ASKED QUESTIONS (DO NOT REPEAT):
${askedQuestions || "None"}

TASK: Ask question ${questionNumber} of 5.

STRICT REQUIREMENTS:
1. The question MUST be DIRECTLY based on specific skills, technologies, or projects mentioned in the resume above
2. For ${difficulty} difficulty:
   - EASY: Basic concepts and definitions from their listed skills
   - MEDIUM: Practical application and problem-solving scenarios from their projects
   - HARD: Deep technical knowledge, system design, and complex scenarios related to their experience
3. DO NOT ask generic questions - reference SPECIFIC items from the resume (e.g., "In your Kongu Arts project...", "Regarding your Node.js experience...", "About the MongoDB database you used...")
4. Ask ONLY ONE question
5. Make it different from previously asked questions
6. Be specific and technical

YOUR QUESTION:`;
    } 
    else if (action === 'evaluate') {
      const answers = req.body.answers;
      
      prompt = `You are an interview evaluator. Based on this resume:

${context}

The candidate answered 5 ${req.body.difficulty || 'medium'} difficulty questions:
${JSON.stringify(answers, null, 2)}

Please evaluate their performance and provide:
1. Overall score out of 100
2. Detailed feedback on each answer
3. Strengths and areas for improvement
4. Final recommendation

Format your response clearly with the score at the top.`;
    }

    // Get AI response
    const result = await model.generateContent(prompt);
    const answer = result.response.text();

    // Save bot response
    await concollection.insertOne({
      sessionId: sessionId,
      message: answer,
      role: "ASSISTANT",
      action: action,
      createdAt: new Date(),
    });

    await connection.close();

    // Send response based on action
    if (action === 'ask_question') {
      res.json({ 
        question: answer,
        sessionId: sessionId 
      });
    } else if (action === 'evaluate') {
      res.json({ 
        evaluation: answer,
        sessionId: sessionId 
      });
    } else {
      res.json(answer);
    }

  } catch (e) {
    console.error("Conversation error:", e);
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;