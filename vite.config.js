import { defineConfig, transformWithEsbuild } from 'vite';
import react from '@vitejs/plugin-react';
import legacy from '@vitejs/plugin-legacy';

function handleModuleDirectivesPlugin() {
  return {
    name: 'handle-module-directives-plugin',
    transform(code, id) {
      if (id.includes('@vkontakte/icons')) {
        code = code.replace(/"use-client";?/g, '');
      }
      return { code };
    },
  };
}

function threatJsFilesAsJsx() {
  return {
    name: 'treat-js-files-as-jsx',
    async transform(code, id) {
      if (!id.match(/src\/.*\.js$/)) return null;

      return transformWithEsbuild(code, id, {
        loader: 'jsx',
        jsx: 'automatic',
      });
    },
  };
}

/**
 * Some chunks may be large.
 * This will not affect the loading speed of the site.
 * We collect several versions of scripts that are applied depending on the browser version.
 * This is done so that your code runs equally well on the site and in the odr.
 * The details are here: https://dev.vk.ru/mini-apps/development/on-demand-resources.
 */
export default defineConfig({
  base: '/TravelDiary/',

  plugins: [
    react(),
    threatJsFilesAsJsx(),
    handleModuleDirectivesPlugin(),
    legacy({
      targets: ['defaults', 'not IE 11'],
    }),
  ],

  // ДОБАВЬТЕ ЭТУ СЕКЦИЮ:
  server: {
    allowedHosts: [
      'a69bb767d88b8814-77-222-99-234.serveousercontent.com',
      '.serveousercontent.com', // разрешить все поддомены serveousercontent.com
      'localhost'
    ]
  },

  optimizeDeps: {
    force: true,
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
      },
    },
  },

  build: {
    outDir: 'build',
  },
});