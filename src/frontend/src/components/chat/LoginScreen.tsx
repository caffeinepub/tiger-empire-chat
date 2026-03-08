import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useInternetIdentity } from "@/hooks/useInternetIdentity";
import { useSaveUserProfile } from "@/hooks/useQueries";
import { Loader2, Shield, Users } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";

interface LoginScreenProps {
  totalUsers?: number;
}

export default function LoginScreen({ totalUsers }: LoginScreenProps) {
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const { identity, login, loginStatus } = useInternetIdentity();
  const saveProfile = useSaveUserProfile();
  const isAuthenticated = !!identity;
  const isLoggingIn = loginStatus === "logging-in";

  const handleJoin = async () => {
    if (!username.trim() || !displayName.trim()) {
      toast.error("Please fill in both username and display name");
      return;
    }
    if (username.includes(" ")) {
      toast.error("Username cannot contain spaces");
      return;
    }
    try {
      await saveProfile.mutateAsync({
        username: username.trim(),
        displayName: displayName.trim(),
      });
      toast.success("Welcome to Tiger Empire!");
    } catch {
      toast.error("Failed to save profile. Please try again.");
    }
  };

  return (
    <div className="min-h-screen empire-bg flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Decorative rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[600px] h-[600px] rounded-full border border-gold/5" />
        <div className="absolute w-[400px] h-[400px] rounded-full border border-gold/8" />
        <div className="absolute w-[200px] h-[200px] rounded-full border border-gold/10" />
      </div>

      <motion.div
        className="w-full max-w-md relative z-10"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        {/* Logo & Title */}
        <div className="text-center mb-10">
          <motion.div
            className="inline-block mb-5"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
          >
            <div className="w-24 h-24 mx-auto rounded-2xl overflow-hidden shadow-gold border border-gold/30">
              <img
                src="/assets/generated/tiger-empire-logo-transparent.dim_200x200.png"
                alt="Tiger Empire"
                className="w-full h-full object-cover"
              />
            </div>
          </motion.div>

          <motion.h1
            className="font-display text-5xl font-black tiger-text-gradient tracking-tight mb-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            Tiger Empire
          </motion.h1>
          <motion.p
            className="text-muted-foreground text-sm font-body"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            A realm for millions — join the empire
          </motion.p>

          {totalUsers !== undefined && totalUsers > 0 && (
            <motion.div
              className="mt-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-gold/20 bg-gold/5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.4 }}
            >
              <Users className="w-3.5 h-3.5 text-gold" />
              <span className="text-xs font-medium text-gold">
                {totalUsers.toLocaleString()} members strong
              </span>
            </motion.div>
          )}
        </div>

        {/* Card */}
        <motion.div
          className="bg-card border border-border rounded-2xl p-8 shadow-gold"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.4 }}
        >
          {!isAuthenticated ? (
            /* Step 1: Login */
            <div className="text-center space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-center w-12 h-12 mx-auto rounded-full bg-gold/10 border border-gold/20">
                  <Shield className="w-5 h-5 text-gold" />
                </div>
                <h2 className="font-display text-xl font-bold">Secure Login</h2>
                <p className="text-muted-foreground text-sm">
                  Login with Internet Identity to join Tiger Empire
                </p>
              </div>
              <Button
                className="w-full tiger-gradient text-primary-foreground font-semibold h-12 text-base rounded-xl hover:opacity-90 transition-opacity"
                onClick={login}
                disabled={isLoggingIn}
              >
                {isLoggingIn ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  "Login to Tiger Empire"
                )}
              </Button>
            </div>
          ) : (
            /* Step 2: Setup Profile */
            <div className="space-y-6">
              <div className="space-y-1">
                <h2 className="font-display text-xl font-bold">
                  Create Your Profile
                </h2>
                <p className="text-muted-foreground text-sm">
                  Choose your identity in the empire
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-sm font-medium">
                    Username <span className="text-gold">*</span>
                  </Label>
                  <Input
                    id="username"
                    data-ocid="login.username_input"
                    placeholder="e.g. tiger_warrior"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="bg-secondary border-border focus:border-gold/50 focus:ring-gold/30 h-11 rounded-xl"
                    autoComplete="username"
                  />
                  <p className="text-xs text-muted-foreground">
                    Unique handle, no spaces
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="displayName" className="text-sm font-medium">
                    Display Name <span className="text-gold">*</span>
                  </Label>
                  <Input
                    id="displayName"
                    data-ocid="login.displayname_input"
                    placeholder="e.g. The Tiger"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="bg-secondary border-border focus:border-gold/50 focus:ring-gold/30 h-11 rounded-xl"
                    onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                  />
                </div>
              </div>

              <Button
                data-ocid="login.submit_button"
                className="w-full tiger-gradient text-primary-foreground font-semibold h-12 text-base rounded-xl hover:opacity-90 transition-opacity"
                onClick={handleJoin}
                disabled={
                  saveProfile.isPending ||
                  !username.trim() ||
                  !displayName.trim()
                }
              >
                {saveProfile.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Joining...
                  </>
                ) : (
                  "Join Tiger Empire"
                )}
              </Button>
            </div>
          )}
        </motion.div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-8">
          © {new Date().getFullYear()}.{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-gold transition-colors"
          >
            Built with love using caffeine.ai
          </a>
        </p>
      </motion.div>
    </div>
  );
}
