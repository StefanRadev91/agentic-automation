import { Locator, Page } from '@playwright/test';
import { AppRoutes, EventCategory } from '../../enums/app/app';
import { NavigationComponent } from '../components/navigation.component';

/**
 * Page Object for the EventHub events list (search and filters).
 */
export class EventsPage {
    readonly nav: NavigationComponent;

    constructor(private readonly page: Page) {
        this.nav = new NavigationComponent(page);
    }

    // ==================== Locators ====================

    get heading(): Locator {
        return this.page.getByRole('heading', { name: 'Upcoming Events' });
    }

    get searchInput(): Locator {
        return this.page.getByPlaceholder('Search events, venues…');
    }

    get categoryFilter(): Locator {
        return this.page.getByRole('combobox').filter({
            has: this.page.getByRole('option', { name: 'All Categories' }),
        });
    }

    get cityFilter(): Locator {
        return this.page.getByRole('combobox').filter({
            has: this.page.getByRole('option', { name: 'All Cities' }),
        });
    }

    get eventCards(): Locator {
        return this.page.getByTestId('event-card');
    }

    // Event card whose text contains the given title.
    eventCard(title: string): Locator {
        return this.eventCards.filter({ hasText: title });
    }

    // ==================== Actions ====================

    /**
     * Opens the events list.
     *
     * @returns {Promise<void>} Resolves when navigation is complete.
     */
    async openEventsPage(): Promise<void> {
        await this.page.goto(`${process.env.APP_URL!}${AppRoutes.EVENTS}`, {
            waitUntil: 'domcontentloaded',
        });
    }

    /**
     * Types a query into the search box.
     *
     * @param {string} query - Free text matched against title, description and venue.
     * @returns {Promise<void>}
     */
    async search(query: string): Promise<void> {
        await this.searchInput.fill(query);
    }

    /**
     * Filters the list by category.
     *
     * @param {EventCategory} category - Category to show.
     * @returns {Promise<void>}
     */
    async filterByCategory(category: EventCategory): Promise<void> {
        await this.categoryFilter.selectOption(category);
    }

    /**
     * Opens the booking page of the card matching the title.
     *
     * @param {string} title - Event title (or part of it).
     * @returns {Promise<void>}
     */
    async openEvent(title: string): Promise<void> {
        await this.eventCard(title).getByTestId('book-now-btn').click();
    }
}
