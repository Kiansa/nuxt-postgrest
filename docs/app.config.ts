export default defineAppConfig({
  seo: {
    title: 'Nuxt PostgREST',
    description: 'First-class PostgREST for Nuxt. Typed clients, SSR-aware composables and auth-aware JWT forwarding.',
  },
  header: {
    title: 'Nuxt PostgREST',
  },
  github: {
    url: 'https://github.com/Kiansa/nuxt-postgrest',
    branch: 'main',
    rootDir: 'docs',
  },
  socials: {
    npm: 'https://www.npmjs.com/package/nuxt-postgrest',
  },
  ui: {
    colors: {
      primary: 'emerald',
      neutral: 'zinc',
    },
    commandPalette: {
      slots: {
        item: 'items-center',
        input: '[&_.iconify]:size-4 [&_.iconify]:mx-0.5',
      },
      variants: {
        size: {
          md: {
            itemLeadingIcon: 'size-4 mx-0.5',
          },
        },
      },
    },
    contentNavigation: {
      slots: {
        linkLeadingIcon: 'size-4 mx-0.5',
        linkTrailing: 'hidden',
      },
    },
    pageLinks: {
      slots: {
        linkLeadingIcon: 'size-4',
        linkLabelExternalIcon: 'size-2.5',
      },
    },
  },
})
