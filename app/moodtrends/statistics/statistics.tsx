import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import {
  collection,
  getDocs,
  orderBy,
  query,
  Timestamp,
  where,
} from 'firebase/firestore';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Dimensions, FlatList, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { db } from 'utils/firebaseConfig';
import styles from './statistics_styles';

type MoodKey = string;
type MoodInfo = { key: string; name: string; emoji: string; value: number };

interface JournalEntry {
  id: string;
  mood: MoodKey;
  text?: string;
  time: Date;
}

interface WeekBucket {
  start: Date;
  dayMood: (MoodKey | null)[];
  dominantMood: MoodKey | null;
  dominantCount: number;
  percentage: number;
}

type BarDatum = { value: number; label?: string; frontColor?: string };

const WEEKS_COUNT = 5;

/** Mood scale (adjust to your app) */
const MOOD_SCALE: MoodInfo[] = [
  { key: 'angry',    name: 'Angry',    emoji: '😡', value: 1 },
  { key: 'sad',      name: 'Sad',      emoji: '😢', value: 2 },
  { key: 'confused', name: 'Confused', emoji: '😕', value: 3 },
  { key: 'neutral',  name: 'Neutral',  emoji: '😐', value: 3.5 },
  { key: 'calm',     name: 'Calm',     emoji: '🙂', value: 4 },
  { key: 'happy',    name: 'Happy',    emoji: '😄', value: 5 },
];
const MOOD_BY_KEY = new Map(MOOD_SCALE.map(m => [m.key.toLowerCase(), m]));
const MOOD_BY_EMOJI = new Map(MOOD_SCALE.map(m => [m.emoji, m]));
const FALLBACK_MOOD: MoodInfo = { key: 'neutral', name: 'Neutral', emoji: '😐', value: 3.5 };

/** Start of day in local time */
function startOfDay(d: Date) { const x = new Date(d); x.setHours(0,0,0,0); return x; }
function startOfWeekSun(d: Date) { const x = startOfDay(d); x.setDate(x.getDate() - x.getDay()); return x; }
function addDays(d: Date, n: number) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }

/** Format YYYY-MM-DD in *local* time (no UTC conversion). */
function fmtLocalDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Get start & end for LAST calendar month in local time */
function getLastMonthRangeLocal(ref = new Date()) {
  const year = ref.getFullYear();
  const month = ref.getMonth(); // 0..11 (current month)
  const lastMonth = month - 1;
  const start = new Date(year, lastMonth, 1, 0, 0, 0, 0);
  const end = new Date(year, month, 0, 23, 59, 59, 999); // day 0 of current month = last day of previous month
  return { start, end };
}

function toDate(tsLike: any): Date {
  if (tsLike instanceof Date) return tsLike;
  if (tsLike?.toDate) return tsLike.toDate();
  if (typeof tsLike?.seconds === 'number') return new Date(tsLike.seconds * 1000);
  const d = new Date(tsLike);
  return isNaN(d.getTime()) ? new Date() : d;
}

/** Normalize mood; never returns null */
function normalizeMood(m?: string | null): MoodInfo {
  if (!m) return FALLBACK_MOOD;
  const s = String(m).trim(); // trims trailing spaces like "happy "
  return MOOD_BY_EMOJI.get(s)
      || MOOD_BY_KEY.get(s.toLowerCase())
      || { ...FALLBACK_MOOD, key: s.toLowerCase(), name: s };
}

type TabKey = 'freq' | 'date' | 'avg';

const Statistics: React.FC = () => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [empty, setEmpty] = useState(false);

  // UI tab selection
  const [tab, setTab] = useState<TabKey>('freq');

  // Toggle this to true if you want to fetch ALL docs (ignoring 5-week filter) for testing
  const DEBUG_LOAD_ALL = false;

  /** Load from Firestore */
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      setEmpty(false);

      try {
        if (DEBUG_LOAD_ALL) {
          const snapAll = await getDocs(collection(db, 'MoodHistory'));
          const rows: JournalEntry[] = snapAll.docs
            .map((doc) => {
              const data: any = doc.data();
              return {
                id: doc.id,
                mood: data.mood as MoodKey,
                text: data.text ?? '',
                time: toDate(data['MoodHistory']),
              };
            })
            .sort((a, b) => a.time.getTime() - b.time.getTime());
          setEntries(rows);
          setEmpty(rows.length === 0);
          setLoading(false);
          return;
        }

        const now = new Date();
        const currentWeekStart = startOfWeekSun(now);
        const earliestWeekStart = addDays(currentWeekStart, -(WEEKS_COUNT - 1) * 7);

        // Filter + order on the SAME field to avoid composite index requirement.
        const qy = query(
          collection(db, 'MoodHistory'),
          where('createdAt', '>=', Timestamp.fromDate(earliestWeekStart)),
          orderBy('createdAt', 'asc')
        );

        const snap = await getDocs(qy);
        let rows: JournalEntry[] = snap.docs.map((doc) => {
          const data: any = doc.data();
          return {
            id: doc.id,
            mood: data.mood as MoodKey,
            text: data.text ?? '',
            time: toDate(data['createdAt']),
          };
        });

        // Fallback if empty (covers older data or wrong types/rules)
        if (rows.length === 0) {
          const snapAll = await getDocs(collection(db, 'MoodHistory'));
          rows = snapAll.docs
            .map((doc) => {
              const data: any = doc.data();
              return {
                id: doc.id,
                mood: data.mood as MoodKey,
                text: data.text ?? '',
                time: toDate(data['createdAt']),
              };
            })
            .filter(r => r.time >= earliestWeekStart)
            .sort((a, b) => a.time.getTime() - b.time.getTime());
        }

        setEntries(rows);
        setEmpty(rows.length === 0);
      } catch (e: any) {
        setError(e?.message ?? 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  /** ===== Derived stats ===== */
  // Build 5 weekly buckets (keys use local getTime, not ISO)
  const weeks: WeekBucket[] = useMemo(() => {
    const now = new Date();
    const current = startOfWeekSun(now);
    const starts: Date[] = [];
    for (let i = WEEKS_COUNT - 1; i >= 0; i--) starts.push(addDays(current, -i * 7));

    const bucketMap = new Map<string, WeekBucket>();
    starts.forEach((s) => {
      bucketMap.set(String(s.getTime()), {
        start: s, dayMood: Array(7).fill(null),
        dominantMood: null, dominantCount: 0, percentage: 0,
      });
    });

    const chooseDayMood = (items: JournalEntry[]): MoodKey | null => {
      if (!items.length) return null;
      const counts = new Map<string, number>();
      items.forEach((it) => {
        const n = normalizeMood(it.mood);
        const key = n.emoji || n.name;
        counts.set(key, (counts.get(key) ?? 0) + 1);
      });
      let best: string | null = null, bestC = -1;
      counts.forEach((c, k) => { if (c > bestC) { bestC = c; best = k; } });
      return best;
    };

    for (const entry of entries) {
      const wStart = startOfWeekSun(entry.time);
      const key = String(wStart.getTime());
      if (!bucketMap.has(key)) continue;
      const week = bucketMap.get(key)!;
      (week as any)._raw = (week as any)._raw ?? new Map<number, JournalEntry[]>();
      const dayIdx = entry.time.getDay();
      const arr = (week as any)._raw.get(dayIdx) ?? [];
      arr.push(entry);
      (week as any)._raw.set(dayIdx, arr);
    }

    bucketMap.forEach((week) => {
      const raw: Map<number, JournalEntry[]> = (week as any)._raw ?? new Map();
      for (let d = 0; d < 7; d++) {
        week.dayMood[d] = chooseDayMood(raw.get(d) ?? []);
      }
      const counts = new Map<string, number>();
      week.dayMood.forEach((mk) => { if (mk) counts.set(mk, (counts.get(mk) ?? 0) + 1); });
      if (counts.size) {
        let best: string | null = null, bestCount = -1;
        counts.forEach((c, k) => { if (c > bestCount) { bestCount = c; best = k; } });
        week.dominantMood = best;
        week.dominantCount = bestCount;
        week.percentage = Math.round((bestCount / 7) * 100);
      }
      delete (week as any)._raw;
    });

    return starts.map((s) => bucketMap.get(String(s.getTime()))!);
  }, [entries]);

  const entriesInLastNDays = (n: number) => {
    const end = startOfDay(new Date());
    const start = addDays(end, -(n - 1));
    return entries.filter(e => {
      const d = startOfDay(e.time);
      return d >= start && d <= end;
    });
  };

  // Date-wise (last 30 days) — use local date keys
  const dateWiseCommonLast30 = useMemo(() => {
    const last30 = entriesInLastNDays(30);
    const grouped = new Map<string, JournalEntry[]>();
    last30.forEach((e) => {
      const k = fmtLocalDate(startOfDay(e.time)); // LOCAL date key
      grouped.set(k, [...(grouped.get(k) ?? []), e]);
    });

    const byDate = new Map<string, string>();
    grouped.forEach((list, day) => {
      const counts = new Map<string, number>();
      list.forEach((it) => {
        const k = (normalizeMood(it.mood).emoji || normalizeMood(it.mood).name);
        counts.set(k, (counts.get(k) ?? 0) + 1);
      });
      let best: string | null = null; let bestC = -1;
      counts.forEach((c, k) => { if (c > bestC) { bestC = c; best = k; } });
      if (best) byDate.set(day, best);
    });

    const res: { day: string; mood: string | null }[] = [];
    const end = startOfDay(new Date());
    for (let i = 29; i >= 0; i--) {
      const day = fmtLocalDate(addDays(end, -i)); // LOCAL date string
      res.push({ day, mood: byDate.get(day) ?? null });
    }
    return res;
  }, [entries]);

  /** ===== Average mood — LAST month (emoji + label only) ===== */
  const avgMoodLastMonth = useMemo(() => {
    const { start, end } = getLastMonthRangeLocal(new Date());
    const inLastMonth = entries.filter(e => e.time >= start && e.time <= end);
    if (!inLastMonth.length) {
      console.log('[Avg Last Month] No entries found between', start, 'and', end);
      return { label: '—', emoji: '▫️' as string };
    }

    const values = inLastMonth.map(e => normalizeMood(e.mood).value);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;

    let closest = MOOD_SCALE[0];
    let diff = Infinity;
    MOOD_SCALE.forEach(m => {
      const d = Math.abs(m.value - avg);
      if (d < diff) { diff = d; closest = m; }
    });

    // Console debug
    console.log('[Avg Last Month]');
    console.log('  Entries count:', inLastMonth.length);
    console.log('  Values:', values);
    console.log('  Numeric average:', avg.toFixed(2));
    console.log('  Closest mood:', closest.emoji, closest.name);

    return { label: closest.name, emoji: closest.emoji };
  }, [entries]);

  const moodFreq5Weeks = useMemo(() => {
    const counts = new Map<string, number>();
    const earliest = addDays(startOfWeekSun(new Date()), -(WEEKS_COUNT - 1) * 7);
    entries
      .filter(e => e.time >= earliest)
      .forEach(e => {
        const k = (normalizeMood(e.mood).emoji || normalizeMood(e.mood).name);
        counts.set(k, (counts.get(k) ?? 0) + 1);
      });
    const bars: BarDatum[] = MOOD_SCALE.map(m => ({
      label: m.emoji,
      value: counts.get(m.emoji) ?? 0,
    }));
    return { bars, counts };
  }, [entries]);

  /** Console log: last 5 weeks mood frequency */
  useEffect(() => {
    if (moodFreq5Weeks) {
      const obj: Record<string, number> = {};
      MOOD_SCALE.forEach(m => { obj[m.emoji] = moodFreq5Weeks.counts.get(m.emoji) ?? 0; });
      console.log('[Mood frequency - last 5 weeks]', obj);
    }
  }, [moodFreq5Weeks]);

  /** ===== UI Tabs / Render ===== */
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={styles.muted}>Loading statistics…</Text>
      </View>
    );
  }
  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>Error: {error}</Text>
      </View>
    );
  }
  if (empty) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>No entries found yet. Add some moods to see stats.</Text>
      </View>
    );
  }

  return (
    <LinearGradient colors={["#1f1b5a", "#3f34c0"]} style={styles.container}>
    <TouchableOpacity
          onPress={() => router.replace('/(tabs)/mood_trends')}
          style={styles.backButton}
          accessibilityLabel="Go to Home">
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
    <View style={styles.container}>
      {/* Tab buttons */}
      <View style={styles.tabs}>
        <TabButton label="Mood Frequency" active={tab === 'freq'} onPress={() => setTab('freq')} />
        <TabButton label="Date-wise (30d)" active={tab === 'date'} onPress={() => setTab('date')} />
        <TabButton label="Avg Last Month" active={tab === 'avg'} onPress={() => setTab('avg')} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {tab === 'freq' && (
          <View style={styles.card}>
            <Text style={styles.h2}>📊 Mood frequency — last 5 weeks</Text>
            <BarChart
              data={moodFreq5Weeks.bars}
              barWidth={28}
              yAxisTextStyle={styles.axis}
              xAxisLabelTextStyle={styles.axis}
              noOfSections={4}
              barBorderRadius={10}
              frontColor="#60a5fa"
              spacing={14}
              isAnimated
              showFractionalValues
              height={Dimensions.get("window").height * 0.5}

            />
            <View style={{ height: 8 }} />
            <View style={styles.legendRow}>
              {MOOD_SCALE.map((m) => (
                <Text key={m.key} style={styles.legendItem}>{m.emoji} {m.name}</Text>
              ))}
            </View>
          </View>
        )}

        {tab === 'date' && (
          <View style={styles.card}>
            <Text style={styles.h2}>📅 Most common mood — date-wise (last 30 days)</Text>
            <FlatList
              data={dateWiseCommonLast30}
              keyExtractor={(it) => it.day}
              renderItem={({ item }) => (
                <View style={styles.dateRow}>
                  <Text style={styles.dateTxt}>{item.day}</Text>
                  <Text style={styles.dateMood}>{item.mood ?? '—'}</Text>
                </View>
              )}
              ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
              scrollEnabled={false}
            />
          </View>
        )}

        {tab === 'avg' && (
          <View style={styles.card}>
            <Text style={styles.h2}>📈 Average mood — last month</Text>
            <Text style={styles.avgBig}>{avgMoodLastMonth.emoji} {avgMoodLastMonth.label}</Text>
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
    </LinearGradient>
  );
};

export default Statistics;

/** ===== Small components ===== */
const TabButton: React.FC<{ label: string; active?: boolean; onPress: () => void }> = ({ label, active, onPress }) => {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.tabBtn, active && styles.tabBtnActive]}>
      <Text style={[styles.tabTxt, active && styles.tabTxtActive]}>{label}</Text>
    </TouchableOpacity>
  );

};
