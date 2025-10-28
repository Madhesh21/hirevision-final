import { useState, useEffect } from "react";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/Header";

const Analysis = () => {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get results from localStorage
    const savedResults = localStorage.getItem("atsResults");
    
    if (savedResults) {
      try {
        const data = JSON.parse(savedResults);
        setResults(data);
      } catch (error) {
        console.error("Error parsing results:", error);
      }
    }
    
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Loading results...</p>
        </div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="min-h-screen bg-background">
        <Header showNavigation showBackToMain={false} />
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            <AlertCircle className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h2 className="mb-2 text-2xl font-semibold text-foreground">No Results Found</h2>
            <p className="mb-6 text-muted-foreground">
              Please upload a resume first to see your ATS analysis
            </p>
            <Button onClick={() => (window.location.href = "/upload")}>
              Upload Resume
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const { overallScore, matchingKeywords, missingKeywords, recommendations } = results;

  const getScoreColor = (score) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreLabel = (score) => {
    if (score >= 80) return "Excellent ATS compatibility";
    if (score >= 60) return "Good ATS compatibility";
    return "Needs improvement";
  };

  const getProgressColor = (score) => {
    if (score >= 80) return "bg-green-600";
    if (score >= 60) return "bg-yellow-600";
    return "bg-red-600";
  };

  const getImpactColor = (impact) => {
    if (impact === "High") return "bg-red-100 text-red-800 border-red-200";
    if (impact === "Medium") return "bg-yellow-100 text-yellow-800 border-yellow-200";
    return "bg-blue-100 text-blue-800 border-blue-200";
  };

  return (
    <div className="min-h-screen bg-background">
      <Header showNavigation showBackToMain={true} />

      <main className="container mx-auto px-6 py-12">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8 text-center">
            <h1 className="mb-3 text-4xl font-light text-foreground">
              ATS Analysis Results
            </h1>
            <p className="text-muted-foreground">
              Here's how your resume performs against the job description
            </p>
          </div>

          {/* Overall Score Card */}
          <Card className="mb-8 shadow-md">
            <CardContent className="p-8">
              <div className="text-center">
                <p className="mb-4 text-sm font-medium text-muted-foreground">
                  Overall ATS Score
                </p>
                <div className={`mb-4 text-6xl font-light ${getScoreColor(overallScore)}`}>
                  {overallScore}%
                </div>
                <div className="mx-auto mb-4 h-2 w-full max-w-md overflow-hidden rounded-full bg-gray-200">
                  <div
                    className={`h-full transition-all duration-1000 ${getProgressColor(overallScore)}`}
                    style={{ width: `${overallScore}%` }}
                  />
                </div>
                <p className={`text-sm font-medium ${getScoreColor(overallScore)}`}>
                  {getScoreLabel(overallScore)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Keywords Section */}
          <div className="mb-8 grid gap-6 md:grid-cols-2">
            <Card className="shadow-md">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <CardTitle>Matching Keywords</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex flex-wrap gap-2">
                  {matchingKeywords && matchingKeywords.length > 0 ? (
                    matchingKeywords.map((keyword, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="bg-green-100 text-green-800"
                      >
                        {keyword}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No matching keywords found</p>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {matchingKeywords?.length || 0} keywords found in your resume
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-md">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                  <CardTitle>Missing Keywords</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex flex-wrap gap-2">
                  {missingKeywords && missingKeywords.length > 0 ? (
                    missingKeywords.map((keyword, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="bg-yellow-100 text-yellow-800"
                      >
                        {keyword}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No missing keywords</p>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  Consider adding these keywords to improve your score
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recommendations Section */}
          <Card className="mb-8 shadow-md">
            <CardHeader>
              <CardTitle>Recommendations for Improvement</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recommendations && recommendations.length > 0 ? (
                  recommendations.map((rec, index) => (
                    <div
                      key={index}
                      className="flex items-start justify-between gap-4 rounded-lg border border-border p-4"
                    >
                      <div className="flex-1">
                        <h4 className="mb-1 font-semibold text-foreground">
                          {rec.category}
                        </h4>
                        <p className="text-sm text-muted-foreground">{rec.suggestion}</p>
                      </div>
                      <Badge
                        variant="outline"
                        className={getImpactColor(rec.impact)}
                      >
                        {rec.impact} Impact
                      </Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No recommendations available</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-wrap justify-center gap-4">
            <Button
              variant="outline"
              size="lg"
              onClick={() => {
                localStorage.removeItem("atsResults");
                window.location.href = "/upload";
              }}
            >
              Analyze Another Resume
            </Button>
            <Button
              size="lg"
              onClick={() => {
                window.location.href = "/chat";
              }}
            >
              Start AI Interview Practice
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Analysis;