import { expect, it } from 'vitest';
import { homeCharacterPose } from '../src/home/characterPose';
import { resolvePose } from '../src/islander/rig/poses';
it('maps both room poses to supported front rig poses, including sitting on furniture', () => {
  expect(resolvePose('front', homeCharacterPose('stand')).id).toBe('idle');
  expect(resolvePose('front', homeCharacterPose('sit')).seated).toBe(true);
});
