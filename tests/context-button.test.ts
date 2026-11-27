import { describe, expect, it } from 'vitest';
import { bodyChoice, bodyDashDir, bodyShown, type BodyState } from '../src/input/context-button';

const s = (o: Partial<BodyState>): BodyState => ({ crouch: false, dash: false, crouched: false, stickX: 0, stickY: 0, ...o });

describe('the body button (touch context button for the crouch and the dash, #377)', () => {
  it('is shown only while a practice gives the crouch or the dash', () => {
    expect(bodyShown(s({}))).toBe(false);
    expect(bodyShown(s({ crouch: true }))).toBe(true);
    expect(bodyShown(s({ dash: true }))).toBe(true);
  });

  it('does nothing without either practice', () => {
    expect(bodyChoice(s({ stickX: 1 }))).toBeNull();
  });

  it('with the crouch alone it kneels, moving or not, and stands when crouched', () => {
    expect(bodyChoice(s({ crouch: true }))).toBe('crouch');
    expect(bodyChoice(s({ crouch: true, stickY: 1 }))).toBe('crouch');
    expect(bodyChoice(s({ crouch: true, crouched: true }))).toBe('stand');
  });

  it('with the dash alone it dashes, forward when the stick rests', () => {
    expect(bodyChoice(s({ dash: true }))).toBe('dash');
    expect(bodyDashDir(0, 0)).toBe('forward');
  });

  it('with both it kneels standing still and dashes while the stick moves; crouched, it stands first', () => {
    expect(bodyChoice(s({ crouch: true, dash: true }))).toBe('crouch');
    expect(bodyChoice(s({ crouch: true, dash: true, stickX: 0.2 }))).toBe('crouch');
    expect(bodyChoice(s({ crouch: true, dash: true, stickX: 0.6 }))).toBe('dash');
    expect(bodyChoice(s({ crouch: true, dash: true, crouched: true, stickX: 0.6 }))).toBe('stand');
  });

  it('dashes the way the stick points (touch y is positive up)', () => {
    expect(bodyDashDir(0, 1)).toBe('forward');
    expect(bodyDashDir(0, -1)).toBe('back');
    expect(bodyDashDir(1, 0.2)).toBe('right');
    expect(bodyDashDir(-1, 0)).toBe('left');
  });
});
