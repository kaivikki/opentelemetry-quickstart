const appTracer = require('./app-tracer');
const {meter} = appTracer.initializeTelemetry('user-service',8082);

const express = require('express');
const axios = require('axios');
const { trace, context }  = require("@opentelemetry/api");

const app = express();

const randomNumber = (min,max) =>{
  return Math.floor(Math.random()* max + min);
};

app.get('/user', async (request, response) => {
  const apiResponse = await axios('https://mocki.io/v1/d4867d8b-b5d5-4a48-a4ab-79131b5809b8');
  console.log("Got response from Mock Api.Length is "+apiResponse.data.length);
  const randomIndex = randomNumber(0, apiResponse.data.length);
  console.log("Random Index is " + randomIndex)
  const activeSpan = trace.getSpan(context.active());
  activeSpan.addEvent('A number was randomizaed', {
      randomIndex
  })
  response.json(apiResponse.data[randomIndex]);
});

app.listen(8090,()=>{
  console.log('users services is up and running on port 8090');
});