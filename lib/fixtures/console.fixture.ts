import {
    test as baseTest,
    type Page,
    type ConsoleMessage,
} from '@playwright/test';

class PageConsole {
    readonly messages : ConsoleMessage[] = [];

    constructor (page: Page) {
        page.on("console", (message) => {
            this.messages.push(message)
        });
    }
}

export const test = baseTest.extend<{ pageConsole : PageConsole}> ({
    pageConsole: async ({page}, use) => {
        const pageConsole = new PageConsole(page);
        await use(pageConsole);
    }
})

export { expect } from '@playwright/test';
