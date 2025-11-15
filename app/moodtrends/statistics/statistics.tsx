// Statistics.tsx
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
import { useSettings } from '../../utilis/Settings';

// ⭐ FIXED: correct import (default factory)
import { getStatisticsStyles } from './statistics_styles';


/* ============================================================
    TYPES + HELPERS (unchanged)
============================================================ */
type MoodKey = string;
type MoodInfo = { key: string; name: string; emoji: string; value: number };

interface MoodEntry {
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

const MOOD_SCALE: MoodInfo[] = [
  { key: 'angry', name: 'Angry', emoji: '😡', value: 1 },
  { key: 'sad', name: 'Sad', emoji: '😢', value: 2 },
  { key: 'confused', name: 'Confused', emoji: '😕', value: 3 },
  { key: 'neutral', name: 'Neutral', emoji: '😐', value: 3.5 },
  { key: 'calm', name: 'Calm', emoji: '🙂', value: 4 },
  { key: 'happy', name: 'Happy', emoji: '😄', value: 5 },
];

const MOOD_BY_KEY = new Map(MOOD_SCALE.map(m => [m.key.toLowerCase(), m]));
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
    end: new Date(year, month, 0, 23, 59, 59, 999),
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

function normalizeMood(mood?: string): MoodInfo {
  if (!mood) return FALLBACK_MOOD;
  const s = String(mood).trim();
  return MOOD_BY_EMOJI.get(s) || MOOD_BY_KEY.get(s.toLowerCase()) || FALLBACK_MOOD;
}


/* ============================================================
    MAIN SCREEN
============================================================ */
const Statistics: React.FC = () => {

  const { isDark } = useSettings();
  const styles = getStatisticsStyles(isDark);  // ⭐ FIXED: Now styles exists everywhere

  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [empty, setEmpty] = useState(false);
  const [tab, setTab] = useState<'freq' | 'date' | 'avg'>('freq');


  /* ============================================================
        LOAD DATA
  ============================================================ */
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
        const earliest = addDays(startOfWeekSun(now), -(WEEKS_COUNT - 1) * 7);

        const col = collection(db, 'users', u.uid, 'MoodHistory');

        let docs: MoodEntry[] = [];

        try {
          const qy = query(col, where('createdAt', '>=', Timestamp.fromDate(earliest)), orderBy('createdAt', 'asc'));
          const snap = await getDocs(qy);
          docs = snap.docs.map(d => {
            const x: any = d.data();
            const time = toDate(x.createdAt ?? x.timestamp ?? { date: x.date, time: x.time });
            return { id: d.id, mood: x.mood, text: x.text ?? '', time };
          });
        } catch {
          const snapAll = await getDocs(col);
          docs = snapAll.docs
            .map(d => {
              const x: any = d.data();
              const time = toDate(x.createdAt ?? x.timestamp ?? { date: x.date, time: x.time });
              return { id: d.id, mood: x.mood, text: x.text ?? '', time };
            })
            .filter(r => !isNaN(r.time.getTime()) && r.time >= earliest)
            .sort((a, b) => a.time.getTime() - b.time.getTime());
        }

        setEntries(docs);
        setEmpty(docs.length === 0);

      } catch (e: any) {
        setError(e?.message ?? 'Failed to load data');
      } finally {
        setLoading(false);
      }
    });

    return unsub;
  }, []);


  /* ============================================================
        CALCULATIONS
  ============================================================ */
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
      const dateKey = fmtLocalDate(startOfDay(e.time));
      grouped.set(dateKey, [...(grouped.get(dateKey) ?? []), e]);
    });

    const results: { day: string; mood: string | null }[] = [];
    const today0 = startOfDay(new Date());

    for (let i = 29; i >= 0; i--) {
      const day = fmtLocalDate(addDays(today0, -i));
      const list = grouped.get(day);
      if (!list) {
        results.push({ day, mood: null });
      } else {
        const counts = new Map<string, number>();
        list.forEach(it => {
          const m = normalizeMood(it.mood);
          const key = m.emoji || m.name;
          counts.set(key, (counts.get(key) ?? 0) + 1);
        });

        let best: string | null = null;
        let bestCount = -1;
        counts.forEach((c, k) => { if (c > bestCount) { bestCount = c; best = k; } });

        results.push({ day, mood: best });
      }
    }

    return results;
  }, [entries]);

  const avgMoodLastMonth = useMemo(() => {
    const { start, end } = getLastMonthRangeLocal();
    const monthEntries = entries.filter(e => e.time >= start && e.time <= end);

    if (!monthEntries.length) return { label: '—', emoji: '▫️' };

    const values = monthEntries.map(e => normalizeMood(e.mood).value);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;

    let closest = MOOD_SCALE[0];
    let diff = Infinity;

    MOOD_SCALE.forEach(info => {
      const d = Math.abs(info.value - avg);
      if (d < diff) { diff = d; closest = info; }
    });

    return { label: closest.name, emoji: closest.emoji };
  }, [entries]);

  const moodFreq5Weeks = useMemo(() => {
    const counts = new Map<string, number>();
    const earliest = addDays(startOfWeekSun(new Date()), -(WEEKS_COUNT - 1) * 7);

    entries.filter(e => e.time >= earliest).forEach(e => {
      const n = normalizeMood(e.mood);
      const key = n.emoji || n.name;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });

    const bars: BarDatum[] = MOOD_SCALE.map(m => ({
      label: m.emoji,
      value: counts.get(m.emoji) ?? 0,
    }));

    return { bars };
  }, [entries]);


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
        <Text style={styles.muted}>No mood entries added yet.</Text>
      </View>
    );
  }


  



  return (
    <LinearGradient
  colors={isDark ? (['#07070a', '#0f0f16'] as [string, string]) : (['#ffffff', '#ffffff'] as [string, string])}
  style={styles.container}
>
      <View style={styles.innerWrap}>

        {/* Back Btn */}
        <TouchableOpacity
          onPress={() => router.replace('/(tabs)/mood_trends')}
          style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>

        {/* Tabs */}
        <View style={styles.tabs}>
          <TabButton label="Mood Frequency" active={tab === 'freq'} onPress={() => setTab('freq')} styles={styles} />
          <TabButton label="Date-wise (30d)" active={tab === 'date'} onPress={() => setTab('date')} styles={styles} />
          <TabButton label="Avg Last Month" active={tab === 'avg'} onPress={() => setTab('avg')} styles={styles} />
        </View>


        <ScrollView contentContainerStyle={{ padding: 16 }}>

          {/* TAB 1 : Frequency */}
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
                frontColor={isDark ? '#7f8bff' : '#1372e7ff'}
                spacing={14}
                isAnimated
                height={Dimensions.get('window').height * 0.45}
              />

              <View style={styles.legendRow}>
                {MOOD_SCALE.map(m => (
                  <Text key={m.key} style={styles.legendItem}>
                    {m.emoji} {m.name}
                  </Text>
                ))}
              </View>
            </View>
          )}

          {/* TAB 2 : Date wise */}
          {tab === 'date' && (
            <View style={styles.card}>
              <Text style={styles.h2}>📅 Most common mood — last 30 days</Text>

              <FlatList
                data={dateWiseCommonLast30}
                keyExtractor={it => it.day}
                renderItem={({ item }) => (
                  <View style={styles.dateRow}>
                    <Text style={styles.dateTxt}>{item.day}</Text>
                    <Text style={styles.dateMood}>{item.mood ?? '—'}</Text>
                  </View>
                )}
                scrollEnabled={false}
              />
            </View>
          )}

          {/* TAB 3 : Avg month */}
          {tab === 'avg' && (
            <View style={styles.card}>
              <Text style={styles.h2}> Average mood — last month</Text>
              <Text style={styles.avgBig}>
                {avgMoodLastMonth.emoji} {avgMoodLastMonth.label}
              </Text>
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </LinearGradient>
  );
};

export default Statistics;



/* ============================================================
    FIXED TAB BUTTON (styles passed as props)
============================================================ */
const TabButton = ({
  label,
  active,
  onPress,
  styles,
}: {
  label: string;
  active?: boolean;
  onPress: () => void;
  styles: any;
}) => (
  <TouchableOpacity
    onPress={onPress}
    style={[styles.tabBtn, active && styles.tabBtnActive]}>
    <Text style={[styles.tabTxt, active && styles.tabTxtActive]}>{label}</Text>
  </TouchableOpacity>
);
