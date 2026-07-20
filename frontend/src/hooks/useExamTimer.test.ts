import { describe, it, expect } from 'vitest';
import { formatTime } from './useExamTimer';

describe('formatTime', () => {
  it('formate les minutes et secondes en MM:SS', () => {
    expect(formatTime(0)).toBe('00:00');
    expect(formatTime(65)).toBe('01:05');
    expect(formatTime(35 * 60)).toBe('35:00');
    expect(formatTime(40 * 60)).toBe('40:00');
  });
});
