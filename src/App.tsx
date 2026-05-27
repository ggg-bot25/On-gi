import { useState } from "react";
import Header from "./components/Header";
import EmotionSelector from "./components/EmotionSelector";
import ChatRoom from "./components/ChatRoom";
import BreathingCoach from "./components/BreathingCoach";
import PraiseBoard from "./components/PraiseBoard";
import DataAnalysis from "./components/DataAnalysis";
import { Smile, HelpCircle, Heart, Sparkles } from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState<string>("home");
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);

  const renderActiveContent = () => {
    switch (activeTab) {
      case "home":
        return (
          <EmotionSelector
            onSelectEmotions={setSelectedEmotions}
            selectedEmotions={selectedEmotions}
            goToChatTab={() => setActiveTab("chat")}
          />
        );
      case "chat":
        return <ChatRoom selectedEmotions={selectedEmotions} />;
      case "breathe":
        return <BreathingCoach />;
      case "board":
        return <PraiseBoard />;
      case "analysis":
        return <DataAnalysis />;
      default:
        return (
          <EmotionSelector
            onSelectEmotions={setSelectedEmotions}
            selectedEmotions={selectedEmotions}
            goToChatTab={() => setActiveTab("chat")}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-stone-100/50 text-stone-800 flex flex-col font-sans select-none antialiased">
      {/* Dynamic Header with Navigation */}
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Container */}
      <main className="flex-1 mx-auto max-w-7xl w-full px-4 py-8 sm:px-6 lg:py-12">
        {renderActiveContent()}
      </main>

      {/* Footer explaining warm support context */}
      <footer className="border-t border-stone-200 bg-white py-8 text-center text-stone-500 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-2.5">
          <div className="flex items-center justify-center space-x-1">
            <Heart className="h-4 w-4 text-teal-600 fill-teal-600 animate-pulse" />
            <span className="font-bold text-stone-700">토닥토닥 교실은 언제나 선생님의 편입니다.</span>
          </div>
          <p className="max-w-md mx-auto leading-relaxed">
            본 상담 내용은 익명을 원칙으로 하며 그 어떠한 개인정보나 대화기록도 외부로 수집·보관하지 않는 안전한 닫힌 서랍 공간입니다. 지칠 땐 언제든 토닥 교실을 펼쳐 차 한 잔을 기울여 주세요.
          </p>
          <p className="text-[10px] font-mono text-stone-400">
            © 2026 토닥토닥 교실. Supported by Gemini 3.5 Flash Model.
          </p>
        </div>
      </footer>
    </div>
  );
}
