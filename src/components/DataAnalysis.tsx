import { useState, useEffect } from "react";
import { 
  BarChart3, 
  Users, 
  Briefcase, 
  GraduationCap, 
  Flame, 
  ShieldCheck, 
  RefreshCw, 
  CheckCircle2, 
  Sparkles, 
  HeartHandshake 
} from "lucide-react";
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from "recharts";

interface TrendPoint {
  name: string;
  complaints: number;
  workload: number;
  teaching: number;
  burnout: number;
}

interface StressAnalysis {
  analyzed: boolean;
  totalSessions: number;
  totalUserMessages: number;
  scores: {
    complaints: number;
    workload: number;
    teaching: number;
    burnout: number;
  };
  dominantCategory: string;
  insight: string;
  actionPlan: string[];
  isDemo: boolean;
  trend?: TrendPoint[];
}

export default function DataAnalysis() {
  const [data, setData] = useState<StressAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({});

  const fetchAnalysis = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/analyze");
      if (res.ok) {
        const payload = await res.json();
        setData(payload);
      }
    } catch (err) {
      console.error("Failed to load stress analysis data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalysis();
  }, []);

  const toggleStep = (stepText: string) => {
    setCompletedSteps((prev) => ({
      ...prev,
      [stepText]: !prev[stepText],
    }));
  };

  const getPercentageColor = (score: number) => {
    if (score >= 70) return "bg-rose-500";
    if (score >= 45) return "bg-amber-500";
    return "bg-teal-600";
  };

  const getPercentageTextStyle = (score: number) => {
    if (score >= 70) return "text-rose-600 font-extrabold";
    if (score >= 45) return "text-amber-600 font-bold";
    return "text-teal-700 font-bold";
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-2 px-1">
      {/* 1. Header & Introductory Note */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl flex items-center gap-2">
            <BarChart3 className="h-7 w-7 text-teal-700" />
            <span>나의 교직 스트레스 마킹 지도</span>
          </h2>
          <p className="text-sm text-stone-500 mt-1">
            토닥 상담소와의 실제 대담 문장들을 수학적으로 분류 및 분석한 맞춤 진단서입니다.
          </p>
        </div>

        <button
          onClick={fetchAnalysis}
          disabled={loading}
          className="flex items-center space-x-2 rounded-xl bg-teal-50 border border-teal-200 hover:bg-teal-100 text-teal-800 px-4 py-2.5 text-xs font-bold transition shadow-sm shrink-0 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>데이터 실시간 재분석</span>
        </button>
      </div>

      {loading && !data ? (
        <div className="flex flex-col items-center justify-center p-12 text-center space-y-3">
          <RefreshCw className="h-8 w-8 animate-spin text-teal-600" />
          <p className="text-sm font-semibold text-stone-600">선생님의 억눌렸던 언어 데이터들을 귀 기울여 판독하는 중...</p>
        </div>
      ) : data ? (
        <div className="grid gap-6">
          
          {/* Active Security Lock */}
          <div className="rounded-xl border border-teal-100 bg-teal-50/30 p-4 flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-teal-700 shrink-0 mt-0.5" />
            <div className="text-xs text-teal-900 leading-relaxed font-medium">
              <span className="font-bold">🔒 강력한 비밀 보호 보증:</span> 본 대뇌 인지 분석 보고서는 오직 선생님 한 분만 조회 가능하도록 로컬 브라우저 세션에 안전 격리되어 해독됩니다. 외부 교육청이나 포털 시스템의 추적이 원천 배제됩니다.
            </div>
          </div>

          {/* 3 Overview Quick Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 text-center">
              <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block mb-1">총 심화 대화 횟수</span>
              <p className="text-2xl font-black text-stone-800 font-mono">{data.totalSessions}회</p>
            </div>
            <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 text-center">
              <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block mb-1">털어놓은 가슴앓이 문장</span>
              <p className="text-2xl font-black text-stone-800 font-mono">{data.totalUserMessages}마디</p>
            </div>
            <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 text-center">
              <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block mb-1">피로 한계 요인</span>
              <p className="text-base font-extrabold text-teal-800 truncate px-0.5 mt-1">{data.dominantCategory}</p>
            </div>
          </div>

          {/* 4 Stress category charts */}
          <div className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6 shadow-sm space-y-6">
            <div className="space-y-1">
              <h3 className="font-bold text-stone-800 text-sm sm:text-base flex items-center gap-1.5">
                <Sparkles className="h-4.5 w-4.5 text-yellow-500 fill-yellow-400" />
                <span>누적 대화 맥락 분류 상태</span>
              </h3>
              <p className="text-xs text-stone-500">
                가장 큰 고민을 내포한 교직 아픔의 영역을 % 수치로 마킹한 분석표입니다.
              </p>
            </div>

            <div className="space-y-4">
              
              {/* Complaints */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="font-bold text-stone-700 flex items-center gap-2">
                    <Users className="h-4 w-4 text-rose-500" />
                    <span>학부모 민원 및 전화 마찰</span>
                  </span>
                  <span className={getPercentageTextStyle(data.scores.complaints)}>{data.scores.complaints}%</span>
                </div>
                <div className="w-full bg-stone-100 rounded-full h-3 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ${getPercentageColor(data.scores.complaints)}`}
                    style={{ width: `${data.scores.complaints}%` }}
                  />
                </div>
              </div>

              {/* Workload */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="font-bold text-stone-700 flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-amber-500" />
                    <span>행정 공문서 및 나이스 업무 과하</span>
                  </span>
                  <span className={getPercentageTextStyle(data.scores.workload)}>{data.scores.workload}%</span>
                </div>
                <div className="w-full bg-stone-100 rounded-full h-3 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ${getPercentageColor(data.scores.workload)}`}
                    style={{ width: `${data.scores.workload}%` }}
                  />
                </div>
              </div>

              {/* Teaching */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="font-bold text-stone-700 flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-teal-600" />
                    <span>학생 교실 통제 및 훈육 상의 피로</span>
                  </span>
                  <span className={getPercentageTextStyle(data.scores.teaching)}>{data.scores.teaching}%</span>
                </div>
                <div className="w-full bg-stone-100 rounded-full h-3 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ${getPercentageColor(data.scores.teaching)}`}
                    style={{ width: `${data.scores.teaching}%` }}
                  />
                </div>
              </div>

              {/* Burnout */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="font-bold text-stone-700 flex items-center gap-2">
                    <Flame className="h-4 w-4 text-purple-500" />
                    <span>전체적인 기력 고갈 및 우울감 (번아웃)</span>
                  </span>
                  <span className={getPercentageTextStyle(data.scores.burnout)}>{data.scores.burnout}%</span>
                </div>
                <div className="w-full bg-stone-100 rounded-full h-3 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ${getPercentageColor(data.scores.burnout)}`}
                    style={{ width: `${data.scores.burnout}%` }}
                  />
                </div>
              </div>

            </div>
          </div>

          {/* Recharts stress level trend chart */}
          <div className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6 shadow-sm space-y-6">
            <div className="space-y-1">
              <h3 className="font-bold text-stone-800 text-sm sm:text-base flex items-center gap-1.5 font-sans">
                <BarChart3 className="h-4.5 w-4.5 text-teal-700" />
                <span>회차별 마음 피로 추이 추세선</span>
              </h3>
              <p className="text-xs text-stone-500 font-sans">
                상담 횟수가 거듭됨에 따른 스트레스 영역별 피로 지수 변화 흐름을 직관적으로 도출한 마킹 추세선입니다.
              </p>
            </div>

            <div className="w-full h-[320px] pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={data.trend || []}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: '#78716c', fontSize: 11, fontWeight: 'medium' }} 
                    stroke="#e7e5e4"
                  />
                  <YAxis 
                    domain={[0, 100]} 
                    tick={{ fill: '#78716c', fontSize: 11 }} 
                    stroke="#e7e5e4"
                  />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '12px', 
                      backgroundColor: '#ffffff', 
                      border: '1px solid #e7e5e4',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                    }}
                    labelStyle={{ fontWeight: 'bold', color: '#1c1917', fontSize: '12px', fontFamily: 'sans-serif' }}
                    itemStyle={{ fontSize: '12px', fontFamily: 'sans-serif' }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36} 
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: 11, fontWeight: 'bold', color: '#444', fontFamily: 'sans-serif' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="complaints" 
                    name="학부모 민원" 
                    stroke="#f43f5e" 
                    strokeWidth={3} 
                    dot={{ r: 4, strokeWidth: 1 }}
                    activeDot={{ r: 7 }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="workload" 
                    name="행정 업무" 
                    stroke="#f59e0b" 
                    strokeWidth={3} 
                    dot={{ r: 4, strokeWidth: 1 }}
                    activeDot={{ r: 7 }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="teaching" 
                    name="학생 지도" 
                    stroke="#0d9488" 
                    strokeWidth={3} 
                    dot={{ r: 4, strokeWidth: 1 }}
                    activeDot={{ r: 7 }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="burnout" 
                    name="교직 탈진" 
                    stroke="#a855f7" 
                    strokeWidth={3} 
                    dot={{ r: 4, strokeWidth: 1 }}
                    activeDot={{ r: 7 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {data.isDemo && (
              <p className="text-[10px] text-stone-400 font-medium pl-1 italic">
                * 위 차트의 추세선은 가상의 선생님 상담 예시 데이터로 구성된 것입니다. 대화를 시작하시면 선생님의 실제 진척에 맞춰 실시간 추적 마킹됩니다.
              </p>
            )}
          </div>

          {/* 5. Deep Psychology Insights Narrative Text */}
          <div className="rounded-2xl border-l-4 border-l-teal-600 border border-stone-200 bg-stone-50 p-5 sm:p-6 space-y-3">
            <h4 className="text-xs font-bold text-teal-850 tracking-wide uppercase flex items-center gap-1.5">
              <HeartHandshake className="h-4 w-4" />
              <span>심리 정서 분석 보고서</span>
            </h4>
            <div className="text-stone-850 font-serif leading-relaxed text-sm sm:text-base whitespace-pre-line text-justify pl-1">
              "{data.insight}"
            </div>
            {data.isDemo && (
              <p className="text-[10px] text-stone-400 font-medium pl-1 italic">
                * 이 보고서는 로컬 규칙 기반 심리 진단 알고리즘을 사용해 합성되었습니다. GEMINI_API_KEY를 우측 Secrets에 탑재하시면 훨씬 더 유려하고 정교한 인지 치료 임상 처방을 보실 수 있습니다.
              </p>
            )}
          </div>

          {/* 6. Active Custom Remedial Checklist */}
          <div className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6 shadow-sm space-y-4">
            <div className="space-y-1">
              <h3 className="font-bold text-stone-850 text-sm sm:text-base">
                📋 오늘 실천하는 마음 영양 일일 영양제
              </h3>
              <p className="text-xs text-stone-500">
                선생님의 핵심 고민 원인을 고려해 권고해 드리는 작은 행동 일과입니다. 완료한 항목에 체크해 보세요.
              </p>
            </div>

            <div className="grid gap-3 pt-2">
              {data.actionPlan.map((step, idx) => {
                const isCompleted = completedSteps[step] || false;
                return (
                  <div
                    key={idx}
                    onClick={() => toggleStep(step)}
                    className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isCompleted 
                        ? "border-teal-300 bg-teal-50/20 text-stone-500" 
                        : "border-stone-100 bg-stone-50/50 hover:bg-stone-50 text-stone-800"
                    }`}
                  >
                    <CheckCircle2 className={`h-5 w-5 shrink-0 mt-0.5 transition-all ${
                      isCompleted ? "text-teal-600 fill-teal-100" : "text-stone-300"
                    }`} />
                    <span className={`text-xs sm:text-sm font-medium ${isCompleted ? "line-through text-stone-400" : ""}`}>
                      {step}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      ) : (
        <div className="rounded-2xl border border-stone-200 bg-stone-50 text-center p-8 space-y-4">
          <p className="text-sm font-medium text-stone-600">
            선생님, 스트레스 분석을 가동하기에는 아직 털어놓으신 대화 내용이 충분하지 않습니다.
          </p>
          <p className="text-xs text-stone-500">
            '토닥 상담소'에서 평소 겪는 교실 내 소진 상태를 몇 자 적어 대화를 해 주세요!
          </p>
        </div>
      )}
    </div>
  );
}
