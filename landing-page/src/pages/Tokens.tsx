import { useMemo, useState } from "react";
import { id } from "@instantdb/react";
import { Copy, KeyRound, LogOut, Shield, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { hasInstantAppId, instantAppId, instantDb } from "@/lib/instant";
import {
  generateServiceToken,
  sha256Hex,
  tokenPrefix,
} from "@/lib/serviceTokens";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ServiceToken = {
  id: string;
  label?: string;
  tokenPrefix?: string;
  status?: string;
  createdAt?: string | number;
  expiresAt?: string | number;
  revokedAt?: string | number;
};

const formatDate = (value?: string | number) => {
  if (!value) return "Never";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Invalid date";
  return date.toLocaleString();
};

const isRevoked = (token: ServiceToken) =>
  token.status === "revoked" || Boolean(token.revokedAt);

const isExpired = (token: ServiceToken) => {
  if (!token.expiresAt) return false;
  const expiry = new Date(token.expiresAt).getTime();
  if (Number.isNaN(expiry)) return false;
  return expiry <= Date.now();
};

const Tokens = () => {
  const auth = instantDb.useAuth();
  const user = auth.user;

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [magicCodeSent, setMagicCodeSent] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);

  const [label, setLabel] = useState("");
  const [expiresInDays, setExpiresInDays] = useState("30");
  const [isCreatingToken, setIsCreatingToken] = useState(false);
  const [lastRawToken, setLastRawToken] = useState<string | null>(null);

  const { data, error: tokenError, isLoading: isLoadingTokens } = instantDb
    .useQuery(
      user
        ? {
          serviceTokens: {
            $: {
              order: {
                createdAt: "desc",
              },
            },
          },
        }
        : null,
    );

  const tokens = useMemo(
    () => ((data?.serviceTokens || []) as ServiceToken[]),
    [data?.serviceTokens],
  );

  const handleSendMagicCode = async () => {
    if (!email.trim()) {
      toast.error("Enter an email address first.");
      return;
    }
    setIsSendingCode(true);
    try {
      await instantDb.auth.sendMagicCode({ email: email.trim() });
      setMagicCodeSent(true);
      toast.success("Magic code sent. Check your inbox.");
    } catch (err) {
      console.error(err);
      toast.error("Could not send magic code.");
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleVerifyMagicCode = async () => {
    if (!email.trim() || !code.trim()) {
      toast.error("Enter both email and code.");
      return;
    }
    setIsVerifyingCode(true);
    try {
      await instantDb.auth.signInWithMagicCode({
        email: email.trim(),
        code: code.trim(),
      });
      setCode("");
      toast.success("Signed in.");
    } catch (err) {
      console.error(err);
      toast.error("Invalid or expired code.");
    } finally {
      setIsVerifyingCode(false);
    }
  };

  const handleCreateToken = async () => {
    if (!user) return;
    if (!label.trim()) {
      toast.error("Token name is required.");
      return;
    }
    setIsCreatingToken(true);
    try {
      const rawToken = generateServiceToken();
      const tokenHash = await sha256Hex(rawToken);
      const tokenId = id();
      const days = Number.parseInt(expiresInDays, 10);
      const expiresAt = Number.isFinite(days) && days > 0
        ? new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()
        : undefined;

      await instantDb.transact([
        instantDb.tx.serviceTokens[tokenId].update({
          tokenHash,
          tokenPrefix: tokenPrefix(rawToken),
          label: label.trim(),
          status: "active",
          createdAt: new Date().toISOString(),
          expiresAt,
        }),
        instantDb.tx.serviceTokens[tokenId].link({ $user: user.id }),
      ]);

      setLabel("");
      setLastRawToken(rawToken);
      toast.success("Service token created.");
    } catch (err) {
      console.error(err);
      toast.error("Could not create token.");
    } finally {
      setIsCreatingToken(false);
    }
  };

  const handleCopy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success("Copied to clipboard.");
    } catch {
      toast.error("Copy failed.");
    }
  };

  const handleRevoke = async (token: ServiceToken) => {
    try {
      await instantDb.transact(
        instantDb.tx.serviceTokens[token.id].update({
          status: "revoked",
          revokedAt: new Date().toISOString(),
        }),
      );
      toast.success("Token revoked.");
    } catch (err) {
      console.error(err);
      toast.error("Could not revoke token.");
    }
  };

  const handleDelete = async (token: ServiceToken) => {
    try {
      await instantDb.transact(instantDb.tx.serviceTokens[token.id].delete());
      toast.success("Token deleted.");
    } catch (err) {
      console.error(err);
      toast.error("Could not delete token.");
    }
  };

  if (!hasInstantAppId) {
    return (
      <main className="min-h-screen bg-background p-6 md:p-10">
        <div className="mx-auto max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>Instant app id missing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                Add <code>VITE_INSTANT_APP_ID</code> to
                <code>landing-page/.env.local</code>.
              </p>
              <p>
                This page creates token hashes in InstantDB, which your server
                uses for auth verification.
              </p>
              <p>Current value: {instantAppId || "(empty)"}</p>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <section className="mx-auto max-w-5xl p-6 md:p-10 space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Service tokens
            </h1>
            <p className="text-muted-foreground mt-1">
              Create, copy once, and revoke tokens used by rmmbr clients.
            </p>
          </div>
          {user && (
            <Button
              variant="outline"
              onClick={() => instantDb.auth.signOut()}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </Button>
          )}
        </header>

        {auth.isLoading && (
          <Card>
            <CardContent className="py-6 text-muted-foreground">
              Checking session...
            </CardContent>
          </Card>
        )}

        {!auth.isLoading && !user && (
          <Card>
            <CardHeader>
              <CardTitle>Sign in to manage tokens</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="flex flex-wrap gap-3">
                <Button onClick={handleSendMagicCode} disabled={isSendingCode}>
                  {isSendingCode ? "Sending..." : "Send magic code"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => instantDb.auth.signInAsGuest()}
                >
                  Continue as guest
                </Button>
              </div>

              {magicCodeSent && (
                <div className="rounded-lg border p-4 space-y-3">
                  <Label htmlFor="code">6-digit code</Label>
                  <Input
                    id="code"
                    placeholder="123456"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                  />
                  <Button
                    onClick={handleVerifyMagicCode}
                    disabled={isVerifyingCode}
                  >
                    {isVerifyingCode ? "Verifying..." : "Verify and sign in"}
                  </Button>
                </div>
              )}

              {auth.error && (
                <p className="text-sm text-destructive">
                  {String(auth.error.message)}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {user && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <KeyRound className="h-5 w-5" />
                  Create a new service token
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="token-label">Token name</Label>
                  <Input
                    id="token-label"
                    placeholder="Production worker"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expiry-days">Expire after (days)</Label>
                  <Input
                    id="expiry-days"
                    value={expiresInDays}
                    onChange={(e) => setExpiresInDays(e.target.value)}
                  />
                </div>
                <div className="md:col-span-3 flex flex-wrap gap-3">
                  <Button
                    onClick={handleCreateToken}
                    disabled={isCreatingToken}
                  >
                    {isCreatingToken ? "Creating..." : "Create token"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {lastRawToken && (
              <Card className="border-amber-500/40">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-amber-600">
                    <Shield className="h-5 w-5" />
                    Copy this token now
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    This is the only time the raw token is shown. We only store
                    its hash.
                  </p>
                  <div className="rounded-md border bg-muted/30 px-3 py-2 font-mono text-sm break-all">
                    {lastRawToken}
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => handleCopy(lastRawToken)}
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copy token
                  </Button>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Your tokens</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {isLoadingTokens && (
                  <p className="text-sm text-muted-foreground">
                    Loading tokens...
                  </p>
                )}
                {tokenError && (
                  <p className="text-sm text-destructive">
                    {String(tokenError.message)}
                  </p>
                )}
                {!isLoadingTokens && tokens.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No tokens yet. Create one above.
                  </p>
                )}

                {tokens.map((token) => {
                  const revoked = isRevoked(token);
                  const expired = isExpired(token);
                  const state = revoked
                    ? "revoked"
                    : expired
                    ? "expired"
                    : "active";

                  return (
                    <div
                      key={token.id}
                      className="rounded-lg border p-4 space-y-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="font-medium text-foreground">
                            {token.label || "Unnamed token"}
                          </p>
                          <p className="text-xs text-muted-foreground font-mono">
                            {token.tokenPrefix || "(no prefix)"}...
                          </p>
                        </div>
                        <Badge
                          variant={state === "active" ? "default" : "secondary"}
                        >
                          {state}
                        </Badge>
                      </div>

                      <div className="grid gap-2 text-sm text-muted-foreground md:grid-cols-3">
                        <p>Created: {formatDate(token.createdAt)}</p>
                        <p>Expires: {formatDate(token.expiresAt)}</p>
                        <p>Revoked: {formatDate(token.revokedAt)}</p>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        {!revoked && (
                          <Button
                            variant="outline"
                            onClick={() => handleRevoke(token)}
                          >
                            Revoke
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(token)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </>
        )}
      </section>
    </main>
  );
};

export default Tokens;
