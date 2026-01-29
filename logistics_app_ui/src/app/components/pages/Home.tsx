import { Truck, Clock, AlertTriangle, Database, CheckCircle, AlertCircle, XCircle, TrendingUp } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import KPICard from '@/app/components/ui/KPICard';
import { VoiceAssistant } from '@/app/components/ui/VoiceAssistant';
import { KPICardSkeleton, ChartSkeleton, RegionalCardSkeleton } from '@/app/components/ui/LoadingSkeleton';
import * as api from '@/app/services/api';

interface GenieResponse {
  summary: string;
  table?: {
    columns: string[];
    rows: Array<Array<string | null>>;
  };
  error?: string;
}

export default function Home() {
  // Use React Query for data fetching with caching
  const { data: overviewData, isLoading, error } = useQuery({
    queryKey: ['overview'],
    queryFn: api.getOverviewData,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  const kpis = overviewData?.kpis || null;
  const throughputData = overviewData?.throughput || [];
  const regionalData = overviewData?.regional || [];

  // Add delay before showing "no data" warning to prevent flash
  const [showDataWarning, setShowDataWarning] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Minimum display time for skeletons (500ms) to prevent flashing
    if (!isLoading && overviewData) {
      const timer = setTimeout(() => {
        setShowContent(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isLoading, overviewData]);

  useEffect(() => {
    // Delay showing warning by 1 second to prevent flash on fast loads
    if (!isLoading && kpis) {
      const hasData = kpis.network_throughput > 0 || 
                      kpis.late_arrivals > 0 || 
                      throughputData.length > 0 || 
                      regionalData.length > 0;
      
      if (!hasData) {
        const timer = setTimeout(() => {
          setShowDataWarning(true);
        }, 1000);
        return () => clearTimeout(timer);
      } else {
        setShowDataWarning(false);
      }
      
      setIsInitialLoad(false);
    }
  }, [isLoading, kpis, throughputData, regionalData]);
  
  // Voice interface state
  const [inputState, setInputState] = useState<"idle" | "listening" | "processing" | "responded">("idle");
  const [aiQuestion, setAiQuestion] = useState<string | null>(null);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [aiTable, setAiTable] = useState<{columns: string[]; rows: Array<Array<string | null>>} | null>(null);
  const [voiceDraft, setVoiceDraft] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const voiceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Voice interface handlers
  const handleQuerySubmit = async (query: string) => {
    setInputState("processing");
    setAiQuestion(query);
    setAiResponse(null);
    setAiTable(null);
    setVoiceDraft(null);

    try {
      const response = await fetch("/api/genie/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: query }),
      });

      const payload = (await response.json()) as GenieResponse;
      if (!response.ok) {
        throw new Error(payload.error || "Unable to reach Genie AI.");
      }

      setAiResponse(payload.summary || "No summary returned from Genie.");
      setAiTable(payload.table || null);
      setInputState("responded");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      setAiResponse(`Genie AI request failed: ${message}`);
      setAiTable(null);
      setInputState("responded");
    }
  };

  const handleReset = () => {
    // Stop any ongoing speech
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    
    // Clear AI response
    setAiResponse(null);
    setAiTable(null);
    setAiQuestion(null);
    setInputState("idle");
  };

  const handleVoiceInput = () => {
    const SpeechRecognitionImpl =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionImpl) {
      setAiResponse("Voice input isn't supported in this browser. Please use Chrome or Edge.");
      setInputState("responded");
      return;
    }

    const recognition = new SpeechRecognitionImpl();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.maxAlternatives = 3;

    let finalTranscript = "";

    recognition.onresult = (event) => {
      let interimTranscript = "";
      
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + " ";
        } else {
          interimTranscript += transcript;
        }
      }

      const currentTranscript = (finalTranscript + interimTranscript).trim();
      if (currentTranscript) {
        setVoiceDraft(currentTranscript);
        
        // Clear existing timeout
        if (voiceTimeoutRef.current) {
          clearTimeout(voiceTimeoutRef.current);
        }
        
        // Set new timeout: stop after 2 seconds of silence
        voiceTimeoutRef.current = setTimeout(() => {
          if (recognitionRef.current) {
            recognitionRef.current.stop();
            setInputState("idle");
          }
        }, 2000);
      }
    };

    recognition.onerror = () => {
      setInputState("idle");
      if (voiceTimeoutRef.current) {
        clearTimeout(voiceTimeoutRef.current);
      }
    };

    recognition.onend = () => {
      setInputState((prev) => (prev === "listening" ? "idle" : prev));
      if (voiceTimeoutRef.current) {
        clearTimeout(voiceTimeoutRef.current);
      }
    };

    recognitionRef.current?.stop();
    recognitionRef.current = recognition;
    setInputState("listening");
    recognition.start();
  };

  const pickPreferredVoice = (voices: SpeechSynthesisVoice[]) => {
    const preferredNames = [
      "Samantha",
      "Alex",
      "Google US English",
      "Google UK English Female",
      "Microsoft Aria Online (Natural) - English (United States)",
      "Microsoft Jenny Online (Natural) - English (United States)",
    ];
    const preferred = voices.find((voice) => preferredNames.includes(voice.name));
    if (preferred) {
      return preferred;
    }
    const english = voices.find((voice) => voice.lang.toLowerCase().startsWith("en"));
    return english || voices[0] || null;
  };

  const cleanTextForSpeech = (text: string): string => {
    return text
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/\*([^*]+)\*/g, "$1")
      .replace(/[;]/g, ",")
      .replace(/[:]/g, ".")
      .replace(/[—–]/g, " to ")
      .replace(/[-]/g, " ")
      .replace(/[`]/g, "")
      .replace(/[\[\]{}()]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  };

  const handleSpeak = (text: string) => {
    if (!("speechSynthesis" in window)) {
      setAiResponse("Text-to-speech isn't supported in this browser.");
      return;
    }

    // If already speaking, stop it
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const cleaned = cleanTextForSpeech(text);
    const utterance = new SpeechSynthesisUtterance(cleaned);
    
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = pickPreferredVoice(voices);
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }
    
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    utterance.onstart = () => {
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  // Data is now fetched automatically by React Query (no manual useEffect needed)

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-red-800 font-semibold mb-2">Unable to Load Data</h3>
        <p className="text-red-600 text-sm mb-4">
          {error instanceof Error ? error.message : 'Failed to load data'}
        </p>
        <p className="text-gray-600 text-sm">
          Possible causes:
          <ul className="list-disc ml-5 mt-2">
            <li>DLT tables are empty - run your pipeline first</li>
            <li>SQL Warehouse is not running</li>
            <li>API connection issues</li>
          </ul>
        </p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Data Warning Banner - Only show after delay to prevent flash */}
      {showDataWarning && !isLoading && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 animate-fade-in">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <div>
              <h4 className="font-semibold text-amber-900">No Data Available</h4>
              <p className="text-sm text-amber-700">
                API connected successfully, but tables appear to be empty. Run your DLT pipeline to populate:
                <code className="ml-2 bg-amber-100 px-2 py-1 rounded text-xs">
                  kaustavpaul_demo.ace_demo.logistics_silver
                </code>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Executive Logistics Overview
        </h2>
        <p className="text-gray-600">
          Analytics and insights across Ace Hardware's supply chain network
        </p>
      </div>

      {/* Voice Assistant */}
      <VoiceAssistant
        inputState={inputState}
        aiQuestion={aiQuestion}
        aiResponse={aiResponse}
        aiTable={aiTable}
        prefillText={voiceDraft}
        isSpeaking={isSpeaking}
        onQuerySubmit={handleQuerySubmit}
        onVoiceInput={handleVoiceInput}
        onSpeak={handleSpeak}
        onReset={handleReset}
      />

      {/* KPI Cards with Loading Animation */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {isLoading || !showContent ? (
          <>
            <KPICardSkeleton />
            <KPICardSkeleton />
            <KPICardSkeleton />
            <KPICardSkeleton />
          </>
        ) : (
          <>
            <div className="animate-fade-in stagger-1">
              <KPICard
                title="Network Throughput"
                value={kpis?.network_throughput?.toString() || "0"}
                unit="trucks in transit"
                icon={Truck}
                trend={{ value: 12, direction: 'up' }}
                color="orange"
              />
            </div>
            <div className="animate-fade-in stagger-2">
              <KPICard
                title="Late Arrivals (24h)"
                value={kpis?.late_arrivals?.toString() || "0"}
                unit={`${kpis?.late_arrivals_percent || 0}% of deliveries`}
                icon={Clock}
                trend={{ value: 3, direction: 'down' }}
                color="red"
              />
            </div>
            <div className="animate-fade-in stagger-3">
              <KPICard
                title="Avg Delay"
                value={kpis?.avg_delay?.toString() || "0"}
                unit="minutes"
                icon={AlertTriangle}
                trend={{ value: 5, direction: 'down' }}
                color="amber"
              />
            </div>
            <div className="animate-fade-in stagger-4">
              <KPICard
                title="Data Quality Score"
                value={kpis?.data_quality_score?.toFixed(1) || "0"}
                unit="out of 100"
                icon={Database}
                trend={{ value: 2, direction: 'up' }}
                color="green"
              />
            </div>
          </>
        )}
      </div>

      {/* Regional Status & Throughput Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Regional Status */}
        {isLoading || !showContent ? (
          <div className="space-y-3">
            <RegionalCardSkeleton />
            <RegionalCardSkeleton />
            <RegionalCardSkeleton />
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-fade-in stagger-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Regional Performance</h2>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <TrendingUp className="w-4 h-4" />
                <span>Live Status</span>
              </div>
            </div>
            <div className="space-y-2.5">
              {regionalData.map((region) => {
              const statusConfig = {
                normal: {
                  icon: CheckCircle,
                  color: 'text-green-600',
                  bg: 'bg-green-50',
                  barColor: 'bg-gradient-to-r from-green-500 to-emerald-600',
                  badge: 'bg-green-100 text-green-700'
                },
                warning: {
                  icon: AlertCircle,
                  color: 'text-amber-600',
                  bg: 'bg-amber-50',
                  barColor: 'bg-gradient-to-r from-amber-500 to-orange-600',
                  badge: 'bg-amber-100 text-amber-700'
                },
                critical: {
                  icon: XCircle,
                  color: 'text-red-600',
                  bg: 'bg-red-50',
                  barColor: 'bg-gradient-to-r from-red-500 to-rose-600',
                  badge: 'bg-red-100 text-red-700'
                }
              };
              
              const config = statusConfig[region.status as keyof typeof statusConfig] || statusConfig.normal;
              const StatusIcon = config.icon;
              
              return (
                <div key={region.name} className={`rounded-lg p-3 ${config.bg} transition-all hover:shadow-md`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <StatusIcon className={`w-4 h-4 ${config.color}`} />
                      <span className="font-semibold text-gray-900 text-sm">{region.name}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${config.badge} capitalize`}>
                        {region.status}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-semibold text-gray-900">{region.trucks}</span>
                      <span className="text-xs text-gray-600 ml-1">trucks</span>
                    </div>
                  </div>
                  <div className="relative">
                    <div className="h-2 bg-white rounded-full overflow-hidden shadow-inner">
                      <div
                        className={`h-full ${config.barColor} rounded-full transition-all duration-500 ease-out`}
                        style={{ width: `${region.utilization}%` }}
                      />
                    </div>
                    <div className="mt-1 flex justify-between text-[10px] text-gray-500">
                      <span>Utilization: {region.utilization}%</span>
                      <span>{region.utilization}% capacity</span>
                    </div>
                  </div>
                </div>
              );
              })}
            </div>
          </div>
        )}

        {/* Throughput Trend */}
        {isLoading || !showContent ? (
          <ChartSkeleton />
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-fade-in stagger-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Network Throughput (Last 24h)
            </h2>
            <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={throughputData}>
              <defs>
                <linearGradient id="colorThroughput" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FF7900" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#FF7900" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="hour"
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
              />
              <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
              <Area
                type="monotone"
                dataKey="trucks"
                stroke="#FF7900"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorThroughput)"
              />
            </AreaChart>
          </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
