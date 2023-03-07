import {
  CloudWatchLogsClient,
  GetQueryResultsCommand,
  QueryStatus,
  StartQueryCommand,
  StartQueryCommandInput,
} from "@aws-sdk/client-cloudwatch-logs";
import { promises as fs } from "fs";
import { sleep } from "./sleep";

const THIRTY_ONE_DAYS_IN_MS = 31 * 24 * 86400 * 1000;

export async function queryCloudWatchInsights<T>(
  logsClient: CloudWatchLogsClient,
  input: StartQueryCommandInput,
) {
  const startQueryResponse = await logsClient.send(
    new StartQueryCommand(input),
  );

  let output: T[] = [];

  let fetched = false;

  while (!fetched) {
    try {
      const data = await logsClient.send(
        new GetQueryResultsCommand({
          queryId: startQueryResponse.queryId,
        }),
      );

      if (data.status === QueryStatus.Complete) {
        output = (data.results as T[]) || [];
        fetched = true;
      } else if (data.status === QueryStatus.Failed) {
        throw new Error("query failed");
      } else if (data.status === QueryStatus.Timeout) {
        throw new Error("query timed out");
      }
    } catch (err) {
      fetched = true;
      throw err;
    }

    if (!fetched) {
      await sleep(10000);
    }
  }

  return output;
}

(async () => {
  const logsClient = new CloudWatchLogsClient({});

  const logGroupName =
    process.env["LOG_GROUP_NAME"] || "CloudTrail/DefaultLogGroup";

  console.log(
    `Using log group ${logGroupName} - set LOG_GROUP_NAME to override.`,
  );

  const now = new Date();
  const startTime = now.getTime() - THIRTY_ONE_DAYS_IN_MS;

  const results = await queryCloudWatchInsights<[string, string, number]>(
    logsClient,
    {
      logGroupName,
      queryString: `
stats count(*) by eventSource, eventName
| fields eventSource, eventName
      `,
      startTime: Math.floor(startTime / 1000),
      endTime: now.getTime() / 1000,
    },
  );

  await fs.writeFile("results.json", JSON.stringify(results));
})().catch(console.error);
