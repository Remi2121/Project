import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { collection, getDocs, orderBy, query, Timestamp, where } from 'firebase/firestore';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { auth, db } from 'utils/firebaseConfig';
import styles from './statistics_styles';

/** ===== Types & config (kept as before) ===== */
type MoodKey = string;
type MoodInfo = { key: string; name: string; emoji: string; value: number };

interface MoodEntry {
  id: string;
  mood: MoodKey;
  text?: string;
  time: Date; // normalized Date
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

const MOOD_SCALE: MoodInfo[] = [
  { key: 'angry',    name: 'Angry',    emoji: '😡', value: 1 },
  { key: 'sad',      name: 'Sad',      emoji: '😢', value: 2 },
  { key: 'confused', name: 'Confused', emoji: '😕', value: 3 },
  { key: 'neutral',  name: 'Neutral',  emoji: '😐', value: 3.5 },
  { key: 'calm',     name: 'Calm',     emoji: '🙂', value: 4 },
  { key: 'happy',    name: 'Happy',    emoji: '😄', value: 5 },
];
const MOOD_BY_KEY   = new Map(MOOD_SCALE.map(m => [m.key.toLowerCase(), m]));
const MOOD_BY_EMOJI = new Map(MOOD_SCALE.map(m => [m.emoji, m]));
const FALLBACK_MOOD: MoodInfo = { key: 'neutral', name: 'Neutral', emoji: '😐', value: 3.5 };

function startOfDay(d: Date) { const x = new Date(d); x.setHours(0,0,0,0); return x; }
function startOfWeekSun(d: Date) { const x = startOfDay(d); x.setDate(x.getDate() - x.getDay()); return x; }
function addDays(d: Date, n: number) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function fmtLocalDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
function getLastMonthRangeLocal(ref = new Date()) {
  const year = ref.getFullYear();
  const month = ref.getMonth();
  return {
    start: new Date(year, month - 1, 1, 0, 0, 0, 0),
    end:   new Date(year, month, 0, 23, 59, 59, 999),
  };
}
function toDate(tsLike: any): Date {
  if (!tsLike) return new Date(NaN);
  if (tsLike instanceof Date) return tsLike;
  if (tsLike?.toDate) return tsLike.toDate();
  if (typeof tsLike?.seconds === 'number') return new Date(tsLike.seconds * 1000);
  if (typeof tsLike === 'object') {
    if (tsLike.createdAt) return toDate(tsLike.createdAt);
    if (tsLike.timestamp) return toDate(tsLike.timestamp);
    if (tsLike.date && tsLike.time) return new Date(`${tsLike.date} ${tsLike.time}`);
    if (tsLike.date) return new Date(tsLike.date);
  }
  const d = new Date(tsLike);
  return isNaN(d.getTime()) ? new Date(NaN) : d;
}
function normalizeMood(m?: string): MoodInfo {
  if (!m) return FALLBACK_MOOD;
  const s = String(m).trim();
  return MOOD_BY_EMOJI.get(s)
      || MOOD_BY_KEY.get(s.toLowerCase())
      || { ...FALLBACK_MOOD, key: s.toLowerCase(), name: s };
}

/** ===== Screen (MoodHistory ONLY) ===== */
const Statistics: React.FC = () => {
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [empty, setEmpty] = useState(false);
  const [tab, setTab] = useState<'freq' | 'date' | 'avg'>('freq');

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (u) => {
      if (!u) {
        router.replace('/authpages/Login-page');
        return;
      }

      setLoading(true);
      setError(null);
      setEmpty(false);

      try {
        const now = new Date();
        const earliestWeekStart = addDays(startOfWeekSun(now), -(WEEKS_COUNT - 1) * 7);

        const uid = u.uid;
        const moodHistoryColl = collection(db, 'users', uid, 'MoodHistory');

        let rows: MoodEntry[] = [];
        try {
          const qy = query(
            moodHistoryColl,
            where('createdAt', '>=', Timestamp.fromDate(earliestWeekStart)),
            orderBy('createdAt', 'asc')
          );
          const snap = await getDocs(qy);
          rows = snap.docs.map(d => {
            const x: any = d.data();
            const when = x.createdAt ?? x.timestamp ?? { date: x.date, time: x.time };
            return { id: d.id, mood: x.mood as MoodKey, text: x.text ?? '', time: toDate(when) };
          });
        } catch {
          const snapAll = await getDocs(moodHistoryColl);
          rows = snapAll.docs
            .map(d => {
              const x: any = d.data();
              const when = x.createdAt ?? x.timestamp ?? { date: x.date, time: x.time };
              return { id: d.id, mood: x.mood as MoodKey, text: x.text ?? '', time: toDate(when) };
            })
            .filter(r => !isNaN(r.time.getTime()) && r.time >= earliestWeekStart)
            .sort((a,b) => a.time.getTime() - b.time.getTime());
        }

        setEntries(rows);
        setEmpty(rows.length === 0);
      } catch (e: any) {
        setError(e?.message ?? 'Failed to load data');
      } finally {
        setLoading(false);
      }
    });

    return unsub;
  }, []);

  const weeks = useMemo(() => {
    const now = new Date();
    const current = startOfWeekSun(now);
    const starts: Date[] = [];
    for (let i = WEEKS_COUNT - 1; i >= 0; i--) starts.push(addDays(current, -i * 7));

    const bucketMap = new Map<string, WeekBucket>();
    starts.forEach((s) => {
      bucketMap.set(String(s.getTime()), {
        start: s,
        dayMood: Array(7).fill(null),
        dominantMood: null,
        dominantCount: 0,
        percentage: 0,
      });
    });

    const chooseDayMood = (items: MoodEntry[]): MoodKey | null => {
      if (!items.length) return null;
      const counts = new Map<string, number>();
      items.forEach((it) => {
        const n = normalizeMood(it.mood);
        const k = n.emoji || n.name;
        counts.set(k, (counts.get(k) ?? 0) + 1);
      });
      let best: string | null = null, bestC = -1;
      counts.forEach((c, k) => { if (c > bestC) { bestC = c; best = k; } });
      return best;
    };

    for (const e of entries) {
      const wStart = startOfWeekSun(e.time);
      const key = String(wStart.getTime());
      if (!bucketMap.has(key)) continue;
      const wk = bucketMap.get(key)!;
      (wk as any)._raw = (wk as any)._raw ?? new Map<number, MoodEntry[]>();
      const dayIdx = e.time.getDay();
      const arr = (wk as any)._raw.get(dayIdx) ?? [];
      arr.push(e);
      (wk as any)._raw.set(dayIdx, arr);
    }

    bucketMap.forEach((wk) => {
      const raw: Map<number, MoodEntry[]> = (wk as any)._raw ?? new Map();
      for (let d = 0; d < 7; d++) wk.dayMood[d] = chooseDayMood(raw.get(d) ?? []);
      const counts = new Map<string, number>();
      wk.dayMood.forEach((mk) => { if (mk) counts.set(mk, (counts.get(mk) ?? 0) + 1); });
      if (counts.size) {
        let best: string | null = null, bestC = -1;
        counts.forEach((c, k) => { if (c > bestC) { bestC = c; best = k; } });
        wk.dominantMood = best;
        wk.dominantCount = bestC;
        wk.percentage = Math.round((bestC / 7) * 100);
      }
      delete (wk as any)._raw;
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

  const dateWiseCommonLast30 = useMemo(() => {
    const last30 = entriesInLastNDays(30);
    const grouped = new Map<string, MoodEntry[]>();
    last30.forEach((e) => {
      const k = fmtLocalDate(startOfDay(e.time));
      grouped.set(k, [...(grouped.get(k) ?? []), e]);
    });

    const byDate = new Map<string, string>();
    grouped.forEach((list, day) => {
      const counts = new Map<string, number>();
      list.forEach((it) => {
        const n = normalizeMood(it.mood);
        const k = n.emoji || n.name;
        counts.set(k, (counts.get(k) ?? 0) + 1);
      });
      let best: string | null = null; let bestC = -1;
      counts.forEach((c, k) => { if (c > bestC) { bestC = c; best = k; } });
      if (best) byDate.set(day, best);
    });

    const res: { day: string; mood: string | null }[] = [];
    const end = startOfDay(new Date());
    for (let i = 29; i >= 0; i--) {
      const day = fmtLocalDate(addDays(end, -i));
      res.push({ day, mood: byDate.get(day) ?? null });
    }
    return res;
  }, [entries]);

  const avgMoodLastMonth = useMemo(() => {
    const { start, end } = getLastMonthRangeLocal(new Date());
    const inLastMonth = entries.filter(e => e.time >= start && e.time <= end);
    if (!inLastMonth.length) {
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
    return { label: closest.name, emoji: closest.emoji };
  }, [entries]);

  const moodFreq5Weeks = useMemo(() => {
    const counts = new Map<string, number>();
    const earliest = addDays(startOfWeekSun(new Date()), -(WEEKS_COUNT - 1) * 7);
    entries
      .filter(e => e.time >= earliest)
      .forEach(e => {
        const n = normalizeMood(e.mood);
        const k = n.emoji || n.name;
        counts.set(k, (counts.get(k) ?? 0) + 1);
      });
    const bars: BarDatum[] = MOOD_SCALE.map(m => ({
      label: m.emoji,
      value: counts.get(m.emoji) ?? 0,
    }));
    return { bars, counts };
  }, [entries]);

  /** ===== UI ===== */
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
        <Text style={styles.muted}>No mood entries yet. Add some moods to see stats.</Text>
      </View>
    );
  }

  return (
    <LinearGradient colors={['#ffffff', '#ffffff']} style={styles.container}>
      <View style={styles.innerWrap}>
        <TouchableOpacity
          onPress={() => router.replace('/(tabs)/mood_trends')}
          style={styles.backButton}
          accessibilityLabel="Go to Home">
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>

        <View style={styles.tabs}>
          <TabButton label="Mood Frequency" active={tab === 'freq'} onPress={() => setTab('freq')} />
          <TabButton label="Date-wise (30d)" active={tab === 'date'} onPress={() => setTab('date')} />
          <TabButton label="Avg Last Month" active={tab === 'avg'} onPress={() => setTab('avg')} />
        </View>

        <ScrollView contentContainerStyle={{ padding: 16 }}>
          {tab === 'freq' && (
            <View style={styles.card}>
              <Text style={styles.h2}> Mood frequency — last 5 weeks</Text>
              <BarChart
                data={moodFreq5Weeks.bars}
                barWidth={28}
                yAxisTextStyle={styles.axis}
                xAxisLabelTextStyle={styles.axis}
                noOfSections={4}
                barBorderRadius={10}
                frontColor="#1372e7ff"
                spacing={14}
                isAnimated
                showFractionalValues
                height={Dimensions.get('window').height * 0.45}
              />
              <View style={{ height: 8 }} />
              <View style={styles.legendRow}>
                {MOOD_SCALE.map((m) => (
                  <Text key={m.key} style={styles.legendItem}>
                    {m.emoji} {m.name}
                  </Text>
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
              <Text style={styles.h2}> Average mood — last month</Text>
              <Text style={styles.avgBig}>
                {avgMoodLastMonth.emoji} {avgMoodLastMonth.label}
              </Text>
            </View>
          )}

          <View style={{ height: 32 }} />
        </ScrollView>
      </View>
    </LinearGradient>
  );
};

export default Statistics;

const TabButton: React.FC<{ label: string; active?: boolean; onPress: () => void }> = ({
  label, active, onPress,
}) => (
  <TouchableOpacity onPress={onPress} style={[styles.tabBtn, active && styles.tabBtnActive]}>
    <Text style={[styles.tabTxt, active && styles.tabTxtActive]}>{label}</Text>
  </TouchableOpacity>
);
