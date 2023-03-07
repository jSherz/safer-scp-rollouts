import type { IService } from "*/service-iam-data.js";
import * as serviceIamData from "./service-iam-data.js";

export type EventSource = string;
export type EventName = string;

const serviceByStringPrefix: Record<string, IService> = Object.entries(
  serviceIamData.PolicyEditorConfig.serviceMap,
).reduce((out, [, value]) => {
  if (out[value.StringPrefix]) {
    value.Actions.forEach((action) =>
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TS does not understand we've checked it
      out[value.StringPrefix]!.Actions.push(action),
    );
  } else {
    out[value.StringPrefix] = value;
  }

  return out;
}, {} as Record<string, IService>);

/**
 * Allow lookups of the API action to find if it's present in one or more
 * services.
 */
const serviceDataByAction: Record<string, string[]> = Object.values(
  serviceIamData.PolicyEditorConfig.serviceMap,
).reduce((out, curr) => {
  curr.Actions.forEach((action) => {
    if (out[action]) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TS does not understand we've checked it
      out[action]!.push(curr.StringPrefix);
    } else {
      out[action] = [curr.StringPrefix];
    }
  });

  return out;
}, {} as Record<string, string[]>);

/**
 * Each key is the name as seen in "eventSource" in CloudTrail. The
 * corresponding value is the IAM service prefix.
 */
const serviceNameOverrides: Record<string, string> = {
  amazonmq: "mq",
  "application-insights": "applicationinsights",
  tagging: "tag",
};

function extractServiceActionsToPrefix(service: string) {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- we're happy to crash if this is called with bad input
  return serviceIamData.PolicyEditorConfig.serviceMap[service]!.Actions.reduce(
    (out, curr) => {
      out[curr] =
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TS does not understand we've used this value above
        serviceIamData.PolicyEditorConfig.serviceMap[service]!.StringPrefix;
      return out;
    },
    {} as Record<string, string>,
  );
}

/**
 * Maps an action coming in to another service, for example billing actions
 * that are split into several IAM prefixes.
 */
const eventSourceOverrides: Record<
  EventSource,
  Record<EventName, EventSource>
> = {
  autoscaling: {
    DescribeScalableTargets: "application-autoscaling",
    DescribeScalingPolicies: "application-autoscaling",
  },
  billingconsole: {
    ...extractServiceActionsToPrefix("AWS Cost and Usage Report"),
    ...extractServiceActionsToPrefix("AWS Billing "),
    ...extractServiceActionsToPrefix("AWS Tax Settings"),
    ...extractServiceActionsToPrefix("AWS Payments"),
    ...extractServiceActionsToPrefix("AWS Consolidated Billing"),
    "AWSPaymentInstrumentGateway.Get": "aws-portal",
    "AWSPaymentPortalService.ContinueWidget": "aws-portal",
    "AWSPaymentPortalService.ConvertCurrencies": "aws-portal",
    "AWSPaymentPortalService.DescribeMakePaymentPage": "aws-portal",
    "AWSPaymentPortalService.DescribePaymentsDashboard": "aws-portal",
    "AWSPaymentPortalService.GetAccountPreferences": "aws-portal",
    "AWSPaymentPortalService.GetBillingContactAddress": "aws-portal",
    "AWSPaymentPortalService.GetEligiblePaymentInstruments": "aws-portal",
    "AWSPaymentPortalService.GetEntitiesByIds": "aws-portal",
    "AWSPaymentPortalService.GetNotificationsForPage": "aws-portal",
    "AWSPaymentPortalService.GetPaymentsDue": "aws-portal",
    "AWSPaymentPortalService.NotifyApprovalComplete": "aws-portal",
    "AWSPaymentPreferenceGateway.Get": "aws-portal",
    GetAccountEDPStatus: "aws-portal",
    GetAccountInformation: "aws-portal",
    GetAccountMarketplaceGroup: "aws-portal",
    GetAllAccountDetails: "aws-portal",
    GetAllAccounts: "aws-portal",
    GetAllPurchaseOrders: "aws-portal",
    GetBillingAddress: "aws-portal",
    GetBillsForBillingPeriod: "aws-portal",
    GetBillsForLinkedAccount: "aws-portal",
    GetCommercialInvoicesForBillingPeriod: "aws-portal",
    GetConsolidatedBillingFamilySummary: "aws-portal",
    GetDefaultCurrency: "aws-portal",
    GetDefaultInstrument: "aws-portal",
    GetFreeTierAlertPreference: "aws-portal",
    GetInvoiceEmailDeliveryPreferences: "aws-portal",
    GetLegacyReportPreferences: "aws-portal",
    GetPaymentPreferences: "aws-portal",
    GetSupportedCountryCodes: "aws-portal",
    GetTaxInvoicesMetadata: "aws-portal",
    GetTotal: "aws-portal",
    getTRNDataForAccounts: "aws-portal",
  },
  cloudcontrolapi: {
    ListResources: "cloudformation",
  },
  monitoring: {
    DescribeAlarmHistory: "cloudwatch",
    DescribeAlarms: "cloudwatch",
    DescribeAnomalyDetectors: "cloudwatch",
    DescribeInsightRules: "cloudwatch",
    GetDashboard: "cloudwatch",
    PutMetricAlarm: "cloudwatch",
  },
  mediapackage: {
    ListPackagingConfigurations: "mediapackage-vod",
    ListPackagingGroups: "mediapackage-vod",
  },
  "servicecatalog-appregistry": {
    ListApplications: "servicecatalog",
  },
  "sso-directory": {
    GetMfaDeviceManagementForDirectory: "sso",
  },
  taxconsole: {
    GetTaxExemptionTypes: "tax",
  },
};

/**
 * Set to `true` to avoid these actions from being tested.
 */
const excludedActions: Record<EventSource, Record<EventName, boolean>> = {
  apigateway: {
    CreateApi: true,
    CreateDeployment: true,
    CreateIntegration: true,
    CreateResource: true,
    CreateRestApi: true,
    CreateRoute: true,
    CreateStage: true,
    DeleteDeployment: true,
    DeleteMethod: true,
    DeleteResource: true,
    DeleteRestApi: true,
    DeleteStage: true,
    GetAccount: true,
    GetApi: true,
    GetApis: true,
    GetAuthorizers: true,
    GetClientCertificates: true,
    GetDeployment: true,
    GetDocumentationParts: true,
    GetIntegration: true,
    GetIntegrationResponses: true,
    GetIntegrations: true,
    GetModels: true,
    GetRequestValidators: true,
    GetResources: true,
    GetRestApi: true,
    GetRestApis: true,
    GetRouteResponses: true,
    GetRoutes: true,
    GetStage: true,
    GetStages: true,
    GetUsagePlans: true,
    GetVpcLinks: true,
    PutIntegration: true,
    PutIntegrationResponse: true,
    PutMethod: true,
    PutMethodResponse: true,
    UpdateStage: true,
  },
  cloudformation: {
    DescribeOrganizationsAccess: true,
  },
  "cognito-idp": {
    Error_GET: true,
    Login_GET: true,
    SAML2Response_POST: true,
    Token_POST: true,
  },
  "discovery-marketplace": {
    GetListingView: true,
    GetSearchFacets: true,
    SearchListings: true,
  },
  ec2: {
    SharedSnapshotVolumeCreated: true,
  },
  kms: {
    RotateKey: true,
  },
  organizations: {
    CloseAccountResult: true,
    CreateAccountResult: true,
  },
  servicecatalog: {
    GetTagOptionMigrationStatus: true,
  },
  signin: {
    ConsoleLogin: true,
    PasswordRecoveryCompleted: true,
    PasswordRecoveryRequested: true,
    UserAuthentication: true,
  },
  ssm: {
    OpenDataChannel: true,
  },
  sso: {
    Authenticate: true,
    CreateToken: true,
    Federate: true,
    GetRoleCredentials: true,
    ListProfiles: true,
    ListProfilesForApplication: true,
    UpdateApplicationProfileForAWSAccountInstance: true,
  },
};

const actionOverrides: Record<EventSource, Record<EventName, EventName[]>> = {
  "aws-portal": {
    "AWSPaymentInstrumentGateway.Get": ["ViewPortal"],
    "AWSPaymentPortalService.ContinueWidget": ["ViewPortal"],
    "AWSPaymentPortalService.ConvertCurrencies": ["ViewPortal"],
    "AWSPaymentPortalService.DescribeMakePaymentPage": ["ViewPortal"],
    "AWSPaymentPortalService.DescribePaymentsDashboard": ["ViewPortal"],
    "AWSPaymentPortalService.GetAccountPreferences": ["ViewPortal"],
    "AWSPaymentPortalService.GetBillingContactAddress": ["ViewPortal"],
    "AWSPaymentPortalService.GetEligiblePaymentInstruments": ["ViewPortal"],
    "AWSPaymentPortalService.GetEntitiesByIds": ["ViewPortal"],
    "AWSPaymentPortalService.GetNotificationsForPage": ["ViewPortal"],
    "AWSPaymentPortalService.GetPaymentsDue": ["ViewPortal"],
    "AWSPaymentPortalService.NotifyApprovalComplete": ["ViewPortal"],
    "AWSPaymentPreferenceGateway.Get": ["ViewPortal"],
    GetAccountEDPStatus: ["ViewPortal"],
    GetAccountInformation: ["ViewPortal"],
    GetAccountMarketplaceGroup: ["ViewPortal"],
    GetAllAccountDetails: ["ViewPortal"],
    GetAllAccounts: ["ViewPortal"],
    GetAllPurchaseOrders: ["ViewPortal"],
    GetBillingAddress: ["ViewPortal"],
    GetBillsForBillingPeriod: ["ViewPortal"],
    GetBillsForLinkedAccount: ["ViewPortal"],
    GetCommercialInvoicesForBillingPeriod: ["ViewPortal"],
    GetConsolidatedBillingFamilySummary: ["ViewPortal"],
    GetDefaultCurrency: ["ViewPortal"],
    GetDefaultInstrument: ["ViewPortal"],
    GetFreeTierAlertPreference: ["ViewPortal"],
    GetInvoiceEmailDeliveryPreferences: ["ViewPortal"],
    GetLegacyReportPreferences: ["ViewPortal"],
    GetPaymentPreferences: ["ViewPortal"],
    GetSupportedCountryCodes: ["ViewPortal"],
    GetTaxInvoicesMetadata: ["ViewPortal"],
    GetTotal: ["ViewPortal"],
    getTRNDataForAccounts: ["ViewPortal"],
  },
  budgets: {
    DescribeBudgets: ["ViewBudget"],
    GetAllSnapshotReports: ["ViewBudget"],
  },
  kms: {
    DeleteKey: ["ScheduleKeyDeletion"],
    ReEncrypt: ["ReEncryptFrom", "ReEncryptTo"],
  },
  lambda: {
    "/^AddPermission.*/": ["AddPermission"],
    "/^CreateFunction.*/": ["CreateFunction"],
    "/^DeleteFunction.*/": ["DeleteFunction"],
    "/^DeleteLayerVersion.*/": ["DeleteLayerVersion"],
    "/^GetAccountSettings.*/": ["GetAccountSettings"],
    "/^GetFunction.*/": ["GetFunction"],
    "/^GetPolicy.*/": ["GetPolicy"],
    "/^ListAliases.*/": ["ListAliases"],
    "/^ListEventSourceMappings.*/": ["ListEventSourceMappings"],
    "/^ListFunctions.*/": ["ListFunctions"],
    "/^ListLayers.*/": ["ListLayers"],
    "/^ListTags.*/": ["ListTags"],
    "/^ListVersionsByFunction.*/": ["ListVersionsByFunction"],
    "/^PublishLayerVersion.*/": ["PublishLayerVersion"],
    "/^RemovePermission.*/": ["RemovePermission"],
    "/^TagResource.*/": ["TagResource"],
    "/^UpdateFunctionCode.*/": ["UpdateFunctionCode"],
    "/^UpdateFunctionConfiguration.*/": ["UpdateFunctionConfiguration"],
  },
  s3: {
    DeleteObjects: ["DeleteObject"],
    GetBucketCors: ["GetBucketCORS"],
    GetBucketEncryption: ["GetEncryptionConfiguration"],
    GetBucketIntelligentTieringConfiguration: [
      "GetIntelligentTieringConfiguration",
    ],
    GetBucketLifecycle: ["GetLifecycleConfiguration"],
    GetBucketReplication: ["GetReplicationConfiguration"],
    GetStorageLensDashboardDataInternal: ["GetStorageLensDashboard"],
    HeadBucket: ["ListBucket"],
    ListBuckets: ["ListBucket"],
    ListObjectVersions: ["ListBucketVersions"],
    ListObjects: ["ListBucket"],
    PutBucketCors: ["PutBucketCORS"],
    PutBucketEncryption: ["PutEncryptionConfiguration"],
    PutBucketLifecycle: ["PutLifecycleConfiguration"],
  },
  sso: {
    "ListProfiles, GetProfile": ["GetProfile", "ListProfiles"],
  },
  tax: {
    GetTaxExemptionTypes: ["GetExemptions"],
  },
};

export function shouldMapCloudTrailAction(
  eventSource: string,
  eventName: string,
): boolean {
  return !excludedActions[eventSource]?.[eventName];
}

export function mapCloudTrailAction(
  rawEventSource: string,
  rawEventName: string,
): [true, string[]] | [false, string] {
  const eventSource =
    // Override all instances of this rawEventSource
    serviceNameOverrides[rawEventSource] ||
    // Override the eventSource only for some actions
    eventSourceOverrides[rawEventSource]?.[rawEventName] ||
    // Just use the raw value
    rawEventSource;

  const eventName = rawEventName;

  const matchingService = serviceByStringPrefix[eventSource];

  if (matchingService) {
    if (matchingService.Actions.includes(eventName)) {
      return [true, [`${matchingService.StringPrefix}:${eventName}`]];
    } else {
      const serviceRemapping = actionOverrides[matchingService.StringPrefix];

      if (serviceRemapping) {
        const remappedAction = Object.entries(serviceRemapping).find(
          ([key]) => {
            if (key.startsWith("/")) {
              return new RegExp(key.substring(1, key.length - 1)).exec(
                eventName,
              );
            }

            return eventName === key;
          },
        );

        if (remappedAction) {
          return [
            true,
            remappedAction[1].map(
              (action) => `${matchingService.StringPrefix}:${action}`,
            ),
          ];
        }
      }

      return [false, `cannot find action ${eventName} in ${eventSource}`];
    }
  } else {
    const matchingServices = serviceDataByAction[eventName];

    if (matchingServices) {
      if (matchingServices.length === 1) {
        return [
          false,
          `found action ${eventName} in ${matchingServices[0]} - is that right?`,
        ];
      } else if (matchingServices.length > 1) {
        return [
          false,
          `found action ${eventName} in multiple services ${matchingServices.join(
            ", ",
          )} - not sure which one is correct`,
        ];
      }
    }

    return [
      false,
      `cannot find a service for action ${eventName} in ${eventSource}`,
    ];
  }
}
