import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  integrations: [
    starlight({
      title: 'Theatrical',
      description: 'Developer toolkit for cinema management platforms — built on Vista Group APIs.',
      logo: {
        light: './src/assets/logo-light.svg',
        dark: './src/assets/logo-dark.svg',
        replacesTitle: false,
      },
      social: {
        github: 'https://github.com/brunohart/theatrical',
      },
      sidebar: [
        {
          label: 'Getting Started',
          items: [
            { label: 'Installation', slug: 'getting-started/installation' },
            { label: 'Quickstart', slug: 'getting-started/quickstart' },
          ],
        },
        {
          label: 'Guides',
          items: [
            { label: 'Authentication', slug: 'guides/authentication' },
            { label: 'Error Handling', slug: 'guides/error-handling' },
            { label: 'Theming & Branding', slug: 'guides/theming' },
          ],
        },
        {
          label: 'Templates',
          items: [
            { label: 'Overview', slug: 'templates/overview' },
            { label: 'React Ticketing', slug: 'templates/react-ticketing' },
          ],
        },
        {
          label: 'Packages',
          items: [
            { label: '@theatrical/sdk', slug: 'packages/sdk' },
            { label: '@theatrical/cli', slug: 'packages/cli' },
            { label: '@theatrical/react', slug: 'packages/react' },
          ],
        },
      ],
      customCss: ['./src/styles/custom.css'],
      head: [
        {
          tag: 'meta',
          attrs: {
            name: 'og:description',
            content: 'Developer toolkit for cinema management platforms',
          },
        },
      ],
    }),
  ],
});
