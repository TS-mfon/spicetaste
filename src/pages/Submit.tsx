import { useState } from "react";
import { useWallet } from "@/lib/genlayer/WalletProvider";
import TasteContract from "@/lib/contracts/TasteContract";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Loader2, Send, CheckCircle } from "lucide-react";

export default function Submit() {
  const { address, isConnected } = useWallet();
  const [loading, setLoading] = useState(false);
  const [testId, setTestId] = useState<number | null>(null);

  const [form, setForm] = useState({
    name: "",
    variantAUrl: "",
    variantBUrl: "",
    variantADesc: "",
    variantBDesc: "",
    metric: "",
    stake: "0",
  });

  const updateField = (field: string, value: string) =>
    setForm((p) => ({ ...p, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected || !address) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!form.name.trim()) {
      toast.error("Please enter a test name");
      return;
    }

    setLoading(true);
    try {
      const contract = new TasteContract(address);
      const { testId: returnedId } = await contract.createTest(
        form.name,
        form.variantAUrl,
        form.variantBUrl,
        form.variantADesc,
        form.variantBDesc,
        form.metric,
        parseInt(form.stake) || 0
      );
      const displayId = returnedId >= 0 ? returnedId : null;
      toast.success(`Test created!${displayId !== null ? ` Your Test ID is ${displayId}` : ""}`);
      setTestId(displayId !== null ? displayId : 0);
      setForm({ name: "", variantAUrl: "", variantBUrl: "", variantADesc: "", variantBDesc: "", metric: "", stake: "0" });
    } catch (err: any) {
      toast.error(err.message || "Failed to create test");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-24">
      <div className="container mx-auto max-w-2xl px-4 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-3xl font-bold text-foreground">Submit for Evaluation</h1>
          <p className="mt-2 text-muted-foreground">
            Submit two creative variants for AI-powered taste evaluation.
          </p>

          {testId !== null && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-6 flex items-center gap-3 rounded-lg border border-emerald/30 bg-emerald/5 p-4"
            >
              <CheckCircle className="h-5 w-5 text-emerald" />
              <div className="text-sm text-foreground">
                <p>Test submitted successfully! <strong className="text-primary">Your Test ID is: {testId}</strong></p>
                <p className="mt-1 text-muted-foreground">Save this ID — use it in the <strong>Arena</strong> to add evidence and trigger resolution.</p>
              </div>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Test Name</Label>
              <Input id="name" placeholder="e.g. Album Cover Showdown" value={form.name} onChange={(e) => updateField("name", e.target.value)} maxLength={100} className="bg-secondary border-border" />
            </div>

            {/* Variant A */}
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 space-y-3">
              <h3 className="font-display text-sm font-semibold text-primary">Variant A</h3>
              <div className="space-y-2">
                <Label htmlFor="variantAUrl">URL (optional)</Label>
                <Input id="variantAUrl" placeholder="https://..." value={form.variantAUrl} onChange={(e) => updateField("variantAUrl", e.target.value)} className="bg-secondary border-border" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="variantADesc">Description</Label>
                <Textarea id="variantADesc" placeholder="Describe variant A…" value={form.variantADesc} onChange={(e) => updateField("variantADesc", e.target.value)} maxLength={200} rows={3} className="bg-secondary border-border resize-none" />
                <p className="text-xs text-muted-foreground">{form.variantADesc.length}/200</p>
              </div>
            </div>

            {/* Variant B */}
            <div className="rounded-xl border border-accent/20 bg-accent/5 p-5 space-y-3">
              <h3 className="font-display text-sm font-semibold text-accent">Variant B</h3>
              <div className="space-y-2">
                <Label htmlFor="variantBUrl">URL (optional)</Label>
                <Input id="variantBUrl" placeholder="https://..." value={form.variantBUrl} onChange={(e) => updateField("variantBUrl", e.target.value)} className="bg-secondary border-border" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="variantBDesc">Description</Label>
                <Textarea id="variantBDesc" placeholder="Describe variant B…" value={form.variantBDesc} onChange={(e) => updateField("variantBDesc", e.target.value)} maxLength={200} rows={3} className="bg-secondary border-border resize-none" />
                <p className="text-xs text-muted-foreground">{form.variantBDesc.length}/200</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="metric">Success Metric</Label>
              <Input id="metric" placeholder="e.g. Which has better aesthetic composition?" value={form.metric} onChange={(e) => updateField("metric", e.target.value)} maxLength={200} className="bg-secondary border-border" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="stake">Stake (GEN)</Label>
              <Input id="stake" type="number" min="0" value={form.stake} onChange={(e) => updateField("stake", e.target.value)} className="bg-secondary border-border" />
            </div>

            <Button type="submit" disabled={loading || !isConnected} className="w-full bg-gradient-gold font-display font-semibold text-primary-foreground hover:opacity-90">
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating…</> : <><Send className="mr-2 h-4 w-4" /> Submit Test</>}
            </Button>

            {!isConnected && (
              <p className="text-center text-sm text-muted-foreground">Connect your wallet to submit.</p>
            )}
          </form>
        </motion.div>
      </div>
    </div>
  );
}
