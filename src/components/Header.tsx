import { Sparkles, Heart, Coffee, BarChart3 } from "lucide-react";

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Header({ activeTab, setActiveTab }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-stone-200 bg-stone-50/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl h-16 items-center justify-between px-4 sm:px-6">
        {/* Serene Logo and Title */}
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-600 text-stone-50 shadow-sm">
            <Heart className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-stone-800 sm:text-xl">
              토닥토닥 교실
            </h1>
            <p className="hidden text-xs text-stone-500 sm:block">
              대한민국 교사들을 위한 마음 쉼터
            </p>
          </div>
        </div>

        {/* Dynamic Nav Tabs */}
        <nav className="flex space-x-1 sm:space-x-2">
          {[
            { id: "home", label: "마음 진단", icon: Sparkles },
            { id: "chat", label: "토닥 상담소", icon: Heart },
            { id: "breathe", label: "차 한 잔 호흡", icon: Coffee },
            { id: "board", label: "교사 나눔방", icon: Sparkles },
            { id: "analysis", label: "스트레스 분석", icon: BarChart3 },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-btn-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-1 sm:space-x-2 rounded-lg px-3 py-1.5 text-xs sm:text-sm font-medium transition-all ${
                  isActive
                    ? "bg-teal-700 text-stone-50 shadow-sm"
                    : "text-stone-600 hover:bg-stone-100/80 hover:text-stone-900"
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${isActive ? "text-stone-50" : "text-stone-500"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
