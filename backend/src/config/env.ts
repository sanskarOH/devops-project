function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not defined`);
  }
  return value;
}

export const env = {
  port: Number(process.env.PORT || 5000),
  mongodbUri: requireEnv("MONGODB_URI"),
  baseUrl: process.env.BASE_URL || "http://localhost:5000",
};
