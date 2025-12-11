import type { App } from 'vue';

import directive from './src';

const directivePlugin = {
  ...directive,
  install: (app: App) => app.directive('VueFocusOnMouseup', directive),
};

if (typeof globalThis !== 'undefined') {
  (globalThis as Record<string, unknown>).VueFocusOnMouseup = directivePlugin;
}

export default directivePlugin;