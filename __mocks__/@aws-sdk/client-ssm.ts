export * from "@aws-sdk/client-ssm";

export const SSMClient = vi.fn().mockReturnValue({
  send: vi.fn(),
});
