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

// Middleware to validate userId
const validateUser = (req, res, next) => {
  const userId = req.body.userId || req.headers['x-user-id'];
  
  if (!userId) {
    return res.status(401).json({ error: "User authentication required" });
  }
  
  req.userId = userId;
  next();
};

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

// Load PDF, generate embeddings, store in MongoDB - WITH USER ID
router.post("/load-document", upload.single("resume"), validateUser, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No PDF file uploaded" });
    }

    const userId = req.userId;
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
        
        // Create a session for this uploaded document with userId
        const sessionCollection = db.collection("sessions");
        const session = await sessionCollection.insertOne({
          userId: userId, // ADDED: Link to user
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
              sessionId: sessionId,
              userId: userId, // ADDED: Link to user
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

// ATS Analysis endpoint - WITH USER ID
// router.post("/analyze-ats", upload.single("resume"), validateUser, async (req, res) => {
//   try {
//     if (!req.file) {
//       return res.status(400).json({ error: "No PDF file uploaded" });
//     }

//     const userId = req.userId;
//     const jobDescription = req.body.jobDescription || "";
//     const pdfPath = req.file.path;
//     const parser = new PdfParser(this, 1);
    
//     parser.loadPDF(pdfPath);

//     parser.on("pdfParser_dataReady", async (data) => {
//       try {
//         const resumeText = parser.getRawTextContent();
        
//         const prompt = `You are an ATS (Applicant Tracking System) analyzer. Analyze this resume against the job description and provide a detailed ATS compatibility score.

// RESUME:
// ${resumeText}

// JOB DESCRIPTION:
// ${jobDescription || "General software engineering position"}

// Provide your analysis in this EXACT JSON format (no markdown, just raw JSON):
// {
//   "overallScore": 78,
//   "matchingKeywords": ["JavaScript", "React", "Node.js", "MongoDB", "AWS"],
//   "missingKeywords": ["Docker", "Kubernetes", "GraphQL", "Redis"],
//   "recommendations": [
//     {
//       "category": "Skills",
//       "suggestion": "Add Docker and Kubernetes to your technical skills section",
//       "impact": "High"
//     },
//     {
//       "category": "Format",
//       "suggestion": "Use bullet points instead of paragraphs for better ATS parsing",
//       "impact": "Medium"
//     },
//     {
//       "category": "Keywords",
//       "suggestion": "Include more industry-specific terms from the job description",
//       "impact": "High"
//     },
//     {
//       "category": "Experience",
//       "suggestion": "Quantify your achievements with specific metrics and numbers",
//       "impact": "Medium"
//     }
//   ]
// }

// IMPORTANT: Return ONLY the JSON object, no additional text or formatting.`;

//         const result = await model.generateContent(prompt);
//         let analysisText = result.response.text();
        
//         analysisText = analysisText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
//         const analysis = JSON.parse(analysisText);
        
//         const connection = await MongoClient.connect(process.env.DB);
//         const db = connection.db("HireVision");
//         const sessionCollection = db.collection("sessions");
        
//         const session = await sessionCollection.insertOne({
//           userId: userId, // ADDED: Link to user
//           createdAt: new Date(),
//           pdfPath: pdfPath,
//           fileName: req.file.originalname,
//           atsScore: analysis.overallScore,
//           analysis: analysis,
//           jobDescription: jobDescription,
//         });
        
//         await connection.close();
        
//         res.json({
//           success: true,
//           sessionId: session.insertedId.toString(),
//           ...analysis
//         });
        
//       } catch (err) {
//         console.error("Analysis error:", err);
//         res.status(500).json({ error: "Error analyzing resume: " + err.message });
//       }
//     });

//     parser.on("pdfParser_dataError", (err) => {
//       console.error("PDF parsing error:", err);
//       res.status(500).json({ error: "Error parsing PDF file" });
//     });

//   } catch (error) {
//     console.log(error);
//     res.status(500).json({ error: "Error processing document" });
//   }
// });



// ATS Analysis endpoint - WITH USER ID AND EMBEDDINGS
router.post("/analyze-ats", upload.single("resume"), validateUser, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No PDF file uploaded" });
    }

    const userId = req.userId;
    const jobDescription = req.body.jobDescription || "";
    const pdfPath = req.file.path;
    const parser = new PdfParser(this, 1);
    
    parser.loadPDF(pdfPath);

    parser.on("pdfParser_dataReady", async (data) => {
      try {
        const resumeText = parser.getRawTextContent();
        
        const connection = await MongoClient.connect(process.env.DB);
        const db = connection.db("HireVision");
        
        // STEP 1: Create session first
        const sessionCollection = db.collection("sessions");
        const session = await sessionCollection.insertOne({
          userId: userId,
          createdAt: new Date(),
          pdfPath: pdfPath,
          fileName: req.file.originalname,
          jobDescription: jobDescription,
        });
        
        const sessionId = session.insertedId.toString();
        
        // STEP 2: Create embeddings for RAG (same as load-document)
        const docsCollection = db.collection("docs");
        const splitContent = resumeText.split("\n").filter((l) => l.trim() !== "");

        for (const line of splitContent) {
          try {
            const embeddings = await createEmbeddings(line);
            await docsCollection.insertOne({
              text: line,
              embedding: embeddings,
              sessionId: sessionId,
              userId: userId,
            });
          } catch (err) {
            console.error("Insert error for line:", line, err.message);
          }
        }
        
        // STEP 3: Do ATS analysis with Gemini
        const prompt = `You are an ATS (Applicant Tracking System) analyzer. Analyze this resume against the job description and provide a detailed ATS compatibility score.

RESUME:
${resumeText}

JOB DESCRIPTION:
${jobDescription || "General software engineering position"}

Provide your analysis in this EXACT JSON format (no markdown, just raw JSON):
{
  "overallScore": 78,
  "matchingKeywords": ["JavaScript", "React", "Node.js", "MongoDB", "AWS"],
  "missingKeywords": ["Docker", "Kubernetes", "GraphQL", "Redis"],
  "recommendations": [
    {
      "category": "Skills",
      "suggestion": "Add Docker and Kubernetes to your technical skills section",
      "impact": "High"
    },
    {
      "category": "Format",
      "suggestion": "Use bullet points instead of paragraphs for better ATS parsing",
      "impact": "Medium"
    },
    {
      "category": "Keywords",
      "suggestion": "Include more industry-specific terms from the job description",
      "impact": "High"
    },
    {
      "category": "Experience",
      "suggestion": "Quantify your achievements with specific metrics and numbers",
      "impact": "Medium"
    }
  ]
}

IMPORTANT: Return ONLY the JSON object, no additional text or formatting.`;

        const result = await model.generateContent(prompt);
        let analysisText = result.response.text();
        
        analysisText = analysisText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const analysis = JSON.parse(analysisText);
        
        // STEP 4: Update session with ATS results
        await sessionCollection.updateOne(
          { _id: session.insertedId },
          { 
            $set: { 
              atsScore: analysis.overallScore,
              analysis: analysis 
            } 
          }
        );
        
        await connection.close();
        
        res.json({
          success: true,
          sessionId: sessionId,
          totalLines: splitContent.length, // Added for confirmation
          ...analysis
        });
        
      } catch (err) {
        console.error("Analysis error:", err);
        res.status(500).json({ error: "Error analyzing resume: " + err.message });
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



// Interview conversation endpoint - WITH USER ID FILTERING
// router.post("/conversation", validateUser, async (req, res) => {
//   try {
//     let sessionId = req.body.sessionId;
//     const userId = req.userId;
    
//     const connection = await MongoClient.connect(process.env.DB);
//     const db = connection.db("HireVision");
    
//     // Validate session exists AND belongs to user
//     if (!sessionId) {
//       return res.status(400).json({ error: "Session ID is required. Please upload a resume first." });
//     }

//     // ADDED: Verify session belongs to user
//     const sessionCollection = db.collection("sessions");
//     const session = await sessionCollection.findOne({
//       _id: new ObjectId(sessionId),
//       userId: userId
//     });

//     if (!session) {
//       return res.status(403).json({ error: "Session not found or access denied" });
//     }

//     const msg = req.body.message;
//     const action = req.body.action || 'chat';

//     // Save user message
//     const concollection = db.collection("conversations");
//     await concollection.insertOne({
//       sessionId: sessionId,
//       userId: userId, // ADDED: Link to user
//       message: msg,
//       role: "USER",
//       action: action,
//       createdAt: new Date(),
//     });

//     // Get resume context from vector search - FILTERED BY SESSION AND USER
//     const messageVector = await createEmbeddings(msg);
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
//         $match: {
//           sessionId: sessionId,
//           userId: userId, // ADDED: Filter by user
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
//     let responseKey = 'answer';

//     // Get conversation history - FILTERED BY USER
//     const conversationHistory = await concollection.find({
//       sessionId: sessionId,
//       userId: userId // ADDED: Filter by user
//     }).sort({ createdAt: 1 }).limit(10).toArray();
    
//     const chatHistory = conversationHistory.map(c => 
//       `${c.role}: ${c.message}`
//     ).join("\n");

//     // Different prompts based on action
//     if (action === 'chat' || !action) {
//       prompt = `You are an AI interview assistant. You have access to the candidate's resume and can have a natural conversation about their experience, skills, and background.

// RESUME CONTENT:
// ${context}

// CONVERSATION HISTORY:
// ${chatHistory}

// USER MESSAGE: ${msg}

// INSTRUCTIONS:
// 1. Answer based on the resume content when relevant
// 2. Ask follow-up questions naturally to practice interview skills
// 3. Provide constructive feedback when appropriate
// 4. Keep responses conversational and helpful
// 5. If the user's message is not related to their resume, politely guide them back to interview practice

// YOUR RESPONSE:`;
//       responseKey = 'answer';
//     }
//     else if (action === 'ask_question') {
//       const difficulty = req.body.difficulty;
//       const questionNumber = req.body.questionNumber;
      
//       const previousQuestions = await concollection.find({
//         sessionId: sessionId,
//         userId: userId, // ADDED: Filter by user
//         role: "ASSISTANT",
//         action: "ask_question"
//       }).toArray();
      
//       const askedQuestions = previousQuestions.map(q => q.message).join("\n");
      
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
//       responseKey = 'question';
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
//       responseKey = 'evaluation';
//     }

//     const result = await model.generateContent(prompt);
//     const answer = result.response.text();

//     await concollection.insertOne({
//       sessionId: sessionId,
//       userId: userId, // ADDED: Link to user
//       message: answer,
//       role: "ASSISTANT",
//       action: action,
//       createdAt: new Date(),
//     });

//     await connection.close();

//     res.json({ 
//       [responseKey]: answer,
//       sessionId: sessionId 
//     });

//   } catch (e) {
//     console.error("Conversation error:", e);
//     res.status(500).json({ error: e.message });
//   }
// });

// Add this to your existing router file - UPDATE the evaluation part in /conversation endpoint

// Modified evaluate action in the /conversation endpoint
router.post("/conversation", validateUser, async (req, res) => {
  try {
    let sessionId = req.body.sessionId;
    const userId = req.userId;
    
    const connection = await MongoClient.connect(process.env.DB);
    const db = connection.db("HireVision");
    
    if (!sessionId) {
      return res.status(400).json({ error: "Session ID is required. Please upload a resume first." });
    }

    const sessionCollection = db.collection("sessions");
    const session = await sessionCollection.findOne({
      _id: new ObjectId(sessionId),
      userId: userId
    });

    if (!session) {
      return res.status(403).json({ error: "Session not found or access denied" });
    }

    const msg = req.body.message;
    const action = req.body.action || 'chat';

    // Save user message
    const concollection = db.collection("conversations");
    await concollection.insertOne({
      sessionId: sessionId,
      userId: userId,
      message: msg,
      role: "USER",
      action: action,
      createdAt: new Date(),
    });

    // Get resume context from vector search
    const messageVector = await createEmbeddings(msg);
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
          sessionId: sessionId,
          userId: userId,
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
    let responseKey = 'answer';

    // Get conversation history
    const conversationHistory = await concollection.find({
      sessionId: sessionId,
      userId: userId
    }).sort({ createdAt: 1 }).limit(20).toArray();
    
    const chatHistory = conversationHistory.map(c => 
      `${c.role}: ${c.message}`
    ).join("\n");

    // Handle different actions
    if (action === 'chat' || !action) {
      prompt = `You are an AI interview assistant. You have access to the candidate's resume and can have a natural conversation about their experience, skills, and background.

RESUME CONTENT:
${context}

CONVERSATION HISTORY:
${chatHistory}

USER MESSAGE: ${msg}

INSTRUCTIONS:
1. Answer based on the resume content when relevant
2. Ask follow-up questions naturally to practice interview skills
3. Provide constructive feedback when appropriate
4. Keep responses conversational and helpful
5. If the user's message is not related to their resume, politely guide them back to interview practice

YOUR RESPONSE:`;
      responseKey = 'answer';
    }
    else if (action === 'ask_question') {
      const difficulty = req.body.difficulty;
      const questionNumber = req.body.questionNumber;
      
      const previousQuestions = await concollection.find({
        sessionId: sessionId,
        userId: userId,
        role: "ASSISTANT",
        action: "ask_question"
      }).toArray();
      
      const askedQuestions = previousQuestions.map(q => q.message).join("\n");
      
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
3. DO NOT ask generic questions - reference SPECIFIC items from the resume
4. Ask ONLY ONE question
5. Make it different from previously asked questions
6. Be specific and technical

YOUR QUESTION:`;
      responseKey = 'question';
    } 
    else if (action === 'evaluate') {
      const answers = req.body.answers;
      const difficulty = req.body.difficulty || 'medium';
      
      // Get the actual questions that were asked
      const questionDocs = await concollection.find({
        sessionId: sessionId,
        userId: userId,
        role: "ASSISTANT",
        action: "ask_question"
      }).sort({ createdAt: 1 }).toArray();
      
      const questionsWithAnswers = questionDocs.map((q, idx) => {
        const answer = answers.find(a => a.question === idx + 1);
        return {
          question: q.message.replace(/Question \d+\/5:\n\n/, ''),
          userAnswer: answer?.answer || "No answer provided"
        };
      });
      
      prompt = `You are an expert interview evaluator. Based on this candidate's resume and their interview responses, provide a comprehensive evaluation.

RESUME CONTENT:
${context}

INTERVIEW DIFFICULTY: ${difficulty.toUpperCase()}

QUESTIONS AND ANSWERS:
${questionsWithAnswers.map((qa, idx) => `
Question ${idx + 1}: ${qa.question}
Candidate's Answer: ${qa.userAnswer}
`).join('\n')}

TASK: Provide a comprehensive evaluation in the following EXACT JSON format (no markdown, just raw JSON):

{
  "overallScore": 45,
  "answers": [
    {
      "question": "Exact question text here",
      "userAnswer": "Candidate's exact answer here",
      "feedback": "Detailed feedback explaining what was good, what was missing, and how to improve. Be specific and constructive.",
      "score": "3/10"
    }
  ],
  "strengths": [
    "Specific strength observed during the interview with example",
    "Another strength with context",
    "Third strength based on their responses"
  ],
  "areasForImprovement": [
    "Specific area needing improvement with actionable advice",
    "Another area with concrete suggestions",
    "Third area with clear guidance on how to improve"
  ],
  "recommendation": "Overall recommendation summarizing the candidate's readiness, key takeaways, and next steps for improvement. Be honest but constructive."
}

EVALUATION CRITERIA:
1. Technical Accuracy: Did they answer correctly based on their resume skills?
2. Communication: How clear and structured was their response?
3. Depth: Did they provide sufficient detail and examples?
4. Relevance: Did they address the question directly?
5. Professionalism: Was the answer appropriate for an interview setting?

SCORING GUIDE:
- 9-10/10: Excellent answer with clear examples and deep understanding
- 7-8/10: Good answer with minor gaps
- 5-6/10: Adequate but lacking depth or clarity
- 3-4/10: Poor answer with significant issues
- 0-2/10: Unacceptable or no meaningful response

IMPORTANT: 
- Return ONLY the JSON object, no additional text or markdown formatting
- Be fair but honest in your evaluation
- Provide specific, actionable feedback
- Reference their resume context when relevant
- Calculate overallScore as average of all answer scores`;

      const result = await model.generateContent(prompt);
      let evaluationText = result.response.text();
      
      // Clean up markdown formatting
      evaluationText = evaluationText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      try {
        const evaluation = JSON.parse(evaluationText);
        
        // Save evaluation to database
        await concollection.insertOne({
          sessionId: sessionId,
          userId: userId,
          message: JSON.stringify(evaluation),
          role: "ASSISTANT",
          action: "evaluate",
          createdAt: new Date(),
        });
        
        await connection.close();
        
        return res.json({
          success: true,
          evaluation: evaluation
        });
      } catch (parseError) {
        console.error("JSON Parse Error:", parseError);
        console.error("Raw evaluation text:", evaluationText);
        
        await connection.close();
        
        return res.status(500).json({ 
          error: "Failed to parse evaluation response",
          rawResponse: evaluationText
        });
      }
    }

    // For chat and ask_question actions
    const result = await model.generateContent(prompt);
    const answer = result.response.text();

    await concollection.insertOne({
      sessionId: sessionId,
      userId: userId,
      message: answer,
      role: "ASSISTANT",
      action: action,
      createdAt: new Date(),
    });

    await connection.close();

    res.json({ 
      [responseKey]: answer,
      sessionId: sessionId 
    });

  } catch (e) {
    console.error("Conversation error:", e);
    res.status(500).json({ error: e.message });
  }
});


module.exports = router;