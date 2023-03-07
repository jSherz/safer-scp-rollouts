import axios from "axios";
import { promises as fs } from "fs";
import * as path from "path";

/**
 * We use the IAM data supplied to the Policy Generator as a machine-readable
 * and hopefully maintained source of IAM actions.
 *
 * @param outputPath the JS file will be saved here
 */
export async function fetchIamData(outputPath: string): Promise<void> {
  const response = await axios.get(
    "https://awspolicygen.s3.amazonaws.com/js/policies.js",
  );

  await fs.writeFile(
    outputPath,
    `const app = {};
${response.data}
module.exports = app;
`,
  );
}

if (process.argv && process.argv.length >= 3 && process.argv[2] === "run") {
  (async () => {
    await fetchIamData(path.join(process.cwd(), "src", "service-iam-data.js"));
  })().catch(console.error);
}
