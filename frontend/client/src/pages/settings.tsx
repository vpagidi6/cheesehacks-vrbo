import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { fetchSummary, saveSettings } from "@/api/client";
import { EstimationMode } from "@/api/types";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { Save, Loader2 } from "lucide-react";

export default function Settings() {
  const { toast } = useToast();
  const currentMonth = new Date().toISOString().slice(0, 7);
  
  const [dailyLimitMl, setDailyLimitMl] = useState<number>(500);
  const [estimationMode, setEstimationMode] = useState<EstimationMode>("conservative");

  const { data, isLoading } = useQuery({
    queryKey: ['summary', currentMonth],
    queryFn: () => fetchSummary(currentMonth),
    retry: false
  });

  useEffect(() => {
    if (data) {
      setDailyLimitMl(data.dailyLimitMl);
      setEstimationMode(data.estimationMode);
    }
  }, [data]);

  const mutation = useMutation({
    mutationFn: () => saveSettings(dailyLimitMl, estimationMode),
    onSuccess: () => {
      toast({
        title: "Settings Saved",
        description: "Your preferences have been successfully updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error Saving Settings",
        description: (error as Error).message + " (Make sure your backend is running!)",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate();
  };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Settings</h1>
          <p className="text-slate-500 mt-1">Configure your usage goals and estimation model</p>
        </div>

        {isLoading ? (
          <div className="h-64 bg-slate-200 animate-pulse rounded-xl"></div>
        ) : (
          <form onSubmit={handleSubmit}>
            <Card className="shadow-sm border-slate-200 overflow-hidden">
              <CardHeader className="bg-white">
                <CardTitle>Preferences</CardTitle>
                <CardDescription>These settings apply to all your future usage estimates.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8 p-6 bg-white border-t border-slate-100">
                <div className="space-y-3">
                  <Label htmlFor="dailyLimit" className="text-base font-semibold text-slate-900">Daily Limit (mL)</Label>
                  <p className="text-sm text-slate-500 mb-2">
                    Set a goal for your maximum daily water footprint. We'll warn you if you exceed it.
                  </p>
                  <div className="relative max-w-xs">
                    <Input 
                      id="dailyLimit" 
                      type="number" 
                      min={1}
                      value={dailyLimitMl}
                      onChange={(e) => setDailyLimitMl(Number(e.target.value))}
                      className="h-12 text-lg pl-4 pr-12 shadow-sm"
                      required
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">
                      mL
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="text-base font-semibold text-slate-900">Estimation Mode</Label>
                  <p className="text-sm text-slate-500">
                    Different models have varying water usage. Select how conservative you want the estimates to be.
                  </p>
                  <RadioGroup 
                    value={estimationMode} 
                    onValueChange={(val) => setEstimationMode(val as EstimationMode)}
                    className="gap-4 mt-4"
                  >
                    <div className={`flex items-start space-x-3 p-4 rounded-xl border transition-all cursor-pointer ${estimationMode === 'low' ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500 ring-opacity-50' : 'border-slate-200 bg-white hover:border-blue-300'}`} onClick={() => setEstimationMode("low")}>
                      <RadioGroupItem value="low" id="low" className="mt-1" />
                      <div>
                        <Label htmlFor="low" className="font-semibold text-slate-900 cursor-pointer">Low</Label>
                        <p className="text-sm text-slate-500 mt-1">Optimistic estimates assuming highly efficient data centers using recycled water.</p>
                      </div>
                    </div>
                    <div className={`flex items-start space-x-3 p-4 rounded-xl border transition-all cursor-pointer ${estimationMode === 'conservative' ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500 ring-opacity-50' : 'border-slate-200 bg-white hover:border-blue-300'}`} onClick={() => setEstimationMode("conservative")}>
                      <RadioGroupItem value="conservative" id="conservative" className="mt-1" />
                      <div>
                        <Label htmlFor="conservative" className="font-semibold text-slate-900 cursor-pointer">Conservative (Recommended)</Label>
                        <p className="text-sm text-slate-500 mt-1">Balanced estimates based on average industry reports for server cooling.</p>
                      </div>
                    </div>
                    <div className={`flex items-start space-x-3 p-4 rounded-xl border transition-all cursor-pointer ${estimationMode === 'range' ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500 ring-opacity-50' : 'border-slate-200 bg-white hover:border-blue-300'}`} onClick={() => setEstimationMode("range")}>
                      <RadioGroupItem value="range" id="range" className="mt-1" />
                      <div>
                        <Label htmlFor="range" className="font-semibold text-slate-900 cursor-pointer">High Range</Label>
                        <p className="text-sm text-slate-500 mt-1">Pessimistic estimates highlighting worst-case scenarios for hot climates.</p>
                      </div>
                    </div>
                  </RadioGroup>
                </div>
              </CardContent>
              <CardFooter className="bg-slate-50 border-t border-slate-200 py-4 flex justify-end">
                <Button type="submit" disabled={mutation.isPending} className="h-11 px-8 bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
                  {mutation.isPending ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                  ) : (
                    <><Save className="mr-2 h-4 w-4" /> Save Changes</>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </form>
        )}
      </div>
    </AppLayout>
  );
}