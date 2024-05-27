import express from 'express';
import bodyParser from 'body-parser';
import debouncer, { SQS_QUEUE_URL } from './debouncedSqs';

const app = express();
app.use(bodyParser.json());

app.post('/:tenantId/webhook/:webhookId', async (req, res) => {
  const { tenantId, webhookId } = req.params;
  const data = req.body;

  const message = {
    tenantId,
    webhookId,
    data
  };

  // This message will be consumed by `debounceWorker.js` and written to the unique
  // distributed index. Later on all duduped messages are delivered to SQS_DEBOUNCED_QUEUE_URL
  // when `cron.js` triggers.
  //
  // Note: you can use your existing way of sending messages to SQS (SQS_QUEUE_URL)
  await debouncer.enqueue([message], SQS_QUEUE_URL);

  res.sendStatus(200);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
