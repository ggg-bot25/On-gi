import { useState, useEffect, useRef } from "react";
import { Coffee, RotateCw, Play, Pause, Disc, Info } from "lucide-react";

interface TeaBlend {
  id: string;
  name: string;
  description: string;
  color: string;
  glowColor: string;
  flavorText: string;
}

const TEA_BLENDS: TeaBlend[] = [
  {
    id: "chamomile",
    name: "캐모마일 (Chamomile)",
    description: "불안 해소와 근육 이완에 탁월한 사과향의 노란 대지",
    color: "bg-amber-400 border-amber-300 text-amber-900",
    glowColor: "shadow-amber-400/30",
    flavorText: "온 세상을 따스하게 안아주던 선생님에게 잠깐의 포근함을 선물하는 차"
  },
  {
    id: "lavender",
    name: "라벤더 (Lavender)",
    description: "잔뜩 흥분된 신경을 차분한 보랏빛 고요함으로 잠재우는 꽃밭",
    color: "bg-purple-400 border-purple-300 text-purple-900",
    glowColor: "shadow-purple-400/30",
    flavorText: "오늘 하루 무수한 요구와 목소리에 지쳤을 보이스 메이커를 위한 정화제"
  },
  {
    id: "peppermint",
    name: "페퍼민트 (Peppermint)",
    description: "복잡하게 엉킨 피로를 맑은 박하향으로 단박에 틔워내는 얼음",
    color: "bg-teal-400 border-teal-300 text-teal-900",
    glowColor: "shadow-teal-400/30",
    flavorText: "수업 기획서와 공문 속에서 잔뜩 조였던 뒷목을 시원하게 펴줄 바람"
  }
];

export default function BreathingCoach() {
  const [selectedTea, setSelectedTea] = useState<TeaBlend>(TEA_BLENDS[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // States of 4-7-8 breathing
  // phases: 'idle' | 'inhale' (4s) | 'hold' (7s) | 'exhale' (8s)
  const [phase, setPhase] = useState<'idle' | 'inhale' | 'hold' | 'exhale'>('idle');
  const [timeLeft, setTimeLeft] = useState(0);
  const [roundsCompleted, setRoundsCompleted] = useState(0);
  const [infusionPercentage, setInfusionPercentage] = useState(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isPlaying) {
      if (timerRef.current) clearInterval(timerRef.current);
      setPhase('idle');
      setTimeLeft(0);
      return;
    }

    // Initialize first cycle
    if (phase === 'idle') {
      startNewPhase('inhale');
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Transition phase
          handlePhaseTransition();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, phase]);

  const startNewPhase = (nextPhase: 'inhale' | 'hold' | 'exhale') => {
    setPhase(nextPhase);
    if (nextPhase === 'inhale') {
      setTimeLeft(4);
    } else if (nextPhase === 'hold') {
      setTimeLeft(7);
    } else if (nextPhase === 'exhale') {
      setTimeLeft(8);
    }
  };

  const handlePhaseTransition = () => {
    if (phase === 'inhale') {
      startNewPhase('hold');
    } else if (phase === 'hold') {
      startNewPhase('exhale');
    } else if (phase === 'exhale') {
      // 1 Round complete!
      const newRounds = roundsCompleted + 1;
      setRoundsCompleted(newRounds);
      const newPercentage = Math.min(newRounds * 34, 100);
      setInfusionPercentage(newPercentage);
      
      if (newPercentage >= 100) {
        setIsPlaying(false);
        setPhase('idle');
      } else {
        startNewPhase('inhale');
      }
    }
  };

  const handleReset = () => {
    setIsPlaying(false);
    setPhase('idle');
    setTimeLeft(0);
    setRoundsCompleted(0);
    setInfusionPercentage(0);
  };

  const getPhaseMessage = () => {
    switch (phase) {
      case 'inhale':
        return {
          title: "코로 숨을 깊게 들이마시세요",
          desc: "4초 동안 캐모마일 들판의 싱그러움을 들이켜듯",
          action: "깊게 들이쉬기"
        };
      case 'hold':
        return {
          title: "스며들도록 그 호흡을 멈추세요",
          desc: "7초 동안 깊고 아늑한 호흡이 온몸 가득 머물도록",
          action: "호흡 머금기"
        };
      case 'exhale':
        return {
          title: "한숨과 함께 피로를 내보내세요",
          desc: "8초 동안 입으로 '후-' 소리를 내며 긴장을 남김없이 비워냅니다",
          action: "남김없이 내쉬기"
        };
      default:
        return {
          title: "준비되시면 시작 버튼을 눌러주세요",
          desc: "선생님의 마음에 고요를 선물하기 위한 4-7-8 호흡이 시작됩니다.",
          action: "대기 중"
        };
    }
  };

  const currentMsg = getPhaseMessage();

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
      <div className="text-center space-y-3">
        <span className="inline-flex items-center space-x-1.5 rounded-full bg-teal-100 px-3 py-1 text-xs font-semibold text-teal-800">
          <Coffee className="h-3.5 w-3.5" />
          <span>차 한 잔의 힐링 공간</span>
        </span>
        <h2 className="text-2xl font-bold tracking-tight text-stone-800 sm:text-3xl">
          숨 한 모금, 차 한 잔
        </h2>
        <p className="mx-auto max-w-xl text-stone-600 text-sm">
          의학적으로 입증된 4-7-8 이완 연쇄 호흡을 통해 스트레스를 낮추고 차를 우러내 보세요. <br />
          라운드가 완료될 때마다 찻잔에 포근한 온기가 채워집니다.
        </p>
      </div>

      {/* Grid: 1. Tea selection, 2. Interactive Coach */}
      <div className="grid gap-6 md:grid-cols-12">
        {/* Tea Selection Part */}
        <div className="md:col-span-5 space-y-4">
          <div className="rounded-xl bg-stone-100/80 p-5 space-y-3">
            <h3 className="text-sm font-bold text-stone-700 flex items-center space-x-1">
              <Info className="h-4 w-4 text-stone-500" />
              <span>우려낼 치유의 찻잎 선택</span>
            </h3>

            <div className="space-y-2.5">
              {TEA_BLENDS.map((tea) => {
                const isSelected = selectedTea.id === tea.id;
                return (
                  <button
                    key={tea.id}
                    onClick={() => {
                      setSelectedTea(tea);
                      handleReset();
                    }}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all cursor-pointer ${
                      isSelected
                        ? "border-teal-600 bg-white ring-2 ring-teal-500/10 shadow-sm"
                        : "border-stone-200 hover:border-stone-300 bg-stone-50"
                    }`}
                  >
                    <div className="flex items-center space-x-3.5">
                      <div className={`h-8 w-8 rounded-full ${tea.color} flex items-center justify-center font-bold text-white shadow-sm`}>
                        🍵
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-stone-800 text-sm">{tea.name}</p>
                        <p className="text-xs text-stone-500 truncate">{tea.description}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Flavor quote */}
          <div className="rounded-xl border border-teal-100 bg-teal-50/20 p-5">
            <p className="text-xs text-teal-800 font-bold mb-1">💡 토닥 도슨트의 처방 조언</p>
            <p className="text-xs text-stone-600 leading-relaxed font-serif">
               "{selectedTea.flavorText}"
            </p>
          </div>
        </div>

        {/* Breathing Circle Coach Part */}
        <div className="md:col-span-7 rounded-2xl border border-stone-200 bg-white p-6 sm:p-8 flex flex-col items-center justify-center text-center space-y-6">
          
          {/* Brew Progress Slider */}
          <div className="w-full space-y-1">
            <div className="flex justify-between text-xs text-stone-500 px-1">
              <span>찻잎 우리는 중</span>
              <span className="font-mono text-teal-700 font-bold">{infusionPercentage}% infusion</span>
            </div>
            <div className="h-2 w-full bg-stone-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-teal-600 transition-all duration-1000"
                style={{ width: `${infusionPercentage}%` }}
              />
            </div>
          </div>

          {/* Central Animated Breathing Shape */}
          <div className="relative flex h-52 w-52 items-center justify-center">
            
            {/* Dynamic Ambient glow rings */}
            <div 
              className={`absolute inset-0 rounded-full bg-stone-100 border border-stone-200/50 transition-all duration-1000 ${
                phase === 'inhale' ? 'scale-125 bg-teal-50 border-teal-200' :
                phase === 'hold' ? 'scale-110 bg-teal-100/50 border-teal-300/60' :
                'scale-95 bg-stone-50'
              }`}
            />

            {/* Core Shape representing teabag or round fluid element */}
            <div
              className={`relative z-10 flex h-36 w-36 items-center justify-center rounded-full text-white font-bold text-lg shadow-lg shadow-black/5 transition-all transition-duration-1000 ${selectedTea.color} ${selectedTea.glowColor} ${
                phase === 'inhale' ? 'scale-115 opacity-100' :
                phase === 'hold' ? 'scale-110 rotate-12 duration-500 opacity-90' :
                phase === 'exhale' ? 'scale-90 opacity-100' : 'scale-100 opacity-80'
              }`}
            >
              {phase !== 'idle' ? (
                <div className="flex flex-col items-center">
                  <span className="text-2xl font-mono tracking-widest">{timeLeft}</span>
                  <span className="text-[10px] mt-1 font-semibold opacity-90">{currentMsg.action}</span>
                </div>
              ) : (
                <Coffee className="h-10 w-10 text-white" />
              )}
            </div>

            {/* Progress dot spinners for visual rhythm */}
            {isPlaying && (
              <Disc className="absolute h-44 w-44 text-teal-700/20 animate-spin" />
            )}
          </div>

          {/* Prompt labels and Instructions */}
          <div className="space-y-1.5 max-w-md">
            <h4 className="text-lg font-extrabold text-stone-800 transition">
              {currentMsg.title}
            </h4>
            <p className="text-xs text-stone-500 leading-relaxed min-h-[34px]">
              {currentMsg.desc}
            </p>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center space-x-3 pt-2">
            {!isPlaying ? (
              <button
                onClick={() => setIsPlaying(true)}
                className="flex items-center space-x-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-stone-50 px-6 py-3 text-sm font-bold shadow-md cursor-pointer transition"
              >
                <Play className="h-4 w-4 fill-white" />
                <span>호흡 연쇄 시작 ({roundsCompleted}/3)</span>
              </button>
            ) : (
              <button
                onClick={() => setIsPlaying(false)}
                className="flex items-center space-x-2 rounded-xl bg-stone-800 hover:bg-stone-900 text-stone-50 px-6 py-3 text-sm font-bold shadow-md cursor-pointer transition"
              >
                <Pause className="h-4 w-4 fill-white" />
                <span>일시 정지</span>
              </button>
            )}

            <button
              onClick={handleReset}
              className="flex items-center space-x-1 rounded-xl bg-stone-100 border border-stone-200 text-stone-700 px-4 py-3 text-sm font-bold transition hover:bg-stone-200"
            >
              <RotateCw className="h-3.5 w-3.5" />
              <span>다시 시도</span>
            </button>
          </div>

          {/* Congratulations after 100% steeping */}
          {roundsCompleted >= 3 && infusionPercentage >= 100 && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-xs text-amber-900 leading-relaxed text-left space-y-1 max-w-md animate-bounce">
              <span className="font-extrabold flex items-center gap-1.5 text-amber-800">🎉 따듯한 차 우려내기 완료!</span>
              <span>선생님, 고요에 녹여낸 가벼워진 심장으로 차의 온기를 들이켜며 복잡한 생각들은 바람결에 날려 보내세요. 교실의 주인공도 중요하지만, 그곳에 선 스스로의 건강보다 귀한 가치는 결코 없습니다.</span>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
