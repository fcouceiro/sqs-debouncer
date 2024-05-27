import cron from 'node-cron';

import debouncer from './debouncedSqs.js';

// Runs every hour at the start of the hour
cron.schedule('0 * * * *', async () => {
  // Push out all deduped messages received so far (see `./debounceWorker.js`)
  debouncer.dispatchStoredMessages();
});
