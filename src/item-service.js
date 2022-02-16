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

/* Manual Instrumentation Example */
//setInterval(async () =>{
  // Below Implementaion will create two traces each having one span. One trace would be Refresh Cache
  // and second trace would be HTTP GET to mock API. This is not useful as we want this to be a single trace called referesh-cache
  // two spans together
  
  // const span = trace.getTracer('manual').startSpan('Refresh Cache');
  // const apiResponse = await axios('https://mocki.io/v1/d4867d8b-b5d5-4a48-a4ab-79131b5809b8');
  // span.end();
  

  // Create a Single Trace with two spans. Anything that happens in callback woule be added to context of startActiveSpan
 // trace.getTracer('manual').startActiveSpan('Refresh Cache', async (span) =>{
    //const apiResponse = await axios('https://mocki.io/v1/d4867d8b-b5d5-4a48-a4ab-79131b5809b8');
    //span.end();
 // })

//},60*1000);

app.listen(8080,()=>{
  console.log('items services is up and running on port 8080');
});
