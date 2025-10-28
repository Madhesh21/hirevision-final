import { useState, useRef, useEffect } from "react";
import { Send, X, TrendingUp, AlertCircle, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";
import { supabase } from "@/integrations/supabase/client";

// Evaluation Modal Component
const InterviewEvaluationModal = ({ evaluation, onClose, onStartNew }) => {
  if (!evaluation) return null;

  const getScoreColor = (score) => {
    if (score >= 70) return "text-green-600";
    if (score >= 40) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBgColor = (score) => {
    if (score >= 70) return "border-green-600";
    if (score >= 40) return "border-yellow-600";
    return "border-red-600";
  };

  const getScoreLabel = (score) => {
    if (score >= 70) return "Good";
    if (score >= 40) return "Average";
    return "Poor";
  };

  const getQuestionScore = (score) => {
    const match = score?.match(/(\d+)\/(\d+)/);
    return match ? match[0] : score || "0/10";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 hover:bg-gray-100"
        >
          <X className="h-5 w-5" />
        </button>

        <CardContent className="p-8">
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-2">Interview Evaluation</h2>
            <p className="text-sm text-muted-foreground">
              Comprehensive analysis of your interview performance
            </p>
          </div>

          {/* Overall Score */}
          <div className="mb-8 bg-gray-50 rounded-lg p-6">
            <h3 className="text-center text-sm text-muted-foreground mb-4">
              Overall Performance
            </h3>
            <div className="flex flex-col items-center">
              <div className={`relative flex items-center justify-center w-32 h-32 rounded-full border-4 ${getScoreBgColor(evaluation.overallScore)}`}>
                <div className="text-center">
                  <div className={`text-4xl font-bold ${getScoreColor(evaluation.overallScore)}`}>
                    {evaluation.overallScore}
                  </div>
                  <div className="text-xs text-muted-foreground">/ 100</div>
                </div>
              </div>
              <Badge 
                variant="outline" 
                className={`mt-4 ${getScoreColor(evaluation.overallScore)}`}
              >
                {getScoreLabel(evaluation.overallScore)}
              </Badge>
            </div>
          </div>

          {/* Detailed Feedback */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4">
              Detailed Feedback on Each Answer
            </h3>
            <div className="space-y-4">
              {evaluation.answers?.map((answer, index) => {
                const scoreMatch = answer.score?.match(/(\d+)/);
                const numericScore = scoreMatch ? parseInt(scoreMatch[0]) : 0;
                
                return (
                  <Card key={index} className="border">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                          <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${getScoreBgColor(numericScore * 10)}`}>
                            <span className={`font-semibold ${getScoreColor(numericScore * 10)}`}>
                              {numericScore}
                            </span>
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="mb-3">
                            <p className="text-xs text-muted-foreground mb-1">
                              Question {index + 1}
                            </p>
                            <p className="font-medium">{answer.question}</p>
                          </div>
                          
                          <div className="mb-3">
                            <p className="text-xs text-muted-foreground mb-1">
                              Your Answer:
                            </p>
                            <p className="text-sm bg-gray-50 p-3 rounded">
                              "{answer.userAnswer}"
                            </p>
                          </div>

                          <div className="mb-3">
                            <p className="text-xs text-muted-foreground mb-1">
                              Feedback:
                            </p>
                            <p className="text-sm text-gray-700">
                              {answer.feedback}
                            </p>
                          </div>

                          <Badge 
                            variant={numericScore >= 7 ? "default" : numericScore >= 4 ? "secondary" : "destructive"} 
                            className="text-xs"
                          >
                            Score: {getQuestionScore(answer.score)}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Performance Analysis */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4">Performance Analysis</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="border-green-200 bg-green-50">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    <h4 className="font-semibold text-green-900">Strengths</h4>
                  </div>
                  <ul className="space-y-2">
                    {evaluation.strengths?.map((strength, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-green-800">
                        <span className="text-green-600 mt-1">✓</span>
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-yellow-200 bg-yellow-50">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                    <h4 className="font-semibold text-yellow-900">
                      Areas for Improvement
                    </h4>
                  </div>
                  <ul className="space-y-2">
                    {evaluation.areasForImprovement?.map((area, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-yellow-800">
                        <span className="text-yellow-600 mt-1">→</span>
                        <span>{area}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Final Recommendation */}
          {evaluation.recommendation && (
            <div className="mb-6">
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="p-6">
                  <h4 className="font-semibold text-blue-900 mb-2">
                    Final Recommendation
                  </h4>
                  <p className="text-sm text-blue-800">
                    {evaluation.recommendation}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 justify-between items-center pt-4 border-t">
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => window.print()}
            >
              <Download className="h-4 w-4" />
              Download Report
            </Button>
            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button onClick={onStartNew}>
                Start New Practice
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [interviewMode, setInterviewMode] = useState(null);
  const [difficulty, setDifficulty] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [showEvaluation, setShowEvaluation] = useState(false);
  const [evaluationData, setEvaluationData] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const sessionId = localStorage.getItem('sessionId');
    if (!sessionId) {
      setMessages([{
        role: "assistant",
        content: "Welcome! Please upload your resume first from the upload page to start practicing.",
        time: new Date().toLocaleTimeString(),
      }]);
    } else {
      setMessages([{
        role: "assistant",
        content: "Hello! I'm your AI interview assistant. Choose how you'd like to practice:\n\n1. Free Practice - Have a natural conversation about your experience\n2. Structured Interview - Answer 5 questions with a difficulty level",
        time: new Date().toLocaleTimeString(),
      }]);
    }
  }, []);

  const startStructuredInterview = async (selectedDifficulty) => {
    setDifficulty(selectedDifficulty);
    setInterviewMode('structured');
    setCurrentQuestion(1);
    setAnswers([]);
    
    const startMessage = {
      role: "assistant",
      content: `Great! Starting ${selectedDifficulty.toUpperCase()} difficulty interview. I'll ask you 5 questions based on your resume. Take your time to answer each one thoughtfully.`,
      time: new Date().toLocaleTimeString(),
    };
    
    setMessages(prev => [...prev, startMessage]);
    await askQuestion(selectedDifficulty, 1);
  };

  const startFreePractice = () => {
    setInterviewMode('practice');
    const startMessage = {
      role: "assistant",
      content: "Perfect! Let's have a conversation about your experience. Feel free to ask me anything or tell me about yourself, and I'll help you practice your interview skills.",
      time: new Date().toLocaleTimeString(),
    };
    setMessages(prev => [...prev, startMessage]);
  };

  const askQuestion = async (diff, questionNum) => {
    setIsLoading(true);
    
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        const errorMessage = {
          role: "assistant",
          content: "Authentication error. Please sign in again.",
          time: new Date().toLocaleTimeString(),
        };
        setMessages((prev) => [...prev, errorMessage]);
        setIsLoading(false);
        return;
      }

      const sessionId = localStorage.getItem('sessionId');
      
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/conversation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user.id,
        },
        body: JSON.stringify({
          message: `Question ${questionNum}`,
          sessionId: sessionId,
          action: "ask_question",
          difficulty: diff,
          questionNumber: questionNum,
          userId: user.id,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get question");
      }

      const data = await response.json();

      const questionMessage = {
        role: "assistant",
        content: `Question ${questionNum}/5:\n\n${data.question}`,
        time: new Date().toLocaleTimeString(),
      };

      setMessages((prev) => [...prev, questionMessage]);
    } catch (error) {
      console.error("Error getting question:", error);
      
      const errorMessage = {
        role: "assistant",
        content: "I apologize, but I'm having trouble generating a question. Please try again.",
        time: new Date().toLocaleTimeString(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const evaluateAnswers = async () => {
    setIsLoading(true);
    
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        const errorMessage = {
          role: "assistant",
          content: "Authentication error. Please sign in again.",
          time: new Date().toLocaleTimeString(),
        };
        setMessages((prev) => [...prev, errorMessage]);
        setIsLoading(false);
        return;
      }

      const sessionId = localStorage.getItem('sessionId');
      
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/conversation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user.id,
        },
        body: JSON.stringify({
          message: "Evaluate my interview",
          sessionId: sessionId,
          action: "evaluate",
          difficulty: difficulty,
          answers: answers,
          userId: user.id,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get evaluation");
      }

      const data = await response.json();

      // Show evaluation modal instead of message
      if (data.success && data.evaluation) {
        setEvaluationData(data.evaluation);
        setShowEvaluation(true);
      } else {
        // Fallback to message if format is different
        const evaluationMessage = {
          role: "assistant",
          content: `Interview Complete! Here's your evaluation:\n\n${data.evaluation || JSON.stringify(data)}`,
          time: new Date().toLocaleTimeString(),
        };
        setMessages((prev) => [...prev, evaluationMessage]);
      }
      
    } catch (error) {
      console.error("Error getting evaluation:", error);
      
      const errorMessage = {
        role: "assistant",
        content: "I apologize, but I'm having trouble generating the evaluation. Please try again.",
        time: new Date().toLocaleTimeString(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseEvaluation = () => {
    setShowEvaluation(false);
    
    // Reset for new interview
    setInterviewMode(null);
    setDifficulty(null);
    setCurrentQuestion(0);
    setAnswers([]);
    
    // Offer to start again
    const restartMessage = {
      role: "assistant",
      content: "Would you like to practice again? Choose Free Practice or Structured Interview with a difficulty level.",
      time: new Date().toLocaleTimeString(),
    };
    setMessages((prev) => [...prev, restartMessage]);
  };

  const handleStartNewPractice = () => {
    setShowEvaluation(false);
    setInterviewMode(null);
    setDifficulty(null);
    setCurrentQuestion(0);
    setAnswers([]);
    
    const restartMessage = {
      role: "assistant",
      content: "Great! Let's start a new practice session. Choose your mode:",
      time: new Date().toLocaleTimeString(),
    };
    setMessages([restartMessage]);
  };
  
  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = {
      role: "user",
      content: inputValue,
      time: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    
    if (interviewMode === 'structured') {
      setAnswers(prev => [...prev, {
        question: currentQuestion,
        answer: inputValue,
      }]);
    }
    
    const currentInput = inputValue;
    setInputValue("");
    setIsLoading(true);

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        const errorMessage = {
          role: "assistant",
          content: "Please sign in to continue the interview practice.",
          time: new Date().toLocaleTimeString(),
        };
        setMessages((prev) => [...prev, errorMessage]);
        setIsLoading(false);
        setTimeout(() => {
          window.location.href = "/signin";
        }, 2000);
        return;
      }

      const sessionId = localStorage.getItem('sessionId');
      
      if (!sessionId) {
        const errorMessage = {
          role: "assistant",
          content: "Please upload your resume first from the upload page to start the interview practice.",
          time: new Date().toLocaleTimeString(),
        };
        setMessages((prev) => [...prev, errorMessage]);
        setIsLoading(false);
        return;
      }

      if (interviewMode === 'structured') {
        if (currentQuestion < 5) {
          const nextQ = currentQuestion + 1;
          setCurrentQuestion(nextQ);
          await askQuestion(difficulty, nextQ);
        } else {
          await evaluateAnswers();
        }
      } else {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/conversation`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": user.id,
          },
          body: JSON.stringify({
            message: currentInput,
            sessionId: sessionId,
            action: "chat",
            userId: user.id,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to get response");
        }

        const data = await response.json();

        const assistantMessage = {
          role: "assistant",
          content: data.answer || data.question || data.message || "I apologize, but I couldn't generate a response.",
          time: new Date().toLocaleTimeString(),
        };

        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      
      const errorMessage = {
        role: "assistant",
        content: "I apologize, but I'm having trouble connecting to the server. Please try again.",
        time: new Date().toLocaleTimeString(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const bestPractices = [
    "Use the STAR method (Situation, Task, Action, Result)",
    "Provide specific examples with measurable outcomes",
    "Be concise but thorough in your responses",
  ];

  const focusPoints = [
    "Highlight achievements relevant to the role",
    "Show problem-solving and critical thinking",
    "Demonstrate cultural fit and enthusiasm",
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header showNavigation backToMainUrl="/upload" />

      {showEvaluation && (
        <InterviewEvaluationModal
          evaluation={evaluationData}
          onClose={handleCloseEvaluation}
          onStartNew={handleStartNewPractice}
        />
      )}

      <main className="container mx-auto px-6 py-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 text-center">
            <h1 className="mb-2 text-3xl font-light text-foreground">
              AI Interview Practice
            </h1>
            <p className="text-sm text-muted-foreground">
              {interviewMode === 'structured' 
                ? `${difficulty?.toUpperCase()} Difficulty - Question ${currentQuestion}/5`
                : "Practice with personalized questions based on your resume"}
            </p>
          </div>

          {!interviewMode && messages.length > 0 && (
            <div className="mb-6 flex flex-wrap justify-center gap-3">
              <Button
                onClick={startFreePractice}
                variant="outline"
                className="px-6"
              >
                Free Practice
              </Button>
              <Button
                onClick={() => startStructuredInterview('easy')}
                className="bg-green-600 px-6 hover:bg-green-700"
              >
                Easy Interview
              </Button>
              <Button
                onClick={() => startStructuredInterview('medium')}
                className="bg-yellow-600 px-6 hover:bg-yellow-700"
              >
                Medium Interview
              </Button>
              <Button
                onClick={() => startStructuredInterview('hard')}
                className="bg-red-600 px-6 hover:bg-red-700"
              >
                Hard Interview
              </Button>
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Card className="shadow-md">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-success/10">
                      <div className="mr-1.5 h-2 w-2 rounded-full bg-success" />
                      {interviewMode === 'structured' ? 'Structured Interview' : interviewMode === 'practice' ? 'Free Practice' : 'AI Interview Assistant'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-4 space-y-4 overflow-y-auto" style={{ minHeight: "400px", maxHeight: "500px" }}>
                    {messages.map((message, index) => (
                      <div
                        key={index}
                        className={`flex ${
                          message.role === "assistant" ? "justify-start" : "justify-end"
                        }`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg p-4 ${
                            message.role === "assistant"
                              ? "bg-muted text-foreground"
                              : "bg-primary text-primary-foreground"
                          }`}
                        >
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                          <p className="mt-2 text-xs opacity-70">{message.time}</p>
                        </div>
                      </div>
                    ))}
                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="max-w-[80%] rounded-lg bg-muted p-4">
                          <div className="flex gap-1">
                            <div className="h-2 w-2 animate-bounce rounded-full bg-foreground/60" style={{ animationDelay: "0ms" }} />
                            <div className="h-2 w-2 animate-bounce rounded-full bg-foreground/60" style={{ animationDelay: "150ms" }} />
                            <div className="h-2 w-2 animate-bounce rounded-full bg-foreground/60" style={{ animationDelay: "300ms" }} />
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  <div className="flex gap-2">
                    <Input
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder={interviewMode ? "Type your answer here..." : "Choose a mode to start..."}
                      className="flex-1 bg-input"
                      disabled={isLoading || !interviewMode}
                    />
                    <Button 
                      size="icon" 
                      onClick={sendMessage}
                      disabled={isLoading || !inputValue.trim() || !interviewMode}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {interviewMode ? "Press Enter to send, or use the Send button" : "Select a practice mode above to begin"}
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">Interview Tips</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="mb-2 text-sm font-semibold text-foreground">
                        Best Practices:
                      </h4>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        {bestPractices.map((practice, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-success">•</span>
                            <span>{practice}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="mb-2 text-sm font-semibold text-foreground">
                        What to Focus On:
                      </h4>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        {focusPoints.map((point, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-success">•</span>
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Chat;