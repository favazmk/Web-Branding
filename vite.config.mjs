import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default {
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        webdev: resolve(__dirname, 'web-development-services.html'),
        digital: resolve(__dirname, 'digital-marketing.html'),
        campaign: resolve(__dirname, 'campaign.html'),
        wip: resolve(__dirname, 'work-in-progress.html')
      }
    }
  }
};
