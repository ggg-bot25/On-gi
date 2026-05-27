import { useState } from "react";
import { EmotionCard } from "../types";
import { Sparkles, HeartIcon, RotateCw, Smile } from "lucide-react";

export const EMOTIONS: EmotionCard[] = [
  {
    id: "workload",
    emoji: "📝",
    label: "업무 과다",
    description: "나이스 기안, 공문, 기획 보고서... 끝없는 공무에 숨을 고르고 싶을 때",
    color: "border-emerald-200 bg-emerald-50/70 text-emerald-900 hover:bg-emerald-50/100",
    tags: ["행정 잡무", "끝없는 야근", "만성 피로"]
  },
  {
    id: "parent",
    emoji: "🗣️",
    label: "학부모 민원",
    description: "차가운 오해, 무리한 독촉 혹은 악성 민원 폭탄에 가슴 속이 하얗게 짓밟혔을 때",
    color: "border-rose-200 bg-rose-50/70 text-rose-900 hover:bg-rose-50/100",
    tags: ["민원 스트레스", "개인 연락망 침해", "억울함"]
  },
  {
    id: "students",
    emoji: "🎒",
    label: "학생 생활지도",
    description: "말썽 피우고 통제를 거부하는 뒤엉킨 아이들, 온종일 지친 목소리로 교실을 지켰을 때",
    color: "border-amber-200 bg-amber-50/70 text-amber-900 hover:bg-amber-50/100",
    tags: ["수업 태도", "통제 불능", "생활 지도 마찰"]
  },
  {
    id: "loneliness",
    emoji: "🌪️",
    label: "교실 속 외로움",
    description: "북적이는 학생들 사이에 있으면서도 누구에게도 기댈 수 없어 홀로 고독할 때",
    color: "border-indigo-200 bg-indigo-50/70 text-indigo-900 hover:bg-indigo-50/100",
    tags: ["고립감", "나만의 싸움", "비밀 상담소"]
  },
  {
    id: "burnout",
    emoji: "🕯️",
    label: "번아웃 (탈진)",
    description: "한때 가득했던 열정과 사랑이 모두 말라 버려 내일 출근조차 아득히 두려울 때",
    color: "border-teal-200 bg-teal-50/70 text-teal-900 hover:bg-teal-50/100",
    tags: ["자괴감", "열정 고갈", "영혼 잔고 0%"]
  }
];

interface EmotionSelectorProps {
  onSelectEmotions: (emotions: string[]) => void;
  selectedEmotions: string[];
  goToChatTab: () => void;
}

export default function EmotionSelector({ onSelectEmotions, selectedEmotions, goToChatTab }: EmotionSelectorProps) {
  const [vitamin, setVitamin] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedForVitamin, setSelectedForVitamin] = useState<string>("");

  const toggleSelect = (label: string) => {
    if (selectedEmotions.includes(label)) {
      onSelectEmotions(selectedEmotions.filter((e) => e !== label));
    } else {
      onSelectEmotions([...selectedEmotions, label]);
    }
  };

  const generateVitamin = async (label: string) => {
    setSelectedForVitamin(label);
    setLoading(true);
    setVitamin(null);
    try {
      const res = await fetch("/api/mind-vitamin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emotion: label })
      });
      const data = await res.json();
      setVitamin(data.vitamin);
    } catch (err) {
      console.error(err);
      setVitamin("선생님의 몸과 마음이 너무나 소중합니다. 오늘은 따듯한 차 한 잔을 마시며 편히 쉬어 주세요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center space-y-3">
        <span className="inline-flex items-center space-x-1.5 rounded-full bg-teal-100 px-3 py-1 text-xs font-semibold text-teal-800">
          <Smile className="h-3.5 w-3.5" />
          <span>선생님의 오늘 마음 진단</span>
        </span>
        <h2 className="text-2xl font-bold tracking-tight text-stone-800 sm:text-3xl">
          지친 마음의 매듭을 풀어내세요
        </h2>
        <p className="mx-auto max-w-2xl text-stone-600 text-sm sm:text-base">
          교탁 앞에 서느라 미처 품어주지 못한 선생님의 오늘 속앓이는 어떤 것인가요? <br />
          마음이 일렁이는 상자를 클릭해 감정을 담고 전용 위로를 받으세요.
        </p>
      </div>

      {/* Emotion Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {EMOTIONS.map((item) => {
          const isSelected = selectedEmotions.includes(item.label);
          return (
            <div
              key={item.id}
              className={`relative flex flex-col justify-between rounded-2xl border-2 p-5 transition-all duration-300 cursor-pointer shadow-sm ${
                isSelected
                  ? "border-teal-600 ring-2 ring-teal-500/20 bg-teal-50/50"
                  : item.color
              }`}
            >
              <div onClick={() => toggleSelect(item.label)} className="flex-1 space-y-3">
                {/* Emoji & Label */}
                <div className="flex items-center justify-between">
                  <span className="text-3xl" role="img" aria-label={item.label}>
                    {item.emoji}
                  </span>
                  <div
                    className={`h-4 w-4 rounded-full border-2 transition-all ${
                      isSelected ? "border-teal-700 bg-teal-700" : "border-stone-300 bg-white"
                    }`}
                  />
                </div>

                <h3 className="text-base font-bold text-stone-800">{item.label}</h3>
                <p className="text-xs leading-relaxed text-stone-600">{item.description}</p>
                
                {/* HashTags */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {item.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="inline-block rounded-md bg-stone-100 px-1.5 py-0.5 text-[10px] text-stone-500"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Button Inside Card */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  generateVitamin(item.label);
                }}
                className="mt-4 flex w-full items-center justify-center space-x-1 rounded-xl bg-white border border-stone-200/80 px-1.5 py-1.5 text-xs font-semibold text-stone-700 shadow-sm transition hover:bg-stone-50 hover:border-neutral-300"
              >
                <Sparkles className="h-3 w-3 text-amber-500 animate-spin" />
                <span>나만을 위한 위로받기</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Mind Vitamin Diagnostic Pop-up Box */}
      { (loading || vitamin) && (
        <div className="mx-auto max-w-2xl rounded-2xl border border-teal-100 bg-teal-50/30 p-6 md:p-8 shadow-sm text-stone-800">
          <div className="flex items-start space-x-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-600 text-stone-50">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="space-y-3 flex-1">
              <h4 className="text-sm font-semibold text-teal-800">
                {selectedForVitamin}에 보낸 토닥 처방 비타민 💊
              </h4>
              {loading ? (
                <div className="flex items-center space-x-2 text-stone-500 py-3">
                  <RotateCw className="h-4 w-4 animate-spin text-teal-600" />
                  <span className="text-sm">선생님의 고단함을 사려 깊게 읽고 마음 비타민을 짓는 중입니다...</span>
                </div>
              ) : (
                <p className="text-stone-700 leading-relaxed font-serif text-base whitespace-pre-line border-l-2 border-teal-400 pl-4 py-1 italic">
                  "{vitamin}"
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Connection Indicator card */}
      <div className="rounded-2xl bg-stone-100/80 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1">
          <h4 className="font-bold text-stone-800 text-sm sm:text-base">
            학부모, 학생으로 인한 응어리를 더 깊게 털어놓고 싶으신가요?
          </h4>
          <p className="text-stone-600 text-xs sm:text-sm">
            상단 진단 카드를 선택한 뒤 상담소 탭으로 이동하시면 가슴 속 응어리를 들어주는 AI 심리 상담사 '토닥 선생님'이 기다립니다.
          </p>
        </div>
        <button
          onClick={goToChatTab}
          className="shrink-0 flex items-center space-x-2 rounded-xl bg-teal-700 hover:bg-teal-800 duration-200 px-5 py-2.5 text-sm font-bold text-white shadow-md cursor-pointer"
        >
          <HeartIcon className="h-4 w-4 fill-white" />
          <span>토닥 선생님 상담실 가기</span>
        </button>
      </div>
    </div>
  );
}
