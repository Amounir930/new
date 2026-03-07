import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc';
import { Resource } from '@opentelemetry/resources';
import { NodeSDK } from '@opentelemetry/sdk-node';
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from '@opentelemetry/semantic-conventions';

export function startTracing(
  serviceName: string,
  serviceVersion: string = '1.0.0'
): NodeSDK {
  // OTLP Trace Exporter
  const traceExporter = new OTLPTraceExporter({
    // If running in docker, use the container name, else fallback to localhost
    url:
      process.env['OTEL_EXPORTER_OTLP_ENDPOINT'] ||
      'http://otel-collector:4317',
  });

  const sdk = new NodeSDK({
    resource: new Resource({
      [ATTR_SERVICE_NAME]: serviceName,
      [ATTR_SERVICE_VERSION]: serviceVersion,
    }),
    traceExporter,
    instrumentations: [
      getNodeAutoInstrumentations({
        // Disable fs instrumentations as they can be noisy
        '@opentelemetry/instrumentation-fs': {
          enabled: false,
        },
      }),
    ],
  });

  try {
    sdk.start();
    process.stdout.write(
      `[OpenTelemetry] Tracing initialized for service: ${serviceName}`
    );
  } catch (error) {
    process.stdout.write(
      `[OpenTelemetry] Error initializing tracing: \n${String(error)}`
    );
  }

  // Graceful shutdown
  process.on('SIGTERM', () => {
    sdk
      .shutdown()
      .then(() => process.stdout.write('[OpenTelemetry] Tracing terminated'))
      .catch((error) =>
        process.stdout.write('[OpenTelemetry] Error terminating tracing', error)
      )
      .finally(() => process.exit(0));
  });

  return sdk;
}
