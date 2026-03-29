import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import {
  isMetaMaskInstalled as checkMetaMask,
  connectMetaMask,
  switchAccount,
  getAccounts,
  getCurrentChainId,
  isOnGenLayerNetwork,
  getEthereumProvider,
} from "./client";

const DISCONNECT_FLAG = "wallet_disconnected";

export interface WalletState {
  address: string | null;
  chainId: string | null;
  isConnected: boolean;
  isLoading: boolean;
  isMetaMaskInstalled: boolean;
  isOnCorrectNetwork: boolean;
}

interface WalletContextValue extends WalletState {
  connectWallet: () => Promise<string>;
  disconnectWallet: () => void;
  switchWalletAccount: () => Promise<string>;
}

const WalletContext = createContext<WalletContextValue | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<WalletState>({
    address: null, chainId: null, isConnected: false,
    isLoading: true, isMetaMaskInstalled: false, isOnCorrectNetwork: false,
  });

  useEffect(() => {
    const init = async () => {
      const installed = checkMetaMask();
      if (!installed || localStorage.getItem(DISCONNECT_FLAG) === "true") {
        setState({ address: null, chainId: null, isConnected: false, isLoading: false, isMetaMaskInstalled: installed, isOnCorrectNetwork: false });
        return;
      }
      try {
        const accounts = await getAccounts();
        const chainId = await getCurrentChainId();
        const correct = await isOnGenLayerNetwork();
        setState({ address: accounts[0] || null, chainId, isConnected: accounts.length > 0, isLoading: false, isMetaMaskInstalled: true, isOnCorrectNetwork: correct });
      } catch {
        setState({ address: null, chainId: null, isConnected: false, isLoading: false, isMetaMaskInstalled: true, isOnCorrectNetwork: false });
      }
    };
    init();
  }, []);

  useEffect(() => {
    const provider = getEthereumProvider();
    if (!provider) return;
    const onAccounts = async (accounts: string[]) => {
      const chainId = await getCurrentChainId();
      const correct = await isOnGenLayerNetwork();
      if (accounts.length > 0) localStorage.removeItem(DISCONNECT_FLAG);
      setState(p => ({ ...p, address: accounts[0] || null, chainId, isConnected: accounts.length > 0, isOnCorrectNetwork: correct }));
    };
    const onChain = async (chainId: string) => {
      const correct = parseInt(chainId, 16) === 4221;
      const accounts = await getAccounts();
      setState(p => ({ ...p, chainId, address: accounts[0] || null, isConnected: accounts.length > 0, isOnCorrectNetwork: correct }));
    };
    provider.on("accountsChanged", onAccounts);
    provider.on("chainChanged", onChain);
    return () => { provider.removeListener("accountsChanged", onAccounts); provider.removeListener("chainChanged", onChain); };
  }, []);

  const connectWallet = useCallback(async () => {
    setState(p => ({ ...p, isLoading: true }));
    try {
      const address = await connectMetaMask();
      const chainId = await getCurrentChainId();
      const correct = await isOnGenLayerNetwork();
      localStorage.removeItem(DISCONNECT_FLAG);
      setState({ address, chainId, isConnected: true, isLoading: false, isMetaMaskInstalled: true, isOnCorrectNetwork: correct });
      return address;
    } catch (err) {
      setState(p => ({ ...p, isLoading: false }));
      throw err;
    }
  }, []);

  const disconnectWallet = useCallback(() => {
    localStorage.setItem(DISCONNECT_FLAG, "true");
    setState(p => ({ ...p, address: null, isConnected: false }));
  }, []);

  const switchWalletAccount = useCallback(async () => {
    setState(p => ({ ...p, isLoading: true }));
    try {
      const newAddr = await switchAccount();
      const chainId = await getCurrentChainId();
      const correct = await isOnGenLayerNetwork();
      localStorage.removeItem(DISCONNECT_FLAG);
      setState({ address: newAddr, chainId, isConnected: true, isLoading: false, isMetaMaskInstalled: true, isOnCorrectNetwork: correct });
      return newAddr;
    } catch (err) {
      setState(p => ({ ...p, isLoading: false }));
      throw err;
    }
  }, []);

  return <WalletContext.Provider value={{ ...state, connectWallet, disconnectWallet, switchWalletAccount }}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within WalletProvider");
  return ctx;
}
