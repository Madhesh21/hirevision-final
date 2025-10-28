import { Link } from "react-router-dom";
import { FileText, MessageSquare, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Header from "@/components/Header";

const Landing = () => {
  const features = [
    {
      icon: FileText,
      title: "ATS Score Analysis",
      description: "Get detailed feedback on how well your resume matches job descriptions and ATS requirements.",
    },
    {
      icon: MessageSquare,
      title: "AI Interview Practice",
      description: "Practice with personalized interview questions generated from your resume and target roles.",
    },
    {
      icon: BarChart3,
      title: "Performance Insights",
      description: "Track your improvement with detailed analytics and receive personalized recommendations.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-6 py-16">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="mb-6 text-5xl font-light tracking-tight text-foreground">
            Hire<span className="font-semibold">Vision</span>
          </h1>
          <p className="mb-12 text-lg text-muted-foreground">
            Optimize your resume for ATS systems and practice personalized interviews powered by AI to land your dream job.
          </p>

          <div className="mb-16 grid gap-6 md:grid-cols-3">
            {features.map((feature) => (
              <Card key={feature.title} className="border shadow-sm transition-shadow hover:shadow-md">
                <CardContent className="p-6">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-secondary">
                    <feature.icon className="h-6 w-6 text-foreground" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-foreground">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex flex-col items-center gap-4">
            <Button size="lg" className="px-8" asChild>
              <Link to="/signup">Start Optimizing Your Resume</Link>
            </Button>
            <p className="text-sm text-muted-foreground">
              Free to get started. No credit card required.
            </p>
          </div>
        </div>
      </main>

      <footer className="container mx-auto border-t border-border px-6 py-8">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <p>© 2024 HireVision. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-foreground">Privacy</a>
            <a href="#" className="hover:text-foreground">Terms</a>
            <a href="#" className="hover:text-foreground">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
