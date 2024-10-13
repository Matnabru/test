import dotenv from "dotenv";

dotenv.config();

export const config = {
  server: {
    port: process.env.PORT,
  },
  api: {
    state: `${process.env.API_URL}/state`,
    mappings: `${process.env.API_URL}/mappings`,
  },
  database: {
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432", 10),
    username: process.env.DB_USERNAME || "",
    password: process.env.DB_PASSWORD || "",
    name: process.env.DB_NAME || "",
  },
};
