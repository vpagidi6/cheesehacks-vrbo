import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Droplets } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignup, setIsSignup] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { user, loading: authLoading, login, signup } = useAuth();

  useEffect(() => {
    if (!authLoading && user) {
      setLocation("/dashboard");
    }
  }, [authLoading, user, setLocation]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-pulse text-slate-500">Loading…</div>
      </div>
    );
  }

  if (user) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password) {
      setError("Email and password required");
      return;
    }
    setLoading(true);
    try {
      if (isSignup) {
        await signup(email.trim(), password);
      } else {
        await login(email.trim(), password);
      }
      setLocation("/dashboard");
    } catch (err: unknown) {
      const code = err && typeof err === "object" && "code" in err ? (err as { code: string }).code : "";
      const msg =
        code === "auth/invalid-credential" || code === "auth/user-not-found"
          ? "Invalid email or password"
          : code === "auth/email-already-in-use"
            ? "Email already registered"
            : code === "auth/operation-not-allowed"
              ? "Enable Email/Password in Firebase Console → Authentication."
              : err instanceof Error
                ? err.message
                : "Login failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans">
      <Card className="w-full max-w-md shadow-xl border-slate-200">
        <CardHeader className="text-center pb-8 pt-8">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-6 text-blue-600 shadow-sm">
            <Droplets size={32} />
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight text-slate-900">
            WaterWise AI
          </CardTitle>
          <CardDescription className="text-base mt-2">
            Monitor the environmental impact of your AI usage
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2 text-left">
              <label
                htmlFor="email"
                className="text-sm font-medium text-slate-700"
              >
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 bg-white text-base shadow-sm"
                data-testid="input-email"
                autoComplete="email"
              />
            </div>
            <div className="space-y-2 text-left">
              <label
                htmlFor="password"
                className="text-sm font-medium text-slate-700"
              >
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12 bg-white text-base shadow-sm"
                data-testid="input-password"
                autoComplete={isSignup ? "new-password" : "current-password"}
              />
            </div>
            {error && (
              <p className="text-sm text-red-600" role="alert">
                {error}
              </p>
            )}
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 text-base font-medium shadow-md bg-blue-600 hover:bg-blue-700 text-white"
              data-testid="button-submit"
            >
              {loading ? "Please wait…" : isSignup ? "Create account" : "Sign in"}
            </Button>
            <div className="text-center text-sm text-slate-600">
              {isSignup ? (
                <>
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignup(false);
                      setError("");
                    }}
                    className="text-blue-600 hover:underline font-medium"
                  >
                    Sign in
                  </button>
                </>
              ) : (
                <>
                  No account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignup(true);
                      setError("");
                    }}
                    className="text-blue-600 hover:underline font-medium"
                  >
                    Create one
                  </button>
                </>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
