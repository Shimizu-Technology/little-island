import { BadgeResultCard } from '../badges/ResultCard';
import { Companion } from "../islander/Companion";
import type { RoundPractice } from "../practice/useRoundPractice";
import { Text } from "../components/Text";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { AppState, Platform, StyleSheet, TextInput, View } from "react-native";
import Svg, { Circle, Path, Rect } from "react-native-svg";
import { Button, C, Copy, GameHeader, Heading, IconButton, Label, Sheet } from "../components/ui";
import { PARTY_PACKS, PartyPackId, partyPack, partyWord } from "./content";
import {
  createPartySession,
  partyAction,
  partyActor,
  partyCandidates,
  PartyIntent,
  PartySession,
  rematchParty,
  validPartyNames,
  partyNameError,
} from "./engine";
import { PartyPicture } from "./PartyPicture";
export type PartyScreenProps = {
  roundPractice?: RoundPractice;
  beforeNewRound?: (run: () => void) => void;
  session: PartySession | null;
  onChange: (next: PartySession, previous: PartySession | null) => void;
  active?: boolean;
  width?: number;
  sound?: boolean;
  onSpeakInstructions?: () => void;
  onBack?: () => void;
  onToggleSound?: () => void;
};
function CardBack() {
  return (
    <Svg width="100" height="108" viewBox="0 0 100 108" accessible={false}>
      <Rect x="12" y="7" width="76" height="94" rx="18" fill="#DCE9D9" stroke="#6A9480" strokeWidth="2" />
      <Circle cx="50" cy="49" r="22" fill="#FFF8E6" />
      <Path
        d="M42 41 Q42 31 52 33 Q64 36 55 46 Q49 49 50 55"
        fill="none"
        stroke="#246858"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <Circle cx="50" cy="63" r="3" fill="#246858" />
      <Path d="M32 82 H68" stroke="#8AAF97" strokeWidth="4" strokeLinecap="round" />
    </Svg>
  );
}
/** Secret visibility and unconfirmed vote selection are never serialized. */
export function PartyScreen({ session, onChange, active = true, width = 340, sound, onSpeakInstructions, onBack, onToggleSound, beforeNewRound, roundPractice }: PartyScreenProps) {
  const latest = useRef(session),
    change = useRef(onChange);
  React.useLayoutEffect(() => {
    latest.current = session;
    change.current = onChange;
  }, [session, onChange]);
  const [players, setPlayers] = useState(session?.players ?? ["Player 1", "Player 2", "Player 3"]),
    [pack, setPack] = useState<PartyPackId>(session?.pack ?? "animals"),
    [circles, setCircles] = useState<1 | 2>(session?.clueRounds ?? 1);
  const [setup, setSetup] = useState(!session),
    [visibleToken, setVisibleToken] = useState<string | null>(null),
    [selection, setSelection] = useState<number | null>(null),
    [help, setHelp] = useState(false),
    [confirmNew, setConfirmNew] = useState(false),
    [foreground, setForeground] = useState(AppState.currentState === "active" || Platform.OS === "web");
  const conceal = useCallback(() => {
    setVisibleToken(null);
    setSelection(null);
  }, []);
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      setForeground(state === "active");
      if (state !== "active") conceal();
    });
    return () => sub.remove();
  }, [conceal]);
  useEffect(() => {
    if (Platform.OS !== "web" || typeof document === "undefined") return;
    const hide = () => conceal();
    document.addEventListener("visibilitychange", hide);
    window.addEventListener("blur", hide);
    return () => {
      document.removeEventListener("visibilitychange", hide);
      window.removeEventListener("blur", hide);
    };
  }, [conceal]);
  // The visibility token also includes active. Once a route hides, no subsequent reactivation may expose its old card.
  useEffect(() => {
    if (!active) {
      queueMicrotask(conceal);
    }
  }, [active, conceal]);
  const newRound = beforeNewRound ?? ((run: () => void) => run());
  const commit = (next: PartySession) => {
    const previous = latest.current;
    latest.current = next;
    conceal();
    change.current(next, previous);
  };
  const act = (type: PartyIntent["type"], target?: number) => {
    if (!session || !latest.current || !active || !foreground) return;
    const next = partyAction(latest.current, {
      sessionId: session.id,
      revision: session.revision,
      player: partyActor(session)!,
      type,
      target,
    });
    if (next !== latest.current) commit(next);
  };
  const start = () => {
    if (!validPartyNames(players.map((p) => p.trim()))) return;
    newRound(() => {
    commit(
      createPartySession({
        players,
        pack,
        clueRounds: circles,
        previousWord: session?.wordId,
        previousImposter: session?.imposter,
      })
    );
    setSetup(false);
    });
  };
  const openSetup = () => {
    conceal();
    setPlayers(session?.players ?? players);
    setPack(session?.pack ?? pack);
    setCircles(session?.clueRounds ?? circles);
    setSetup(true);
    setConfirmNew(false);
  };
  const token = session ? `${session.id}:${session.revision}:${partyActor(session)}` : "";
  const shown = !!session && visibleToken === token && active && foreground && !help && !confirmNew;
  const actor = session ? partyActor(session) : null;
  const rolePhase = session?.phase === "roles",
    voting = session?.phase === "voting" || session?.phase === "runoff";
  const namesValid = validPartyNames(players.map((p) => p.trim()));
  return (
    <View style={s.root}>
      {onBack ? <GameHeader title="Secret Word" onBack={onBack} sound={onToggleSound ? { on: !!sound, toggle: onToggleSound } : undefined} onHelp={() => { conceal(); setHelp(true); }} /> : <View style={s.row}><Heading style={{ flex: 1, fontSize: 24 }}>Secret Word</Heading><IconButton icon="help" label="How to play Secret Word" onPress={() => { conceal(); setHelp(true); }} /></View>}
      {setup || !session ? (
        <Sheet visible={setup || !session} title={roundPractice?.pending ? "A little practice, then play" : "Secret Word · players & pack"} onClose={() => { if (roundPractice?.pending) roundPractice.cancel(); else if (session) setSetup(false); else onBack?.(); }} footer={roundPractice?.pending ? undefined :
          <Button disabled={!namesValid || !active} onPress={start}>Deal the secret roles</Button>
        }>
          {roundPractice?.pending ? roundPractice.content : <>
          <Copy>
            Gather 3–8 people and pass one device. Everyone sees the same secret word except one Imposter. Can your
            clues help you spot them?
          </Copy>
          <View style={s.panel}>
            <Heading style={{ fontSize: 22 }}>Who is playing?</Heading>
            <Copy style={s.small}>Nicknames are fine. Each name must be different.</Copy>
            {players.map((name, i) => (
              <View key={i} style={{ gap: 4 }}><View style={s.nameRow}>
                <Text style={s.playerNumber}>{i + 1}</Text>
                <TextInput
                  accessibilityLabel={`Player ${i + 1} name`}
                  value={name}
                  maxLength={96}
                  onChangeText={(value) => setPlayers((old) => old.map((p, n) => (n === i ? value : p)))}
                  style={s.input}
                  placeholder={`Player ${i + 1}`}
                  autoCorrect={false}
                  autoCapitalize="words"
                />
                {players.length > 3 && (
                  <Button
                    compact
                    quiet
                    label={`Remove player ${i + 1}`}
                    onPress={() => setPlayers((old) => old.filter((_, n) => n !== i))}
                  >
                    Remove
                  </Button>
                )}
              </View>
              {partyNameError(name, players, i) && <Copy style={{ color: C.error, fontSize: 14 }}>{partyNameError(name, players, i)}</Copy>}
              </View>
            ))}
            {players.length < 8 && (
              <Button
                quiet
                onPress={() =>
                  setPlayers((old) => {
                    let n = old.length + 1;
                    while (old.includes(`Player ${n}`)) n++;
                    return [...old, `Player ${n}`];
                  })
                }
              >
                Add a player
              </Button>
            )}
            {!namesValid && <Copy style={{ color: C.coral }}>Use 3–8 different names, each with 1–24 characters.</Copy>}
          </View>
          <Heading style={{ fontSize: 22 }}>Choose your picture pack</Heading>
          {PARTY_PACKS.map((p) => (
            <Button
              key={p.id}
              quiet
              selected={pack === p.id}
              label={`${p.name}. ${p.description}`}
              onPress={() => setPack(p.id)}
            >
              {p.name}
            </Button>
          ))}
          <View style={s.row}>
            <Button quiet compact selected={circles === 1} onPress={() => setCircles(1)}>
              1 clue circle
            </Button>
            <Button quiet compact selected={circles === 2} onPress={() => setCircles(2)}>
              2 clue circles
            </Button>
          </View>
          <Copy style={s.small}>
            Each person gives one clue out loud per circle. No reading, recording or speech service is required.
          </Copy>
          <Copy style={s.small}>Practice example: for BICYCLE you could say “wheels”. Keep the word itself secret.</Copy>
          {session && (
            <Button
              quiet
              onPress={() => {
                conceal();
                setSetup(false);
              }}
            >
              Return to current game
            </Button>
          )}
          </>}
        </Sheet>
      ) : session.phase === "result" ? (
        <View style={s.result}><BadgeResultCard round={session.id}/>
          <Companion event="draw"/>
          <Label>Everyone can look now</Label>
          <Heading>{session.result!.winner === "family" ? "You found the Imposter!" : "The Imposter escaped!"}</Heading>
          <Copy>
            {session.result!.reason === "tied"
              ? "The runoff was tied, so the Imposter wins this round."
              : session.result!.reason === "wrong-suspect"
                ? `The vote chose ${session.players[session.result!.suspect!]}, who knew the word. The Imposter wins this round.`
                : "Your clues and votes caught the player without the word."}
          </Copy>
          <Text style={s.word}>{session.players[session.imposter]} was the Imposter.</Text>
          <PartyPicture word={session.wordId} size={Math.min(210, width * 0.65)} />
          <Heading style={{ fontSize: 28 }}>The word was {partyWord(session.pack, session.wordId).word}.</Heading>
          <Copy style={s.small}>Votes stay private, even after the game.</Copy>
          <Button onPress={() => newRound(() => commit(rematchParty(session)))}>Play again · new word & roles</Button>
          <Button quiet onPress={openSetup}>
            Change players or pack
          </Button>
        </View>
      ) : rolePhase || voting ? (
        <>
          <View style={s.row}>
            <Label>
              {rolePhase
                ? `Secret roles · ${session.roleCursor + 1} of ${session.players.length}`
                : session.phase === "runoff"
                  ? `Private runoff · ${session.runoffBallots.length + 1} of ${session.players.length}`
                  : `Private vote · ${session.ballots.length + 1} of ${session.players.length}`}
            </Label>
          </View>
          {session.phase === "runoff" && (
            <View style={s.notice}>
              <Copy>
                The first vote tied. Vote again for one of these players:{" "}
                {partyCandidates(session)
                  .map((i) => session.players[i])
                  .join(", ")}
                . A second tie lets the Imposter escape.
              </Copy>
            </View>
          )}
          {!shown ? (
            <View style={s.secret}>
              <CardBack />
              <Heading style={{ fontSize: 27 }}>Pass to {session.players[actor!]}.</Heading>
              <Copy style={s.center}>
                {rolePhase
                  ? "Everyone else, look away. Keep the screen hidden from the group."
                  : "Choose in private. Nobody will see your vote."}
              </Copy>
              <Button
                disabled={!active || !foreground}
                label={`I am ${session.players[actor!]}. ${rolePhase ? "Reveal my card" : "Choose my vote"}`}
                onPress={() => {
                  setSelection(null);
                  setVisibleToken(token);
                }}
              >
                {rolePhase ? "Reveal my card" : "Choose my vote"}
              </Button>
            </View>
          ) : rolePhase ? (
            <View style={s.secret}>
              <Label>Only {session.players[actor!]} should look</Label>
              {actor === session.imposter ? (
                <>
                  <CardBack />
                  <Heading>You are the Imposter!</Heading>
                  <Copy style={s.center}>
                    You do not know the secret word. Listen to the clues and try to blend in. Keep your role secret.
                  </Copy>
                </>
              ) : (
                <>
                  <PartyPicture word={session.wordId} size={Math.min(210, width * 0.65)} />
                  <Label>Your secret word</Label>
                  <Text style={s.secretWord}>{partyWord(session.pack, session.wordId).word}</Text>
                  <Copy style={s.center}>
                    Remember the word and picture. Give clues later without saying the word itself.
                  </Copy>
                </>
              )}
              <Button onPress={() => act("role-done")}>Hide my card & pass</Button>
              <Button quiet onPress={conceal}>
                Hide · I need another look
              </Button>
            </View>
          ) : (
            <Sheet visible={shown && voting} title={`${session.players[actor!]}’s private vote`} onClose={conceal} footer={<>
              <Button disabled={selection === null} onPress={() => act("vote", selection!)}>
                {selection === null ? "Choose a name to confirm" : `Confirm · ${session.players[selection]} & hide`}
              </Button>
              <Button quiet onPress={conceal}>Hide without voting</Button>
            </>}>
              <Heading style={{ fontSize: 23 }}>Who is the Imposter?</Heading>
              <Copy>Pick one other player, then confirm. Your choice stays private.</Copy>
              {partyCandidates(session).filter((i) => i !== actor).map((i) => (
                <Button key={i} quiet selected={selection === i} onPress={() => setSelection(i)}>{session.players[i]}</Button>
              ))}
            </Sheet>
          )}
        </>
      ) : (
        <View style={s.panel}>
          <Label>
            Clue circle {Math.floor(session.clueCursor / session.players.length) + 1} of {session.clueRounds}
          </Label>
          <Heading style={{ fontSize: 28 }}>{session.players[actor!]}, give your clue.</Heading>
          <Copy>
            Say one short clue out loud. Do not say or spell the secret word. If you are the Imposter, use the clues you
            have heard to blend in.
          </Copy>
          <View style={s.notice}>
            <Copy>No one is eliminated during clues. Be kind, listen, and let everyone have their turn.</Copy>
          </View>
          <Button disabled={!active || !foreground} onPress={() => act("clue-done")}>
            {session.clueCursor + 1 === session.players.length * session.clueRounds
              ? "Clue given · start private voting"
              : "Clue given · next player"}
          </Button>
        </View>
      )}
      {session && !setup && session.phase !== "result" && (
        <Button
          compact
          quiet
          onPress={() => {
            conceal();
            setConfirmNew(true);
          }}
        >
          Start a different game
        </Button>
      )}
      {!setup && !!session && roundPractice?.panel}
      <Sheet title="How to play Secret-word Imposter" visible={help} onClose={() => setHelp(false)}>
        <Button quiet disabled={!sound || !onSpeakInstructions} onPress={() => onSpeakInstructions?.()}>Listen to the instructions</Button>
        <Copy>
          1. Gather 3–8 people in the same room. Take turns privately revealing a card. Everyone gets the same word and
          picture, except one player who sees “You are the Imposter”. Hide the card before passing.
        </Copy>
        <Copy>
          2. Follow the named turns. Give one short clue out loud without saying or spelling the secret word. The
          Imposter listens and tries to blend in. There are one or two complete clue circles, chosen during setup.
        </Copy>
        <Copy>Practice example: for BICYCLE you could say “wheels”. This is only a practice example.</Copy>
        <Copy>
          3. Pass the device again. Each person votes privately for one other person. You cannot vote for yourself.
          Previous votes are never shown.
        </Copy>
        <Copy>
          4. The player with the most votes is the suspect. If that is the Imposter, the family wins. If someone else is
          chosen, the Imposter wins. Tied leaders get one runoff; a second tie means the Imposter escapes.
        </Copy>
        <Copy>
          This is a friendly pretend mystery. Nobody is removed from the game. Talk kindly, and play another round with
          fresh roles. These are Little Island’s fixed house rules.
        </Copy>
        <Copy>
          Pack: {partyPack(!setup && session ? session.pack : pack).name}. Pictures are reminders of the word; they are
          not a separate clue that the Imposter can see.
        </Copy>
      </Sheet>
      <Sheet title="Start a different game?" visible={confirmNew} onClose={() => setConfirmNew(false)}>
        <Copy>Your current round stays saved while you edit setup. Dealing new roles replaces it.</Copy>
        <Button onPress={openSetup}>Choose players & pack</Button>
        <Button quiet onPress={() => setConfirmNew(false)}>
          Keep this round
        </Button>
      </Sheet>
    </View>
  );
}
const s = StyleSheet.create({
  root: { width: "100%", gap: 16 },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 10, alignItems: "center" },
  panel: { padding: 18, borderRadius: 22, backgroundColor: C.soft, gap: 13 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  playerNumber: { color: C.teal, fontSize: 18, fontWeight: "800", width: 20 },
  input: {
    flex: 1,
    minWidth: 100,
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.paper,
    paddingHorizontal: 12,
    fontSize: 17,
    color: C.ink,
  },
  small: { fontSize: 14, lineHeight: 21 },
  secret: {
    alignItems: "center",
    borderRadius: 26,
    borderColor: "#BFCFB9",
    borderWidth: 2,
    backgroundColor: "#F0F3E6",
    padding: 22,
    gap: 16,
  },
  center: { textAlign: "center" },
  secretWord: { fontSize: 34, color: C.ink, fontWeight: "800", textAlign: "center" },
  word: { fontSize: 22, color: C.ink, fontWeight: "700" },
  notice: { backgroundColor: "#F6EDD8", borderRadius: 16, padding: 14 },
  result: { borderRadius: 24, padding: 20, backgroundColor: "#E5EFE5", alignItems: "center", gap: 16 },
});
