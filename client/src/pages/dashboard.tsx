import { useQuery } from "@tanstack/react-query";
import { fetchSummary } from "@/api/client";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCcw, Droplet, Zap } from "lucide-react";
import { ProgressBar } from "@/components/dashboard/progress-bar";
import { ProviderBreakdown } from "@/components/dashboard/provider-breakdown";
import { CalendarHeatmap } from "@/components/dashboard/calendar-heatmap";
import { WaterUsageCard } from "@/components/dashboard/water-usage-card";
import { CO2EmissionsCard } from "@/components/dashboard/co2-emissions-card";
import { PerspectiveCard } from "@/components/dashboard/perspective-card";

export default function Dashboard() {
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  
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
                  {(error as Error).message}. Ensure you are logged in and the backend is reachable.
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
            {/* Unified Usage Card */}
            <Card className="lg:col-span-2 shadow-sm border-slate-200 overflow-hidden flex flex-col">
              <CardHeader className="pb-4 border-b border-slate-100 z-10 bg-white">
                <CardTitle className="text-xl flex items-center gap-2">
                  Today's Usage
                  <span className="text-xs font-medium bg-blue-50/80 backdrop-blur text-blue-700 px-2.5 py-1 rounded-full ml-auto">
                    Mode: <span className="capitalize">{data.estimationMode}</span>
                  </span>
                </CardTitle>
                <CardDescription>
                  {data.totalCO2 != null || data.equivalence != null
                    ? "All-time totals from your connected accounts"
                    : "Real-time estimation based on prompt size"}
                </CardDescription>
                
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-4 pt-4 border-t border-slate-50">
                  <div className="flex items-center gap-1.5 text-sm font-medium text-slate-700 bg-amber-50 px-2.5 py-1 rounded-md">
                    <Zap size={16} className="text-amber-500" />
                    <span>{data.today.tokens.toLocaleString()} tokens processed</span>
                  </div>
                  {data.equivalence && (
                    <div className="flex items-center gap-1.5 text-sm text-slate-600 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100/50">
                      <span>{data.equivalence}</span>
                    </div>
                  )}
                </div>
              </CardHeader>
              
              <div className="flex flex-col md:flex-row p-6 gap-6 bg-slate-50 flex-grow">
                {/* Left Side: Water Card */}
                <div className="flex-1">
                  <WaterUsageCard 
                    ml={data.today.ml} 
                    limitMl={data.dailyLimitMl} 
                  />
                  {data.today.ml >= data.dailyLimitMl && (
                    <div className="mt-4 p-3 bg-red-50/90 backdrop-blur text-red-800 text-sm rounded-xl flex items-start gap-2 border border-red-100 shadow-sm">
                      <AlertCircle size={16} className="mt-0.5 flex-shrink-0 text-red-600" />
                      <p className="font-medium"><strong>Warning:</strong> Exceeded daily water limit of {data.dailyLimitMl} mL.</p>
                    </div>
                  )}
                </div>

                {/* Right Side: CO2 Card */}
                <div className="flex-1">
                  <CO2EmissionsCard 
                    co2Grams={data.today.tokens * 0.05} // Example mapping: 0.05g per token
                    co2Limit={data.dailyLimitMl * 0.05} // Use same relative scale
                  />
                </div>
              </div>
            </Card>

            {/* Perspective Card (Full Width underneath Usage, above Heatmap) */}
            <div className="lg:col-span-3">
              <PerspectiveCard 
                waterLiters={data.today.ml / 1000} // Convert mL to Liters
                milesDrivenString={data.equivalence}
              />
            </div>

            {/* By Provider Card */}
            <Card className="shadow-sm border-slate-200">
              <CardHeader>
                <CardTitle className="text-lg">Tokens by AI Model</CardTitle>
                <CardDescription>Breakdown of tokens processed per AI provider</CardDescription>
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