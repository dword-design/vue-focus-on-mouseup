import pathLib from 'node:path';

import { expect, test } from '@playwright/test';
import endent from 'endent';
import { execaCommand } from 'execa';
import fs from 'fs-extra';
import getPort from 'get-port';
import nuxtDevReady from 'nuxt-dev-ready';
import kill from 'tree-kill-promise';

test('valid', async ({ page }, testInfo) => {
  const cwd = testInfo.outputPath();

  await fs.outputFile(
    pathLib.join(cwd, 'app', 'pages', 'index.vue'),
    endent`
      <template>
        <button v-focus-on-mouseup>Hello world</input>
      </template>

      <script setup lang="ts">
      import vFocusOnMouseup from '../../../../src';
      </script>
    `,
  );

  const port = await getPort();

  const nuxt = execaCommand('nuxt dev', {
    cwd,
    env: { PORT: String(port) },
    reject: false,
  });

  try {
    await nuxtDevReady(port);
    await page.goto(`http://localhost:${port}`);
    const button = page.locator('button');
    await expect(button).toBeAttached();

    const buttonCoords = await button.evaluate(buttonEl => {
      const bounds = buttonEl.getBoundingClientRect();
      return {
        x: bounds.x + bounds.width / 2,
        y: bounds.y + bounds.height / 2,
      };
    });

    await page.mouse.move(buttonCoords.x, buttonCoords.y);
    await expect(button).not.toBeFocused();
    await page.mouse.down();
    await expect(button).not.toBeFocused();
    await page.mouse.up();
    await expect(button).toBeFocused();
  } finally {
    await kill(nuxt.pid!);
  }
});
