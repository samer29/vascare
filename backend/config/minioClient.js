// config/minioClient.js
const Minio = require("minio");
require("dotenv").config({ path: "../root.env" });

const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT || "127.0.0.1",
  port: parseInt(process.env.MINIO_PORT) || 9000,
  useSSL: false,
  accessKey: process.env.MINIO_ACCESS_KEY || "minioadmin",
  secretKey: process.env.MINIO_SECRET_KEY || "minioadmin",
});

// Add this function to generate proper URLs
minioClient.getPublicUrl = function (bucket, objectName) {
  // Use localhost instead of 127.0.0.1 for better compatibility
  const baseUrl = process.env.MINIO_PUBLIC_URL || "http://localhost:9000";
  return `${baseUrl}/${bucket}/${objectName}`;
};

module.exports = minioClient;
