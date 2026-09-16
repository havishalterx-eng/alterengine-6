import { createEnvironmentValidators } from "@alterx/adapters";

export interface ProvisioningEnvironment {
  readonly localMock: boolean;
  readonly runtimeMode: "real" | "mock";
  readonly configSource: "appconfig" | "local-file";
  readonly region: "ap-south-1";
  readonly grpcBindAddress: string;
  readonly e2bApiKeyReference?: string;
}

function required(environment: NodeJS.ProcessEnv, name: string): string {
  const value = environment[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function parseGrpcBindAddress(value: string | undefined): string {
  const address = value?.trim() ?? "0.0.0.0:50055";
  if (!/^(?:\d{1,3}\.){3}\d{1,3}:\d{1,5}$/.test(address)) {
    throw new Error(
      "PROVISIONING_GRPC_BIND_ADDRESS must be an IPv4 address and port",
    );
  }
  return address;
}

const { runtimeMode, configSource: readConfigSource } = createEnvironmentValidators(
  (field, reason) => new Error(`${field} ${reason}`),
);

export function loadProvisioningEnvironment(environment: NodeJS.ProcessEnv): ProvisioningEnvironment {
  const alterEnvironment = required(environment, "ALTER_ENV");
  if (!(["local", "dev", "staging", "prod"] as const).includes(alterEnvironment as "local")) throw new Error("ALTER_ENV is invalid");
  if (required(environment, "ALTER_SERVICE_NAME") !== "provisioning-service") throw new Error("ALTER_SERVICE_NAME must equal provisioning-service");
  if (required(environment, "ALTER_REGION") !== "ap-south-1") throw new Error("ALTER_REGION must equal ap-south-1");
  const mode = runtimeMode(environment);
  const source = readConfigSource(environment);
  if (mode === "mock") {
    return {
      localMock: true,
      runtimeMode: mode,
      configSource: source,
      region: "ap-south-1",
      grpcBindAddress: parseGrpcBindAddress(
        environment.PROVISIONING_GRPC_BIND_ADDRESS,
      ),
    };
  }
  if (source !== "appconfig") throw new Error("RUNTIME_MODE=real requires ALTER_CONFIG_SOURCE=appconfig");
  return {
    localMock: false,
    runtimeMode: mode,
    configSource: source,
    region: "ap-south-1",
    grpcBindAddress: parseGrpcBindAddress(
      environment.PROVISIONING_GRPC_BIND_ADDRESS,
    ),
    e2bApiKeyReference: required(environment, "E2B_API_KEY_REF"),
  };
}
