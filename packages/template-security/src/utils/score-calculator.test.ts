/**
 * Security Score Calculator Tests
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { calculateSecurityScore } from './score-calculator.js';
import fs from 'fs';
import path from 'path';

vi.mock('fs');

describe('calculateSecurityScore', () => {
    const mockReportsDir = '/mock/reports';

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should calculate perfect score (100) when all reports are clean', () => {
        (fs.readFileSync as any).mockImplementation((p: any) => {
            if (p.includes('static-analysis-report.json')) return JSON.stringify({ violations: [] });
            if (p.includes('s1-s9-report.json')) return JSON.stringify({ violations: [] });
            if (p.includes('penetration-test-full-report.json')) return JSON.stringify({ vulnerabilities: [] });
            if (p.includes('performance-report.json')) return JSON.stringify({ lighthouse: { performance: 1.0 } });
            return '';
        });

        const report = calculateSecurityScore(mockReportsDir);

        expect(report.score).toBe(100);
        expect(report.phases.static.passed).toBe(true);
        expect(report.phases.protocols.passed).toBe(true);
        expect(report.phases.penetration.passed).toBe(true);
        expect(report.phases.performance.passed).toBe(true);
    });

    it('should drop score for critical violations', () => {
        (fs.readFileSync as any).mockImplementation((p: any) => {
            if (p.includes('static-analysis-report.json')) return JSON.stringify({
                violations: [{ severity: 'CRITICAL' }, { severity: 'LOW' }]
            });
            if (p.includes('s1-s9-report.json')) return JSON.stringify({ violations: [] });
            if (p.includes('penetration-test-full-report.json')) return JSON.stringify({ vulnerabilities: [] });
            if (p.includes('performance-report.json')) return JSON.stringify({ lighthouse: { performance: 1.0 } });
            return '';
        });

        const report = calculateSecurityScore(mockReportsDir);

        // Static Analysis: 100 - 1*50 - 2*5 = 40.
        // Total score weighted: 40 * 0.25 (10) + 100 * 0.25 (25) + 100 * 0.4 (40) + 100 * 0.1 (10) = 85.
        expect(report.score).toBe(85);
        expect(report.phases.static.passed).toBe(false);
    });

    it('should handle missing reports gracefully (score 0 for that phase)', () => {
        (fs.readFileSync as any).mockImplementation(() => { throw new Error('File not found'); });

        const report = calculateSecurityScore(mockReportsDir);

        expect(report.score).toBe(0);
        expect(report.phases.static.score).toBe(0);
    });

    it('should calculate penetration score correctly with High severity', () => {
        vi.mocked(fs.readFileSync).mockImplementation((p: any) => {
            if (p.includes('static-analysis-report.json')) return JSON.stringify({ violations: [] });
            if (p.includes('s1-s9-report.json')) return JSON.stringify({ violations: [] });
            if (p.includes('penetration-test-full-report.json')) return JSON.stringify({
                vulnerabilities: [{ severity: 'HIGH' }]
            });
            if (p.includes('performance-report.json')) return JSON.stringify({ lighthouse: { performance: 1.0 } });
            return '';
        });

        const report = calculateSecurityScore(mockReportsDir);
        // Pentest: 100 - 0*100 - 1*20 = 80
        // Total: 25 + 25 + 80*0.4(32) + 10 = 92
        expect(report.score).toBe(92);
    });
});
