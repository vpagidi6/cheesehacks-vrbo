import { useQuery } from "@tanstack/react-query";
import { fetchSummary } from "@/api/client";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCcw, Droplet, Zap } from "lucide-react";
import { ProgressBar } from "@/components/dashboard/progress-bar";
import { ProviderBreakdown } from "@/components/dashboard/provider-breakdown";
import { CalendarHeatmap } from "@/components/dashboard/calendar-heatmap";

export default function Dashboard() {
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['summary', currentMonth],
    queryFn: () => fetchSummary(currentMonth),
    retry: false
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h1>
          <p className="text-slate-500 mt-1">Overview of your AI water consumption for {currentMonth}</p>
        </div>

        {isLoading && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="h-64 bg-slate-200 animate-pulse rounded-xl md:col-span-2 lg:col-span-3"></div>
          </div>
        )}

        {isError && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
                <AlertCircle size={24} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-red-900">Failed to load data</h3>
                <p className="text-sm text-red-600 mt-1 max-w-md mx-auto">
                  {(error as Error).message}. Ensure your FastAPI backend is running and reachable at the configured VITE_API_BASE.
                </p>
              </div>
              <Button onClick={() => refetch()} variant="outline" className="bg-white hover:bg-slate-50">
                <RefreshCcw size={16} className="mr-2" />
                Retry Connection
              </Button>
            </CardContent>
          </Card>
        )}

        {data && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Today Card */}
            <Card className="lg:col-span-2 shadow-sm border-slate-200 relative overflow-hidden">
              {/* Water tank fill effect */}
              <div 
                className={`absolute bottom-0 left-0 right-0 w-full transition-all duration-1000 ease-in-out z-0 opacity-15 ${data.today.ml >= data.dailyLimitMl ? 'bg-red-500' : 'bg-blue-500'}`}
                style={{ height: `${Math.min(100, Math.max(0, (data.today.ml / data.dailyLimitMl) * 100))}%` }}
              >
                {/* Subtle top edge for the water */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-b from-black/5 to-transparent" />
              </div>
              
              <div className="relative z-10">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl flex items-center gap-2">
                    Today's Usage
                    <span className="text-xs font-medium bg-blue-50/80 backdrop-blur text-blue-700 px-2.5 py-1 rounded-full ml-auto">
                      Mode: <span className="capitalize">{data.estimationMode}</span>
                    </span>
                  </CardTitle>
                  <CardDescription>
                    Real-time estimation based on prompt size
                    <span className="ml-2 font-medium text-slate-700">({Math.round((data.today.ml / data.dailyLimitMl) * 100)}% of limit)</span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-2 gap-6 mb-8">
                    <div className="flex items-start space-x-4">
                      <div className="p-3 bg-white/60 backdrop-blur text-blue-600 rounded-xl shadow-sm border border-slate-100/50">
                        <Droplet size={28} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-600 uppercase tracking-wider">Water Consumed</p>
                        <h4 className="text-4xl font-bold tracking-tight text-slate-900 mt-1">
                          {data.today.ml.toLocaleString()}
                          <span className="text-lg font-medium text-slate-500 ml-1">/ {data.dailyLimitMl.toLocaleString()} mL</span>
                        </h4>
                      </div>
                    </div>
                    <div className="flex items-start space-x-4">
                      <div className="p-3 bg-white/60 backdrop-blur text-amber-500 rounded-xl shadow-sm border border-slate-100/50">
                        <Zap size={28} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-600 uppercase tracking-wider">Tokens Processed</p>
                        <h4 className="text-4xl font-bold tracking-tight text-slate-900 mt-1">
                          {data.today.tokens.toLocaleString()}
                        </h4>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {data.today.ml >= data.dailyLimitMl && (
                      <div className="p-4 bg-red-50/90 backdrop-blur text-red-800 text-sm rounded-xl flex items-start gap-3 border border-red-100 shadow-sm animate-in slide-in-from-bottom-2">
                        <AlertCircle size={18} className="mt-0.5 flex-shrink-0 text-red-600" />
                        <p className="font-medium"><strong>Warning:</strong> You have exceeded your daily water limit of {data.dailyLimitMl} mL. Consider optimizing your prompts.</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </div>
            </Card>

            {/* By Provider Card */}
            <Card className="shadow-sm border-slate-200">
              <CardHeader>
                <CardTitle className="text-lg">Monthly By Provider</CardTitle>
                <CardDescription>Water volume per AI model</CardDescription>
              </CardHeader>
              <CardContent>
                <ProviderBreakdown byProvider={data.byProvider} />
              </CardContent>
            </Card>

            {/* Monthly Calendar Card */}
            <Card className="md:col-span-2 lg:col-span-3 shadow-sm border-slate-200">
              <CardHeader>
                <CardTitle className="text-xl">Monthly Heatmap</CardTitle>
                <CardDescription>Daily water footprint across the month</CardDescription>
              </CardHeader>
              <CardContent>
                <CalendarHeatmap month={currentMonth} days={data.monthDays} />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AppLayout>
  );
}