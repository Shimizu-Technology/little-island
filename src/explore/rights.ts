import { TOPICS } from "./content";
/** Per-item provenance is bundled with the app; references are not runtime downloads. */
export const EXPLORE_ASSET_REGISTRY = TOPICS.map((topic) => ({
  topicId: topic.id,
  explanation: { origin: "Original Little Island text", file: "src/explore/content.ts", copiedSourceText: false },
  illustration: {
    origin: "Original Little Island SVG code",
    file: "src/explore/ExploreArt.tsx",
    motif: topic.illustration,
    thirdPartyImage: false,
  },
  references: topic.sources,
  review: topic.review,
  narration: {
    transcript: "topicNarration(topic)",
    distribution:
      "Parent integration supplies bundled private-family audio; this module imports no external recording.",
  },
}));
