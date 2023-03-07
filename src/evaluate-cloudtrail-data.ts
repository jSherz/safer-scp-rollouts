import {
  IAMClient,
  PolicyEvaluationDecisionType,
  SimulateCustomPolicyCommand,
} from "@aws-sdk/client-iam";
import chalk from "chalk";
import { promises as fs } from "fs";
import {
  mapCloudTrailAction,
  shouldMapCloudTrailAction,
} from "./map-cloudtrail-action";
import _chunk = require("lodash.chunk");

(async () => {
  const cloudTrailData = (
    JSON.parse(await fs.readFile("results.json", "utf-8")) as Array<
      Array<{ field: string; value: string }>
    >
  ).reduce((out, curr) => {
    const eventSource = curr
      .find((entry) => entry.field === "eventSource")
      ?.value?.replace(".amazonaws.com", "");
    const eventName = curr.find((entry) => entry.field === "eventName")?.value;
    const count = curr.find((entry) => entry.field === "count(*)")?.value;

    if (!eventSource || !eventName || !count) {
      throw new Error(
        "malformed row - does not contain the required fields " +
          JSON.stringify(curr),
      );
    }

    out.push({
      eventSource,
      eventName,
      count,
      sortKey: eventSource + eventName,
    });
    return out;
  }, [] as Array<{ eventSource: string; eventName: string; count: string; sortKey: string }>);

  const toSimulate = new Set<string>();

  for (const event of cloudTrailData.sort((a, b) => {
    if (a.sortKey > b.sortKey) {
      return 1;
    } else if (a.sortKey === b.sortKey) {
      return 0;
    } else {
      return -1;
    }
  })) {
    const { eventSource, eventName, count } = event;

    if (!shouldMapCloudTrailAction(eventSource, eventName)) {
      continue;
    }

    const [matchFound, message] = mapCloudTrailAction(eventSource, eventName);

    if (matchFound) {
      toSimulate.add(`${eventSource}:${eventName}`);
      // console.log(
      //   `evaluating ${eventSource} ${eventName} (count = ${count}) ${chalk.green(
      //     "OK",
      //   )}`,
      // );
    } else {
      console.log(
        `evaluating ${eventSource} ${eventName} (count = ${count}) ${chalk.red(
          message,
        )}`,
      );
    }
  }

  const iamClient = new IAMClient({});

  for (const chunk of _chunk(Array.from(toSimulate), 100)) {
    const result = await iamClient.send(
      new SimulateCustomPolicyCommand({
        PolicyInputList: [
          `
          {
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Deny",
      "Action": [
        "cloudwatch:DeleteAlarms",
        "cloudwatch:DeleteDashboards",
        "cloudwatch:DisableAlarmActions",
        "cloudwatch:PutDashboard",
        "cloudwatch:PutMetricAlarm",
        "cloudwatch:SetAlarmState"
      ],
      "Resource": "*"
    }
  ]
}`,
        ],
        ActionNames: chunk,
      }),
    );

    console.log("Results were truncated?", result.IsTruncated ? "yes" : "no");

    for (const evaluationResult of result.EvaluationResults || []) {
      if (
        evaluationResult.EvalDecision ===
        PolicyEvaluationDecisionType.IMPLICIT_DENY
      ) {
        console.log(
          `evaluating ${evaluationResult.EvalActionName} ${chalk.yellow(
            "implicit deny",
          )}`,
        );
      } else if (
        evaluationResult.EvalDecision ===
        PolicyEvaluationDecisionType.EXPLICIT_DENY
      ) {
        console.log(
          `evaluating ${evaluationResult.EvalActionName} ${chalk.red(
            "explicit deny",
          )}`,
        );
      } else {
        console.log(
          `evaluating ${evaluationResult.EvalActionName} ${chalk.green(
            "allowed",
          )}`,
        );
      }
    }
  }
})().catch(console.error);
