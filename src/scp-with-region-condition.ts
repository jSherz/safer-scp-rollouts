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
            "Sid": "DenyAllOutsideEU",
            "Effect": "Deny",
            "NotAction": [
                "a4b:*",
                "acm:*",
                "aws-marketplace-management:*",
                "aws-marketplace:*",
                "aws-portal:*",
                "budgets:*",
                "ce:*",
                "chime:*",
                "cloudfront:*",
                "config:*",
                "cur:*",
                "directconnect:*",
                "ec2:DescribeRegions",
                "ec2:DescribeTransitGateways",
                "ec2:DescribeVpnGateways",
                "fms:*",
                "globalaccelerator:*",
                "health:*",
                "iam:*",
                "importexport:*",
                "kms:*",
                "mobileanalytics:*",
                "networkmanager:*",
                "organizations:*",
                "pricing:*",
                "route53:*",
                "route53domains:*",
                "s3:GetAccountPublic*",
                "s3:ListAllMyBuckets",
                "s3:ListMultiRegionAccessPoints",
                "s3:PutAccountPublic*",
                "shield:*",
                "sts:*",
                "support:*",
                "trustedadvisor:*",
                "waf-regional:*",
                "waf:*",
                "wafv2:*",
                "wellarchitected:*"
            ],
            "Resource": "*",
            "Condition": {
                "StringNotEquals": {
                    "aws:RequestedRegion": [
                        "eu-central-1",
                        "eu-west-1"
                    ]
                },
                "ArnNotLike": {
                    "aws:PrincipalARN": [
                        "arn:aws:iam::*:role/Role1AllowedToBypassThisSCP",
                        "arn:aws:iam::*:role/Role2AllowedToBypassThisSCP"
                    ]
                }
            }
        }
    ]
}
`;

(async () => {
  const iamClient = new IAMClient({});

  const euCentral1Result = await iamClient.send(
    new SimulateCustomPolicyCommand({
      PolicyInputList: [policyUnderTest],
      ActionNames: ["ec2:RunInstances"],
      ContextEntries: [
        {
          ContextKeyName: "aws:RequestedRegion",
          ContextKeyType: ContextKeyTypeEnum.STRING,
          ContextKeyValues: ["eu-central-1"],
        },
      ],
    }),
  );

  console.log("eu-central-1:\n");
  console.log(
    euCentral1Result.EvaluationResults?.map(
      (entry) => `${entry.EvalActionName} = ${entry.EvalDecision}`,
    ).join("\n"),
  );

  const euWest2Result = await iamClient.send(
    new SimulateCustomPolicyCommand({
      PolicyInputList: [policyUnderTest],
      ActionNames: ["ec2:RunInstances"],
      ContextEntries: [
        {
          ContextKeyName: "aws:RequestedRegion",
          ContextKeyType: ContextKeyTypeEnum.STRING,
          ContextKeyValues: ["eu-west-2"],
        },
      ],
    }),
  );

  console.log(`\neu-west-2\n`);
  console.log(
    euWest2Result.EvaluationResults?.map(
      (entry) => `${entry.EvalActionName} = ${entry.EvalDecision}`,
    ).join("\n"),
  );

  const euWest2ExemptResult = await iamClient.send(
    new SimulateCustomPolicyCommand({
      PolicyInputList: [policyUnderTest],
      ActionNames: ["ec2:RunInstances"],
      ContextEntries: [
        {
          ContextKeyName: "aws:RequestedRegion",
          ContextKeyType: ContextKeyTypeEnum.STRING,
          ContextKeyValues: ["eu-west-2"],
        },
        {
          ContextKeyName: "aws:PrincipalARN",
          ContextKeyType: ContextKeyTypeEnum.STRING,
          ContextKeyValues: [
            "arn:aws:iam::123456789123:role/Role2AllowedToBypassThisSCP",
          ],
        },
      ],
    }),
  );

  console.log(`\neu-west-2 exempt role\n`);
  console.log(
    euWest2ExemptResult.EvaluationResults?.map(
      (entry) => `${entry.EvalActionName} = ${entry.EvalDecision}`,
    ).join("\n"),
  );
})().catch(console.error);
