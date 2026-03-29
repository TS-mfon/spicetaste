import { createGenLayerClient, CONTRACT_ADDRESS } from "../genlayer/client";

export interface TestResult {
  id: number;
  name: string;
  status: string;
  winner: string;
  reasoning: string;
  stake: number;
}

export interface TransactionReceipt {
  status: string;
  hash: string;
  [key: string]: any;
}

class TasteContract {
  private contractAddress: `0x${string}`;
  private client: ReturnType<typeof createGenLayerClient>;

  constructor(address?: string | null) {
    this.contractAddress = CONTRACT_ADDRESS;
    this.client = createGenLayerClient(address || undefined);
  }

  updateAccount(address: string): void {
    this.client = createGenLayerClient(address);
  }

  async getTest(testId: number): Promise<TestResult> {
    try {
      const result: any = await this.client.readContract({
        address: this.contractAddress,
        functionName: "get_test",
        args: [testId],
      });

      if (result instanceof Map) {
        const obj: Record<string, any> = {};
        result.forEach((v: any, k: string) => { obj[k] = v; });
        return {
          id: Number(obj.id),
          name: String(obj.name),
          status: String(obj.status),
          winner: String(obj.winner),
          reasoning: String(obj.reasoning),
          stake: Number(obj.stake),
        };
      }

      return {
        id: Number(result.id ?? testId),
        name: String(result.name ?? ""),
        status: String(result.status ?? ""),
        winner: String(result.winner ?? ""),
        reasoning: String(result.reasoning ?? ""),
        stake: Number(result.stake ?? 0),
      };
    } catch (error) {
      console.error("Error fetching test:", error);
      throw new Error("Failed to fetch test from contract");
    }
  }

  async createTest(
    name: string,
    variantAUrl: string,
    variantBUrl: string,
    variantADesc: string,
    variantBDesc: string,
    successMetric: string,
    stake: number
  ): Promise<TransactionReceipt> {
    try {
      const txHash = await this.client.writeContract({
        address: this.contractAddress,
        functionName: "create_test",
        args: [name, variantAUrl, variantBUrl, variantADesc, variantBDesc, successMetric, stake],
        value: BigInt(0),
      });

      const receipt = await this.client.waitForTransactionReceipt({
        hash: txHash,
        status: "ACCEPTED" as any,
        retries: 30,
        interval: 3000,
      });

      return receipt as TransactionReceipt;
    } catch (error) {
      console.error("Error creating test:", error);
      throw new Error("Failed to create test");
    }
  }

  async submitEvidence(testId: number, url: string, description: string): Promise<TransactionReceipt> {
    try {
      const txHash = await this.client.writeContract({
        address: this.contractAddress,
        functionName: "submit_evidence",
        args: [testId, url, description],
        value: BigInt(0),
      });

      const receipt = await this.client.waitForTransactionReceipt({
        hash: txHash,
        status: "ACCEPTED" as any,
        retries: 30,
        interval: 3000,
      });

      return receipt as TransactionReceipt;
    } catch (error) {
      console.error("Error submitting evidence:", error);
      throw new Error("Failed to submit evidence");
    }
  }

  async resolve(testId: number): Promise<TransactionReceipt> {
    try {
      const txHash = await this.client.writeContract({
        address: this.contractAddress,
        functionName: "resolve",
        args: [testId],
        value: BigInt(0),
      });

      const receipt = await this.client.waitForTransactionReceipt({
        hash: txHash,
        status: "ACCEPTED" as any,
        retries: 40,
        interval: 5000,
      });

      return receipt as TransactionReceipt;
    } catch (error) {
      console.error("Error resolving test:", error);
      throw new Error("Failed to resolve test");
    }
  }
}

export default TasteContract;
