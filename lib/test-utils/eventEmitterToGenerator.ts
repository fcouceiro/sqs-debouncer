import { EventEmitter } from 'stream';

async function* eventEmitterToGenerator(
  emitter: EventEmitter,
  eventName: string
) {
  const queue = [];
  let resolve: any;
  let reject: any;
  let error: any;

  // Event handler
  const handler = (event) => {
    if (resolve) {
      resolve(event);
      resolve = null;
    } else {
      queue.push(event);
    }
  };

  emitter.on(eventName, handler);
  emitter.on('error', (err) => {
    error = err;
    reject(err);
  });

  try {
    while (true) {
      if (error) {
        throw error;
      }

      if (queue.length > 0) {
        yield queue.shift();
      } else {
        yield await new Promise((res, rej) => {
          resolve = res;
          reject = rej;
        });
      }
    }
  } finally {
    emitter.off(eventName, handler);
  }
}

export { eventEmitterToGenerator };
