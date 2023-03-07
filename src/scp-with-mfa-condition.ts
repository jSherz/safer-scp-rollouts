import {
  ContextKeyTypeEnum,
  IAMClient,
  SimulateCustomPolicyCommand,
} from "@aws-sdk/client-iam";

const policyUnderTest = `
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "DenyStopAndTerminateWhenMFAIsNotPresent",
      "Effect": "Deny",
      "Action": [
        "ec2:StopInstances",
        "ec2:TerminateInstances"
      ],
      "Resource": "*",
      "Condition": {"BoolIfExists": {"aws:MultiFactorAuthPresent": false}}
    }
  ]
}
`;

(async () => {
  const iamClient = new IAMClient({});

  const noContextResult = await iamClient.send(
    new SimulateCustomPolicyCommand({
      PolicyInputList: [policyUnderTest],
      ActionNames: ["ec2:StopInstances"],
    }),
  );

  console.log("no context value:\n");
  console.log(
    noContextResult.EvaluationResults?.map(
      (entry) => `${entry.EvalActionName} = ${entry.EvalDecision}`,
    ).join("\n"),
  );

  const noMfaResult = await iamClient.send(
    new SimulateCustomPolicyCommand({
      PolicyInputList: [policyUnderTest],
      ActionNames: ["ec2:StopInstances"],
      ContextEntries: [
        {
          ContextKeyName: "aws:MultiFactorAuthPresent",
          ContextKeyType: ContextKeyTypeEnum.BOOLEAN,
          ContextKeyValues: ["false"],
        },
      ],
    }),
  );

  console.log("\nno MFA:\n");
  console.log(
    noMfaResult.EvaluationResults?.map(
      (entry) => `${entry.EvalActionName} = ${entry.EvalDecision}`,
    ).join("\n"),
  );

  const withMfaResult = await iamClient.send(
    new SimulateCustomPolicyCommand({
      PolicyInputList: [policyUnderTest],
      ActionNames: ["ec2:StopInstances"],
      ContextEntries: [
        {
          ContextKeyName: "aws:MultiFactorAuthPresent",
          ContextKeyType: ContextKeyTypeEnum.BOOLEAN,
          ContextKeyValues: ["true"],
        },
      ],
    }),
  );

  console.log("\nwith MFA:\n");
  console.log(
    withMfaResult.EvaluationResults?.map(
      (entry) => `${entry.EvalActionName} = ${entry.EvalDecision}`,
    ).join("\n"),
  );
})().catch(console.error);
