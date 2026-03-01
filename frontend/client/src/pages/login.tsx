import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { getUser, setUser } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Droplets } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (getUser()) {
      setLocation("/dashboard");
    }
  }, [setLocation]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setUser(email.trim());
      setLocation("/dashboard");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans">
      <Card className="w-full max-w-md shadow-xl border-slate-200">
        <CardHeader className="text-center pb-8 pt-8">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-6 text-blue-600 shadow-sm">
            <Droplets size={32} />
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight text-slate-900">WaterWise AI</CardTitle>
          <CardDescription className="text-base mt-2">
            Monitor the environmental impact of your AI usage
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2 text-left">
              <label htmlFor="email" className="text-sm font-medium text-slate-700">Email Address</label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 bg-white text-base shadow-sm"
                data-testid="input-email"
              />
            </div>
            <Button type="submit" className="w-full h-12 text-base font-medium shadow-md bg-blue-600 hover:bg-blue-700 text-white" data-testid="button-submit">
              Continue to Dashboard
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}