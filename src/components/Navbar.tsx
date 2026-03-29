import { Link, useLocation } from "react-router-dom";
import { useWallet } from "@/lib/genlayer/WalletProvider";
import { Button } from "@/components/ui/button";
import { Wallet, LogOut, Zap } from "lucide-react";

const navItems = [
  { path: "/", label: "Home" },
  { path: "/submit", label: "Submit" },
  { path: "/arena", label: "Arena" },
  { path: "/verify", label: "Verify" },
];

export function Navbar() {
  const { address, isConnected, connectWallet, disconnectWallet, isLoading } = useWallet();
  const location = useLocation();

  const shortAddr = address ? `${address.slice(0, 6)}…${address.slice(-4)}` : "";

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-gold">
            <Zap className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-display text-lg font-bold tracking-tight text-foreground">
            Proof of Taste
          </span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                location.pathname === item.path
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {isConnected ? (
            <div className="flex items-center gap-2">
              <span className="rounded-md border border-border bg-secondary px-3 py-1.5 font-mono text-xs text-secondary-foreground">
                {shortAddr}
              </span>
              <Button variant="ghost" size="icon" onClick={disconnectWallet} className="h-8 w-8 text-muted-foreground hover:text-foreground">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button onClick={connectWallet} disabled={isLoading} size="sm" className="bg-gradient-gold font-display text-sm font-semibold text-primary-foreground hover:opacity-90">
              <Wallet className="mr-2 h-4 w-4" />
              Connect
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}
