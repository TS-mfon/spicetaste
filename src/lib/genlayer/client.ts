import { createClient } from "genlayer-js";
import { testnetAsimov } from "genlayer-js/chains";

export const CONTRACT_ADDRESS = "0xe12FFFD21d4B2D40cd014014170404cd7aD151DD" as `0x${string}`;

export const GENLAYER_CHAIN_ID = 4221;
export const GENLAYER_CHAIN_ID_HEX = `0x${GENLAYER_CHAIN_ID.toString(16)}`;

export const GENLAYER_NETWORK = {
  chainId: GENLAYER_CHAIN_ID_HEX,
  chainName: "Genlayer Bradbury Testnet",
  nativeCurrency: { name: "GEN", symbol: "GEN", decimals: 18 },
  rpcUrls: ["https://rpc-bradbury.genlayer.com"],
  blockExplorerUrls: ["https://explorer-bradbury.genlayer.com/"],
};

interface EthereumProvider {
  isMetaMask?: boolean;
  request: (args: { method: string; params?: any[] }) => Promise<any>;
  on: (event: string, handler: (...args: any[]) => void) => void;
  removeListener: (event: string, handler: (...args: any[]) => void) => void;
}

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

export function isMetaMaskInstalled(): boolean {
  return typeof window !== "undefined" && !!window.ethereum?.isMetaMask;
}

export function getEthereumProvider(): EthereumProvider | null {
  return typeof window !== "undefined" ? window.ethereum || null : null;
}

export async function getAccounts(): Promise<string[]> {
  const provider = getEthereumProvider();
  if (!provider) return [];
  try {
    return await provider.request({ method: "eth_accounts" });
  } catch {
    return [];
  }
}

export async function getCurrentChainId(): Promise<string | null> {
  const provider = getEthereumProvider();
  if (!provider) return null;
  try {
    return await provider.request({ method: "eth_chainId" });
  } catch {
    return null;
  }
}

export async function isOnGenLayerNetwork(): Promise<boolean> {
  const chainId = await getCurrentChainId();
  if (!chainId) return false;
  return parseInt(chainId, 16) === GENLAYER_CHAIN_ID;
}

export async function switchToGenLayerNetwork(): Promise<void> {
  const provider = getEthereumProvider();
  if (!provider) throw new Error("MetaMask is not installed");
  try {
    await provider.request({ method: "wallet_switchEthereumChain", params: [{ chainId: GENLAYER_CHAIN_ID_HEX }] });
  } catch (error: any) {
    if (error.code === 4902) {
      await provider.request({ method: "wallet_addEthereumChain", params: [GENLAYER_NETWORK] });
    } else throw error;
  }
}

export async function connectMetaMask(): Promise<string> {
  const provider = getEthereumProvider();
  if (!provider) throw new Error("MetaMask is not installed");
  const accounts = await provider.request({ method: "eth_requestAccounts" });
  if (!accounts?.length) throw new Error("No accounts found");
  const onCorrect = await isOnGenLayerNetwork();
  if (!onCorrect) await switchToGenLayerNetwork();
  return accounts[0];
}

export async function switchAccount(): Promise<string> {
  const provider = getEthereumProvider();
  if (!provider) throw new Error("MetaMask is not installed");
  await provider.request({ method: "wallet_requestPermissions", params: [{ eth_accounts: {} }] });
  const accounts = await provider.request({ method: "eth_accounts" });
  if (!accounts?.length) throw new Error("No account selected");
  return accounts[0];
}

const bradburyChain = {
  ...testnetAsimov,
  name: "Genlayer Bradbury Testnet",
  rpcUrls: {
    ...testnetAsimov.rpcUrls,
    default: {
      ...testnetAsimov.rpcUrls.default,
      http: ["https://rpc-bradbury.genlayer.com"],
    },
  },
  blockExplorers: {
    default: { name: "GenLayer Bradbury Explorer", url: "https://explorer-bradbury.genlayer.com" },
  },
};

export function createGenLayerClient(address?: string) {
  const config: any = {
    chain: bradburyChain,
    endpoint: "https://rpc-bradbury.genlayer.com",
  };
  if (address) config.account = address as `0x${string}`;
  return createClient(config);
}
