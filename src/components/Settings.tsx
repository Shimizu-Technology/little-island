import * as Linking from "expo-linking";
import appConfig from "../../app.json";
import React, { useState } from "react";
import { TextInput, View } from "react-native";
import { Text } from "./Text";
import { useStore } from "../state/Store";
import { exportBackup, importBackup } from "../state/backup";
import { Button, C, Chip, Copy, Heading, Sheet, ToggleRow, font, styles } from "./ui";
import { Gate, gateAccepts, makeGate } from "../state/grownUpGate";
import { PreviousSaves } from "./PreviousSaves";
import { practiceSummary } from "../learn/skills";
import { engines, skillLabels } from "../learn/engines";
import { islandNames } from "../learn/home";
import type { Island } from "../learn/types";
import { PracticeOptions } from "./PracticeOptions";
import { LearnerSettings } from "../learn/LearnerSettings";
import { useSoundControls } from "./Audio";
import { emptyArcade } from "../arcade";
import { learnerPractice } from "../learn/learners";
export function Settings({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const store = useStore(),
    [unlocked, setUnlocked] = useState(false),
    [message, setMessage] = useState(""),
    [sourceError, setSourceError] = useState(""),
    [pending, setPending] = useState<string | null>(null),
    [history, setHistory] = useState(false),
    [busy, setBusy] = useState(false),
    [gate, setGate] = useState<Gate>(() => makeGate()),
    [answer, setAnswer] = useState("");
  const { play: previewVoice } = useSoundControls(store.save.settings.sound && visible);
  const practice = practiceSummary(store.save.skills, skillLabels());
  function check() {
    if (gateAccepts(gate, answer)) {
      setUnlocked(true);
      setMessage("");
    } else {
      setMessage("That’s not it. A grown-up can try a new question.");
      setGate(makeGate());
    }
    setAnswer("");
  }
  function close() {
    setUnlocked(false);
    setGate(makeGate());
    setAnswer("");
    setPending(null);
    setSourceError("");
    setHistory(false);
    setMessage("");
    onClose();
  }
  async function read() {
    setPending(null);
    setMessage("");
    try {
      const raw = await importBackup();
      if (raw) {
        setPending(raw);
      }
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "We could not read that backup.");
    }
  }
  async function restore() {
    if (!pending) return;
    setBusy(true);
    try {
      await store.restore(pending);
      setPending(null);
      setHistory(false);
      setMessage("Your games and settings have been restored.");
    } catch (error) {
      if (error instanceof Error && /original has been kept/.test(error.message)) close();
      else setMessage("The backup could not be restored. Your current games are still kept.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Sheet visible={visible} onClose={close} title="Your little island">
      <Heading style={{ fontSize: 19 }}>Make yourself comfortable</Heading>
      <ToggleRow
        label="Sound"
        detail="Turn all audio on or off"
        value={store.save.settings.sound}
        disabled={busy}
        onChange={(sound) => store.settings({ sound })}
      />
      <ToggleRow label="Game sounds" detail="Small feedback tones" value={store.save.settings.effects ?? true} disabled={busy} onChange={effects => store.settings({ effects })} />
      <ToggleRow label="Spoken help" detail="Hear questions and instructions when you ask" value={store.save.settings.narration ?? true} disabled={busy} onChange={narration => store.settings({ narration })} />
      <ToggleRow label="Read aloud automatically" detail="Off keeps speech on tap-to-hear" value={store.save.settings.automaticSpeech ?? false} disabled={busy} onChange={automaticSpeech => store.settings({ automaticSpeech })} />
      <Heading style={{ fontSize: 17 }}>Narration voice</Heading>
      <View style={[styles.row, { flexWrap: "wrap" }]}>{(["warm", "calm"] as const).map(voice => <Chip key={voice} selected={(store.save.settings.voice ?? "warm") === voice} onPress={() => { if (!busy) store.settings({ voice }); }}>{voice === "warm" ? "Warm" : "Calm"}</Chip>)}</View>
      <Button quiet compact disabled={!store.save.settings.sound || store.save.settings.narration === false || busy} onPress={() => previewVoice("voice-preview")}>Hear this voice</Button>
      <Heading style={{ fontSize: 17 }}>Narration volume</Heading>
      <View style={[styles.row, { flexWrap: "wrap" }]}>{[0.25, 0.5, 0.75, 1].map(narrationVolume => <Chip key={narrationVolume} selected={(store.save.settings.narrationVolume ?? 0.75) === narrationVolume} onPress={() => { if (!busy) store.settings({ narrationVolume }); }}>{Math.round(narrationVolume * 100)}%</Chip>)}</View>
      <ToggleRow
        label="Checkers piece hints"
        detail="A small dot on pieces that can move"
        value={store.save.settings.help}
        disabled={busy}
        onChange={(help) => store.settings({ help })}
      />
      <Copy>
        Games and Explore work without internet. Nearby family rooms use a local connection between approved devices. Saves stay on this device. There are no accounts, ads, trackers, or in-app purchases.
      </Copy>
      <View style={{ height: 1, backgroundColor: C.line }} />
      <Heading style={{ fontSize: 19 }}>For grown-ups</Heading>
      {!unlocked ? (
        <>
          <Copy>Practice notes, backups and About are for grown-ups. Type the answer to unlock.</Copy>
          <View style={[styles.row, { gap: 10 }]}>
            <Text style={{ fontFamily: font, fontSize: 20, fontWeight: "700", color: C.ink }}>
              {gate.a} × {gate.b} =
            </Text>
            <TextInput
              accessibilityLabel={`Grown-up question: ${gate.a} times ${gate.b}`}
              value={answer}
              onChangeText={(v) => setAnswer(v.replace(/[^0-9]/g, "").slice(0, 3))}
              keyboardType="number-pad"
              returnKeyType="done"
              onSubmitEditing={check}
              autoComplete="off"
              textContentType="none"
              style={[styles.input, { width: 96, textAlign: "center", minHeight: 48, paddingVertical: 10 }]}
            />
            <Button quiet compact disabled={!answer} onPress={check}>
              Unlock
            </Button>
          </View>
        </>
      ) : (
        <>
          <View style={{ gap: 8 }}>
            <Heading style={{ fontSize: 19 }}>About</Heading>
            <Copy>{appConfig.expo.name} · Version {appConfig.expo.version}</Copy>
            <Copy>Made by Shimizu Technology</Copy>
            <Copy>Little Island is open source (MIT)</Copy>
            <Copy>No ads, accounts or tracking.</Copy>
            <Button quiet disabled={busy} onPress={() => {
              if (!unlocked) return;
              setSourceError("");
              void Linking.openURL("https://github.com/Shimizu-Technology/little-island")
                .catch(() => setSourceError("The source code could not be opened. Please try again when you’re online."));
            }}>View the source code</Button>
            {!!sourceError && <View accessibilityLiveRegion="polite"><Copy>{sourceError}</Copy></View>}
          </View>
          <View style={{ height: 1, backgroundColor: C.line }} />
          {/* Additive Arcade grown-up controls; neither reminder nor music is forced on. */}
          <Heading style={{ fontSize: 19 }}>Arcade comfort</Heading>
          <ToggleRow label="Arcade music" detail="Quiet original loops during play" value={store.save.arcade?.music ?? false} disabled={busy} onChange={music => store.arcade({ type: "preferences", music }, { epoch: store.epoch, learner: store.save.learning?.active ?? "family" })} />
          <ToggleRow label="Unlock every arcade level" detail="Open all worlds and free play for every learner" value={store.save.arcade?.unlockAll ?? false} disabled={busy} onChange={unlockAll => store.arcade({ type: "preferences", unlockAll }, { epoch: store.epoch, learner: store.save.learning?.active ?? "family" })} />
          <Copy>Arcade break reminder · appears only between levels</Copy>
          <View style={[styles.row, { flexWrap: "wrap" }]}>{([0, 15, 20, 30, 45] as const).map(breakMinutes => <Chip key={breakMinutes} selected={(store.save.arcade ?? emptyArcade()).breakMinutes === breakMinutes} onPress={() => { if (!busy) store.arcade({ type: "preferences", breakMinutes }, { epoch: store.epoch, learner: store.save.learning?.active ?? "family" }); }}>{breakMinutes ? `${breakMinutes} min` : "Off"}</Chip>)}</View>
          <ToggleRow label="Show my islander in learning games" detail="A friend beside questions and practice" value={store.save.settings.learningIslander ?? true} disabled={busy} onChange={learningIslander => store.settings({ learningIslander })} />
          <LearnerSettings disabled={busy} />
          <PracticeOptions value={learnerPractice(store.save.learning, store.save.settings.practice)}
            onChange={practice => store.settings({ practice })} disabled={busy} />
          {!!Object.keys(store.save.practiceNotes ?? {}).length && <View style={{ gap: 6 }}>
            <Heading style={{ fontSize: 19 }}>Earlier family practice</Heading>
            <Copy>Earlier shared-device counts are kept here. They are not assigned to a child or used to judge individual proficiency. A guided answer counts toward finishing practice.</Copy>
            {Object.entries(store.save.practiceNotes ?? {}).map(([skill, notes]) => <Copy key={skill}>
              {skillLabels()[skill] ?? (skill.startsWith("read.") ? "Reading pictures" : "Number practice")}: {notes.independent} on her own · {notes.helped} with help
            </Copy>)}
          </View>}
          <Heading style={{ fontSize: 19 }}>Shared family practice signals</Heading>
          {!practice.length && <Copy>No recent practice yet. As she explores the learning islands, the words and ideas she tries will appear here.</Copy>}
          {(["reading", "numbers", "science", "thinking", "coding"] as Island[]).map(island => {
            const labels = new Set(Object.values(engines).filter(e => e.island === island).flatMap(e => Object.keys(e.skills)));
            const lines = practice.filter(line => labels.has(line.skill));
            return !lines.length ? null : <View key={island} style={{ gap: 6 }}>
              <Heading style={{ fontSize: 17 }}>{islandNames[island]}</Heading>
              {lines.map(line => <Copy key={line.skill}>{line.label} — {line.state === "getting-easier" ? "getting easier" : "practicing"}</Copy>)}
            </View>;
          })}
          <View style={{ height: 1, backgroundColor: C.line }} />
          <Copy>
            A backup lets you move progress to another device. Deleting the app can remove its local saves. Keep backups
            in a private place; family names and secret game roles may be included. Nearby room credentials are never backed up.
          </Copy>
          <Button
            quiet
            disabled={busy}
            onPress={() =>
              void exportBackup(JSON.stringify(store.save))
                .then(() => setMessage("Choose a private place to save your backup."))
                .catch(() => setMessage("The backup could not be shared. Please try again."))
            }
          >
            Save a backup
          </Button>
          <Button quiet disabled={busy} onPress={() => void read()}>
            Choose a backup to restore
          </Button>
          <Button quiet disabled={busy} onPress={() => { setPending(null); setHistory(!history); }}>
            {history ? "Close previous saves" : "Previous saves"}
          </Button>
          {history && !pending && <PreviousSaves onChoose={(raw) => { setPending(raw); setMessage(""); }} />}
          {pending && (
            <>
              <Copy>
                Restoring replaces the games, learners, islanders and rooms on this device. An older backup restores its older state. A copy of the current save is preserved in recovery
                storage.
              </Copy>
              <Button disabled={busy} onPress={() => void restore()}>
                {busy ? "Restoring…" : "Replace games with this backup"}
              </Button>
              <Button quiet onPress={() => setPending(null)}>
                Keep my current games
              </Button>
            </>
          )}
          <Copy>
            Family preview · Version {appConfig.expo.version}. Public release and physical-device acceptance are separate milestones.
          </Copy>
        </>
      )}
      {!!message && <Copy style={{ color: C.ink }}>{message}</Copy>}
    </Sheet>
  );
}
