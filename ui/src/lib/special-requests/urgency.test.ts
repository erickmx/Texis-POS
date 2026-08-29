import { getUrgency } from './urgency';

describe('getUrgency', () => {
  it('should return normal tier when deadline is null.', () => {
    const result = getUrgency(null);
    expect(result.tier).toBe('normal');
    expect(result.label).toBe('Normal');
  });

  it('should return overdue tier when deadline is in the past.', () => {
    const pastDeadline = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const result = getUrgency(pastDeadline);
    expect(result.tier).toBe('overdue');
    expect(result.label).toBe('OVERDUE');
  });

  it('should return urgent tier when deadline is within 24 hours.', () => {
    const deadline = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString();
    const result = getUrgency(deadline);
    expect(result.tier).toBe('urgent');
    expect(result.label).toBe('Urgent');
  });

  it('should return warning tier when deadline is within 3 days.', () => {
    const deadline = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();
    const result = getUrgency(deadline);
    expect(result.tier).toBe('warning');
    expect(result.label).toBe('Warning');
  });

  it('should return normal tier when deadline is more than 3 days away.', () => {
    const deadline = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString();
    const result = getUrgency(deadline);
    expect(result.tier).toBe('normal');
    expect(result.label).toBe('Normal');
  });

  it('should return urgent tier when deadline is exactly at the 24h boundary minus 1ms.', () => {
    const deadline = new Date(Date.now() + 24 * 60 * 60 * 1000 - 1).toISOString();
    const result = getUrgency(deadline);
    expect(result.tier).toBe('urgent');
  });

  it('should return warning tier when deadline is exactly at the 3-day boundary minus 1ms.', () => {
    const deadline = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 - 1).toISOString();
    const result = getUrgency(deadline);
    expect(result.tier).toBe('warning');
  });
});
