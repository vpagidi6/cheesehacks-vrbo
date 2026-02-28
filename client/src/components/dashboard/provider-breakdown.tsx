import { Bot, Sparkles, BrainCircuit } from "lucide-react";

export function ProviderBreakdown({ byProvider }: { byProvider: { chatgpt: number; claude: number; gemini: number } }) {
  const total = byProvider.chatgpt + byProvider.claude + byProvider.gemini;
  
  const getPercent = (val: number) => total > 0 ? Math.round((val / total) * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 transition-colors hover:border-slate-200">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-green-100 text-green-600 rounded-lg">
            <Bot size={20} />
          </div>
          <div>
            <div className="font-medium text-slate-900">ChatGPT</div>
            <div className="text-xs text-slate-500">{getPercent(byProvider.chatgpt)}% of total</div>
          </div>
        </div>
        <div className="text-right">
          <span className="font-bold text-slate-900">{byProvider.chatgpt.toLocaleString()}</span>
          <span className="text-sm text-slate-500 ml-1">mL</span>
        </div>
      </div>
      
      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 transition-colors hover:border-slate-200">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-orange-100 text-orange-600 rounded-lg">
            <Sparkles size={20} />
          </div>
          <div>
            <div className="font-medium text-slate-900">Claude</div>
            <div className="text-xs text-slate-500">{getPercent(byProvider.claude)}% of total</div>
          </div>
        </div>
        <div className="text-right">
          <span className="font-bold text-slate-900">{byProvider.claude.toLocaleString()}</span>
          <span className="text-sm text-slate-500 ml-1">mL</span>
        </div>
      </div>
      
      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 transition-colors hover:border-slate-200">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-100 text-blue-600 rounded-lg">
            <BrainCircuit size={20} />
          </div>
          <div>
            <div className="font-medium text-slate-900">Gemini</div>
            <div className="text-xs text-slate-500">{getPercent(byProvider.gemini)}% of total</div>
          </div>
        </div>
        <div className="text-right">
          <span className="font-bold text-slate-900">{byProvider.gemini.toLocaleString()}</span>
          <span className="text-sm text-slate-500 ml-1">mL</span>
        </div>
      </div>
    </div>
  );
}