import { useState, useEffect, useRef, MouseEvent } from "react";
import { Message, CounselingSession } from "../types";
import { 
  Send, 
  Heart, 
  RotateCw, 
  Trash2, 
  ArrowRightCircle, 
  Plus, 
  Calendar, 
  MessageSquare, 
  ShieldCheck,
  Sparkles,
  X,
  FileText
} from "lucide-react";

interface ChatRoomProps {
  selectedEmotions: string[];
}

const STARTER_PRESETS = [
  {
    tag: "학부모",
    text: "학부모님에게 차가운 한마디나 무리한 전화를 받고서부터 심장이 자꾸 떨리고 가라앉지 않아요."
  },
  {
    tag: "교실 통제",
    text: "아이들이 제 훈육을 아랑곳 않고 비웃거나 수업을 망쳐놓을 때, 제 자질이 의심되어 너무 자괴감이 듭니다."
  },
  {
    tag: "행정 잡무",
    text: "하루 종일 수업 외에 나이스, 기안 작성과 각종 행사 기획 서류에 파묻혀 지쳐 번아웃이 왔어요."
  },
  {
    tag: "출근 불안",
    text: "아침에 눈을 뜨고 학교 정문이 시야에 다가올 때마다 숨이 막히고 눈물이 날 것만 같아요."
  }
];

const INITIAL_WELCOME_MESSAGE = (emotions: string[]) => {
  const emotionContext = emotions.length > 0 
    ? `현재 마음 진단을 통해 '${emotions.join(", ")}'의 짐을 선택하셨군요. ` 
    : "";
  return {
    id: "welcome",
    role: "model" as const,
    content: `어서 오세요, 선생님. 이곳은 선생님이 짊어지신 교탁의 무게를 잠시 풀고 오직 선생님 한 분의 마음 건강에만 집중하는 안전한 대화 나눔터입니다.\n\n${emotionContext}요즘 어떤 일이 선생님을 가장 고단하게 만들고 있나요? 속 안의 생채기를 하나씩 꺼내 들려주시면 토닥 선생님이 귀 기울여 다독이겠습니다.`,
    timestamp: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })
  };
};

export default function ChatRoom({ selectedEmotions }: ChatRoomProps) {
  // Chat Room state
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  // History List state (Saved in server)
  const [sessions, setSessions] = useState<CounselingSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  // Counseling Summary states
  const [summary, setSummary] = useState<string[] | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);

  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  // Initialize welcomed messages
  useEffect(() => {
    setMessages([INITIAL_WELCOME_MESSAGE(selectedEmotions)]);
  }, [selectedEmotions]);

  // Fetch past sessions from backend
  const fetchSessions = async () => {
    try {
      setLoadingSessions(true);
      const res = await fetch("/api/sessions");
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
      }
    } catch (err) {
      console.error("Failed to load counseling sessions:", err);
    } finally {
      setLoadingSessions(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  // Auto scroll to bottom of chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Save/Sync dynamic session state to server
  const saveSessionToServer = async (sessionId: string, currentMsgs: Message[]) => {
    try {
      // Determine session title using selected emotions or first user message
      let title = "";
      if (selectedEmotions.length > 0) {
        title = `${selectedEmotions.join(", ")} 치유`;
      } else {
        const firstUserMsg = currentMsgs.find(m => m.role === 'user');
        title = firstUserMsg 
          ? `${firstUserMsg.content.slice(0, 15)}... 익명 상담` 
          : "토닥 마음 치유 상담";
      }

      await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: sessionId,
          title: title,
          emotions: selectedEmotions,
          messages: currentMsgs
        })
      });
      // Refresh backend session listings
      fetchSessions();
    } catch (err) {
      console.error("Failed to background sync counseling session:", err);
    }
  };

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    // Generate sessionId if not present
    const sessionId = currentSessionId || `session-${Date.now()}`;
    if (!currentSessionId) {
      setCurrentSessionId(sessionId);
    }

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: textToSend,
      timestamp: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    // Save user message to backend immediately
    await saveSessionToServer(sessionId, updatedMessages);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
         headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({ role: m.role, content: m.content })),
          selectedEmotions: selectedEmotions
        })
      });

      const data = await res.json();
      const modelMsg: Message = {
        id: `model-${Date.now()}`,
        role: "model",
        content: data.content,
        timestamp: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })
      };
      
      const finalMsgs = [...updatedMessages, modelMsg];
      setMessages(finalMsgs);
      // Synchronize backend on model responses as well
      await saveSessionToServer(sessionId, finalMsgs);
    } catch (err) {
      console.error("Chat error:", err);
      const errorMsg: Message = {
        id: `error-${Date.now()}`,
        role: "model",
        content: "선생님, 통신선에 피로가 쌓여 응답을 우려내지 못했습니다. 마음을 가다듬고 한 번만 더 마음을 흘려보내 주세요.",
        timestamp: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  // Call Gemini to generate a 3-sentence counseling summary
  const handleGetSummary = async () => {
    const userMsgs = messages.filter((m) => m.role === "user");
    if (userMsgs.length === 0) {
      alert("선생님, 아직 나눈 고민 이야기가 부족해 핵심 요약을 지어낼 수 없습니다. 먼저 마음의 속앓이를 몇 글자 털어놓아 주시면 감사하겠습니다.");
      return;
    }

    try {
      setLoadingSummary(true);
      setShowSummaryModal(true);
      setSummary(null);

      const res = await fetch("/api/chat/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages })
      });

      if (res.ok) {
        const data = await res.json();
        setSummary(data.summary);
      } else {
        throw new Error("Failed to load summary");
      }
    } catch (err) {
      console.error("Failed to generate dialogue summary:", err);
      setSummary([
        "대화의 긴 흐름 속에서 교직 업무의 정서적 피로 인자와 관계상의 긴장감들이 수놓아지고 있습니다.",
        "악성 민원이나 교권 마찰이 있을 때는 즉각 대응하기보다 마음에 방어막을 덧대는 보호작업이 급선무입니다.",
        "토닥과의 안전한 상담 기록장을 활용해 내면의 생채기를 하나씩 다듬으며 극복의 나침반을 설계하고 계십니다."
      ]);
    } finally {
      setLoadingSummary(false);
    }
  };

  // Start a fresh counseling session
  const handleNewSession = () => {
    setCurrentSessionId(null);
    setMessages([INITIAL_WELCOME_MESSAGE(selectedEmotions)]);
  };

  // Load a historic session from past history
  const handleLoadSession = async (sess: CounselingSession) => {
    setCurrentSessionId(sess.id);
    setMessages(sess.messages);
  };

  // Delete session from database
  const handleDeleteSession = async (e: MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("선생님, 이 소중한 상담 일지를 상담소 서랍에서 지우시겠습니까?")) return;

    try {
      const res = await fetch(`/api/sessions/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        if (currentSessionId === id) {
          handleNewSession();
        }
        fetchSessions();
      }
    } catch (err) {
      console.error("Failed to delete session:", err);
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-12 max-w-7xl mx-auto items-stretch">
      
      {/* 1. Live Interactive Counseling Box (Left / Main) */}
      <div className="col-span-12 md:col-span-8 flex flex-col rounded-2xl border border-stone-200 bg-stone-50 overflow-hidden shadow-sm h-[650px]">
        
        {/* Top title bar */}
        <div className="bg-white border-b border-stone-200 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-600 text-stone-50 font-bold shadow-md animate-pulse">
              토닥
            </div>
            <div>
              <h3 className="font-bold text-stone-800 text-xs sm:text-base flex items-center space-x-1.5 px-0.5">
                <span>상담사 토닥 선생님</span>
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
              </h3>
              <p className="text-stone-500 text-xs px-0.5 font-medium truncate max-w-xs sm:max-w-md">
                {selectedEmotions.length > 0 
                  ? `지정된 마음: ${selectedEmotions.join(", ")}`
                  : "현재 마음 귀 기울임 진행 중"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleGetSummary}
              className="flex items-center space-x-1 border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs px-3 py-2 font-bold rounded-xl transition shadow-sm cursor-pointer"
              title="현재 상담 대화를 기반으로 인공지능이 3줄 핵심 요약 보고를 발행합니다"
            >
              <FileText className="h-3.5 w-3.5 text-rose-700" />
              <span className="hidden sm:inline">상담 핵심 요약</span>
              <span className="sm:hidden">요약</span>
            </button>

            <button
              onClick={handleNewSession}
              className="flex items-center space-x-1 rounded-xl bg-teal-50 border border-teal-200 hover:bg-teal-100 text-xs text-teal-800 px-3 py-2 font-bold transition shadow-sm cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>새 위로상담</span>
            </button>
          </div>
        </div>

        {/* Chat Messages flow area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.map((msg) => {
            const isModel = msg.role === "model";
            return (
              <div
                key={msg.id}
                className={`flex items-start ${isModel ? "justify-start" : "justify-end"}`}
              >
                <div className={`flex flex-col space-y-1.5 max-w-[85%] ${isModel ? "items-start" : "items-end"}`}>
                  
                  {/* Bubble label */}
                  <span className="text-[10px] text-stone-400 font-semibold px-1">
                    {isModel ? "토닥 심리상담사" : "선생님"} • {msg.timestamp}
                  </span>

                  {/* Actual Message bubble */}
                  <div
                    className={`rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm whitespace-pre-wrap ${
                      isModel
                        ? "bg-white border border-stone-200 text-stone-800 rounded-tl-none font-serif"
                        : "bg-teal-700 text-stone-50 rounded-tr-none font-sans"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Loading status indicator */}
          {loading && (
            <div className="flex items-start justify-start">
              <div className="flex flex-col space-y-1 max-w-[85%] items-start">
                <span className="text-[10px] text-stone-400 font-semibold px-1">
                  토닥 심리상담사
                </span>
                <div className="rounded-2xl border border-stone-200 bg-white px-4 py-3 shadow-sm rounded-tl-none flex items-center space-x-2 text-stone-500">
                  <RotateCw className="h-3.5 w-3.5 animate-spin text-teal-600" />
                  <span className="text-xs font-semibold">선생님의 슬픔에 따뜻한 연고를 짓는 중입니다...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>

        {/* Suggestion Starter Presets */}
        {messages.length === 1 && (
          <div className="bg-stone-50 border-t border-stone-200/50 p-4 space-y-2">
            <p className="text-[11px] font-bold text-stone-500 flex items-center space-x-1.5">
              <Heart className="h-3.5 w-3.5 text-teal-600 fill-teal-600 animate-pulse" />
              <span>선생님들이 가장 아파하는 교직 실태입니다. 마음 문장을 눌러 속삭여 보세요.</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {STARTER_PRESETS.map((p, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(p.text)}
                  className="rounded-xl border border-stone-200 bg-white hover:border-teal-500 hover:bg-teal-50/20 px-3 py-2 text-xs text-left text-stone-700 transition font-medium flex items-center justify-between gap-1 w-full sm:w-auto cursor-pointer"
                >
                  <span>[{p.tag}] {p.text.slice(0, 36)}...</span>
                  <ArrowRightCircle className="h-3.5 w-3.5 shrink-0 text-stone-400 hover:text-teal-600" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Dynamic User input entry bar */}
        <div className="border-t border-stone-200 bg-white p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(input);
            }}
            className="flex space-x-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="마음에 가득 눌러 담은 피로와 일방적인 응어리를 훌훌 풀어놓으세요..."
              disabled={loading}
              className="flex-1 rounded-xl border border-stone-300 bg-stone-50 px-4 py-2.5 text-sm font-medium text-stone-800 placeholder-stone-400 transition focus:border-teal-600 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-600 focus:ring-offset-0 disabled:bg-stone-100 disabled:text-stone-400"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="rounded-xl bg-teal-700 hover:bg-teal-800 disabled:bg-stone-200 disabled:text-stone-400 p-2.5 text-white/100 shadow-md transition flex items-center justify-center shrink-0 w-11 h-11 cursor-pointer"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>

      {/* 2. Closed-drawer Secure Consultation History Database (Right / Sidebar) */}
      <div className="col-span-12 md:col-span-4 rounded-2xl border border-stone-200 bg-white shadow-sm p-5 flex flex-col h-[650px] overflow-hidden">
        
        {/* Title */}
        <div className="space-y-1 pb-4 border-b border-stone-100 shrink-0">
          <h4 className="font-bold text-stone-800 text-sm sm:text-base flex items-center space-x-1.5 px-0.5">
            <ShieldCheck className="h-5 w-5 text-teal-700" />
            <span>🔒 나의 안전 상담 일지</span>
          </h4>
          <p className="text-xs text-stone-500 px-0.5">
            백엔드 데이터베이스에 격리·보관되는 선생님 한 분만을 위한 상담 서랍장입니다.
          </p>
        </div>

        {/* Back-end Sessions log list */}
        <div className="flex-1 overflow-y-auto pt-3 space-y-2">
          {loadingSessions ? (
            <div className="flex flex-col items-center justify-center h-full text-stone-400 text-xs space-y-2">
              <RotateCw className="h-6 w-6 animate-spin text-teal-600" />
              <span>안전 상담 서랍을 잠금 해제하는 중...</span>
            </div>
          ) : sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-stone-400 text-center p-6 space-y-3">
              <MessageSquare className="h-10 w-10 text-stone-300 animate-pulse" />
              <div className="space-y-1">
                <p className="text-xs font-bold text-stone-600">등록된 상담 일지가 비어 있습니다</p>
                <p className="text-[10px] text-stone-500 leading-relaxed">
                  왼쪽 창에서 속앓이를 털어놓고 한마디 나누시면 자동으로 백엔드 상담 일지에 안전 기안됩니다.
                </p>
              </div>
            </div>
          ) : (
            sessions.map((sess) => {
              const isSelected = sess.id === currentSessionId;
              const dialogueCount = sess.messages.filter(m => m.role === 'user').length;
              return (
                <div
                  key={sess.id}
                  onClick={() => handleLoadSession(sess)}
                  className={`group relative p-3.5 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? "border-teal-600 bg-teal-50/40 ring-1 ring-teal-500/20"
                      : "border-stone-100 hover:border-stone-200 hover:bg-stone-50"
                  }`}
                >
                  <div className="flex-1 min-w-0 pr-6">
                    <h5 className="font-bold text-xs sm:text-sm text-stone-800 truncate leading-tight group-hover:text-teal-900 transition mb-1">
                      {sess.title}
                    </h5>
                    
                    <div className="flex items-center space-x-2 text-[10px] text-stone-400 font-bold">
                      <span className="flex items-center space-x-0.5 text-stone-500">
                        <Calendar className="h-3 w-3 shrink-0" />
                        <span>{sess.date}</span>
                      </span>
                      <span>•</span>
                      <span className="text-teal-700">대화 {dialogueCount}회</span>
                    </div>
                  </div>

                  {/* Deletion button hidden inside server list */}
                  <button
                    onClick={(e) => handleDeleteSession(e, sess.id)}
                    title="상담 기록 영구 삭제"
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 p-2 rounded-lg border border-stone-200 bg-white hover:bg-rose-50 hover:border-rose-200 text-stone-400 hover:text-rose-600 transition opacity-0 group-hover:opacity-100 shadow-sm cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Security Alert notice footer */}
        <div className="pt-4 border-t border-stone-100 shrink-0 text-[10px] text-stone-400 leading-relaxed text-center font-semibold">
          💡 토닥의 모든 일지는 외부 통신선 차단, 로컬 세션 해독, 비밀 보장 시스템 하에 원천 관리됩니다. 
        </div>

      </div>

      {/* 3. Counselling Summary Modal Dialog */}
      {showSummaryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-2xl border border-stone-200 bg-white p-6 shadow-2xl flex flex-col space-y-4">
            
            {/* Modal Title bar */}
            <div className="flex items-start justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-rose-50 text-rose-700">
                  <Sparkles className="h-5 w-5 fill-rose-100" />
                </div>
                <div>
                  <h3 className="font-extrabold text-stone-900 text-sm sm:text-base">
                    📝 실시간 상담 3줄 핵심 요약
                  </h3>
                  <p className="text-[10px] text-stone-500 font-bold">
                    토닥 인공지능이 선생님의 속상함을 수렴해 요약해낸 치유 요결입니다.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSummaryModal(false)}
                className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal content body */}
            <div className="flex-1 space-y-3.5 py-2">
              {loadingSummary ? (
                <div className="flex flex-col items-center justify-center py-10 space-y-3">
                  <RotateCw className="h-7 w-7 animate-spin text-rose-600" />
                  <p className="text-xs text-stone-500 font-bold animate-pulse">
                    선생님의 아픈 문장들에서 상처를 걸러내 요약 처방을 조제 중입니다...
                  </p>
                </div>
              ) : summary ? (
                <div className="space-y-3">
                  
                  {/* Summary Bullets */}
                  <div className="space-y-2.5">
                    {summary.map((line, curIdx) => (
                      <div
                        key={curIdx}
                        className="flex items-start gap-3 p-3.5 rounded-xl bg-stone-50/70 border border-stone-100 hover:bg-stone-50 transition"
                      >
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-800 font-mono text-xs font-bold shadow-sm">
                          {curIdx + 1}
                        </span>
                        <p className="text-xs sm:text-sm text-stone-800 leading-relaxed font-semibold mt-0.5 text-left">
                          {line}
                        </p>
                      </div>
                    ))}
                  </div>

                </div>
              ) : (
                <div className="text-center py-6 text-stone-500 text-xs">
                  요약 정보를 성공적으로 산출하지 못했습니다.
                </div>
              )}
            </div>

            {/* Confidential security note footer */}
            <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-2 text-[10px] text-stone-400 font-bold">
              <span>🔒 교직 대화 안전 기밀 보장</span>
              <button
                onClick={() => setShowSummaryModal(false)}
                className="rounded-lg bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs px-4 py-2 transition cursor-pointer"
              >
                진단서 닫기
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
