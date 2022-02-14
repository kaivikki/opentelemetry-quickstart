# Open Telemetry Building Blocks / 3 Pillars of Observability

1. Logs: The application story.
2. Metrics: Numbers telling the statistical facts about the system
3. Trace: The context of why things are happening.
   a. Trace Events

# Run Jaeger Docker Image

docker run -d --name jaeger \
 -e COLLECTOR_ZIPKIN_HOST_PORT=:9411 \
 -p 5775:5775/udp \
 -p 6831:6831/udp \
 -p 6832:6832/udp \
 -p 5778:5778 \
 -p 16686:16686 \
 -p 14268:14268 \
 -p 14250:14250 \
 -p 9411:9411 \
 jaegertracing/all-in-one:1.31
