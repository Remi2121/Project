// AutoPredictor.tsx  — updated to full white background + readable styles
import RingProgress from '@/components/RingProgress';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  collection,
  getDocs,
  orderBy,
  query,
  Timestamp,
  where,
} from 'firebase/firestore';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { auth, db } from 'utils/firebaseConfig';

const TZ = 'Asia/Colombo';


type RealMood = 'happy' | 'sad' | 'angry' | 'tired' | 'sick' | 'neutral' | 'calm' | 'excited' | 'anxious';
type Rule = { pred: string; pct: number; reason: string };
type RuleMap = Record<string, Rule>;
type DayRow = { key: string; date: Date; mood: RealMood };


const RULES: RuleMap = require('../../../tools/data/mood_rules.json');

const EMOJI_TO_REAL: Record<string, RealMood> = {
  '😊': 'happy', '😐': 'neutral', '😢': 'sad', '😡': 'angry', '🥱': 'tired', '🤒': 'sick'
};
const REAL_TO_MOODN: Record<string, string> = {
  happy: 'Mood 1', calm: 'Mood 1', excited: 'Mood 1', neutral: 'Mood 1',
  sad: 'Mood 2', anxious: 'Mood 2', sorrow: 'Mood 2',
  angry: 'Mood 3', tired: 'Mood 4', sick: 'Mood 5',
};
const MOODN_TO_REAL: Record<string, RealMood> = {
  'Mood 1': 'happy', 'Mood 2': 'sad', 'Mood 3': 'angry', 'Mood 4': 'tired', 'Mood 5': 'sick',
};


function toDayKeyTZ(d: Date, tz = TZ) {
  const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' });
  return fmt.format(d); // YYYY-MM-DD
}
function startOfDayTZ(d: Date, tz = TZ) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' })
    .formatToParts(d).reduce((a, p) => (a[p.type] = p.value, a), {} as any);
  return new Date(Date.UTC(+parts.year, +parts.month - 1, +parts.day, 0, 0, 0));
}
function addDaysUTC(d: Date, n: number) { const x = new Date(d.getTime()); x.setUTCDate(x.getUTCDate() + n); return x; }


const norm = (s: any) => String(s || '').trim();
const lower = (s: any) => norm(s).toLowerCase();

function toRealMood(input: any): RealMood {
  if (!input) return 'neutral';
  const raw = norm(input);
  if (EMOJI_TO_REAL[raw]) return EMOJI_TO_REAL[raw];
  const k = lower(raw);
  if (['happy','joy','good'].includes(k)) return 'happy';
  if (['neutral','ok','okay'].includes(k)) return 'neutral';
  if (['sad','down','sorrow'].includes(k)) return 'sad';
  if (['angry','mad','anger'].includes(k)) return 'angry';
  if (['tired','sleepy'].includes(k)) return 'tired';
  if (['sick','ill'].includes(k)) return 'sick';
  if (k === 'calm') return 'calm';
  if (k === 'excited') return 'excited';
  if (k === 'anxious') return 'anxious';
  return 'neutral';
}
function toMoodN(input: string) {
  const m = /^mood\s*([1-5])$/i.exec(norm(input));
  if (m) return `Mood ${m[1]}`;
  return REAL_TO_MOODN[lower(input)] || 'Mood 2';
}
const key5 = (a: string[]) => a.join('|');


function findPctFromExcelReason(reason: string, predMoodN?: string): number | null {
  const entries = Object.values(RULES);
  for (const r of entries) {
    if (r.reason === reason && (!predMoodN || r.pred === predMoodN)) return r.pct;
  }
  for (const r of entries) if (r.reason === reason) return r.pct;
  if (predMoodN) {
    for (const r of entries) {
      if (r.reason?.toLowerCase?.().includes(reason.toLowerCase()) && r.pred === predMoodN) return r.pct;
    }
  }
  for (const r of entries) if (r.reason?.toLowerCase?.().includes(reason.toLowerCase())) return r.pct;
  return null;
}
function detectPatternReasonFromExcel(last5N: string[]) {
  const [d1, d2, d3, d4, d5] = last5N;
  if (last5N.every((x) => x === d5)) return { predMoodN: d5, reason: 'All past days same mood', pct: findPctFromExcelReason('All past days same mood', d5) ?? 1.0 };
  if (d3 === d4 && d4 === d5)        return { predMoodN: d5, reason: 'Last 3 days same mood',   pct: findPctFromExcelReason('Last 3 days same mood', d5) ?? 1.0 };
  if (d1 === d2 && d2 === d3 && d4 === d5 && d3 !== d4)
                                      return { predMoodN: d5, reason: 'Last 2 days repeating',   pct: findPctFromExcelReason('Last 2 days repeating', d5) ?? 0.9 };
  if (d4 === d5)                      return { predMoodN: d5, reason: 'Last 2 days same mood',   pct: findPctFromExcelReason('Last 2 days same mood', d5) ?? 0.8 };
  if (d1 === d3 && d3 === d5 && d2 === d4 && d1 !== d2)
                                      return { predMoodN: d1, reason: 'Alternate pattern',       pct: findPctFromExcelReason('Alternate pattern', d1) ?? 0.7 };
  if (d1 === d5)                      return { predMoodN: d5, reason: 'Start & end same mood',   pct: findPctFromExcelReason('Start & end same mood', d5) ?? 0.8 };
  const counts = new Map<string, number>(); for (const x of last5N) counts.set(x, (counts.get(x) ?? 0) + 1);
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  if (sorted.length) {
    const [topMood, topCnt] = sorted[0]; const second = sorted[1]?.[1] ?? 0;
    if (topCnt > second) {
      const cand = [`Mostly ${topMood}`, `${topMood} majority`, 'Mixed pattern, predicted majority mood`'];
      for (const r of cand) { const pct = findPctFromExcelReason(r, topMood); if (pct != null) return { predMoodN: topMood, reason: r, pct }; }
      return { predMoodN: topMood, reason: 'Mixed pattern, predicted majority mood', pct: findPctFromExcelReason('Mixed pattern, predicted majority mood') ?? 0.66 };
    }
  }
  if (d2 === d4) {
    const pred = d2;
    for (const r of [`${pred} happened day after`, `${pred} repeats alternate`, 'Mixed pattern, predicted majority mood']) {
      const pct = findPctFromExcelReason(r, pred); if (pct != null) return { predMoodN: pred, reason: r, pct };
    }
  }
  return null;
}
function predictFromRules(last5Real: RealMood[]) {
  const last5N = last5Real.map((m) => toMoodN(m));
  const exact = RULES[key5(last5N)];
  if (exact) return { moodReal: (MOODN_TO_REAL[exact.pred] || (exact.pred as RealMood)), pct: exact.pct, reason: exact.reason };
  const pat = detectPatternReasonFromExcel(last5N);
  if (pat) return { moodReal: (MOODN_TO_REAL[pat.predMoodN] || (pat.predMoodN as RealMood)), pct: pat.pct, reason: pat.reason };
  return { moodReal: (MOODN_TO_REAL[last5N[4]] || 'neutral'), pct: 0.6, reason: 'No matching rule in Excel (add this sequence in your sheet).' };
}


function toDateFlexible(v: any): Date {
  if (!v) return new Date(NaN);
  if (v?.toDate?.()) return v.toDate();
  if (v instanceof Date) return v;
  return new Date(v);
}


async function loadLast5DailyMoodsForUser(uid: string): Promise<DayRow[]> {
  const today0 = startOfDayTZ(new Date());
  const start = addDaysUTC(today0, -(5 - 1));  // 5 days window start
  const end   = addDaysUTC(today0, 1);         // tomorrow 00:00

  const moodHistoryColl = collection(db, 'users', uid, 'MoodHistory');

  // Try server-side range (createdAt)
  let rows: { when: any; mood: any }[] = [];
  try {
    const qMH = query(
      moodHistoryColl,
      where('createdAt', '>=', Timestamp.fromDate(start)),
      where('createdAt', '<',  Timestamp.fromDate(end)),
      orderBy('createdAt', 'asc')
    );
    const snap = await getDocs(qMH);
    rows = snap.docs.map(d => {
      const x: any = d.data();
      return { when: x.createdAt, mood: x.mood };
    });
  } catch {
    // Fallback: fetch all, then filter locally
    const snap = await getDocs(moodHistoryColl);
    rows = snap.docs
      .map(d => {
        const x: any = d.data();
        return { when: x.createdAt ?? x.timestamp, mood: x.mood };
      })
      .filter(r => {
        const dt = toDateFlexible(r.when);
        return !isNaN(+dt) && dt >= start && dt < end;
      })
      .sort((a, b) => toDateFlexible(a.when).getTime() - toDateFlexible(b.when).getTime());
  }

  return collapseRowsToDaily(rows);
}

function collapseRowsToDaily(rows: { when: any; mood: any }[]): DayRow[] {
  const bucket = new Map<string, string[]>();
  rows.forEach((row) => {
    const dt = toDateFlexible(row.when);
    if (isNaN(+dt)) return;
    const key = toDayKeyTZ(dt);
    const mood = norm(row.mood ?? '');
    if (!bucket.has(key)) bucket.set(key, []);
    bucket.get(key)!.push(mood);
  });

  const today0 = startOfDayTZ(new Date());
  const keys: string[] = [];
  for (let i = 5 - 1; i >= 0; i--) keys.push(toDayKeyTZ(addDaysUTC(today0, -i)));

  return keys.map((k, idx) => {
    const dateUTC = addDaysUTC(startOfDayTZ(new Date()), -(5 - 1 - idx));
    const raw = bucket.get(k) ?? [];
    const realList = raw.map(toRealMood);
    const counts: Partial<Record<RealMood, number>> = {};
    for (const m of realList) counts[m] = (counts[m] ?? 0) + 1;
    const pairs = Object.entries(counts as Record<string, number>).sort((a, b) => b[1] - a[1]);
    let winner: RealMood = 'neutral';
    if (pairs.length === 1 || (pairs[0]?.[1] ?? 0) > (pairs[1]?.[1] ?? 0)) winner = pairs[0][0] as RealMood;
    return { key: k, date: dateUTC, mood: winner };
  });
}


function moodEmoji(m: RealMood) {
  const map: Record<RealMood, string> = {
    happy: '😊', sad: '😢', angry: '😡', tired: '🥱', sick: '🤒',
    neutral: '😐', calm: '😊', excited: '😊', anxious: '😢',
  };
  return map[m] ?? '😐';
}
function moodColor(m: RealMood) {
  switch (m) {
    case 'happy': return '#22c5adff';
    case 'sad': return '#3b82f6';
    case 'angry': return '#ef4444';
    case 'tired': return '#a855f7';
    case 'sick': return '#f59e0b';
    case 'neutral': return '#94a3b8';
    default: return '#2a1faa';
  }
}
function cap(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }
function fmtDayNice(d: Date) { return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }); }


export default function AutoPredictor() {
  const router = useRouter();
  const [busy, setBusy] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [days, setDays] = useState<DayRow[]>([]);

  const prediction = useMemo(() => {
    if (days.length !== 5) return null;
    const last5 = days.map(d => d.mood);
    return predictFromRules(last5);
  }, [days]);

  const load = async () => {
    setBusy(true); setErr(null);
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) {
        Alert.alert('Login required', 'Please sign in to view predictions.', [
          { text: 'OK', onPress: () => router.replace('/authpages/Login-page') },
        ]);
        return;
      }
      const d5 = await loadLast5DailyMoodsForUser(uid); // ← ONLY MoodHistory
      setDays(d5);
    } catch (e: any) {
      setErr(e?.message ?? 'Failed to load');
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => { if (!u) router.replace('/authpages/Login-page'); else load(); });
    return unsub;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // PRIMARY colors for white background
  const PRIMARY = '#2a1faa';
  const FG = '#07203a'; // dark text on white
  const SUB = '#5a73a4ff';

  return (
    // single plain white background (LinearGradient left intentionally white-to-white)
    <LinearGradient colors={['#ffffff', '#ffffff']} style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 140, backgroundColor: '#ffffff' }}>
        <TouchableOpacity onPress={() => router.push('/(tabs)/mood_trends')} style={{ paddingVertical: 8 }}>
          <Text style={{ color: PRIMARY, fontSize: 30, paddingTop: 5, paddingRight: 5 }}>←</Text>
        </TouchableOpacity>

        <Text style={{ color: PRIMARY, fontSize: 22, fontWeight: '800', marginTop: 6 }}>
          Last 5 Days and  Predict Day 6
        </Text>

        <View style={{ height: 10 }} />

        <TouchableOpacity
          onPress={load}
          disabled={busy}
          style={{
            alignSelf: 'flex-start',
            backgroundColor: PRIMARY,
            paddingHorizontal: 16,
            paddingVertical: 10,
            borderRadius: 10,
            opacity: busy ? 0.7 : 1
          }}>
          {busy ? <ActivityIndicator color="#ffffff" /> :
            <Text style={{ color: '#ffffff', fontWeight: '600' }}>Refresh</Text>}
        </TouchableOpacity>

        <View style={{ height: 16 }} />
        <View style={{ gap: 10 }}>
          {busy ? (
            <View style={{ padding: 16, backgroundColor: '#89c8edff', borderRadius: 10 }}>
              <ActivityIndicator color={PRIMARY} />
            </View>
          ) : err ? (
            <View style={{ padding: 16, backgroundColor: '#fff1f1', borderRadius: 10, borderWidth: 1, borderColor: '#ffd3d3' }}>
              <Text style={{ color: '#b03a3a' }}>{err}</Text>
            </View>
          ) : (
            <>
              {days.map((d, idx) => (
                <View
                  key={d.key}
                  style={{
                    padding: 14,
                    borderRadius: 12,
                    backgroundColor: '#f0fbff',
                    borderWidth: 3,
                    borderColor: '#001affff'
                  }}>
                  <Text style={{ color: PRIMARY, fontWeight: '700' }}>
                    Day {idx + 1} • {fmtDayNice(d.date)}
                  </Text>
                  <Text style={{ color: FG, marginTop: 4, fontSize: 16 }}>
                    {moodEmoji(d.mood)} {cap(d.mood)}
                  </Text>
                </View>
              ))}
            </>
          )}
        </View>

        <View style={{ height: 16 }} />

        <View
          style={{
            padding: 16,
            borderRadius: 12,
            backgroundColor: '#f0fbff',
            borderWidth: 3,
            borderColor: '#001affff'
          }}>
          {busy ? (
            <Text style={{ color: SUB }}>Predicting…</Text>
          ) : prediction ? (
            <>
              <View style={{ alignItems: 'center', marginBottom: 10 }}>
                <RingProgress
                  radius={80}
                  strokeWidth={20}
                  progress={prediction.pct}
                  color={moodColor(prediction.moodReal)}
                  backgroundColor="#96d6fbff"
                  center={<Text style={{ fontSize: 48 }}>{moodEmoji(prediction.moodReal)}</Text>}
                />
                <Text style={{ color: FG, fontSize: 18, fontWeight: '800', marginTop: 8 }}>
                  {cap(prediction.moodReal)} • {(prediction.pct * 100).toFixed(0)}%
                </Text>
                <Text style={{ color: SUB, marginTop: 6 }}>
                  {prediction.reason}
                </Text>
              </View>
            </>
          ) : (
            <Text style={{ color: SUB }}>Not enough data. Add moods for the last 5 days.</Text>
          )}
        </View>
      </ScrollView>
    </LinearGradient>
  );
}
