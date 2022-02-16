const { MeterProvider } = require('@opentelemetry/sdk-metrics-base');
const { NodeTracerProvider } = require('@opentelemetry/sdk-trace-node');
const { SimpleSpanProcessor, BatchSpanProcessor, ConsoleSpanExporter, } = require('@opentelemetry/sdk-trace-base');
const { Resource } = require('@opentelemetry/resources');
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');
const { JaegerExporter } = require('@opentelemetry/exporter-jaeger');
const { PrometheusExporter } = require('@opentelemetry/exporter-prometheus');
const { registerInstrumentations } = require('@opentelemetry/instrumentation');
const { ExpressInstrumentation, ExpressRequestHookInformation } = require('opentelemetry-instrumentation-express');
const { HttpInstrumentation } = require('@opentelemetry/instrumentation-http');
const { Span, Baggage } = require('@opentelemetry/api');
const { AlwaysOnSampler, AlwaysOffSampler, ParentBasedSampler, TraceIdRatioBasedSampler } = require('@opentelemetry/core');
const { IORedisInstrumentation } = require('@opentelemetry/instrumentation-ioredis');
const { serviceSyncDetector } = require('opentelemetry-resource-detector-service');
const { CollectorTraceExporter, CollectorMetricExporter, } = require('@opentelemetry/exporter-collector');

const initializeTelemetry = (serviceName, metricPort) =>{

  // Define metrics
  const metricExporter = new PrometheusExporter({ port: metricPort }, () => {
    console.log(`scrape: http://localhost:${metricPort}${PrometheusExporter.DEFAULT_OPTIONS.endpoint}`);
  });
  const meter = new MeterProvider({ exporter: metricExporter, interval: 1000 }).getMeter(serviceName);

  // Define traces
  
  //1.) Define the Exporter.
  // Protocols: HTTP, gRPC
  // Formats : JSON, proto
  const jaegerExporter = new JaegerExporter({ endpoint: 'http://localhost:14268/api/traces'});
  const consoleExporter = new ConsoleSpanExporter();

  //2.) Define the resources
  const serviceResources = serviceSyncDetector.detect();
  const serviceNameResource =  new Resource({[SemanticResourceAttributes.SERVICE_NAME]: serviceName});
  const customResource = new Resource({'aws-region':'localhost'});


  //3.) Define the samplers
  const alwaysOnSampler = new AlwaysOffSampler();
  const paranetBasedSampler = new ParentBasedSampler({
    root: new TraceIdRatioBasedSampler(1)
  });

  //4.) Create the Provider with resources and samplers
  const provider = new NodeTracerProvider({
    resource: serviceNameResource.merge(customResource),
    sampler: alwaysOnSampler
  });

  //5.) Create Processors
  // SimpleSpanProcessor simply gets a span and ship it to the exporter in this case Jaeger Exporter.
  const simpleSpanProcessorWithJaegerExporter = new SimpleSpanProcessor(jaegerExporter);
  const simpleSpanProcessorWithConsoleExporter = new SimpleSpanProcessor(consoleExporter);

  // Batch Span Processor Example. It would buffer the spans.Below example would wait for 7 seconds before shipping the buffered
  // spans to the exporter.
  const batchSpanProcessorWithJaegerExporter = new BatchSpanProcessor(jaegerExporter,{
    scheduledDelayMillis:7000
  });

  // Add the processor to the provider
  provider.addSpanProcessor(simpleSpanProcessorWithJaegerExporter);

  provider.register();
  // Register the Instrumentations. Below are example of auto-instrumentation.
  // Each Instrumentation have its own set of configuration.
  registerInstrumentations({
      instrumentations: [
          new ExpressInstrumentation(
            // Adding Configuration To Express Instrumentation.
            {
              requestHook:(span,requestInfo) =>{
                // This will add the tag called request-header in span with all header details..
                span.setAttribute('request-headers',JSON.stringify(requestInfo.req.headers))
              }
            }
          ),
          new HttpInstrumentation()
      ]
  });

  const tracer = provider.getTracer(serviceName);
  return { meter, tracer };
};

module.exports = {
  initializeTelemetry
};