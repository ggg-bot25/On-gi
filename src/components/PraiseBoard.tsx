import { useState, useEffect, FormEvent } from "react";
import { ComfortNote } from "../types";
import { Heart, PlusCircle, User, Calendar, MessageSquareShare } from "lucide-react";

const INITIAL_NOTES: ComfortNote[] = [
  {
    id: "init-1",
    text: "학부모 전화에 종일 심장이 내려앉았던 오늘, 퇴근 가방을 챙기는데 한 아이가 교탁 위에 삐뚤빼뚤 접은 하트 종이접기를 툭 던지고 뛰어갔습니다. 그 종이 한 장에 울컥 주저앉아 한참을 눈물 흘렸네요. 내일 또 힘낼 거리가 생겼습니다.",
    author: "6년차 초등 교사",
    date: "2026.05.27",
    likes: 38
  },
  {
    id: "init-2",
    text: "기안서 반려와 긴급 공문의 압박으로 오늘 제가 교사인지 행정 서기인지 자괴감이 드는 날이었습니다. 하지만 조용히 교무실 구석에서 타 준 동료 선생님의 믹스커피 한 잔에 부푼 숨이 조금은 가라앉았습니다. 혼자가 아님을 느낍니다.",
    author: "중학교 부장 교사",
    date: "2026.05.26",
    likes: 27
  },
  {
    id: "init-3",
    text: "학교에서 일어난 차가운 마찰은 다른 직장인이나 가족들에게 말해도 깊게 공감받기가 참 힘들더라고요. '네가 너무 과민한 거 아니냐'는 말을 들을 때 상처받는데, 이 공간에 올라오는 사연들을 보니 모두가 견뎌내는 무거운 전투였네요. 늘 연대하고 위로를 보냅니다.",
    author: "고등학교 새내기 교사",
    date: "2026.05.25",
    likes: 54
  },
  {
    id: "init-4",
    text: "모든 아이들이 하교한 오후 5시, 고요 속의 불 꺼진 교실을 천천히 서성여 봅니다. 오늘 쏟았던 열정만큼 텅 비어있지만, 그만큼 채워질 내일의 여지도 충분한 공간입니다. 선생님들, 오늘 교문을 나설 때 어깨에 가득 찬 짐은 그대로 교실 서랍에 걸고 가세요.",
    author: "15년차 초등 부장",
    date: "2026.05.24",
    likes: 42
  }
];

export default function PraiseBoard() {
  const [notes, setNotes] = useState<ComfortNote[]>([]);
  const [newText, setNewText] = useState("");
  const [newAuthor, setNewAuthor] = useState("");
  const [loading, setLoading] = useState(false);

  // Fetch Comfort Notes on load
  const fetchNotes = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/notes");
      if (res.ok) {
        const data = await res.json();
        setNotes(data);
      }
    } catch (err) {
      console.error("Failed to load notes from backend:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const handleLike = async (id: string) => {
    try {
      // Optimistic update
      setNotes((prevNotes) =>
        prevNotes.map((note) =>
          note.id === id ? { ...note, likes: note.likes + 1 } : note
        )
      );

      const res = await fetch(`/api/notes/${id}/like`, {
        method: "POST",
      });
      if (res.ok) {
        const updatedNote = await res.json();
        // Sync with exact server count
        setNotes((prevNotes) =>
          prevNotes.map((note) => (note.id === id ? updatedNote : note))
        );
      }
    } catch (err) {
      console.error("Failed to like note on server:", err);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!newText.trim()) return;

    const bodyData = {
      text: newText.trim(),
      author: newAuthor.trim() || undefined,
      date: new Date().toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
      }).replace(/\. /g, ".").replace(/\.$/, "")
    };

    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyData)
      });

      if (res.ok) {
        const createdNote = await res.json();
        setNotes((prev) => [createdNote, ...prev]);
        setNewText("");
        setNewAuthor("");
      }
    } catch (err) {
      console.error("Failed to write to database:", err);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center space-y-3">
        <span className="inline-flex items-center space-x-1.5 rounded-full bg-teal-100 px-3 py-1 text-xs font-semibold text-teal-800">
          <MessageSquareShare className="h-3.5 w-3.5" />
          <span>동료 교사 마음 나눔판</span>
        </span>
        <h2 className="text-2xl font-bold tracking-tight text-stone-800 sm:text-3xl">
          따스한 한마디, 마음의 손길
        </h2>
        <p className="mx-auto max-w-xl text-stone-600 text-sm">
          같은 무게를 온몸으로 견디고 있는 익명의 동료 교사들과 따뜻한 한마디를 나눠 보세요. <br />
          마음에 와닿는 익명의 글에 하트를 눌러 연대의 따스함을 전하세요.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-12">
        {/* Left Side: Create Comfort Note Form */}
        <div className="md:col-span-4 h-fit sticky top-20 rounded-2xl border border-stone-200 bg-stone-50 p-5 md:p-6 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-stone-800 flex items-center space-x-1.5">
            <PlusCircle className="h-4 w-4 text-teal-700" />
            <span>나의 마음 한 조각 보태기</span>
          </h3>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-stone-600 mb-1.5">
                수식어/작성자 칭호 (예: 5년차 초등교사)
              </label>
              <input
                type="text"
                value={newAuthor}
                onChange={(e) => setNewAuthor(e.target.value)}
                placeholder="어떤 선생님으로 남을까요?"
                maxLength={20}
                className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs font-medium text-stone-800 transition focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-600 mb-1.5">
                동료에게 보내는 위로나 나의 오늘 하소연
              </label>
              <textarea
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                rows={5}
                required
                maxLength={400}
                placeholder="지친 오늘 하루를 회고하거나 동료 선생님들께 건넬 부드러운 손편지를 적어주세요. 교사님들이 보며 한껏 숨을 수 있는 공간입니다..."
                className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs font-medium text-stone-800 transition focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600 resize-none leading-relaxed"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-teal-700 hover:bg-teal-800 py-2.5 text-xs font-bold text-stone-50 shadow-md cursor-pointer transition"
            >
              마음 나누기 등록
            </button>
          </form>
        </div>

        {/* Right Side: Virtual Board Grid */}
        <div className="md:col-span-8 grid gap-4 sm:grid-cols-2">
          {notes.map((note) => (
            <div
              key={note.id}
              className="rounded-2xl border border-stone-100 bg-white p-5 flex flex-col justify-between space-y-4 shadow-sm hover:shadow-md transition-all group"
            >
              {/* Note Content */}
              <p className="text-stone-700 leading-relaxed font-serif text-xs sm:text-sm whitespace-pre-line italic">
                "{note.text}"
              </p>

              {/* Note Metadata */}
              <div className="flex items-center justify-between border-t border-stone-100 pt-3 text-[10px] text-stone-400 font-semibold">
                <div className="flex items-center space-x-3">
                  <span className="flex items-center space-x-1">
                    <User className="h-3 w-3 text-stone-500" />
                    <span>{note.author}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Calendar className="h-3 w-3" />
                    <span>{note.date}</span>
                  </span>
                </div>

                {/* Like Button */}
                <button
                  onClick={() => handleLike(note.id)}
                  className="flex items-center space-x-1 rounded-full bg-stone-50 hover:bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-stone-500 hover:text-rose-600 border border-stone-200 transition cursor-pointer"
                >
                  <Heart className="h-3.5 w-3.5 fill-none group-hover:scale-110 transition duration-150" />
                  <span>{note.likes}</span>
                </button>
              </div>
            </div>
          ))}

          {notes.length === 0 && (
            <div className="col-span-2 text-center py-12 text-stone-400 text-sm font-semibold">
              이 칠판에 아직 남긴 마음이 없습니다. 선생님께서 첫 깃발을 꽂아보시면 어떨까요?
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
