import { expect, it } from "vitest";
import { partyNameError, validPartyNames, createPartySession, validPartySession } from "../src/party/engine";
it("counts emoji names by code point with the existing 24-character party limit", () => {
  const players = ["🐢".repeat(24), "Dad", "Mum"];
  expect(partyNameError(players[0], players, 0)).toBeNull();
  expect(validPartyNames(players)).toBe(true);
  expect(validPartySession(createPartySession({ players }))).toBe(true);
  players[0] += "🐢";
  expect(partyNameError(players[0], players, 0)).toBe("25 characters · limit 24.");
  expect(validPartyNames(players)).toBe(false);
});
it("identifies the offending duplicate or empty field with normalized names", () => {
  expect(partyNameError(" Ｄａｄ ", ["Dad", " Ｄａｄ ", "Mum"], 1)).toContain("different name");
  expect(partyNameError("", ["", "Dad", "Mum"], 0)).toContain("1–24");
});
