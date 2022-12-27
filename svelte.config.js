import { mdsvex } from 'mdsvex';
import mdsvexConfig from './mdsvex.config.js';
import adapter from '@sveltejs/adapter-auto';
import { vitePreprocess } from '@sveltejs/kit/vite';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	extensions: ['.svelte', ...mdsvexConfig.extensions],

	// Consult https://kit.svelte.dev/docs/integrations#preprocessors
	// for more information about preprocessors
	preprocess: [vitePreprocess({ postcss: true }), mdsvex(mdsvexConfig)],

	kit: {
		adapter: adapter()
	},
	package: {
		exports: (filepath) => {
			return filepath.endsWith('index.js');
		},
		files: (filepath) => {
			return !filepath.endsWith('.test.ts');
		}
	}
};

export default config;
