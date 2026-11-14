import { config } from "dotenv";
import { Files } from "files-sdk";
import { neon } from "files-sdk/neon";

config({ path: ".env.local" });

const required = [
  "AWS_ACCESS_KEY_ID",
  "AWS_SECRET_ACCESS_KEY",
  "AWS_ENDPOINT_URL_S3",
  "AWS_REGION",
];

for (const key of required) {
  if (!process.env[key]) {
    console.error(`Missing ${key} in .env.local (value not shown)`);
    process.exit(1);
  }
}

const files = new Files({ adapter: neon({ bucket: "uploads" }) });
const key = "smoke-tests/hello-neon-object-storage.txt";
const payload = "hello from neon object storage smoke test\n";

await files.upload(key, payload, { contentType: "text/plain" });
console.log("uploaded:", key);

const listed = await files.list({ prefix: "smoke-tests/" });
const names = (listed.items ?? []).map((item) => item.key);
console.log("listed:", names);

const downloaded = await files.download(key);
const text = await downloaded.text();
console.log("downloaded contents:");
console.log(text);

const exists = await files.exists(key);
console.log("exists:", exists);
