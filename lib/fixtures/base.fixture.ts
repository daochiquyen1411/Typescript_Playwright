import { mergeTests, mergeExpects } from "@playwright/test";
import {
    test as pageTest,
    expect as pageExpect,
} from "@fixtures/pages.fixture";

import {
    test as consoleTest,
    expect as consoleExpect,
} from "@fixtures/console.fixture";

export const test = mergeTests(pageTest, consoleTest);
export const expect = mergeExpects(pageExpect, consoleExpect);