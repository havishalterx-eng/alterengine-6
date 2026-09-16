import { createEnvironmentValidators } from "@alterx/adapters";

const ALTER_ENVIRONMENTS = ["local", "dev", "staging", "prod"] as const;

interface SandboxEnvironmentBase {
  readonly alterEnvironment: (typeof ALTER_ENVIRONMENTS)[number];
  readonly region: "ap-south-1";
  readonly runtimeMode: "real" | "mock";
  readonly grpcBindAddress: string;
  readonly artifactContentServiceAddress: string;
}

export interface SandboxMockEnvironment extends SandboxEnvironmentBase {
  readonly configSource: "appconfig" | "local-file";
  readonly localMock: true;
}

export type SandboxCodeExecutionProvider = "e2b" | "agentcore";

interface SandboxAppConfigEnvironmentBase extends SandboxEnvironmentBase {
  readonly configSource: "appconfig";
  readonly localMock: false;
  readonly appConfigApplicationId: string;
  readonly appConfigEnvironmentId: string;
  readonly appConfigConfigurationProfileId: string;
  readonly browserbaseApiKeyReference: string;
  readonly browserbaseProjectId: string;
}

export interface SandboxE2bEnvironment extends SandboxAppConfigEnvironmentBase {
  readonly sandboxProvider: "e2b";
  readonly e2bApiKeyReference: string;
}

export interface SandboxAgentCoreEnvironment extends SandboxAppConfigEnvironmentBase {
  readonly sandboxProvider: "agentcore";
}

export type SandboxAppConfigEnvironment = SandboxE2bEnvironment | SandboxAgentCoreEnvironment;

export type SandboxEnvironment =
  | SandboxMockEnvironment
  | SandboxAppConfigEnvironment;

const { runtimeMode, configSource: readConfigSource } = createEnvironmentValidators(
  (field, reason) => new Error(`${field} ${reason}`),
);

function required(environment: NodeJS.ProcessEnv, name: string): string {
  const value = environment[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

export function loadSandboxEnvironment(
  environment: NodeJS.ProcessEnv,
): SandboxEnvironment {
  const alterEnvironment = required(environment, "ALTER_ENV");
  if (
    !ALTER_ENVIRONMENTS.includes(
      alterEnvironment as SandboxEnvironment["alterEnvironment"],
    )
  ) {
    throw new Error("ALTER_ENV is invalid");
  }
  if (required(environment, "ALTER_SERVICE_NAME") !== "sandbox-service") {
    throw new Error("ALTER_SERVICE_NAME must equal sandbox-service");
  }
  if (required(environment, "ALTER_REGION") !== "ap-south-1") {
    throw new Error("ALTER_REGION must equal ap-south-1");
  }
  const mode = runtimeMode(environment);
  const source = readConfigSource(environment);
  const base = {
    alterEnvironment:
      alterEnvironment as SandboxEnvironment["alterEnvironment"],
    region: "ap-south-1" as const,
    runtimeMode: mode,
    grpcBindAddress: grpcAddress(environment),
    artifactContentServiceAddress: required(environment, "ARTIFACT_CONTENT_SERVICE_ADDRESS"),
  };
  if (mode === "mock") {
    return { ...base, configSource: source, localMock: true };
  }
  if (source !== "appconfig") throw new Error("RUNTIME_MODE=real requires ALTER_CONFIG_SOURCE=appconfig");
  const appConfigBase = {
    ...base,
    configSource: "appconfig" as const,
    localMock: false as const,
    appConfigApplicationId: required(environment, "APPCONFIG_APPLICATION_ID"),
    appConfigEnvironmentId: required(environment, "APPCONFIG_ENVIRONMENT_ID"),
    appConfigConfigurationProfileId: required(
      environment,
      "APPCONFIG_CONFIGURATION_PROFILE_ID",
    ),
    browserbaseApiKeyReference: required(
      environment,
      "BROWSERBASE_API_KEY_REF",
    ),
    browserbaseProjectId: required(environment, "BROWSERBASE_PROJECT_ID"),
  };
  const sandboxProvider = environment.SANDBOX_PROVIDER?.trim() || "e2b";
  if (sandboxProvider === "agentcore") {
    return { ...appConfigBase, sandboxProvider: "agentcore" };
  }
  if (sandboxProvider !== "e2b") {
    throw new Error("SANDBOX_PROVIDER must be e2b or agentcore");
  }
  return {
    ...appConfigBase,
    sandboxProvider: "e2b",
    e2bApiKeyReference: required(environment, "E2B_API_KEY_REF"),
  };
}

function grpcAddress(environment: NodeJS.ProcessEnv): string {
  const value =
    environment.SANDBOX_GRPC_BIND_ADDRESS?.trim() ?? "0.0.0.0:50057";
  if (!/^(?:\d{1,3}\.){3}\d{1,3}:\d{1,5}$/.test(value)) {
    throw new Error(
      "SANDBOX_GRPC_BIND_ADDRESS must be an IPv4 address and port",
    );
  }
  return value;
}
