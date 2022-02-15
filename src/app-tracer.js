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
  const traceExporter = new JaegerExporter({ endpoint: 'http://localhost:14268/api/traces'});
  const provider = new NodeTracerProvider({
      resource: new Resource({
          [SemanticResourceAttributes.SERVICE_NAME]: serviceName
      })
  });
  provider.addSpanProcessor(new SimpleSpanProcessor(traceExporter));
  provider.register();
  registerInstrumentations({
      instrumentations: [
          new ExpressInstrumentation(),
          new HttpInstrumentation()
      ]
  });
  const tracer = provider.getTracer(serviceName);
  return { meter, tracer };
};

module.exports = {
  initializeTelemetry
};