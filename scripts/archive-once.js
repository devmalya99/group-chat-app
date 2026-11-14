const { config } = require("dotenv");
const { executeArchiveJob } = require("../server/jobs/schedule-archive");

config({ path: ".env.local" });

executeArchiveJob("manual")
  .then((result) => {
    console.log(JSON.stringify(result, null, 2));
    process.exit(0);
  })
  .catch(() => {
    process.exit(1);
  });
