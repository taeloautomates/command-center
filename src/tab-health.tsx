import * as React from "react";
import { GlassCard, Row, Col, Label, ProgressBar, Dot } from "./ui";
import { CheckIcon } from "./icons";
import type { HealthMode } from "./types";

function ModeSwitch({ mode, setMode }: { mode: HealthMode; setMode: (m: HealthMode) => void }) {
  return (
    <div className="seg" style={{ padding: 2 }}>
      {(["Resistance", "MMA"] as HealthMode[]).map((m) => (
        <button key={m} className={mode === m ? "on" : ""} onClick={() => setMode(m)}
          style={{ padding: "4px 12px", fontSize: 10, letterSpacing: 0.06, textTransform: "uppercase", fontWeight: 600 }}>
          {m}
        </button>
      ))}
    </div>
  );
}

type Exercise = { name: string; sets: number; reps: number | string; weight: string; status: "done" | "doing" | "queued" };

function ExerciseRow({ ex }: { ex: Exercise }) {
  const isDoing = ex.status === "doing";
  const isDone = ex.status === "done";
  return (
    <Row gap={12} align="center" style={{
      padding: "10px 12px",
      background: isDoing ? "rgba(255,255,255,0.06)" : "transparent",
      border: "1px solid rgba(255,255,255," + (isDoing ? 0.12 : 0) + ")",
      borderRadius: 8, transition: "all 200ms",
    }}>
      <span style={{
        width: 16, height: 16, borderRadius: 50,
        background: isDone ? "rgba(255,255,255,0.86)" : "transparent",
        border: "1px solid rgba(255,255,255," + (isDone ? 0 : isDoing ? 0.42 : 0.18) + ")",
        display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        {isDone && <CheckIcon size={9} opacity={1} stroke={2} />}
        {isDoing && <Dot />}
      </span>
      <span style={{
        flex: 1, fontSize: 13, letterSpacing: -0.005,
        color: isDone ? "rgba(255,255,255,0.42)" : isDoing ? "rgba(255,255,255,0.98)" : "rgba(255,255,255,0.78)",
        textDecoration: isDone ? "line-through" : "none",
        textDecorationColor: "rgba(255,255,255,0.18)",
      }}>{ex.name}</span>
      <span className="mono tabular" style={{ fontSize: 11, color: isDoing ? "rgba(255,255,255,0.86)" : "rgba(255,255,255,0.48)", minWidth: 56, textAlign: "right" }}>
        {ex.sets} × {ex.reps}
      </span>
      <span className="mono tabular" style={{ fontSize: 11, color: isDoing ? "rgba(255,255,255,0.86)" : "rgba(255,255,255,0.48)", minWidth: 56, textAlign: "right" }}>
        {ex.weight}
      </span>
    </Row>
  );
}

function BodyPartChip({ part, active, volume, target }: { part: string; active: boolean; volume: number; target: number }) {
  const pct = (volume / target) * 100;
  return (
    <div style={{
      padding: "10px 12px",
      background: active ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.025)",
      border: "1px solid rgba(255,255,255," + (active ? 0.14 : 0.05) + ")",
      borderRadius: 8,
      boxShadow: active ? "inset 0 1px 0 rgba(255,255,255,0.14)" : "none",
    }}>
      <Row justify="space-between" align="center" style={{ marginBottom: 6 }}>
        <span style={{ fontSize: 11, fontWeight: 500, letterSpacing: 0.04, color: active ? "rgba(255,255,255,0.96)" : "rgba(255,255,255,0.62)", textTransform: "uppercase" }}>{part}</span>
        <span className="mono tabular" style={{ fontSize: 10, color: active ? "rgba(255,255,255,0.62)" : "rgba(255,255,255,0.32)" }}>
          {volume}<span style={{ color: "rgba(255,255,255,0.22)" }}>/{target}</span>
        </span>
      </Row>
      <ProgressBar value={Math.min(pct, 100)} active={active} />
    </div>
  );
}

function MacroBar({ label, current, target, unit }: { label: string; current: number; target: number; unit: string }) {
  const pct = Math.min(100, (current / target) * 100);
  return (
    <Col gap={6}>
      <Row justify="space-between" align="baseline">
        <span style={{ fontSize: 11, letterSpacing: 0.12, color: "rgba(255,255,255,0.38)", textTransform: "uppercase", fontWeight: 500 }}>{label}</span>
        <span>
          <span className="tabular" style={{ fontSize: 16, fontWeight: 600, letterSpacing: -0.01, color: "rgba(255,255,255,0.96)" }}>{current.toLocaleString()}</span>
          <span className="tabular" style={{ fontSize: 11, color: "rgba(255,255,255,0.38)", marginLeft: 4 }}>/ {target.toLocaleString()}{unit}</span>
        </span>
      </Row>
      <ProgressBar value={pct} />
    </Col>
  );
}

function WorkoutSessionCard({ mode, setMode }: { mode: HealthMode; setMode: (m: HealthMode) => void }) {
  const resistanceExercises: Exercise[] = [
    { name: "Bench Press",         sets: 4, reps: 8,  weight: "185 lb", status: "done" },
    { name: "Incline DB Press",    sets: 4, reps: 10, weight: "65 lb",  status: "done" },
    { name: "Overhead Press",      sets: 4, reps: 6,  weight: "115 lb", status: "doing" },
    { name: "Lateral Raise",       sets: 3, reps: 12, weight: "25 lb",  status: "queued" },
    { name: "Triceps Pushdown",    sets: 3, reps: 12, weight: "60 lb",  status: "queued" },
    { name: "Cable Crossover",     sets: 3, reps: 12, weight: "30 lb",  status: "queued" },
  ];
  const mmaExercises: Exercise[] = [
    { name: "Shadowboxing — rounds",     sets: 3, reps: "3 m", weight: "warm-up",  status: "done" },
    { name: "Pad work — boxing combos",  sets: 5, reps: "3 m", weight: "w/ coach", status: "done" },
    { name: "Kick drills — round kicks", sets: 4, reps: "2 m", weight: "heavy bag",status: "doing" },
    { name: "Clinch work — body locks",  sets: 4, reps: "2 m", weight: "partner",  status: "queued" },
    { name: "Positional grappling",      sets: 3, reps: "5 m", weight: "live",     status: "queued" },
    { name: "Conditioning — sprawls",    sets: 5, reps: 20,    weight: "bw",       status: "queued" },
  ];
  const exercises = mode === "MMA" ? mmaExercises : resistanceExercises;

  const resistanceBody = [
    { part: "Chest",     active: true,  volume: 18, target: 20 },
    { part: "Shoulders", active: true,  volume: 12, target: 16 },
    { part: "Triceps",   active: true,  volume: 9,  target: 12 },
    { part: "Back",      active: false, volume: 14, target: 18 },
    { part: "Legs",      active: false, volume: 16, target: 20 },
    { part: "Core",      active: false, volume: 8,  target: 10 },
  ];
  const mmaBody = [
    { part: "Striking",  active: true,  volume: 4, target: 5 },
    { part: "Kicks",     active: true,  volume: 3, target: 4 },
    { part: "Clinch",    active: false, volume: 2, target: 3 },
    { part: "Takedowns", active: false, volume: 1, target: 3 },
    { part: "Ground",    active: false, volume: 2, target: 3 },
    { part: "Cond.",     active: true,  volume: 4, target: 4 },
  ];
  const body = mode === "MMA" ? mmaBody : resistanceBody;

  const done = exercises.filter((e) => e.status === "done").length;
  const sessionTitle = mode === "MMA" ? "Striking + Clinch session" : "Push day — Chest / Shoulders / Triceps";

  return (
    <GlassCard style={{ padding: 22, flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }} clickable>
      <Row justify="space-between" align="center" style={{ marginBottom: 4 }}>
        <Row gap={10}>
          <Label>Workout Session</Label>
          <span className="mono" style={{ fontSize: 10, color: "rgba(255,255,255,0.32)" }}>FRI · MAY 15</span>
        </Row>
        <ModeSwitch mode={mode} setMode={setMode} />
      </Row>
      <Row justify="space-between" align="baseline" style={{ marginTop: 10, marginBottom: 14 }}>
        <span style={{ fontSize: 20, fontWeight: 600, letterSpacing: -0.018, color: "rgba(255,255,255,0.96)" }}>{sessionTitle}</span>
        <Row gap={10}>
          <span className="mono tabular" style={{ fontSize: 11, color: "rgba(255,255,255,0.62)" }}>
            {done}<span style={{ color: "rgba(255,255,255,0.28)" }}>/{exercises.length}</span> done
          </span>
          <span style={{ color: "rgba(255,255,255,0.18)" }}>·</span>
          <span className="mono tabular" style={{ fontSize: 11, color: "rgba(255,255,255,0.38)" }}>42 min in</span>
        </Row>
      </Row>
      <div style={{ marginBottom: 14 }}>
        <Label style={{ marginBottom: 8 }}>{mode === "MMA" ? "Discipline volume — this week" : "Body parts — this week"}</Label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginTop: 8 }}>
          {body.map((b) => <BodyPartChip key={b.part} {...b} />)}
        </div>
      </div>
      <Col gap={6} style={{ marginBottom: 14, flex: 1, minHeight: 0 }}>
        {exercises.map((ex, i) => <ExerciseRow key={i} ex={ex} />)}
      </Col>
      <div style={{ paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <Row gap={28} align="stretch">
          <div style={{ flex: 1 }}><MacroBar label="Calories" current={1840} target={2400} unit="" /></div>
          <div style={{ width: 1, background: "rgba(255,255,255,0.05)" }} />
          <div style={{ flex: 1 }}><MacroBar label="Protein"  current={142}  target={180}  unit="g" /></div>
          <div style={{ width: 1, background: "rgba(255,255,255,0.05)" }} />
          <div style={{ flex: 1 }}><MacroBar label="Water"    current={2.4}  target={3.5}  unit="L" /></div>
        </Row>
      </div>
    </GlassCard>
  );
}

function CardioCard() {
  return (
    <GlassCard style={{ padding: 18 }} clickable>
      <Row justify="space-between" align="center" style={{ marginBottom: 14 }}>
        <Label>Cardio & Movement</Label>
        <span className="mono tabular" style={{ fontSize: 10, color: "rgba(255,255,255,0.32)" }}>this week</span>
      </Row>
      <Row gap={20} style={{ marginBottom: 14 }}>
        <Col gap={4} style={{ flex: 1 }}>
          <span style={{ fontSize: 10, letterSpacing: 0.12, color: "rgba(255,255,255,0.38)", textTransform: "uppercase", fontWeight: 500 }}>Run</span>
          <div className="tabular" style={{ fontSize: 22, fontWeight: 600, letterSpacing: -0.018, color: "rgba(255,255,255,0.96)" }}>
            14.2<span style={{ fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.38)", marginLeft: 4 }}>mi</span>
          </div>
          <ProgressBar value={14.2} max={18} />
          <span className="tabular" style={{ fontSize: 10, color: "rgba(255,255,255,0.38)" }}>of 18 mi target</span>
        </Col>
        <div style={{ width: 1, alignSelf: "stretch", background: "rgba(255,255,255,0.05)" }} />
        <Col gap={4} style={{ flex: 1 }}>
          <span style={{ fontSize: 10, letterSpacing: 0.12, color: "rgba(255,255,255,0.38)", textTransform: "uppercase", fontWeight: 500 }}>Walk</span>
          <div className="tabular" style={{ fontSize: 22, fontWeight: 600, letterSpacing: -0.018, color: "rgba(255,255,255,0.96)" }}>
            38,420<span style={{ fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.38)", marginLeft: 4 }}>steps</span>
          </div>
          <ProgressBar value={38420} max={50000} />
          <span className="tabular" style={{ fontSize: 10, color: "rgba(255,255,255,0.38)" }}>of 50,000 target</span>
        </Col>
      </Row>
      <div style={{ paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <Row gap={4} style={{ marginBottom: 6 }}>
          {[
            { d: "M", run: 0.7, walk: 0.6 }, { d: "T", run: 0.0, walk: 0.5 },
            { d: "W", run: 0.9, walk: 0.7 }, { d: "T", run: 0.4, walk: 0.8 },
            { d: "F", run: 0.6, walk: 0.4 }, { d: "S", run: 0.0, walk: 0.0 },
            { d: "S", run: 0.0, walk: 0.0 },
          ].map((d, i) => (
            <Col key={i} gap={2} style={{ flex: 1, alignItems: "center" }}>
              <div style={{ width: "100%", height: 28, background: "rgba(255,255,255,0.04)", borderRadius: 3, position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: (d.run * 100) + "%", background: "rgba(255,255,255,0.86)" }} />
                <div style={{ position: "absolute", left: 0, right: 0, bottom: (d.run * 100) + "%", height: (d.walk * 35) + "%", background: "rgba(255,255,255,0.32)" }} />
              </div>
              <span style={{ fontSize: 9, color: "rgba(255,255,255,0.32)", letterSpacing: 0.12 }}>{d.d}</span>
            </Col>
          ))}
        </Row>
        <Row gap={12} style={{ marginTop: 8 }}>
          <Row gap={5}><span style={{ width: 8, height: 2, background: "rgba(255,255,255,0.86)", borderRadius: 1 }} /><span style={{ fontSize: 10, color: "rgba(255,255,255,0.38)" }}>run</span></Row>
          <Row gap={5}><span style={{ width: 8, height: 2, background: "rgba(255,255,255,0.32)", borderRadius: 1 }} /><span style={{ fontSize: 10, color: "rgba(255,255,255,0.38)" }}>walk</span></Row>
          <span style={{ flex: 1 }} />
          <span className="tabular" style={{ fontSize: 10, color: "rgba(255,255,255,0.38)" }}>resting HR · 54</span>
        </Row>
      </div>
    </GlassCard>
  );
}

function MiniStatCard({ label, today, todayUnit, week, weekTarget, weekUnit, footer }: {
  label: string; today: number; todayUnit: string; week: number; weekTarget: number; weekUnit: string; footer?: string;
}) {
  const pct = (week / weekTarget) * 100;
  return (
    <GlassCard style={{ padding: 16, flex: 1, display: "flex", flexDirection: "column" }} clickable>
      <Label>{label}</Label>
      <Col gap={2} style={{ marginTop: 10, marginBottom: 12 }}>
        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.38)", letterSpacing: 0.04 }}>today</span>
        <div className="tabular" style={{ fontSize: 24, fontWeight: 600, letterSpacing: -0.02, lineHeight: 1, color: "rgba(255,255,255,0.96)" }}>
          {today}<span style={{ fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.38)", marginLeft: 3 }}>{todayUnit}</span>
        </div>
      </Col>
      <div style={{ flex: 1 }} />
      <Col gap={4} style={{ paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <Row justify="space-between">
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.38)", letterSpacing: 0.04 }}>this week</span>
          <span className="mono tabular" style={{ fontSize: 10, color: "rgba(255,255,255,0.62)" }}>
            {week}<span style={{ color: "rgba(255,255,255,0.22)" }}>/{weekTarget}{weekUnit}</span>
          </span>
        </Row>
        <ProgressBar value={Math.min(pct, 100)} />
        {footer && <span className="tabular" style={{ fontSize: 10, color: "rgba(255,255,255,0.38)", marginTop: 4 }}>{footer}</span>}
      </Col>
    </GlassCard>
  );
}

function WorkoutJournalCard() {
  const entries = [
    { date: "THU · MAY 14", title: "Pull day — felt strong", preview: "Hit a clean 5×5 on deadlifts at 315. Sleep was 7.5h. Eating clean is the difference." },
    { date: "WED · MAY 13", title: "Rest + 4 mi easy",       preview: "Legs were toast from Tuesday. Easy zone-2 only. Stretched 25 min before bed." },
    { date: "TUE · MAY 12", title: "Leg day — heavy squats", preview: "PR territory on back squat. 245 × 3 felt grinding. Form held. Took double protein after." },
  ];
  return (
    <GlassCard style={{ padding: 18, flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }} clickable>
      <Row justify="space-between" align="center" style={{ marginBottom: 12 }}>
        <Label>Workout Journal</Label>
        <span className="mono tabular" style={{ fontSize: 10, color: "rgba(255,255,255,0.32)" }}>14 entries</span>
      </Row>
      <Col gap={0} style={{ flex: 1, minHeight: 0 }}>
        {entries.map((e, i) => (
          <Col key={i} gap={4} style={{ padding: "10px 0", borderTop: i === 0 ? "none" : "1px solid rgba(255,255,255,0.04)" }}>
            <Row justify="space-between" align="center">
              <span style={{ fontSize: 13, fontWeight: 500, letterSpacing: -0.005, color: "rgba(255,255,255,0.92)" }}>{e.title}</span>
              <span className="mono tabular" style={{ fontSize: 10, color: "rgba(255,255,255,0.38)" }}>{e.date}</span>
            </Row>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.58)", letterSpacing: -0.005, lineHeight: 1.45 }}>{e.preview}</span>
          </Col>
        ))}
      </Col>
      <button className="pill ghost" style={{ alignSelf: "flex-start", marginTop: 10, padding: "4px 12px" }}>+ new entry</button>
    </GlassCard>
  );
}

export function TabHealth({ mode, setMode }: { mode: HealthMode; setMode: (m: HealthMode) => void }) {
  return (
    <div className="surface" style={{ flex: 1, minHeight: 0, display: "grid", gridTemplateColumns: "1.45fr 1fr", gap: 12 }}>
      <div style={{ display: "flex", minHeight: 0 }}>
        <WorkoutSessionCard mode={mode} setMode={setMode} />
      </div>
      <Col gap={12} style={{ minHeight: 0 }}>
        <CardioCard />
        <Row gap={12} align="stretch" style={{ display: "flex" }}>
          <MiniStatCard label="Stretching" today={18} todayUnit=" min" week={92} weekTarget={105} weekUnit=" min" footer="5 of 7 days · streak 3" />
          <MiniStatCard label="Meditation" today={12} todayUnit=" min" week={64} weekTarget={70}  weekUnit=" min" footer="7 of 7 days · streak 14" />
        </Row>
        <div style={{ flex: 1, minHeight: 0, display: "flex" }}>
          <WorkoutJournalCard />
        </div>
      </Col>
    </div>
  );
}
