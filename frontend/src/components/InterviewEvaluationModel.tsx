import { X, TrendingUp, AlertCircle, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
          {/* Header */}
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
              {evaluation.answers?.map((answer, index) => (
                <Card key={index} className="border">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${getScoreBgColor(0)}`}>
                          <span className="text-red-600 font-semibold">0</span>
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

                        <Badge variant="destructive" className="text-xs">
                          Score: {getQuestionScore(answer.score)}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Performance Analysis */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4">Performance Analysis</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {/* Strengths */}
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

              {/* Areas for Improvement */}
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

// Demo component with sample data
const EvaluationDemo = () => {
  const sampleEvaluation = {
    overallScore: 5,
    answers: [
      {
        question: "Can you tell me about yourself and your background?",
        userAnswer: "idk",
        feedback: "Providing 'idk' (I don't know) demonstrates a complete lack of preparedness and effort. It indicates the candidate did not even attempt to understand or address the question. This is highly detrimental.",
        score: "0/10"
      },
      {
        question: "Can you walk me through a specific project you worked on that you're particularly proud of?",
        userAnswer: "skip",
        feedback: "Answering 'skip' is marginally better than 'idk' as it acknowledges the question, but it still provides absolutely no useful information. It shows a lack of willingness to engage with the interview process.",
        score: "0/10"
      },
      {
        question: "How do you handle challenging situations or tight deadlines in your work?",
        userAnswer: "skip",
        feedback: "Same as above. Unacceptable. The interviewer is looking for examples of adaptability and learning capacity, but the candidate has provided none.",
        score: "0/10"
      },
      {
        question: "What are your technical strengths and how have you applied them in your projects?",
        userAnswer: "skip",
        feedback: "Same as above. Unacceptable. The interviewer is looking for specific technical skills and examples, but the candidate has provided none.",
        score: "0/10"
      },
      {
        question: "What interests you most about this role, and how do you see your skills contributing to our team?",
        userAnswer: "skip",
        feedback: "Same as above. Unacceptable. This is a critical question about motivation and fit, and the lack of response suggests disinterest in the position.",
        score: "0/10"
      }
    ],
    strengths: [
      "Based on the resume, the candidate potentially has some relevant experience (Placement Coordinator, Web Developer Intern) and skills (PHP, Development)",
      "The CGPA of 8.7/10 is positive and demonstrates academic achievement",
      "The project description sounds promising and demonstrates initiative",
      "In theory, the candidate could have strengths in communication (Placement Coordinator) and problem-solving (PHP project)"
    ],
    areasForImprovement: [
      "Interview Preparation: The candidate needs to thoroughly prepare for interviews. This includes researching the company, understanding common interview questions, and practicing answers",
      "Communication Skills: 'idk' and 'skip' are unacceptable answers. The candidate needs to learn how to articulate their thoughts, even if they don't know the perfect answer",
      "Technical Knowledge: The candidate needs to demonstrate a solid understanding of the technologies listed on their resume (e.g., PHP, web development concepts)",
      "Attitude and Professionalism: The candidate's response demonstrates a lack of seriousness and respect for the interview process. They need to display a positive attitude and enthusiasm",
      "Self-Awareness: The candidate should be able to clearly articulate their skills, experiences, and career goals. They need to reflect on their strengths and weaknesses"
    ],
    recommendation: "Based on this interview performance, the candidate is not ready for employment. They demonstrated a complete lack of preparation, engagement, and professionalism. Before pursuing further opportunities, they should focus on developing their communication skills, preparing thoroughly for interviews, and demonstrating genuine interest in the positions they apply for."
  };

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <InterviewEvaluationModal
        evaluation={sampleEvaluation}
        onClose={() => console.log("Close modal")}
        onStartNew={() => console.log("Start new practice")}
      />
    </div>
  );
};

export default EvaluationDemo;