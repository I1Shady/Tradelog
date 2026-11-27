
import { useEffect, useRef, useState } from "react";

import {
  Mic,
  Square,
  Play,
  Pause,
  RotateCcw,
  Upload,
  FileAudio,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  ArrowRight,
  Brain,
  Save,
  Pencil,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { TRADE_PROMPT } from "@/lib/prompts";


const API_BASE_URL = import.meta.env.VITE_API_URL;

type RecordingStatus =
  | "idle"
  | "recording"
  | "recorded"
  | "processing"
  | "completed"
  | "error";

interface TradeDraft {
  symbol: string;
  exchange: string | null;
  timeframe: string | null;
  side: "LONG" | "SHORT";
  entry_price: number | null;
  margin: number | null;
  leverage: number | null;
  order_value: number | null;
  order_type: string | null;
  mental: string | null;
  strategy: string | null;
  mistakes: string | null;
  checklist: {
    volume: boolean;
    time: boolean;
    trend: boolean;
    btc: boolean;
  };
  notes: string | null;
  stop_loss: number | null;
  take_profit: number | null;
  position_pct: number | null;
  pnl_amount: number | null;
  pnl_currency: string | null;
  pnl_result: string | null;
}

const EMPTY_TRADE: TradeDraft = {
  symbol: "",
  exchange: null,
  timeframe: null,
  side: "LONG",
  entry_price: null,
  margin: null,
  leverage: null,
  order_value: null,
  order_type: null,
  mental: null,
  strategy: null,
  mistakes: null,
  checklist: {
    volume: false,
    time: false,
    trend: false,
    btc: false,
  },
  notes: null,
  stop_loss: null,
  take_profit: null,
  position_pct: null,
  pnl_amount: null,
  pnl_currency: null,
  pnl_result: null,
};

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(
    remaining
  ).padStart(2, "0")}`;
}

const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]);
    };

    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

function parseAIResponse(result: unknown): TradeDraft {
  let value = result as Record<string, unknown>;

  if (typeof result === "string") {
    const cleaned = result
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    value = JSON.parse(cleaned);
  }

  if (value && typeof value === "object") {
    if (typeof value.output === "string") {
      return parseAIResponse(value.output);
    }

    if (typeof value.content === "string") {
      return parseAIResponse(value.content);
    }

    if (value.trade && typeof value.trade === "object") {
      value = value.trade as Record<string, unknown>;
    } else if (value.data && typeof value.data === "object") {
      value = value.data as Record<string, unknown>;
    }
  }

  if (!value || typeof value !== "object") {
    throw new Error("Invalid AI response.");
  }

  return {
    ...EMPTY_TRADE,
    ...value,
    checklist: {
      ...EMPTY_TRADE.checklist,
      ...(value.checklist as Record<string, boolean> | undefined),
    },
  } as TradeDraft;
}

function VoiceJournalPage() {
  const [status, setStatus] = useState<RecordingStatus>("idle");

  const [duration, setDuration] = useState(0);

  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const [transcript, setTranscript] = useState("");

  const [error, setError] = useState("");

  const [isPlaying, setIsPlaying] = useState(false);

  const [tradeDraft, setTradeDraft] = useState<TradeDraft | null>(null);

  const [isSaving, setIsSaving] = useState(false);

  const [isEditing, setIsEditing] = useState(true);

  const [saved, setSaved] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const streamRef = useRef<MediaStream | null>(null);

  const chunksRef = useRef<Blob[]>([]);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
      }

      streamRef.current?.getTracks().forEach((track) => {
        track.stop();
      });

      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const startRecording = async () => {
    try {
      setError("");
      setTranscript("");
      setTradeDraft(null);
      setSaved(false);
      setDuration(0);
      setAudioBlob(null);

      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
        setAudioUrl(null);
      }

      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error(
          "Microphone access requires HTTPS or localhost."
        );
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;

      const mimeType = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/mp4",
      ].find((type) => MediaRecorder.isTypeSupported(type));

      const recorder = new MediaRecorder(
        stream,
        mimeType ? { mimeType } : undefined
      );

      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });

        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        setStatus("recorded");

        stream.getTracks().forEach((track) => {
          track.stop();
        });

        streamRef.current = null;
      };

      recorder.start(1000);

      setStatus("recording");

      timerRef.current = window.setInterval(() => {
        setDuration((previous) => previous + 1);
      }, 1000);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to access microphone."
      );

      setStatus("error");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }

    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const togglePlayback = async () => {
    const audio = audioRef.current;

    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      return;
    }

    try {
      await audio.play();
      setIsPlaying(true);
    } catch {
      setError("Unable to play recording.");
    }
  };

  const resetRecording = () => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }

    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }

    streamRef.current?.getTracks().forEach((track) => {
      track.stop();
    });

    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }

    setAudioBlob(null);
    setAudioUrl(null);
    setTranscript("");
    setTradeDraft(null);
    setDuration(0);
    setError("");
    setIsPlaying(false);
    setIsEditing(true);
    setSaved(false);
    setStatus("idle");

    chunksRef.current = [];
  };

  // STEP 1: Audio to text.
  const transcribeRecording = async () => {
    if (!audioBlob) return;

    try {
      setStatus("processing");
      setError("");

      if (!API_BASE_URL) {
        throw new Error("VITE_API_URL is not configured.");
      }

      const base64Audio = await blobToBase64(audioBlob);

      const response = await fetch(
        `${API_BASE_URL}/api/transcribe`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "X-Requested-With": "XMLHttpRequest",
          },
          body: JSON.stringify({
            audio: base64Audio,
            mimeType: audioBlob.type,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || result.detail || "Transcription failed."
        );
      }

      if (!result.text?.trim()) {
        throw new Error("Whisper returned an empty transcript.");
      }

      setTranscript(result.text);
      setStatus("completed");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Transcription failed."
      );

      setStatus("error");
    }
  };

  // STEP 2: Send transcript and prompt to LLM.
  const handleContinueToAI = async () => {
    if (!transcript.trim()) return;

    try {
      setStatus("processing");
      setError("");
      setTradeDraft(null);

      const response = await fetch(
        `${API_BASE_URL}/api/process-voice`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "X-Requested-With": "XMLHttpRequest",
          },
          body: JSON.stringify({
            transcript,
            prompt: TRADE_PROMPT + transcript,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "AI processing failed."
        );
      }

      const draft = parseAIResponse(
        result.trade ?? result.data ?? result.output ?? result
      );

      setTradeDraft(draft);
      setIsEditing(true);
      setStatus("completed");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "AI processing failed."
      );

      setStatus("completed");
    }
  };

  // Update a draft field.
  const updateField = <K extends keyof TradeDraft>(
    field: K,
    value: TradeDraft[K]
  ) => {
    setTradeDraft((previous) => {
      if (!previous) return previous;

      return {
        ...previous,
        [field]: value,
      };
    });
  };

  // Update checklist.
  const updateChecklist = (
    field: keyof TradeDraft["checklist"],
    value: boolean
  ) => {
    setTradeDraft((previous) => {
      if (!previous) return previous;

      return {
        ...previous,
        checklist: {
          ...previous.checklist,
          [field]: value,
        },
      };
    });
  };

  // STEP 3: Save edited trade to PostgreSQL.
  const saveTrade = async () => {
    if (!tradeDraft) return;

    try {
      setIsSaving(true);
      setError("");

      const payload = {
        ...tradeDraft,
        symbol: tradeDraft.symbol.trim().toUpperCase(),
      };

      if (!payload.symbol) {
        throw new Error("Trade symbol is required.");
      }

      const response = await fetch(
        `${API_BASE_URL}/api/trades`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "X-Requested-With": "XMLHttpRequest",
          },
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Failed to save trade."
        );
      }

      setSaved(true);
      setIsEditing(false);

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to save trade."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const inputClass =
    "w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-blue-400 dark:border-white/10 dark:bg-[#111c30] dark:text-white";

  const labelClass =
    "mb-1.5 block text-xs font-semibold text-slate-500 dark:text-slate-400";

  const renderInput = (
    label: string,
    field: keyof TradeDraft,
    type: "text" | "number" = "text"
  ) => {
    const value = tradeDraft?.[field];

    return (
      <div>
        <label className={labelClass}>{label}</label>

        <input
          type={type}
          step={type === "number" ? "any" : undefined}
          disabled={!isEditing || saved}
          value={value === null || value === undefined ? "" : String(value)}
          onChange={(e) => {
            const nextValue = e.target.value;

            updateField(
              field,
              (type === "number"
                ? nextValue === ""
                  ? null
                  : Number(nextValue)
                : nextValue === ""
                  ? null
                  : nextValue) as TradeDraft[typeof field]
            );
          }}
          className={inputClass}
        />
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-[#F4F6FA] px-4 py-8 text-slate-900 dark:bg-[#111c30] dark:text-white sm:px-6 lg:px-10">
      <div className="mx-auto max-w-5xl">

        {/* Header */}
        <section className="mb-8">
          <div className="mb-3 flex items-center gap-2">
            <span className="size-2 rounded-full bg-emerald-500" />

            <span className="text-[11px] font-bold tracking-[0.18em] text-slate-400">
              VOICE WORKSPACE
            </span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Voice Journal
          </h1>

          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Record your trading session and turn your voice into structured trade data.
          </p>
        </section>

        {/* Recorder and Transcript */}
        <div className="grid gap-6 lg:grid-cols-[1fr_0.85fr]">

          {/* Recorder */}
          <Card className="overflow-hidden rounded-2xl border-slate-200 dark:border-white/10 dark:bg-[#1c2a40]">
            <CardContent className="flex flex-col items-center px-5 py-10">

              <div className="mb-7 flex size-24 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-400/10 dark:text-blue-400">
                {status === "recording" ? (
                  <Mic className="size-9 animate-pulse" />
                ) : (
                  <FileAudio className="size-9" />
                )}
              </div>

              <div className="mb-2 font-mono text-5xl font-bold tabular-nums">
                {formatTime(duration)}
              </div>

              <p className="mb-8 text-xs text-slate-400">
                {status === "recording"
                  ? "Recording in progress..."
                  : status === "processing"
                    ? "Processing..."
                    : status === "completed"
                      ? "Processing completed"
                      : "Ready to record"}
              </p>

              {status === "recording" ? (
                <Button
                  onClick={stopRecording}
                  className="h-12 rounded-xl bg-red-500 px-7 hover:bg-red-600"
                >
                  <Square className="mr-2 size-4 fill-current" />
                  Stop Recording
                </Button>
              ) : status === "processing" ? (
                <Button disabled className="h-12 rounded-xl px-7">
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Processing...
                </Button>
              ) : (
                <Button
                  onClick={startRecording}
                  className="h-12 rounded-xl bg-blue-600 px-7 hover:bg-blue-700"
                >
                  <Mic className="mr-2 size-4" />
                  Start Recording
                </Button>
              )}

              <div className="mt-7 flex flex-wrap justify-center gap-2">
                {audioBlob && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={togglePlayback}
                      className="rounded-xl"
                    >
                      {isPlaying ? (
                        <Pause className="mr-2 size-4" />
                      ) : (
                        <Play className="mr-2 size-4" />
                      )}

                      {isPlaying ? "Pause" : "Listen"}
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={resetRecording}
                      className="rounded-xl"
                    >
                      <RotateCcw className="mr-2 size-4" />
                      Record Again
                    </Button>
                  </>
                )}
              </div>

              {audioUrl && (
                <audio
                  ref={audioRef}
                  src={audioUrl}
                  onEnded={() => setIsPlaying(false)}
                  className="hidden"
                />
              )}

              {status === "recorded" && audioBlob && (
                <div className="mt-8 w-full rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-[#17243a]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileAudio className="size-5 text-blue-500" />

                      <div>
                        <p className="text-sm font-semibold">
                          Recording ready
                        </p>

                        <p className="text-xs text-slate-400">
                          {(audioBlob.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>

                    <CheckCircle2 className="size-5 text-emerald-500" />
                  </div>
                </div>
              )}

              {audioBlob && (
                <Button
                  onClick={transcribeRecording}
                  disabled={status === "processing"}
                  className="mt-5 h-11 w-full rounded-xl"
                >
                  <Upload className="mr-2 size-4" />
                  Transcribe Recording
                </Button>
              )}

            </CardContent>
          </Card>

          {/* Transcript */}
          <Card className="rounded-2xl border-slate-200 dark:border-white/10 dark:bg-[#1c2a40]">
            <CardContent className="p-5">

              <div className="mb-5 flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-400/10 dark:text-violet-400">
                  <FileAudio className="size-5" />
                </div>

                <div>
                  <h2 className="text-sm font-bold">
                    Transcript
                  </h2>

                  <p className="text-xs text-slate-400">
                    Your recognized speech
                  </p>
                </div>
              </div>

              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="Your Persian transcript will appear here..."
                className="min-h-[280px] w-full resize-y rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm leading-7 outline-none focus:border-blue-400 dark:border-white/10 dark:bg-[#111c30]"
                dir="auto"
              />

              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  {transcript.length} characters
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={!transcript}
                  onClick={() => {
                    navigator.clipboard.writeText(transcript);
                  }}
                  className="rounded-xl"
                >
                  Copy Text
                </Button>
              </div>

              {status === "completed" && (
                <div className="mt-5 flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-400">
                  <CheckCircle2 className="size-4 shrink-0" />
                  Transcription completed successfully.
                </div>
              )}

              {error && (
                <div className="mt-5 flex items-start gap-2 rounded-xl bg-red-50 p-3 text-xs text-red-600 dark:bg-red-400/10 dark:text-red-400">
                  <AlertCircle className="mt-0.5 size-4 shrink-0" />
                  {error}
                </div>
              )}

              {/* Send to AI */}
              {transcript.trim() && !tradeDraft && (
                <Button
                  onClick={handleContinueToAI}
                  disabled={status === "processing"}
                  className="mt-6 h-12 w-full rounded-xl bg-blue-600 font-semibold text-white shadow-md shadow-blue-600/20 transition-all hover:bg-blue-700"
                >
                  <Brain className="mr-2 size-4" />
                  Send to AI Processing
                  <ArrowRight className="ml-2 size-4" />
                </Button>
              )}

              <Button
                variant="ghost"
                size="sm"
                disabled={!transcript && !audioBlob}
                onClick={resetRecording}
                className="mt-4 w-full rounded-xl text-slate-500 hover:text-red-500"
              >
                <Trash2 className="mr-2 size-4" />
                Clear Session
              </Button>

            </CardContent>
          </Card>

        </div>

        {/* AI Trade Preview */}
        {tradeDraft && (
          <section className="mt-8">

            <Card className="overflow-hidden rounded-2xl border-slate-200 dark:border-white/10 dark:bg-[#1c2a40]">

              <div className="flex flex-col justify-between gap-4 border-b border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-[#202f46] sm:flex-row sm:items-center">

                <div className="flex items-center gap-3">
                  <div className="flex size-11 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-400/10 dark:text-violet-400">
                    <Brain className="size-5" />
                  </div>

                  <div>
                    <h2 className="font-bold">
                      AI Trade Preview
                    </h2>

                    <p className="text-xs text-slate-400">
                      Review and edit extracted trade information
                    </p>
                  </div>
                </div>

                {!saved && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(!isEditing)}
                    className="rounded-xl"
                  >
                    <Pencil className="mr-2 size-4" />
                    {isEditing ? "Finish Editing" : "Edit Trade"}
                  </Button>
                )}

                {saved && (
                  <span className="flex items-center gap-2 text-sm font-semibold text-emerald-500">
                    <CheckCircle2 className="size-4" />
                    Saved Successfully
                  </span>
                )}

              </div>

              <CardContent className="space-y-7 p-5 sm:p-7">

                {/* Basic Information */}
                <div>
                  <h3 className="mb-4 text-sm font-bold">
                    Basic Information
                  </h3>

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

                    {renderInput("Symbol", "symbol")}

                    {renderInput("Exchange", "exchange")}

                    {renderInput("Timeframe", "timeframe")}

                    <div>
                      <label className={labelClass}>Trade Side</label>

                      <select
                        disabled={!isEditing || saved}
                        value={tradeDraft.side}
                        onChange={(e) =>
                          updateField(
                            "side",
                            e.target.value as "LONG" | "SHORT"
                          )
                        }
                        className={inputClass}
                      >
                        <option value="LONG">LONG</option>
                        <option value="SHORT">SHORT</option>
                      </select>
                    </div>

                    {renderInput("Entry Price", "entry_price", "number")}

                    {renderInput("Order Type", "order_type")}

                  </div>
                </div>

                <div className="border-t border-slate-200 dark:border-white/10" />

                {/* Position Information */}
                <div>
                  <h3 className="mb-4 text-sm font-bold">
                    Position Information
                  </h3>

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

                    {renderInput("Margin", "margin", "number")}

                    {renderInput("Leverage", "leverage", "number")}

                    {renderInput("Order Value", "order_value", "number")}

                    {renderInput("Stop Loss", "stop_loss", "number")}

                    {renderInput("Take Profit", "take_profit", "number")}

                    {renderInput("Position %", "position_pct", "number")}

                  </div>
                </div>

                <div className="border-t border-slate-200 dark:border-white/10" />

                {/* Performance */}
                <div>
                  <h3 className="mb-4 text-sm font-bold">
                    Trade Performance
                  </h3>

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

                    {renderInput("PnL Amount", "pnl_amount", "number")}

                    {renderInput("PnL Currency", "pnl_currency")}

                    {renderInput("Exit Type / Result", "pnl_result")}

                  </div>
                </div>

                <div className="border-t border-slate-200 dark:border-white/10" />

                {/* Strategy */}
                <div>
                  <h3 className="mb-4 text-sm font-bold">
                    Strategy & Psychology
                  </h3>

                  <div className="grid gap-4 sm:grid-cols-2">

                    {renderInput("Mental State", "mental")}

                    {renderInput("Strategy", "strategy")}

                  </div>

                  <div className="mt-4">
                    <label className={labelClass}>Mistakes</label>

                    <textarea
                      disabled={!isEditing || saved}
                      value={tradeDraft.mistakes ?? ""}
                      onChange={(e) =>
                        updateField("mistakes", e.target.value || null)
                      }
                      className={`${inputClass} min-h-24 resize-y`}
                      dir="auto"
                    />
                  </div>
                </div>

                {/* Checklist */}
                <div>
                  <h3 className="mb-4 text-sm font-bold">
                    Trade Checklist
                  </h3>

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">

                    {(
                      [
                        ["volume", "Volume"],
                        ["time", "Timing"],
                        ["trend", "Trend"],
                        ["btc", "BTC Alignment"],
                      ] as const
                    ).map(([key, label]) => (
                      <label
                        key={key}
                        className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 p-3 text-sm dark:border-white/10"
                      >
                        <input
                          type="checkbox"
                          checked={tradeDraft.checklist[key]}
                          disabled={!isEditing || saved}
                          onChange={(e) =>
                            updateChecklist(key, e.target.checked)
                          }
                          className="size-4 accent-blue-600"
                        />

                        {label}
                      </label>
                    ))}

                  </div>
                </div>

                {/* Notes */}
                <div>
                  <h3 className="mb-3 text-sm font-bold">
                    Notes
                  </h3>

                  <textarea
                    disabled={!isEditing || saved}
                    value={tradeDraft.notes ?? ""}
                    onChange={(e) =>
                      updateField("notes", e.target.value || null)
                    }
                    placeholder="Additional trade notes..."
                    className={`${inputClass} min-h-32 resize-y leading-7`}
                    dir="auto"
                  />
                </div>

                {/* Raw JSON */}
                <details className="rounded-xl border border-slate-200 p-4 dark:border-white/10">
                  <summary className="cursor-pointer text-sm font-semibold">
                    View Raw JSON
                  </summary>

                  <pre className="mt-4 overflow-x-auto rounded-lg bg-slate-100 p-4 text-xs leading-6 dark:bg-[#111c30]">
                    {JSON.stringify(tradeDraft, null, 2)}
                  </pre>
                </details>

                {/* Save */}
                {!saved && (
                  <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 dark:border-white/10 sm:flex-row sm:justify-end">

                    <Button
                      variant="outline"
                      onClick={() => setTradeDraft(null)}
                      className="rounded-xl"
                    >
                      Discard
                    </Button>

                    <Button
                      onClick={saveTrade}
                      disabled={isSaving || !tradeDraft.symbol.trim()}
                      className="h-11 rounded-xl bg-emerald-600 px-7 text-white hover:bg-emerald-700"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="mr-2 size-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 size-4" />
                          Confirm & Save Trade
                        </>
                      )}
                    </Button>

                  </div>
                )}

                {saved && (
                  <div className="flex items-center gap-3 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-400">
                    <CheckCircle2 className="size-5 shrink-0" />

                    <div>
                      <p className="font-bold">
                        Trade saved successfully!
                      </p>

                      <p className="mt-1 text-xs">
                        Your trade has been added to the database.
                      </p>
                    </div>
                  </div>
                )}

              </CardContent>
            </Card>

          </section>
        )}

      </div>
    </main>
  );
}

export default VoiceJournalPage;
