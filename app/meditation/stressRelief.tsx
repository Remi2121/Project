import React, { useMemo, useState, useEffect, useRef } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, Animated, Easing, Button, Modal, TextInput } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";


// --- Stress audio imports ---
import calm_water from "../../assets/audio/stress/calm_water.mp3";
import ocean_waves from "../../assets/audio/stress/ocean_waves.mp3";
import zen_garden from "../../assets/audio/stress/zen_garden.mp3";
import tranquil_forest from "../../assets/audio/stress/tranquil_forest.mp3";
import morning_relaxation from "../../assets/audio/stress/morning_relaxation.mp3";
import heaven_water from "../../assets/audio/stress/heaven_water.mp3";
import om_chanting from "../../assets/audio/stress/om_chanting.mp3";
import perfect_rain from "../../assets/audio/stress/perfect_rain.mp3";
import temple from "../../assets/audio/stress/temple.mp3";
import peaceful from "../../assets/audio/stress/peaceful.mp3";
import motivational from "../../assets/audio/stress/motivational.mp3";
import soft_water from "../../assets/audio/stress/soft_water.mp3";
import peace_happy from "../../assets/audio/stress/peace_happy.mp3";
import soft_guitar from "../../assets/audio/stress/soft_guitar.mp3";
import birds_singing from "../../assets/audio/stress/birds_singing.mp3";

type Track = { title: string; file: any; image?: any };
type Category = { key: string; label: string; tracks?: Track[] };

const CATEGORIES: Category[] = [
  {
    key: "stress",
    label: "Stress Relief",
    tracks: [
      { title: "Calm Mind", file: calm_water, image: require("../../assets/thumbnails/calm_water.png") },
      { title: "Ocean Waves", file: ocean_waves, image: require("../../assets/thumbnails/ocean_waves.png") },
      { title: "Zen Garden", file: zen_garden, image: require("../../assets/thumbnails/zen_garden.png") },
      { title: "Tranquil Forest", file: tranquil_forest, image: require("../../assets/thumbnails/tranquil_forest.png") },
      { title: "Morning Relaxation", file: morning_relaxation, image: require("../../assets/thumbnails/morning_relaxation.png") },
      { title: "Heaven Water", file: heaven_water, image: require("../../assets/thumbnails/heaven_water.png") },
      { title: "Om Chanting", file: om_chanting, image: require("../../assets/thumbnails/om_chanting.png") },
      { title: "Perfect Rain", file: perfect_rain, image: require("../../assets/thumbnails/perfect_rain.png") },
      { title: "Temple Sounds", file: temple, image: require("../../assets/thumbnails/temple.png") },
      { title: "Peaceful Vibes", file: peaceful, image: require("../../assets/thumbnails/peaceful.png") },
      { title: "Motivational", file: motivational, image: require("../../assets/thumbnails/motivational.png") },
      { title: "Soft Water", file: soft_water, image: require("../../assets/thumbnails/soft_water.png") },
      { title: "Peace & Happy", file: peace_happy, image: require("../../assets/thumbnails/peace_happy.png") },
      { title: "Soft Guitar", file: soft_guitar, image: require("../../assets/thumbnails/soft_guitar.png") },
      { title: "Birds Singing", file: birds_singing, image: require("../../assets/thumbnails/birds_singing.png") },
    ],
  },
  { key: "sleep", label: "Sleep" },
  { key: "focus", label: "Focus" },
];

// --- Stress Component ---
function StressUI({ tracks }: { tracks: Track[]; navigation: any }) {
  return (
    <>
      <Text style={styles.helper}>Play the music and relieve the stress</Text>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingVertical: 16 }} showsVerticalScrollIndicator={false}>
        {tracks.map((t) => (
          <View key={t.title} style={styles.trackRow}>
            <Image source={t.image} style={styles.trackImage} resizeMode="cover" />
            <View style={{ flex: 1 }}>
              <Text style={styles.trackTitle}>{t.title}</Text>
            </View>
            <TouchableOpacity
              style={styles.playBtn}
              onPress={() =>
                router.push({
                  pathname: "/Player",
                  params: { title: t.title, url: t.file, image: t.image },
                })
              }
            >
              <Ionicons name="play" size={18} color="#0d0b2f" />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </>
  );
}

// --- Focus Component ---
function FocusUI() {
  const [duration, setDuration] = useState(300); // default 5 minutes (300 seconds)
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isRunning, setIsRunning] = useState(false);

  const [breathText, setBreathText] = useState("Inhale"); // dynamic text

  const [customModalVisible, setCustomModalVisible] = useState(false);
  const [customInput, setCustomInput] = useState("");

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // format time (mm:ss)
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // handle timer countdown
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            setIsRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    return () => clearInterval(intervalRef.current!);
  }, [isRunning]);

  // handle duration change
  const handleSetDuration = (seconds: number) => {
    setDuration(seconds);
    setTimeLeft(seconds);
    setIsRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  // --- Breathing Animation ---
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {

    if (!isRunning) return;
    const breathingLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.4,
          duration: 4000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 4000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    breathingLoop.start();

    let inhale = true;

    // Update text every 4 seconds
    const textInterval = setInterval(() => {
      inhale = !inhale;
      setBreathText(inhale ? "Inhale" : "Exhale");
    }, 4000);

    return () => {
      breathingLoop.stop();
      clearInterval(textInterval);
    };
  }, [isRunning, scaleAnim]);

  return (
    <View style={focusStyles.container}>
      {/* Timer Display */}
      <Text style={focusStyles.timerText}>{formatTime(timeLeft)}</Text>

      {/* Play / Pause Button */}
      <TouchableOpacity
        style={focusStyles.playPauseBtn}
        onPress={() => setIsRunning((prev) => !prev)}
      >
        <Ionicons
          name={isRunning ? "stop-circle-outline" : "hourglass-outline"}
          size={40}
          color="#0d0b2f"
        />

      </TouchableOpacity>

      {/* Duration Presets */}
      <View style={focusStyles.presetContainer}>
        <TouchableOpacity
          style={focusStyles.presetBtn}
          onPress={() => handleSetDuration(60)}
        >
          <Text style={focusStyles.presetText}>1m</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={focusStyles.presetBtn}
          onPress={() => handleSetDuration(300)}
        >
          <Text style={focusStyles.presetText}>5m</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={focusStyles.presetBtn}
          onPress={() => handleSetDuration(600)}
        >
          <Text style={focusStyles.presetText}>10m</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={focusStyles.presetBtn}
          onPress={() => setCustomModalVisible(true)}
        >
          <Text style={focusStyles.presetText}>Custom</Text>
        </TouchableOpacity>

        {/* Custom Duration Modal */}
        <Modal
          visible={customModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setCustomModalVisible(false)}
        >
          <View style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "rgba(0,0,0,0.5)"
          }}>
            <View style={{
              backgroundColor: "#090227ff",
              padding: 24,
              borderRadius: 20,
              width: 320,
              alignItems: "center",
              shadowColor: "#000",
              shadowOpacity: 0.3,
              shadowRadius: 10,
              elevation: 10
            }}>
              <Text style={{
                color: "#fff",
                fontSize: 18,
                marginBottom: 12
              }}>Enter duration</Text>

              <TextInput
                value={customInput}
                onChangeText={setCustomInput}
                keyboardType="numeric"
                placeholder="Minutes"
                placeholderTextColor="#ccc"

                style={{
                  padding: 10,
                  color: "#fff",
                  textAlign: "center",
                  marginBottom: 20,
                  borderBottomWidth: 1,   // <-- underline only
                  borderBottomColor: "#fff", // underline color
                }}
              />
              <TouchableOpacity
                style={{
                  backgroundColor: "#f7f7f7ff",
                  paddingVertical: 10,
                  paddingHorizontal: 40,
                  borderRadius: 14,
                  marginBottom: 8,
                  alignItems: "center",
                }}
                onPress={() => {
                  const seconds = parseInt(customInput) * 60;
                  if (!isNaN(seconds) && seconds > 0) {
                    handleSetDuration(seconds);
                    setCustomModalVisible(false);
                    setCustomInput("");
                  } else {
                    alert("Please enter a valid number!");
                  }
                }}
              >
                <Text style={{ color: "#0d0b2f", fontWeight: "700", fontSize: 16 }}>Set</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ padding: 8 }}
                onPress={() => setCustomModalVisible(false)}
              >
                <Text style={{ color: "#fff", fontSize: 16 }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>

      {/* Breathing Guide */}
      <Animated.View style={[focusStyles.breathCircle, { transform: [{ scale: scaleAnim }] }]}>
        <Text style={focusStyles.breathText}>{breathText}</Text>
      </Animated.View>

    </View>
  );
}


// --- Sleep Component ---
function SleepUI() {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text style={{ color: "#fff", fontSize: 20 }}>🌙 Sleep UI Coming Soon</Text>
    </View>
  );
}



export default function MeditationListScreen({ navigation }: any) {
  const [active, setActive] = useState<string>(CATEGORIES[0].key);

  const tracks = useMemo(() => CATEGORIES.find(c => c.key === active)?.tracks ?? [], [active]);

  return (
    <LinearGradient colors={["#0d0b2f", "#2a1faa"]} style={styles.container}>
      {/* Header */}
      <View style={styles.headerBar}>
        <Text style={styles.header}>🌙 Meditation</Text>
      </View>

      {/* Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        style={{ marginBottom: 4 }}
      >
        {CATEGORIES.map(cat => {
          const selected = cat.key === active;
          return (
            <TouchableOpacity
              key={cat.key}
              onPress={() => setActive(cat.key)}
              style={[styles.tabChip, selected && styles.tabChipActive]}
            >
              <Text style={[styles.tabText, selected && styles.tabTextActive]}>{cat.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Content Area */}
      <View style={styles.tracksContainer}>
        {active === "stress" && <StressUI tracks={tracks} navigation={navigation} />}
        {active === "sleep" && <SleepUI />}
        {active === "focus" && <FocusUI />}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  headerBar: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  header: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "700",
  },
  tabChip: {
    paddingHorizontal: 32,
    borderRadius: 12,
    marginRight: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    height: 40,
    flexDirection: "row",
    marginTop: 10,
  },
  tabChipActive: {
    backgroundColor: "rgba(255,255,255,0.18)",
    borderColor: "transparent",
  },
  tabText: {
    color: "#cfd3ff",
    fontSize: 14,
  },
  tabTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  helper: {
    color: "#E6E8FF",
    opacity: 0.8,
    paddingHorizontal: 16,
    marginBottom: 8,
    marginTop: 16,
    textAlign: "center",
    fontSize: 20,
  },
  trackRow: {
    backgroundColor: "rgba(0,0,0,0.25)",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  trackTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "left",
    marginLeft: 16,
  },
  playBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#9ff1ff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#9ff1ff",
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 5,
  },
  tracksContainer: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 16,
    marginHorizontal: 16,
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginTop: -610, // ⚠️ maybe adjust later
    marginBottom: 40

  },
  trackImage: {
    width: 50,
    height: 50,
    borderRadius: 10,
  },

});


// --- Focus Styles (separate) ---
const focusStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 20,
  },

  timerText: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 12
  },

  playPauseBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#9ff1ff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 30,
    marginTop: 20,
  },

  presetContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 50,
    width: "100%",
    paddingHorizontal: 40,
  },

  presetBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.15)",
    marginHorizontal: 5,
    alignItems: "center",
    justifyContent: "center",
  },

  presetText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600"
  },

  breathCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 40,
  },

  breathText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },

});



