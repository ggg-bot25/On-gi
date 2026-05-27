import express from "express";
import path from "path";
import dotenv from "dotenv";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Backend JSON Database persistence directories & files
const DATA_DIR = path.join(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const NOTES_FILE = path.join(DATA_DIR, "comfort_notes.json");
const SESSIONS_FILE = path.join(DATA_DIR, "counseling_sessions.json");

const DEFAULT_NOTES = [
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

// Helper to safely read Comfort Notes
function readNotes(): any[] {
  try {
    if (!fs.existsSync(NOTES_FILE)) {
      fs.writeFileSync(NOTES_FILE, JSON.stringify(DEFAULT_NOTES, null, 2), "utf8");
      return DEFAULT_NOTES;
    }
    const raw = fs.readFileSync(NOTES_FILE, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("Error reading comfort notes:", err);
    return DEFAULT_NOTES;
  }
}

// Helper to safely save Comfort Notes
function saveNotes(notes: any[]): void {
  try {
    fs.writeFileSync(NOTES_FILE, JSON.stringify(notes, null, 2), "utf8");
  } catch (err) {
    console.error("Error saving comfort notes:", err);
  }
}

// Helper to safely read Counseling Sessions
function readSessions(): any[] {
  try {
    if (!fs.existsSync(SESSIONS_FILE)) {
      fs.writeFileSync(SESSIONS_FILE, JSON.stringify([], null, 2), "utf8");
      return [];
    }
    const raw = fs.readFileSync(SESSIONS_FILE, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("Error reading counseling sessions:", err);
    return [];
  }
}

// Helper to safely save Counseling Sessions
function saveSessions(sessions: any[]): void {
  try {
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(sessions, null, 2), "utf8");
  } catch (err) {
    console.error("Error saving counseling sessions:", err);
  }
}

// Lazy initialization of Gemini client to prevent startup crash if API key is missing
let aiInstance: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("⚠️ Warning: GEMINI_API_KEY environment variable is not set. Chat will operate in demo/fallback mode.");
    return null;
  }
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiInstance;
}

// System instruction formulated to provide deep psychological solace, structured specifically for South Korean teachers.
const COUNSELOR_SYSTEM_INSTRUCTION = `당신은 대한민국 교사들을 위한 전문 심리 상담사이자 따뜻한 조력자인 '토닥 선생님'입니다.
교사들은 매일 아침부터 저녁까지 학생 지도, 학부모 민원 응대, 거대한 양의 행정 업무(나이스 입력 등), 동료 교사나 관리자와의 관계 등 고도의 감정 노동과 직무 스트레스에 시달립니다.

상담 목표:
- 교사들이 느끼는 번아웃, 공허함, 억울함, 무력감을 온전히 수용하고 '경청'과 '공감'을 통해 상처받은 마음을 위로하는 것.
- 어떤 감정이든 가다듬거나 축소하지 않고 그대로 인정하는 온정적 동반자가 되는 것.

행동 가이드라인:
1. 무조건적인 수용과 경청: 
   - 사용자가 힘든 점을 이야기하면 절대 충고, 조언, 해결책 제시를 서두르지 마세요.
   - "그 상황에서 그렇게 느끼신 건 정말 당연해요", "선생님 탓이 아닙니다", "그 힘든 와중에도 지금까지 교실을 지키느라 얼마나 애쓰셨을지 마음이 아픕니다"와 같이 선생님의 자존감을 보호하고 손을 잡아주는 반응을 제일 먼저 하세요.
2. 실감 나는 교실 현실 이해:
   - 교권 침해, 악성 민원에 대한 불안, 수업을 거부하는 아이, 행정 서류에 깔려 숨 쉬기 어려운 현실 등 교사의 구체적인 생활을 깊이 있게 이해하고 있음을 대화 중간에 보여주세요.
3. 아주 작은 현실적 셀프케어:
   - "오늘 밤에는 퇴근 후 10분 동안 아무 생각 없이 조용한 공간에 앉아 물 한 잔 마셔보세요" 등 지키기 쉬운 초감각적 혹은 심리적 자기 돌봄 팁을 한 가지만 조심스럽게 추천하세요.
4. 다정하고 정중한 높임말:
   - 부드럽고 따뜻하며 사려 깊은 경어를 사용하세요. 문장 끝에는 늘 지지와 연대의 온기가 담기도록 하십시오.
   - 단호하고 딱딱한 말투나 상투적인 템플릿 대답은 피하십시오.`;

// 1. API - Counseling Chat Endpoint
app.post("/api/chat", async (req, res) => {
  const { messages, selectedEmotions } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Messages array is required." });
  }

  const ai = getGeminiClient();

  if (!ai) {
    // Return a thoughtful fallback message when API key is missing so the app doesn't break
    const lastUserMessage = messages[messages.length - 1]?.content || "";
    return res.json({
      role: "model",
      content: `[데모 모드] 안녕하세요, 선생님. 현재 상담소의 AI 엔진(GEMINI_API_KEY)이 연동 준비 중입니다. 
      
하시는 말씀 하나하나 귀담아들었습니다. "${lastUserMessage.slice(0, 30)}..."라고 하신 말씀 속에서 선생님이 그동안 짊어오신 무게와 마음의 피로가 고스란히 느껴져 가슴이 아려옵니다. 

지금 이 순간에도 많은 생각과 걱정으로 마음이 무거우시겠지만, 선생님은 이미 충분히 훌륭하게 자리를 지켜주고 계십니다. 

(💡 이 서비스의 원활한 AI 상담을 진행하려면 우측 상단의 'Settings' > 'Secrets'에 GEMINI_API_KEY를 추가해 주시면 토닥 선생님과 깊은 이야기를 나누실 수 있습니다.)`,
      isDemo: true
    });
  }

  try {
    // Format the incoming React state messages into standard Google GenAI contents
    const contents = messages.map((msg: any) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }]
    }));

    // Inject contextual warmth based on selected emotions on the very first turn
    if (selectedEmotions && selectedEmotions.length > 0 && contents.length === 1) {
      contents[0].parts[0].text = `[작성자 선택 상태: 현재 감정 및 고민 요인 - ${selectedEmotions.join(", ")}]\n\n실제 고민 사연:\n${contents[0].parts[0].text}`;
    }

    // Dynamic Teacher Distress Profiler Integration for Adaptive Solace
    const sessions = readSessions();
    let stressContextPrompt = "";
    if (sessions.length > 0) {
      let complaintsCount = 0;
      let workloadCount = 0;
      let teachingCount = 0;
      let burnoutCount = 0;
      let userTexts: string[] = [];

      sessions.forEach(s => {
        if (s.messages) {
          s.messages.forEach((m: any) => {
            if (m.role === 'user') userTexts.push(m.content);
          });
        }
      });

      const allText = userTexts.join(" ");
      ["학부모", "민원", "전화", "엄마", "아빠", "연락", "항의", "오해"].forEach(k => {
        complaintsCount += (allText.match(new RegExp(k, "gi")) || []).length;
      });
      ["업무", "나이스", "기안", "공문", "서류", "행정", "야근", "초과"].forEach(k => {
        workloadCount += (allText.match(new RegExp(k, "gi")) || []).length;
      });
      ["아이", "학생", "수업", "지각", "말썽", "훈육", "통제", "생활지도"].forEach(k => {
        teachingCount += (allText.match(new RegExp(k, "gi")) || []).length;
      });
      ["번아웃", "탈진", "사표", "출근", "눈물", "힘들", "지침", "우울"].forEach(k => {
        burnoutCount += (allText.match(new RegExp(k, "gi")) || []).length;
      });

      const maxVal = Math.max(complaintsCount, workloadCount, teachingCount, burnoutCount);
      let peak = "전반적인 피로 및 감정적 소모";
      if (maxVal > 0) {
        if (maxVal === complaintsCount) peak = "학부모 악성 민원 마찰 및 관계 소통";
        else if (maxVal === workloadCount) peak = "나이스 기안 및 공문서 등 잡무 과다";
        else if (maxVal === teachingCount) peak = "실질적 학생 교실 통제 및 생활지도 상의 보람 차질";
        else if (maxVal === burnoutCount) peak = "정서적/신체적 탈진 및 의욕 상실 (번아웃)";
      }

      stressContextPrompt = `\n\n[🚨 내담 교사 실시간 마음 분석 프로필]:
선생님의 상담 데이터 분류 결과, 현재 주된 스트레스 요인은 '${peak}'(으)로 확인되었습니다. 
대화 진행 시 이 약점을 세밀히 파악하여 섣부른 방안보다는 해당 어려움에 적조한 정서적 지지와 지대한 공감을 표현해 주세요.`;
    }

    const finalSystemInstruction = COUNSELOR_SYSTEM_INSTRUCTION + stressContextPrompt;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction: finalSystemInstruction,
        temperature: 0.8,
      }
    });

    const replyText = response.text || "선생님, 마음이 너무 깊어 적당한 위로를 아직 찾지 못했나 봅니다. 조용히 선생님의 곁에 머물며 경청하겠습니다.";
    return res.json({
      role: "model",
      content: replyText,
      isDemo: false
    });

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return res.status(500).json({
      error: "상담 중 원활하게 연결되지 못했습니다.",
      details: error.message
    });
  }
});

// 1.5. API - Counseling Chat Summary Endpoint (3-line analysis)
app.post("/api/chat/summary", async (req, res) => {
  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Messages list is required for summary." });
  }

  // Filter messages to represent the dialogue
  const chatText = messages
    .map((m: any) => `${m.role === "user" ? "선생님" : "토닥 상담사"}: ${m.content}`)
    .join("\n");

  const ai = getGeminiClient();
  if (!ai) {
    // Demo fallback summary matching counselor character
    return res.json({
      summary: [
        "지속적인 교직 스트레스와 업무적 긴장으로 인해 정서적 피로가 매우 누적된 상태입니다.",
        "특히 마음 쓰이는 상황이나 교권 침해적 마찰 하에서 심리적 임계치에 다다랐음을 대화가 증명해 줍니다.",
        "지금은 타박이나 문제 해결보다 선생님 자신의 마음 보호막을 한 겹 덧대는 수용적 돌봄이 정답입니다."
      ],
      isDemo: true
    });
  }

  try {
    const prompt = `아래 교육자 상담 대화 내용을 바탕으로 선생님의 현재 고민과 정서적 마음 상태를 요약해 주세요.
반드시 정확히 3줄(3문장)의 직관적이고 따뜻하며 객관적인 핵심 요약으로 반환해 주세요.
각 항목은 이모지 없이 정중한 한국어 서술형(~입니다. ~하고 있습니다. ~가 절실합니다. 등)으로 깔끔하게 정리해 주십시오.

반드시 아래 JSON 형식을 그대로 준수해서 응답하십시오:
{
  "summary": [
    "첫 번째 핵심 요약 문장",
    "두 번째 핵심 요약 문장",
    "세 번째 핵심 요약 문장"
  ]
}

대화 내용:
---
${chatText.slice(0, 3000)}
---`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.6,
      }
    });

    const parsed = JSON.parse(response.text?.trim() || "{}");
    if (parsed.summary && Array.isArray(parsed.summary)) {
      return res.json({ summary: parsed.summary, isDemo: false });
    } else {
      throw new Error("Invalid output format from Gemini");
    }
  } catch (error: any) {
    console.error("Gemini summary error:", error);
    return res.json({
      summary: [
        "심리 공간에 들어와 이야기 나누시면서 내면에 억눌려있던 피로 인자들이 한꺼번에 분출되기 시작했습니다.",
        "업무, 민원 혹은 학생 관리 등 전방위적 자극에 대한 긴급 차단과 휴식이 가장 좋은 주약입니다.",
        "상담 일지에 기록을 정성스레 수록한 것부터가 스스로를 돌보기 위한 용기 있는 첫걸음입니다."
      ],
      isDemo: true
    });
  }
});

// 2. API - Daily Mind Vitamin (Self-care prescriptions tailored to teacher burnout)
app.post("/api/mind-vitamin", async (req, res) => {
  const { emotion } = req.body;
  const ai = getGeminiClient();

  if (!ai) {
    const fallbacks: Record<string, string> = {
      "업무 과다": "교무실 책상 위에 작은 초록색 잎사귀 하나를 시선이 닿는 곳에 놓아보세요. 서류 뭉치 사이에서 잠시 눈을 정화해줄 작은 쉼표가 될 거예요.",
      "학부모 갈등": "전화와 민원은 교사 개인이 아닌 '학교라는 자리'를 향한 것입니다. 온전히 선생님의 인격을 향한 비난이 아님을 기억하세요. 퇴근과 동시에 연락처 알림을 완전히 꺼두세요.",
      "학생 지도": "그 어떤 위대한 스승도 모든 아이를 단번에 변화시킬 순 없었습니다. 오늘 교실 속에서 작은 말썽을 피운 아이와 선생님 사이에 '그럼에도 살아있는 미소 한 자락'만 찾아보세요.",
      "공허함 / 무력감": "온 에너지를 교실에 쏟고 퇴근하면 껍데기만 남은 듯 공허합니다. 집 현관문을 열기 전 시원한 공기를 세 번 깊이 들이마시며 '오늘의 영혼'을 다시 나에게 채워 넣으세요.",
      "번아웃 / 체력 방전": "오늘은 퇴근 후 채점도, 내일 수업 준비도 조금은 미뤄두고 따듯한 물로 샤워를 한 후, 수건으로 머리를 감싸고 제일 푹신한 이불 속에 뛰어드는 일만 목표로 삼아보세요."
    };
    const defaultFallback = "퇴근 후 교문을 벗어날 때, 어깨에 매달린 모든 생각의 보따리를 교문에 잠시 걸어두고 가벼운 걸음으로 집으로 향해 보세요.";
    return res.json({
      vitamin: fallbacks[emotion] || defaultFallback,
      isDemo: true
    });
  }

  try {
    const prompt = `선생님께서 지금 '${emotion}'이라는 감정을 느끼며 매우 지쳐하십니다. 
지금 이 감정 상태에 꼭 필요한 단 두 줄 분량의 '마음 처방 비타민(짧지만 깊은 위로와 극사실적인 일상적 셀프케어 제안)'을 정성스럽게 작성해 주세요. 
친절하고 섬세하며 신뢰도 높은 어투로 작성하시고, 번호나 수식어 없이 한두 문장의 완성된 편지글 형태로 돌려주세요.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "당신은 따뜻하고 전문적인 심리 치료사입니다. 교사의 번아웃과 감정의 핵심을 정확히 꿰뚫어 보며, 부드럽고 가슴을 울리는 따분하지 않은 시적인 마음 비타민을 한두 줄로 선물합니다.",
        temperature: 0.9,
      }
    });

    return res.json({
      vitamin: response.text?.trim() || "지금은 어떤 생각도 하지 않고 고요한 침묵을 선물하는 시간을 보내시는 걸 추천드립니다.",
      isDemo: false
    });
  } catch (err: any) {
    console.error("Mind Vitamin Error:", err);
    return res.json({
      vitamin: "선생님의 지친 발밑에 따뜻한 햇볕 한 줌이 깃들길 바랍니다. 잠시 가벼운 한숨을 내쉬어 보세요.",
      isDemo: true
    });
  }
});

// 3. API - GET Comfort Notes
app.get("/api/notes", (req, res) => {
  const notes = readNotes();
  // Return sorted by newer posts first
  const sortedNotes = [...notes].sort((a, b) => b.id.localeCompare(a.id));
  return res.json(sortedNotes);
});

// 4. API - POST Create Comfort Note
app.post("/api/notes", (req, res) => {
  const { text, author, date } = req.body;
  if (!text) {
    return res.status(400).json({ error: "Content is required." });
  }

  const notes = readNotes();
  const newNote = {
    id: `note-${Date.now()}`,
    text: text.trim(),
    author: author?.trim() || "익명 선생님",
    date: date || new Date().toLocaleDateString("ko-KR"),
    likes: 0
  };

  notes.unshift(newNote);
  saveNotes(notes);
  return res.json(newNote);
});

// 5. API - POST Like Comfort Note
app.post("/api/notes/:id/like", (req, res) => {
  const { id } = req.params;
  const notes = readNotes();
  const noteIndex = notes.findIndex((n) => n.id === id);

  if (noteIndex === -1) {
    return res.status(404).json({ error: "Note not found." });
  }

  notes[noteIndex].likes = (notes[noteIndex].likes || 0) + 1;
  saveNotes(notes);
  return res.json(notes[noteIndex]);
});

// 6. API - GET All Counseling Sessions
app.get("/api/sessions", (req, res) => {
  const sessions = readSessions();
  // Return sorted by date/time (most recent first)
  const sortedSessions = [...sessions].sort((a, b) => b.id.localeCompare(a.id));
  return res.json(sortedSessions);
});

// 7. API - GET Specific Counseling Session
app.get("/api/sessions/:id", (req, res) => {
  const { id } = req.params;
  const sessions = readSessions();
  const session = sessions.find((s) => s.id === id);
  if (!session) {
    return res.status(404).json({ error: "Session not found." });
  }
  return res.json(session);
});

// 8. API - POST Save/Update Counseling Session
app.post("/api/sessions", (req, res) => {
  const { id, title, emotions, messages } = req.body;
  
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Messages list is required." });
  }

  const sessions = readSessions();
  const existingIndex = sessions.findIndex((s) => s.id === id);

  const finalId = id || `session-${Date.now()}`;
  const defaultTitle = emotions && emotions.length > 0
    ? `${emotions.join(", ")} 상담`
    : `상담 대화 (${new Date().toLocaleDateString("ko-KR")})`;

  const sessionObj = {
    id: finalId,
    title: title || defaultTitle,
    date: new Date().toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }),
    emotions: emotions || [],
    messages: messages
  };

  if (existingIndex !== -1) {
    sessions[existingIndex] = sessionObj;
  } else {
    sessions.push(sessionObj);
  }

  saveSessions(sessions);
  return res.json(sessionObj);
});

// 9. API - DELETE Counseling Session
app.delete("/api/sessions/:id", (req, res) => {
  const { id } = req.params;
  let sessions = readSessions();
  const initialLen = sessions.length;
  sessions = sessions.filter((s) => s.id !== id);

  if (sessions.length === initialLen) {
    return res.status(404).json({ error: "Session not found." });
  }

  saveSessions(sessions);
  return res.json({ success: true, message: "상담 기록이 성공적으로 비워졌습니다." });
});

// 10. API - GET Stress Analyzed Report (Heuristics & Gemini AI Cognitive classification with Trend computation)
app.get("/api/analyze", async (req, res) => {
  const sessions = readSessions();
  let userTexts: string[] = [];

  sessions.forEach(s => {
    if (s.messages) {
      s.messages.forEach((m: any) => {
        if (m.role === 'user') {
          userTexts.push(m.content);
        }
      });
    }
  });

  const allText = userTexts.join(" ");

  // Local rule-based analyzer
  let complaintsCount = 0;
  let workloadCount = 0;
  let teachingCount = 0;
  let burnoutCount = 0;

  const complaintsKeywords = ["학부모", "민원", "전화", "엄마", "아빠", "학부모님", "연락", "항의", "오해", "민원인", "전화벨", "악성", "교권", "침해"];
  const workloadKeywords = ["업무", "나이스", "기안", "공문", "서류", "행정", "야근", "초과", "잡무", "기획", "보고서", "부장", "공문서", "결재", "기안서"];
  const teachingKeywords = ["아이", "학생", "수업", "지각", "말썽", "훈육", "통제", "생활지도", "교실", "애들", "지도", "반항", "소란", "아동학대", "고함", "체벌"];
  const burnoutKeywords = ["번아웃", "탈진", "포기", "퇴직", "사표", "출근", "눈물", "힘들", "지침", "우울", "피로", "지쳐", "사직", "정신과", "정신", "스트레스", "가슴이", "심장이"];

  complaintsKeywords.forEach(k => {
    const regex = new RegExp(k, "gi");
    const count = (allText.match(regex) || []).length;
    complaintsCount += count;
  });

  workloadKeywords.forEach(k => {
    const regex = new RegExp(k, "gi");
    const count = (allText.match(regex) || []).length;
    workloadCount += count;
  });

  teachingKeywords.forEach(k => {
    const regex = new RegExp(k, "gi");
    const count = (allText.match(regex) || []).length;
    teachingCount += count;
  });

  burnoutKeywords.forEach(k => {
    const regex = new RegExp(k, "gi");
    const count = (allText.match(regex) || []).length;
    burnoutCount += count;
  });

  const calcScore = (count: number) => Math.min(100, 15 + count * 15);
  const scores = {
    complaints: calcScore(complaintsCount),
    workload: calcScore(workloadCount),
    teaching: calcScore(teachingCount),
    burnout: calcScore(burnoutCount)
  };

  const categoriesMap: Record<string, string> = {
    complaints: "학부모 민원",
    workload: "행정 업무 과다",
    teaching: "학생 생활지도 및 교실 통제",
    burnout: "교직 탈진 (번아웃)"
  };

  let dominant = "burnout";
  let maxScore = -1;
  Object.entries(scores).forEach(([cat, val]) => {
    if (val > maxScore) {
      maxScore = val;
      dominant = cat;
    }
  });

  // Calculate chronological trend data for Recharts line chart
  const chronologicalSessions = [...sessions].sort((a, b) => a.id.localeCompare(b.id));
  const trend = chronologicalSessions.map((sess, idx) => {
    let sCompCount = 0;
    let sWorkCount = 0;
    let sTeachCount = 0;
    let sBurnCount = 0;
    
    if (sess.messages) {
      const sessText = sess.messages
        .filter((m: any) => m.role === 'user')
        .map((m: any) => m.content)
        .join(" ");
        
      complaintsKeywords.forEach(k => {
        sCompCount += (sessText.match(new RegExp(k, "gi")) || []).length;
      });
      workloadKeywords.forEach(k => {
        sWorkCount += (sessText.match(new RegExp(k, "gi")) || []).length;
      });
      teachingKeywords.forEach(k => {
        sTeachCount += (sessText.match(new RegExp(k, "gi")) || []).length;
      });
      burnoutKeywords.forEach(k => {
        sBurnCount += (sessText.match(new RegExp(k, "gi")) || []).length;
      });
    }

    let compBoost = 0;
    let workBoost = 0;
    let teachBoost = 0;
    let burnBoost = 0;
    if (sess.emotions) {
      if (sess.emotions.includes("업무 과다") || sess.emotions.includes("행정 서류")) workBoost += 30;
      if (sess.emotions.includes("학부모 갈등") || sess.emotions.includes("민원전화")) compBoost += 30;
      if (sess.emotions.includes("학생 지도") || sess.emotions.includes("학급 통제")) teachBoost += 30;
      if (sess.emotions.includes("공허함 / 무력감") || sess.emotions.includes("번아웃 / 체력 방전") || sess.emotions.includes("우울")) burnBoost += 30;
    }

    // Return chronological trend node
    const formattedDate = sess.date ? sess.date.replace(/^\d{4}\.\s?/, "") : "05.27";
    return {
      name: `${formattedDate} (${idx + 1}회차)`,
      complaints: Math.min(100, 15 + sCompCount * 15 + compBoost),
      workload: Math.min(100, 15 + sWorkCount * 15 + workBoost),
      teaching: Math.min(100, 15 + sTeachCount * 15 + teachBoost),
      burnout: Math.min(100, 15 + sBurnCount * 15 + burnBoost)
    };
  });

  // If there is only 1 session, prepend a virtual baseline point to make it a line
  if (trend.length === 1) {
    trend.unshift({
      name: "진단 전 (기본)",
      complaints: 15,
      workload: 15,
      teaching: 15,
      burnout: 15
    });
  }

  if (userTexts.length === 0) {
    return res.json({
      analyzed: false,
      totalSessions: 0,
      totalUserMessages: 0,
      scores: { complaints: 15, workload: 15, teaching: 15, burnout: 15 },
      dominantCategory: "기록 없음",
      insight: "선생님, 아직 '토닥 상담소'에서 대화를 나눈 기록이 부족하여 구체적인 분석 프로필을 만들지 못했습니다. 번거로우시겠지만 상담소에서 고민을 한두 문장이라도 나누어 주시면 깊이 있는 스트레스 비중 분류와 마음 분석 보고서를 즉시 전해드리겠습니다.",
      actionPlan: [
        "상담원 토닥 선생님과 첫 대담을 나누어 아픔의 흔적 남기기",
        "마음 진단 탭에서 오늘 느낀 주요 피로 요인 선택해 보기",
        "호흡 탭에서 차분한 마인드 디톡스 세션 완료하기"
      ],
      isDemo: true,
      trend: [
        { name: "05.15 (1회차)", complaints: 20, workload: 45, teaching: 30, burnout: 55 },
        { name: "05.18 (2회차)", complaints: 40, workload: 35, teaching: 45, burnout: 50 },
        { name: "05.22 (3회차)", complaints: 50, workload: 25, teaching: 60, burnout: 40 },
        { name: "05.25 (4회차)", complaints: 75, workload: 30, teaching: 40, burnout: 65 }
      ]
    });
  }

  const ai = getGeminiClient();
  if (ai) {
    try {
      const gPrompt = `선생님의 마음 치유 상담 일지가 수집되었습니다.
아래 텍스트는 선생님이 그동안 털어놓으신 실제 속얘기들입니다:
---
${allText.slice(0, 4000)}
---

이 내용을 바탕으로 깊이 있는 심리 분석 보고서를 교사 맞춤형의 언어로 작성해 주세요.
반드시 아래 JSON 형식을 그대로 준수해서 응답하십시오:
{
  "insight": "이 대화를 바탕으로 한 선생님의 심리 상태 분석. 따듯하면서도 전문적인 심리치료사가 은밀히 건네는 깊은 위로 및 응원과 분석 내용 (교실 실태 조사를 감안하여 3~4문장 정도)",
  "actionPlan": ["추천 행동 치료법 1 (매우 구체적이고 교강사가 실천하기 편한 하루 행동 팁)", "추천 행동 치료법 2", "추천 행동 치료법 3"]
}
반드시 마크다운 코드 블록도 쓰지 말고 순수 JSON 형식의 텍스트 한 가지만 반환해 주십시오.`;

      const gResponse = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: gPrompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.7,
        }
      });

      const parsed = JSON.parse(gResponse.text?.trim() || "{}");
      return res.json({
        analyzed: true,
        totalSessions: sessions.length,
        totalUserMessages: userTexts.length,
        scores,
        dominantCategory: categoriesMap[dominant],
        insight: parsed.insight,
        actionPlan: parsed.actionPlan,
        isDemo: false,
        trend
      });
    } catch (e: any) {
      console.error("Failed to run Gemini analysis prompt:", e);
    }
  }

  // Pure Local Heuristic Prescriptions if Gemini fails or is offline
  const fallbackInsights: Record<string, string> = {
    complaints: "상담 내용을 종합해 보면, 최근 학부모님들과 관계에서 발생한 사소한 오해나 비우호적인 요구가 임계점을 넘겨 선생님의 내면을 크게 흔들어 놓은 것 같습니다. 가슴에 전해진 위협적인 민원이나 차가운 말투가 심리적 방어벽을 낮추어 심장 두근거림이나 억울함을 계속 유발하고 있습니다. 잠시 자신을 그 전화번호와 학교 공간으로부터 철두철미하게 고립시켜 안전감을 회복해야 합니다.",
    workload: "수업을 기획하고 아이들과 호흡해야 할 에너지가 행정 보조적인 성격의 영혼 없는 문서와 업무들로 인해 바닥을 드러내 보이고 있습니다. '내가 일용직 공무원인가' 하는 주객전도의 회의감이 고스란히 마음을 덮쳤습니다. 지금은 일시적으로 행정적 기안에서 완급조절을 취하고, 교탁 위의 모든 의무를 잠시 단순화하는 '포기적 멈춤'이 필요합니다.",
    teaching: "교실 통제가 한계에 다다르고, 아이들의 사소한 반항이나 삐뚤어진 수업 태도가 교사로서의 전반적인 직무 효능감과 내면의 애정을 크게 갉아먹고 있는 것 같습니다. '내가 아이들을 바르게 기르지 못하고 있나'라는 무력감은 지극히 훌륭한 교사들이 통과의례처럼 겪는 마음의 열 감기입니다. 교실에서의 모든 문제를 홀로 책임지려는 습관을 잠시 털어내야 합니다.",
    burnout: "정신적, 육체적 기력이 아주 미미한 수준까지 닳아버려 매일 아침 출근하는 발걸음조차 무거운 무중력 상태의 번아웃을 지나고 계십니다. 열정을 마구 인출만 하며 영혼의 충전을 등한시한 기간이 짙게 수반되었습니다. 지금은 어떠한 반성이나 더 나은 수업 기획도 정지하고, 오직 따뜻한 숙면과 스스로를 부둥켜안는 수용적 충전만이 절대적인 국면입니다."
  };

  const fallbackActionPlans: Record<string, string[]> = {
    complaints: [
      "퇴근 후에는 업무용 메신저 전송을 일절 정지하고, 알람 차단을 선언해 전력 일탈을 맞이하세요.",
      "학부모의 모든 지적은 '자리가 주는 비난'일 뿐, '선생님 인격에 대한 훼손'이 아님을 마음에 거울을 비추어 되뇌세요.",
      "두려웠던 전화 통화 기안을 적정 메모 위주로 격리하여 교장실/교무실에 선제 공유하고 보호를 요청하세요."
    ],
    workload: [
      "모든 결재의 기한을 오늘 당장보다 내일 모레 등으로 최대한 분배하여 속도를 낮춥니다.",
      "불필요한 행사 참가에 대해 완곡하고 논리적인 포기를 표명해 보세요.",
      "내 일이 아닌 타 부서의 행정 조작에 대해 책임의 범위를 교무용 매뉴얼대로 명확히 구분 지으세요."
    ],
    teaching: [
      "한 시간에 10번 소리칠 것을 다음 시간엔 단 2번에 머무르는 조용한 교법(묵음의 기법)을 차용하세요.",
      "나를 힘들게 하는 문제 학생의 지도 권한을 담임 중심에서 학교 관리자 측으로 적극 연계 분배하세요.",
      "말썽을 피우는 아이 한두 명의 방해로 인해 오늘의 정성껏 구성한 40분 가치 수업 전체를 실패라 부르지 마세요."
    ],
    burnout: [
      "수업 주안점 기안을 아주 평이하고 가벼운 교재 위주로 대체하여 내외적 소모를 즉각 줄입니다.",
      "집에 가서는 교실 이야기, 학생 이름, 교육 뉴스 정보를 24시간 완전히 망각하는 미디어 디톡스를 개시하세요.",
      "주말에는 지친 턱선을 받쳐줄 따끔하고 정겨운 향의 입욕제나 따듯한 족욕으로 근육 통증을 풀어내세요."
    ]
  };

  return res.json({
    analyzed: true,
    totalSessions: sessions.length,
    totalUserMessages: userTexts.length,
    scores,
    dominantCategory: categoriesMap[dominant],
    insight: fallbackInsights[dominant] || "모든 감정이 과부하에 직면해 있습니다. 삶의 다양한 분야에서 일시적인 전원을 끄고 자신을 돌보는 것이 절실합니다.",
    actionPlan: fallbackActionPlans[dominant] || ["인위적으로 한숨 돌리기", "차 한잔의 여유 채우기", "퇴근 후 30분 산책"],
    isDemo: true,
    trend
  });
});

// Configure Vite middleware in development or serve built assets in production
async function runServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[토닥토닥 교실 Server] Running on http://localhost:${PORT}`);
  });
}

runServer().catch((err) => {
  console.error("Failed to start server:", err);
});
