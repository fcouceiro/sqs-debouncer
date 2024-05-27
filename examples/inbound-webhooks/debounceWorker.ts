import debouncer from './debouncedSqs';

// Keep this consumer active while you want to move messages
// from your queue to the unique index. `./cron.js` takes care
// of sending these messages to the debounced queue later on
debouncer.createInputConsumer().start();
