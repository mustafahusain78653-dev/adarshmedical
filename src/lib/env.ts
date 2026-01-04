export function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

export const env = {
  MONGODB_URI: () => requiredEnv("MONGODB_URI"),
  JWT_SECRET: () => requiredEnv("JWT_SECRET"),
  SETUP_KEY: () => requiredEnv("SETUP_KEY"),
  NODE_ENV: () => process.env.NODE_ENV ?? "development",
};




