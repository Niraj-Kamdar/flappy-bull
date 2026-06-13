export type FlappyBull = {
  address: string;
  metadata: { name: string; version: string; spec: string };
  instructions: {
    name: string;
    accounts: { name: string; writable?: boolean; signer?: boolean }[];
    args: never[];
    discriminator: number[];
  }[];
  accounts: { name: string; discriminator: number[] }[];
  types: {
    name: string;
    type: {
      kind: string;
      fields: { name: string; type: string }[];
    };
  }[];
};
