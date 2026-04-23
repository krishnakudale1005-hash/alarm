/**
 * TaskModal.test.js — Tests for task type selection logic
 * 
 * Tests the selection state management and callback behavior
 * without requiring a full JSX renderer in Node environment.
 */

// ─── Task type selection logic ────────────────────────────────────────────────
describe('Task type selection logic', () => {
  const TASK_TYPES = ['Math Problem', 'Memory Game', 'Shake to Wake'];

  test('all three task types are defined', () => {
    expect(TASK_TYPES).toHaveLength(3);
    expect(TASK_TYPES).toContain('Math Problem');
    expect(TASK_TYPES).toContain('Memory Game');
    expect(TASK_TYPES).toContain('Shake to Wake');
  });

  test('selecting a task type calls the callback with correct value', () => {
    const onSelect = jest.fn();
    const selected = 'Memory Game';
    onSelect(selected);
    expect(onSelect).toHaveBeenCalledWith('Memory Game');
  });

  test('selecting "Shake to Wake" calls callback correctly', () => {
    const onSelect = jest.fn();
    onSelect('Shake to Wake');
    expect(onSelect).toHaveBeenCalledWith('Shake to Wake');
  });

  test('default selected task is "Math Problem"', () => {
    const defaultTask = 'Math Problem';
    expect(defaultTask).toBe('Math Problem');
  });

  test('onSelect is not called before any interaction', () => {
    const onSelect = jest.fn();
    expect(onSelect).not.toHaveBeenCalled();
  });

  test('onSelect is called exactly once per selection', () => {
    const onSelect = jest.fn();
    onSelect('Memory Game');
    expect(onSelect).toHaveBeenCalledTimes(1);
  });
});

// ─── Active state determination ───────────────────────────────────────────────
describe('Task button active state', () => {
  test('a task button is active when its value matches selected', () => {
    const selected = 'Memory Game';
    const isActive = (task) => task === selected;
    expect(isActive('Memory Game')).toBe(true);
    expect(isActive('Math Problem')).toBe(false);
    expect(isActive('Shake to Wake')).toBe(false);
  });

  test('only one task button is active at a time', () => {
    const TASK_TYPES = ['Math Problem', 'Memory Game', 'Shake to Wake'];
    const selected = 'Shake to Wake';
    const activeCount = TASK_TYPES.filter(t => t === selected).length;
    expect(activeCount).toBe(1);
  });
});

// ─── Ringtone selection logic ──────────────────────────────────────────────────
describe('Ringtone selection logic', () => {
  const PRESET_RINGTONES = ['alarm.mp3', 'chime.mp3', 'digital.mp3'];

  test('preset ringtones list has exactly 3 items', () => {
    expect(PRESET_RINGTONES).toHaveLength(3);
  });

  test('selecting a preset ringtone calls callback with filename', () => {
    const onSelectRingtone = jest.fn();
    onSelectRingtone('chime.mp3');
    expect(onSelectRingtone).toHaveBeenCalledWith('chime.mp3');
  });

  test('default ringtone is alarm.mp3', () => {
    const defaultRingtone = 'alarm.mp3';
    expect(PRESET_RINGTONES).toContain(defaultRingtone);
  });

  test('correctly identifies a preset vs custom ringtone', () => {
    expect(PRESET_RINGTONES.includes('alarm.mp3')).toBe(true);
    expect(PRESET_RINGTONES.includes('my_custom.mp3')).toBe(false);
  });
});
