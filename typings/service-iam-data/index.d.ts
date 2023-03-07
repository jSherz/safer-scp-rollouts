declare module "*/service-iam-data.js" {
  export interface IService {
    StringPrefix: string;
    Actions: string[];
    ARNFormat?: string;
    ARNRegex?: string;
    conditionKeys?: string[];
    HasResource: boolean;
  }

  export interface IPolicyType {
    Name: string;
    AssociatedService: string[];
  }

  export const PolicyEditorConfig: {
    conditionOperators: string[];
    conditionKeys: string[];
    serviceMap: Record<string, IService>;
    policyTypes: Record<string, IPolicyType>;
    VPCPolicyServiceActionMap: Record<string, string[]>;
  };
}
