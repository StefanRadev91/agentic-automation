import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';

/** WCAG rule sets applied by every accessibility scan. */
const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

/** Violation severities that fail a scan. */
const BLOCKING_IMPACTS = ['serious', 'critical'];

/** One accessibility violation, reduced to what a failure message needs. */
export type AccessibilityViolation = {
    id: string;
    impact: string;
    help: string;
    nodes: number;
};

/**
 * Scans the current page with axe-core against WCAG 2.0/2.1 A and AA and
 * returns the serious and critical violations.
 *
 * @param {Page} page - The page to scan, already loaded and settled.
 * @param {readonly string[]} knownRuleIds - Rule ids of known, documented violations to ignore.
 * @returns {Promise<AccessibilityViolation[]>} Blocking violations; empty when the page passes.
 *
 * @example
 * expect(await scanAccessibility(page)).toEqual([]);
 */
export async function scanAccessibility(
    page: Page,
    knownRuleIds: readonly string[] = []
): Promise<AccessibilityViolation[]> {
    const results = await new AxeBuilder({ page })
        .withTags(WCAG_TAGS)
        .disableRules([...knownRuleIds])
        .analyze();

    return results.violations
        .filter(({ impact }) => impact && BLOCKING_IMPACTS.includes(impact))
        .map(({ id, impact, help, nodes }) => ({
            id,
            impact: impact ?? 'unknown',
            help,
            nodes: nodes.length,
        }));
}
