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
        replacesTitle: true,
      },
      social: {
        github: 'https://github.com/brunohart/theatrical',
      },
      sidebar: [
        {
          label: 'Getting Started',
          items: [
            { label: 'Installation', link: '/getting-started/installation/' },
            { label: 'Quickstart', link: '/getting-started/quickstart/' },
          ],
        },
        {
          label: 'Guides',
          items: [
            { label: 'Authentication', link: '/guides/authentication/' },
            { label: 'Error Handling', link: '/guides/error-handling/' },
            { label: 'Theming & Branding', link: '/guides/theming/' },
          ],
        },
        {
          label: 'Templates',
          items: [
            { label: 'Overview', link: '/templates/overview/' },
            { label: 'React Ticketing', link: '/templates/react-ticketing/' },
          ],
        },
        {
          label: 'Packages',
          items: [
            { label: '@theatrical/sdk', link: '/packages/sdk/' },
            { label: '@theatrical/cli', link: '/packages/cli/' },
            { label: '@theatrical/react', link: '/packages/react/' },
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
