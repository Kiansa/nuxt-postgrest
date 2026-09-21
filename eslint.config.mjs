// @ts-check
import { createConfigForNuxt } from '@nuxt/eslint-config/flat'

// Run `npx @eslint/config-inspector` to inspect the resolved config interactively
export default createConfigForNuxt({
  features: {
    // Rules for module authors
    tooling: true,
    // Rules for formatting
    stylistic: true,
  },
  dirs: {
    src: [
      './playground',
      './test/fixtures/basic',
    ],
  },
})
  .append({
    // Nuxt pages/layouts are routed by file name, not registered as components
    files: ['**/pages/**/*.vue', '**/app.vue'],
    rules: { 'vue/multi-word-component-names': 'off' },
  }, {
    ignores: ['docs/.data', 'docs/.output', 'docs/.nuxt'],
  })
