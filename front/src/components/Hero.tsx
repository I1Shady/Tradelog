import { useNavigate } from "react-router";
import { ArrowUpRight, Activity, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";

function Hero() {
  const navigate = useNavigate();

  return (
    <main className="relative flex min-h-[calc(100vh-72px)] items-center overflow-hidden bg-[#F4F6FA] px-5 py-16 text-slate-900 transition-colors duration-300 dark:bg-[#111c30] dark:text-white md:px-10">

      <div className="pointer-events-none absolute -right-32 top-10 size-96 rounded-full bg-blue-400/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-20 size-96 rounded-full bg-violet-400/10 blur-3xl" />

      <div className="relative mx-auto grid w-full max-w-6xl items-center gap-14 lg:grid-cols-2 lg:gap-20">

        <section className="flex flex-col items-start">

          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3.5 py-2 text-xs font-semibold tracking-wide text-blue-700 dark:border-blue-400/20 dark:bg-blue-400/10 dark:text-blue-300">
            <span className="size-2 rounded-full bg-emerald-500" />
            YOUR PERSONAL TRADING WORKSPACE
          </div>

          <h1 className="max-w-xl text-5xl font-bold leading-[1.12] tracking-tight sm:text-6xl lg:text-7xl">
            Trade smarter.
            <span className="mt-2 block bg-gradient-to-r from-blue-600 to-violet-500 bg-clip-text text-transparent dark:from-blue-400 dark:to-violet-400">
              Learn every day.
            </span>
          </h1>

          <p className="mt-7 max-w-lg text-base leading-8 text-slate-500 dark:text-slate-400 md:text-lg">
            Every trade tells a story. Track your performance, understand your
            decisions, and build better trading habits with TradeLog.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Button
              onClick={() => navigate("/journal")}
              className="h-12 rounded-xl bg-blue-600 px-6 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition-all hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-600/25"
            >
              Open Journal
              <ArrowUpRight className="ml-2 size-4" />
            </Button>

            <div className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400">
              <Activity className="size-4 text-blue-500" />
              Your trading journey starts here
            </div>
          </div>

          <div className="mt-16 grid w-full max-w-md grid-cols-2 gap-6 border-t border-slate-200 pt-7 dark:border-white/10">
            <div>
              <div className="mb-2 flex items-center gap-2 text-slate-400">
                <BarChart3 className="size-4" />
                <span className="text-xs font-medium">Performance</span>
              </div>
              <p className="text-sm font-semibold">Track your progress</p>
            </div>

            <div>
              <div className="mb-2 flex items-center gap-2 text-slate-400">
                <Activity className="size-4" />
                <span className="text-xs font-medium">Consistency</span>
              </div>
              <p className="text-sm font-semibold">Build better habits</p>
            </div>
          </div>
        </section>

        <section className="relative mx-auto w-full max-w-md lg:max-w-none">

          <div className="absolute -inset-5 rounded-[2rem] bg-gradient-to-br from-blue-500/15 via-violet-500/10 to-transparent blur-2xl" />

          <div className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-white p-3 shadow-2xl shadow-slate-900/10 dark:border-white/10 dark:bg-[#1c2a40] dark:shadow-black/30">

            <div className="relative h-[340px] overflow-hidden rounded-[1.5rem] bg-gradient-to-br from-blue-100 via-violet-100 to-indigo-200 dark:from-[#263e62] dark:via-[#303957] dark:to-[#242b45] sm:h-[420px]">

              <img
                src="Patrick.png"
                alt="Patrick Star"
                className="h-full w-full object-cover object-center"
              />

              <div className="absolute bottom-4 left-4 right-4 rounded-2xl border border-white/50 bg-white/85 p-4 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-[#172033]/85">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  YOUR TRADING COMPANION
                </p>
                <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                  Stay focused. Keep improving.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 px-3 py-4">
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  TradeLog Journal
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Your trades. Your progress.
                </p>
              </div>

              <div className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-400/10 dark:text-blue-400">
                <BarChart3 className="size-5" />
              </div>
            </div>
          </div>

          <div className="absolute -left-5 top-12 hidden rounded-2xl border border-white/70 bg-white px-4 py-3 shadow-xl dark:border-white/10 dark:bg-[#25334a] sm:block">
            <p className="text-xs text-slate-400">Trading mindset</p>
            <p className="mt-1 text-sm font-bold text-slate-800 dark:text-white">
              Progress over perfection
            </p>
          </div>

        </section>
      </div>
    </main>
  );
}

export default Hero;
