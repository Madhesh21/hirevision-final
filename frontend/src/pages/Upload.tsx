import { useState } from "react";
import { Upload, FileText, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Header from "@/components/Header";

const UploadPage = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [jobDescription, setJobDescription] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== "application/pdf") {
        setError("Please upload a PDF file only");
        setSelectedFile(null);
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError("File size must be less than 10MB");
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
      setError(null);
    }
  };

  // const handleUpload = async () => {
  //   if (!selectedFile) {
  //     setError("Please select a PDF file");
  //     return;
  //   }

  //   setIsUploading(true);
  //   setError(null);
  //   setUploadStatus(null);

  //   try {
  //     // const formData = new FormData();
  //     // formData.append("resume", selectedFile);
  //     // formData.append("jobDescription", jobDescription);
  //     // In Upload component handleUpload function
  //     const formData = new FormData();
  //     formData.append("resume", selectedFile);
  //     formData.append("jobDescription", jobDescription);

  //     // Get user from Supabase
  //     const user = JSON.parse(localStorage.getItem("sb-user")); // Adjust key based on your setup
  //     formData.append("userId", user.id);

  //     const response = await fetch("http://localhost:3000/analyze-ats", {
  //       method: "POST",
  //       body: formData,
  //     });

  //     if (!response.ok) {
  //       throw new Error("Failed to analyze resume");
  //     }

  //     const data = await response.json();

  //     // Save data to localStorage for results page
  //     localStorage.setItem("atsResults", JSON.stringify(data));
  //     localStorage.setItem("sessionId", data.sessionId);

  //     setUploadStatus({
  //       success: true,
  //       message: `Resume analyzed successfully! ATS Score: ${data.overallScore}%`,
  //     });

  //     // Redirect to results page after 1.5 seconds
  //     setTimeout(() => {
  //       window.location.href = "/analysis";
  //     }, 1500);
  //   } catch (err) {
  //     console.error("Upload error:", err);
  //     setError(err.message || "Failed to analyze resume. Please try again.");
  //     setUploadStatus(null);
  //   } finally {
  //     setIsUploading(false);
  //   }
  // };

  const handleUpload = async () => {
  if (!selectedFile) {
    setError("Please select a PDF file");
    return;
  }

  setIsUploading(true);
  setError(null);
  setUploadStatus(null);

  try {
    // Import supabase at the top of your file first:
    // import { supabase } from "@/integrations/supabase/client";
    
    // Get current user from Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      setError("Please sign in to upload your resume");
      setIsUploading(false);
      setTimeout(() => {
        window.location.href = "/signin";
      }, 2000);
      return;
    }

    const formData = new FormData();
    formData.append("resume", selectedFile);
    formData.append("jobDescription", jobDescription);
    formData.append("userId", user.id);

    const response = await fetch("http://localhost:3000/analyze-ats", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Failed to analyze resume");
    }

    const data = await response.json();

    localStorage.setItem("atsResults", JSON.stringify(data));
    localStorage.setItem("sessionId", data.sessionId);

    setUploadStatus({
      success: true,
      message: `Resume analyzed successfully! ATS Score: ${data.overallScore}%`,
    });

    setTimeout(() => {
      window.location.href = "/analysis";
    }, 1500);
  } catch (err) {
    console.error("Upload error:", err);
    setError(err.message || "Failed to analyze resume. Please try again.");
    setUploadStatus(null);
  } finally {
    setIsUploading(false);
  }
};
  const triggerFileInput = () => {
    document.getElementById("resume").click();
  };

  return (
    <div className="min-h-screen bg-background">
      <Header showNavigation showBackToMain={false} />

      <main className="container mx-auto px-6 py-12">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8 text-center">
            <h1 className="mb-3 text-4xl font-light text-foreground">
              Analyze Your Resume
            </h1>
            <p className="text-muted-foreground">
              Upload your resume and paste a job description to get your ATS
              compatibility score and personalized feedback.
            </p>
          </div>

          {uploadStatus && (
            <div className="mb-6 rounded-lg border border-green-500/20 bg-green-500/10 p-4">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                <p className="font-medium">{uploadStatus.message}</p>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Redirecting to results...
              </p>
            </div>
          )}

          {error && (
            <div className="mb-6 rounded-lg border border-red-500/20 bg-red-500/10 p-4">
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle className="h-5 w-5" />
                <p className="font-medium">{error}</p>
              </div>
            </div>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="shadow-md">
              <CardHeader>
                <div className="mb-2 flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  <CardTitle>Upload Resume</CardTitle>
                </div>
                <CardDescription>
                  Upload your resume in PDF format
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="resume">Choose File</Label>
                    <div
                      onClick={triggerFileInput}
                      className="flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-border bg-input p-8 transition-colors hover:border-muted-foreground"
                    >
                      <div className="text-center">
                        <Upload className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                        <p className="mb-1 text-sm font-medium text-foreground">
                          {selectedFile ? selectedFile.name : "Choose File"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {selectedFile
                            ? `${(selectedFile.size / 1024).toFixed(2)} KB`
                            : "PDF files only, max 10MB"}
                        </p>
                        <input
                          id="resume"
                          type="file"
                          accept=".pdf"
                          className="hidden"
                          onChange={handleFileChange}
                          disabled={isUploading}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-md">
              <CardHeader>
                <div className="mb-2 flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  <CardTitle>Job Description</CardTitle>
                </div>
                <CardDescription>
                  Paste the job description you're targeting
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="job-description">Job Description</Label>
                  <Textarea
                    id="job-description"
                    placeholder="Paste the complete job description here..."
                    className="min-h-[200px] resize-none bg-input"
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    disabled={isUploading}
                  />
                  <p className="text-xs text-muted-foreground">
                    Optional: Leave blank for general analysis
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8 text-center">
            <Button
              size="lg"
              className="px-12"
              onClick={handleUpload}
              disabled={isUploading || !selectedFile}
            >
              {isUploading ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Analyzing...
                </>
              ) : (
                "Analyze Resume"
              )}
            </Button>
            <p className="mt-3 text-sm text-muted-foreground">
              {isUploading
                ? "Analyzing your resume with AI..."
                : "Get your ATS compatibility score and detailed feedback in seconds"}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default UploadPage;
