const appTracer = require('./app-tracer');
const {meter} = appTracer.initializeTelemetry('item-service',8081);

const express = require('express');
const axios = require('axios');
const { trace, context }  = require("@opentelemetry/api");

const app = express();
const httpCounter = meter.createCounter('http_calls');

app.get('/data', async (request, response) => {
  try {
      if (request.query['fail']) {
          throw new Error('A really bad error :/')
      }
      const user = await axios.get('http://localhost:8090/user');
      response.json(user.data);
  } catch (e) {
      const activeSpan = trace.getSpan(context.active());
      console.error(`Critical error`, { traceId: activeSpan.spanContext().traceId });
      activeSpan.recordException(e);
      response.sendStatus(500);
  }
});

app.listen(8080,()=>{
  console.log('items services is up and running on port 8080');
});
