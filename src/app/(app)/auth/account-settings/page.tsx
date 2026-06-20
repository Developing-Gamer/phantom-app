"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import * as React from "react";
import { Suspense, useState, useEffect } from "react";
import { useUser, useHexclaveApp } from "@hexclave/next";
import { AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  Camera,
  User,
  Shield,
  Key,
  CreditCard,
  Users,
  Laptop,
  Loader2,
  Plus,
  Trash,
  Mail,
  Copy,
} from "lucide-react";
import { MessageState, LoadingScreen } from "@/components/auth/shared";
import { toast } from "sonner";

type SettingsTab =
  | "profile"
  | "emails"
  | "security"
  | "sessions"
  | "api-keys"
  | "payments"
  | "teams";

const PROFILE_IMAGE_MAX_FILE_SIZE = 5 * 1024 * 1024;
const HEXCLAVE_PROFILE_IMAGE_MAX_BYTES = 95 * 1024;

function getProfileInitials(displayName: string) {
  const initials = displayName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return initials || "U";
}

function isValidHexclaveProfileImageUrl(value: string) {
  if (!value) return true;

  if (value.startsWith("data:image/")) {
    return value.length <= HEXCLAVE_PROFILE_IMAGE_MAX_BYTES;
  }

  try {
    const url = new URL(value);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

function drawCroppedProfileImage(image: HTMLImageElement, size: number) {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Image uploads are not supported in this browser.");
  }

  const sourceSize = Math.min(image.naturalWidth, image.naturalHeight);
  const sourceX = Math.max(0, (image.naturalWidth - sourceSize) / 2);
  const sourceY = Math.max(0, (image.naturalHeight - sourceSize) / 2);

  canvas.width = size;
  canvas.height = size;
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, size, size);
  context.drawImage(image, sourceX, sourceY, sourceSize, sourceSize, 0, 0, size, size);

  return canvas;
}

async function createHexclaveProfileImageDataUrl(file: File) {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    throw new Error("Upload a JPG, PNG, or WebP image.");
  }

  if (file.size > PROFILE_IMAGE_MAX_FILE_SIZE) {
    throw new Error("Profile image must be 5 MB or smaller.");
  }

  const sourceUrl = URL.createObjectURL(file);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Could not read that image. Try another file."));
      img.src = sourceUrl;
    });

    for (const size of [256, 192, 160, 128]) {
      const canvas = drawCroppedProfileImage(image, size);

      for (const quality of [0.82, 0.72, 0.62, 0.52, 0.42]) {
        const dataUrl = canvas.toDataURL("image/jpeg", quality);

        if (dataUrl.length <= HEXCLAVE_PROFILE_IMAGE_MAX_BYTES) {
          return dataUrl;
        }
      }
    }
  } finally {
    URL.revokeObjectURL(sourceUrl);
  }

  throw new Error("Profile image could not be compressed under Hexclave's 100 KB limit.");
}

function AccountSettingsContent() {
  const app = useHexclaveApp();
  const user = useUser({ includeRestricted: false, or: "redirect" });
  const project = app.useProject();

  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // --- State for Profile Tab ---
  const profileImageInputRef = React.useRef<HTMLInputElement>(null);
  const profileUpdateUserRef = React.useRef(user);
  const savedProfileRef = React.useRef({
    displayName: user?.displayName || "",
    profileImageUrl: user?.profileImageUrl || "",
  });
  const profileSaveRequestRef = React.useRef(0);
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [profileImageUrl, setProfileImageUrl] = useState(user?.profileImageUrl || "");
  const [profileImageLoading, setProfileImageLoading] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);

  // --- State for Emails Tab ---
  const [channels, setChannels] = useState<any[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);

  // --- State for Security Tab ---
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passkeyLoading, setPasskeyLoading] = useState(false);

  // --- State for Sessions Tab ---
  const [sessions, setSessions] = useState<any[]>([]);

  // --- State for API Keys Tab ---
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [keyDescription, setKeyDescription] = useState("");
  const [createdKey, setCreatedKey] = useState<any | null>(null);
  const [keyDialogOpen, setKeyDialogOpen] = useState(false);

  // --- State for Payments Tab ---
  const [billing, setBilling] = useState<any | null>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  // --- State for Teams Tab ---
  const [teams, setTeams] = useState<any[]>([]);
  const [teamName, setTeamName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [, setTeamInvitations] = useState<any[]>([]);
  const [teamKeys, setTeamKeys] = useState<any[]>([]);
  const [teamKeyName, setTeamKeyName] = useState("");
  const [createdTeamKey, setCreatedTeamKey] = useState<any | null>(null);
  const [teamKeyDialogOpen, setTeamKeyDialogOpen] = useState(false);

  // Load dynamic data based on tab
  useEffect(() => {
    profileUpdateUserRef.current = user;
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const loadTabData = async () => {
      setLoading(true);
      setError(null);
      try {
        if (activeTab === "emails") {
          const res = await user.listContactChannels();
          setChannels(res);
        } else if (activeTab === "sessions") {
          const res = await user.getActiveSessions();
          setSessions(res);
        } else if (activeTab === "api-keys" && project.config.allowUserApiKeys) {
          const res = await user.listApiKeys();
          setApiKeys(res);
        } else if (activeTab === "payments") {
          try {
            const b = await user.getBilling();
            setBilling(b);
            const inv = await user.listInvoices();
            setInvoices(inv);
            const prod = await user.listProducts();
            setProducts([...prod]);
          } catch (e) {
            console.log("Payments not configured or failed to load:", e);
          }
        } else if (activeTab === "teams") {
          const t = await user.listTeams();
          setTeams(t);
          if (user.selectedTeam) {
            const members = await user.selectedTeam.listUsers();
            setTeamMembers(members);
            const invites = await user.selectedTeam.listInvitations();
            setTeamInvitations(invites);
            if (project.config.allowTeamApiKeys) {
              const keys = await user.selectedTeam.listApiKeys();
              setTeamKeys(keys);
            }
          }
        }
      } catch (err: any) {
        setError(err?.message || "Failed to load settings data.");
      } finally {
        setLoading(false);
      }
    };

    loadTabData();
  }, [activeTab, user, project.config]);

  useEffect(() => {
    const nextProfile = {
      displayName: user?.displayName || "",
      profileImageUrl: user?.profileImageUrl || "",
    };

    savedProfileRef.current = nextProfile;
    setDisplayName(nextProfile.displayName);
    setProfileImageUrl(nextProfile.profileImageUrl);
  }, [user?.id]);

  useEffect(() => {
    const currentUser = profileUpdateUserRef.current;
    if (!currentUser || profileImageLoading) return;

    const nextProfile = { displayName, profileImageUrl };
    const savedProfile = savedProfileRef.current;
    const displayNameChanged = nextProfile.displayName !== savedProfile.displayName;
    const profileImageChanged = nextProfile.profileImageUrl !== savedProfile.profileImageUrl;

    if (!displayNameChanged && !profileImageChanged) {
      return;
    }

    if (profileImageChanged && !isValidHexclaveProfileImageUrl(nextProfile.profileImageUrl)) {
      setError("Profile images must be a compressed image under 100 KB or a public HTTPS URL.");
      setProfileImageUrl(savedProfile.profileImageUrl);
      return;
    }

    const requestId = profileSaveRequestRef.current + 1;
    profileSaveRequestRef.current = requestId;

    const timeoutId = window.setTimeout(async () => {
      setProfileSaving(true);
      setError(null);
      setSuccess(null);

      try {
        const profileUpdate: {
          displayName?: string;
          profileImageUrl?: string | null;
        } = {};

        if (displayNameChanged) {
          profileUpdate.displayName = nextProfile.displayName;
        }

        if (profileImageChanged) {
          profileUpdate.profileImageUrl = nextProfile.profileImageUrl || null;
        }

        await currentUser.update(profileUpdate);

        if (profileSaveRequestRef.current !== requestId) return;
        savedProfileRef.current = nextProfile;
      } catch (err: any) {
        if (profileSaveRequestRef.current !== requestId) return;
        setError(err?.message || "Failed to update profile.");
        if (String(err?.message || "").includes("Invalid profile image URL")) {
          setProfileImageUrl(savedProfile.profileImageUrl);
        }
      } finally {
        if (profileSaveRequestRef.current === requestId) {
          setProfileSaving(false);
        }
      }
    }, 700);

    return () => window.clearTimeout(timeoutId);
  }, [displayName, profileImageLoading, profileImageUrl, user?.id]);

  if (!user) {
    return <LoadingScreen message="Redirecting to sign in..." />;
  }

  const navButtonClass = (tab: SettingsTab) =>
    cn(
      "h-9 justify-start gap-2 rounded-lg px-3 text-sm font-medium text-foreground/75 transition-colors hover:bg-zinc-200/45 hover:text-foreground dark:hover:bg-zinc-800/45",
      activeTab === tab &&
        "bg-white/80 text-foreground shadow-sm ring-1 ring-black/[0.04] hover:bg-white/80 dark:bg-zinc-800/65 dark:ring-white/[0.06] dark:hover:bg-zinc-800/65"
    );
  const profileInitials = getProfileInitials(displayName);

  // --- Profile Actions ---
  const handleProfileImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0];
    e.currentTarget.value = "";

    if (!file) return;

    setProfileImageLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const imageUrl = await createHexclaveProfileImageDataUrl(file);
      setProfileImageUrl(imageUrl);
      toast.success("Profile image updated.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to process profile image.";
      setError(message);
      toast.error(message);
    } finally {
      setProfileImageLoading(false);
    }
  };

  // --- Email Actions ---
  const handleAddEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail) return;

    setEmailLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await user.createContactChannel({
        type: "email",
        value: newEmail,
        usedForAuth: true,
        isPrimary: false,
      });
      setNewEmail("");
      const res = await user.listContactChannels();
      setChannels(res);
      setSuccess("Email address added! Please check your inbox to verify it.");
      toast.success("Email address added!");
    } catch (err: any) {
      setError(err?.message || "Failed to add email address.");
    } finally {
      setEmailLoading(false);
    }
  };

  const handleSetPrimaryEmail = async (channel: any) => {
    if (!channel.verified) {
      setError("You must verify this email address before setting it as primary.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await channel.update({ isPrimary: true });
      const res = await user.listContactChannels();
      setChannels(res);
      setSuccess("Primary email updated successfully!");
      toast.success("Primary email updated!");
    } catch (err: any) {
      setError(err?.message || "Failed to update primary email.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAuthEmail = async (channel: any) => {
    const authChannels = channels.filter((c) => c.usedForAuth);
    if (channel.usedForAuth && authChannels.length <= 1) {
      setError("You must have at least one email address enabled for authentication.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await channel.update({ usedForAuth: !channel.usedForAuth });
      const res = await user.listContactChannels();
      setChannels(res);
      setSuccess("Email authentication settings updated!");
      toast.success("Email auth settings updated!");
    } catch (err: any) {
      setError(err?.message || "Failed to update email authentication settings.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEmail = async (channel: any) => {
    if (channel.isPrimary) {
      setError("You cannot delete your primary email address.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await channel.delete();
      const res = await user.listContactChannels();
      setChannels(res);
      setSuccess("Email address removed successfully.");
      toast.success("Email address removed.");
    } catch (err: any) {
      setError(err?.message || "Failed to remove email address.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async (channel: any) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await channel.sendVerificationEmail();
      setSuccess("Verification email resent successfully!");
      toast.success("Verification email resent!");
    } catch (err: any) {
      setError(err?.message || "Failed to resend verification email.");
    } finally {
      setLoading(false);
    }
  };

  // --- Security Actions ---
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (user.hasPassword) {
        await user.updatePassword({ oldPassword, newPassword });
      } else {
        await user.setPassword({ password: newPassword });
      }
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSuccess("Password updated successfully!");
      toast.success("Password updated successfully!");
    } catch (err: any) {
      setError(err?.message || "Failed to update password.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterPasskey = async () => {
    setPasskeyLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await user.registerPasskey();
      if (result.status === "error") {
        setError(result.error.message || "Failed to register passkey.");
      } else {
        setSuccess("Passkey registered successfully!");
        toast.success("Passkey registered!");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to register passkey.");
    } finally {
      setPasskeyLoading(false);
    }
  };

  const handleTogglePasskeyAuth = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await user.update({ passkeyAuthEnabled: !user.passkeyAuthEnabled });
      setSuccess("Passkey authentication toggled successfully!");
      toast.success("Passkey auth updated!");
    } catch (err: any) {
      setError(err?.message || "Failed to toggle passkey authentication.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleOtpAuth = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await user.update({ otpAuthEnabled: !user.otpAuthEnabled });
      setSuccess("OTP authentication toggled successfully!");
      toast.success("OTP auth updated!");
    } catch (err: any) {
      setError(err?.message || "Failed to toggle OTP authentication.");
    } finally {
      setLoading(false);
    }
  };

  // --- Session Actions ---
  const handleRevokeSession = async (sessionId: string) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await user.revokeSession(sessionId);
      const res = await user.getActiveSessions();
      setSessions(res);
      setSuccess("Session revoked successfully.");
      toast.success("Session revoked.");
    } catch (err: any) {
      setError(err?.message || "Failed to revoke session.");
    } finally {
      setLoading(false);
    }
  };

  // --- API Key Actions ---
  const handleCreateApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyDescription) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const newKey = await user.createApiKey({
        description: keyDescription,
        expiresAt: null,
        isPublic: false,
      });
      setCreatedKey(newKey);
      setKeyDialogOpen(true);
      setKeyDescription("");
      const res = await user.listApiKeys();
      setApiKeys(res);
      setSuccess("API key created successfully!");
      toast.success("API key created!");
    } catch (err: any) {
      setError(err?.message || "Failed to create API key.");
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeApiKey = async (keyId: string) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Assuming key has a delete or revoke method
      const key = apiKeys.find((k) => k.id === keyId);
      if (key) {
        await key.revoke();
        const res = await user.listApiKeys();
        setApiKeys(res);
        setSuccess("API key revoked successfully.");
        toast.success("API key revoked.");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to revoke API key.");
    } finally {
      setLoading(false);
    }
  };

  // --- Payments Actions ---
  const handleCreateCheckout = async (productId: string) => {
    setLoading(true);
    setError(null);
    try {
      const url = await user.createCheckoutUrl({ productId });
      if (url) {
        window.location.assign(url);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to create checkout session.");
    } finally {
      setLoading(false);
    }
  };

  // --- Teams Actions ---
  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const newTeam = await user.createTeam({ displayName: teamName });
      setTeamName("");
      await user.setSelectedTeam(newTeam);
      const t = await user.listTeams();
      setTeams(t);
      setSuccess(`Team "${newTeam.displayName}" created successfully!`);
      toast.success("Team created!");
    } catch (err: any) {
      setError(err?.message || "Failed to create team.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTeam = async (team: any) => {
    setLoading(true);
    setError(null);
    try {
      await user.setSelectedTeam(team);
      const members = await team.listUsers();
      setTeamMembers(members);
      const invites = await team.listInvitations();
      setTeamInvitations(invites);
      if (project.config.allowTeamApiKeys) {
        const keys = await team.listApiKeys();
        setTeamKeys(keys);
      }
      setSuccess(`Switched to team: ${team.displayName}`);
      toast.success(`Switched to ${team.displayName}`);
    } catch (err: any) {
      setError(err?.message || "Failed to select team.");
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveTeam = async (team: any) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await user.leaveTeam(team);
      const t = await user.listTeams();
      setTeams(t);
      await user.setSelectedTeam(null);
      setSuccess("You have left the team.");
      toast.success("Left team.");
    } catch (err: any) {
      setError(err?.message || "Failed to leave team.");
    } finally {
      setLoading(false);
    }
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !user.selectedTeam) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await user.selectedTeam.inviteUser({ email: inviteEmail });
      setInviteEmail("");
      const invites = await user.selectedTeam.listInvitations();
      setTeamInvitations(invites);
      setSuccess(`Invitation sent to ${inviteEmail}!`);
      toast.success("Invitation sent!");
    } catch (err: any) {
      setError(err?.message || "Failed to send team invitation.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeamApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamKeyName || !user.selectedTeam) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const newKey = await user.selectedTeam.createApiKey({
        description: teamKeyName,
        expiresAt: null,
      });
      setCreatedTeamKey(newKey);
      setTeamKeyDialogOpen(true);
      setTeamKeyName("");
      const keys = await user.selectedTeam.listApiKeys();
      setTeamKeys(keys);
      setSuccess("Team API key created successfully!");
      toast.success("Team API key created!");
    } catch (err: any) {
      setError(err?.message || "Failed to create team API key.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-10 flex h-dvh w-dvw flex-col overflow-hidden bg-background text-foreground md:flex-row">
      <aside className="shrink-0 border-b border-black/6 bg-zinc-100/70 px-4 py-6 dark:border-white/6 dark:bg-zinc-900/45 md:h-full md:w-[260px] md:overflow-y-auto md:border-b-0 md:border-r">
        <div className="mb-4 px-3">
          <h1 className="text-xl font-semibold tracking-tight">Account Settings</h1>
        </div>
        {/* Sidebar Navigation */}
        <div className="flex flex-row gap-2 overflow-x-auto pb-2 md:flex-col md:overflow-x-visible md:pb-0">
          <Button
            variant="ghost"
            onClick={() => setActiveTab("profile")}
            className={navButtonClass("profile")}
          >
            <User className="size-4" />
            My Profile
          </Button>
          <Button
            variant="ghost"
            onClick={() => setActiveTab("emails")}
            className={navButtonClass("emails")}
          >
            <Mail className="size-4" />
            Emails & Auth
          </Button>
          <Button
            variant="ghost"
            onClick={() => setActiveTab("security")}
            className={navButtonClass("security")}
          >
            <Shield className="size-4" />
            Security & MFA
          </Button>
          <Button
            variant="ghost"
            onClick={() => setActiveTab("sessions")}
            className={navButtonClass("sessions")}
          >
            <Laptop className="size-4" />
            Active Sessions
          </Button>
          {project.config.allowUserApiKeys && (
            <Button
              variant="ghost"
              onClick={() => setActiveTab("api-keys")}
              className={navButtonClass("api-keys")}
            >
              <Key className="size-4" />
              API Keys
            </Button>
          )}
          <Button
            variant="ghost"
            onClick={() => setActiveTab("payments")}
            className={navButtonClass("payments")}
          >
            <CreditCard className="size-4" />
            Payments
          </Button>
          <Button
            variant="ghost"
            onClick={() => setActiveTab("teams")}
            className={navButtonClass("teams")}
          >
            <Users className="size-4" />
            Teams
          </Button>
        </div>
      </aside>

      {/* Content Area */}
      <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-6 md:px-10 md:py-8">
        <div
          className={cn(
            "mx-auto flex w-full max-w-[800px] flex-col gap-5",
            "**:data-[slot=card]:rounded-2xl **:data-[slot=card]:border **:data-[slot=card]:border-black/8 **:data-[slot=card]:bg-white/80 **:data-[slot=card]:shadow-sm **:data-[slot=card]:ring-0",
            "dark:**:data-[slot=card]:border-white/8 dark:**:data-[slot=card]:bg-zinc-950/55",
            "**:data-[slot=input]:h-10 **:data-[slot=input]:rounded-xl",
            "**:data-[slot=button]:rounded-xl"
          )}
        >
          <div className="mb-1">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              {activeTab === "profile" && "My Profile"}
              {activeTab === "emails" && "Emails & Auth"}
              {activeTab === "security" && "Security & MFA"}
              {activeTab === "sessions" && "Active Sessions"}
              {activeTab === "api-keys" && "API Keys"}
              {activeTab === "payments" && "Payments"}
              {activeTab === "teams" && "Teams"}
            </h2>
          </div>
          <AnimatePresence mode="wait">
            {error && <MessageState type="error" message={error} className="mb-4" />}
            {success && <MessageState type="success" message={success} className="mb-4" />}
          </AnimatePresence>

          {/* --- Tab: My Profile --- */}
          {activeTab === "profile" && (
            <Card>
              <CardHeader>
                <CardTitle>My Profile</CardTitle>
                <CardDescription>Update your personal details and profile picture.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    className="group relative size-20 shrink-0 rounded-full outline-none transition-transform hover:scale-[1.02] focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-60"
                    onClick={() => profileImageInputRef.current?.click()}
                    disabled={loading || profileImageLoading}
                    aria-label="Upload profile image"
                  >
                    <Avatar className="size-20 border border-border shadow-sm">
                      <AvatarImage
                        src={profileImageUrl || undefined}
                        alt={displayName ? `${displayName} profile image` : "Profile image"}
                      />
                      <AvatarFallback className="text-lg font-medium">
                        {profileInitials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/45 text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                      {profileImageLoading ? (
                        <Loader2 className="size-5 animate-spin" />
                      ) : (
                        <Camera className="size-5" />
                      )}
                    </span>
                  </button>
                  <div className="min-w-0 flex-1 space-y-2">
                    <Label htmlFor="displayName">Display Name</Label>
                    <Input
                      id="displayName"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Jane Doe"
                      aria-describedby="profileSaveStatus"
                    />
                  </div>
                  <Input
                    ref={profileImageInputRef}
                    id="profileImageUpload"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    onChange={handleProfileImageUpload}
                    disabled={loading || profileImageLoading}
                  />
                </div>
                <span id="profileSaveStatus" className="sr-only" aria-live="polite">
                  {profileSaving ? "Saving profile changes." : "Profile changes save automatically."}
                </span>
              </CardContent>
            </Card>
          )}

          {/* --- Tab: Emails & Auth --- */}
          {activeTab === "emails" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Email Addresses</CardTitle>
                  <CardDescription>Manage email addresses used for notifications and sign in.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    {channels.map((channel) => (
                      <div key={channel.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border rounded-lg bg-card text-card-foreground shadow-sm">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground">{channel.value}</span>
                            {channel.isPrimary && <Badge variant="default">Primary</Badge>}
                            {channel.verified ? (
                              <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Verified</Badge>
                            ) : (
                              <Badge variant="outline" className="text-amber-500 border-amber-500/20 bg-amber-500/5">Unverified</Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {channel.usedForAuth ? "Enabled for sign in" : "Notifications only"}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          {!channel.verified && (
                            <Button size="sm" variant="outline" onClick={() => handleResendVerification(channel)} disabled={loading}>
                              Resend Verification
                            </Button>
                          )}
                          {!channel.isPrimary && channel.verified && (
                            <Button size="sm" variant="outline" onClick={() => handleSetPrimaryEmail(channel)} disabled={loading}>
                              Make Primary
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant={channel.usedForAuth ? "secondary" : "outline"}
                            onClick={() => handleToggleAuthEmail(channel)}
                            disabled={loading}
                          >
                            {channel.usedForAuth ? "Disable Auth" : "Enable Auth"}
                          </Button>
                          {!channel.isPrimary && (
                            <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10" onClick={() => handleDeleteEmail(channel)} disabled={loading}>
                              <Trash className="size-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  <form onSubmit={handleAddEmail} className="flex flex-col gap-2 sm:flex-row">
                    <div className="flex-1 space-y-2">
                      <Label htmlFor="newEmail" className="sr-only">Add Email Address</Label>
                      <Input
                        id="newEmail"
                        type="email"
                        placeholder="new@example.com"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        required
                        disabled={emailLoading}
                      />
                    </div>
                    <Button
                      type="submit"
                      className="h-10 w-full px-4 sm:w-auto"
                      disabled={emailLoading || !newEmail}
                    >
                      {emailLoading ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
                      Add Email
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          )}

          {/* --- Tab: Security & MFA --- */}
          {activeTab === "security" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{user.hasPassword ? "Change Password" : "Set Password"}</CardTitle>
                  <CardDescription>
                    {user.hasPassword
                      ? "Keep your account secure by updating your password regularly."
                      : "Create a password for signing in to your account."}
                  </CardDescription>
                </CardHeader>
                <form onSubmit={handleUpdatePassword}>
                  <CardContent className="space-y-4 pb-4">
                    {user.hasPassword && (
                      <div className="space-y-2">
                        <Label htmlFor="oldPassword">Current Password</Label>
                        <Input
                          id="oldPassword"
                          type="password"
                          value={oldPassword}
                          onChange={(e) => setOldPassword(e.target.value)}
                          required
                          disabled={loading}
                        />
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        disabled={loading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        disabled={loading}
                      />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button type="submit" disabled={loading}>
                      {loading ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
                      Update Password
                    </Button>
                  </CardFooter>
                </form>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Multi-Factor Authentication (MFA)</CardTitle>
                  <CardDescription>Add an extra layer of security to your account.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between p-4 border rounded-lg bg-card text-card-foreground shadow-sm">
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">One-Time Password (OTP) Auth</p>
                      <p className="text-xs text-muted-foreground">Allow logging in with a 6-digit verification code sent to your email.</p>
                    </div>
                    <Switch checked={user.otpAuthEnabled} onCheckedChange={handleToggleOtpAuth} disabled={loading} />
                  </div>

                  {project.config.passkeyEnabled && (
                    <div className="flex items-center justify-between p-4 border rounded-lg bg-card text-card-foreground shadow-sm">
                      <div className="space-y-1">
                        <p className="font-medium text-foreground">Passkey Authentication</p>
                        <p className="text-xs text-muted-foreground">Log in securely using biometric authentication or security keys.</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <Switch checked={user.passkeyAuthEnabled} onCheckedChange={handleTogglePasskeyAuth} disabled={loading} />
                        <Button size="sm" variant="outline" onClick={handleRegisterPasskey} disabled={passkeyLoading}>
                          {passkeyLoading ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
                          Register Passkey
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* --- Tab: Active Sessions --- */}
          {activeTab === "sessions" && (
            <Card>
              <CardHeader>
                <CardTitle>Active Sessions</CardTitle>
                <CardDescription>Manage devices that are currently logged into your account.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {sessions.map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg bg-card text-card-foreground shadow-sm">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Laptop className="size-4 text-muted-foreground" />
                          <span className="font-medium text-foreground">
                            {session.userAgent || "Unknown Device"}
                          </span>
                          {session.isCurrent && <Badge variant="secondary">Current Session</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          IP Address: {session.ipAddress || "Unknown"} • Last active: {new Date(session.lastUsedAt).toLocaleString()}
                        </p>
                      </div>
                      {!session.isCurrent && (
                        <Button size="sm" variant="outline" className="text-destructive hover:bg-destructive/10" onClick={() => handleRevokeSession(session.id)} disabled={loading}>
                          Revoke
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* --- Tab: API Keys --- */}
          {activeTab === "api-keys" && project.config.allowUserApiKeys && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>User API Keys</CardTitle>
                  <CardDescription>Create and manage API keys to authenticate programmatic requests.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <form onSubmit={handleCreateApiKey} className="flex gap-2">
                    <div className="flex-1 space-y-2">
                      <Label htmlFor="keyDescription" className="sr-only">Key Description</Label>
                      <Input
                        id="keyDescription"
                        placeholder="e.g., Development Token"
                        value={keyDescription}
                        onChange={(e) => setKeyDescription(e.target.value)}
                        required
                        disabled={loading}
                      />
                    </div>
                    <Button type="submit" disabled={loading || !keyDescription}>
                      {loading ? <Loader2 className="size-4 animate-spin mr-2" /> : <Plus className="size-4 mr-2" />}
                      Create Key
                    </Button>
                  </form>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Description</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {apiKeys.map((key) => (
                        <TableRow key={key.id}>
                          <TableCell className="font-medium">{key.description}</TableCell>
                          <TableCell>{new Date(key.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell className="text-right">
                            <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10" onClick={() => handleRevokeApiKey(key.id)} disabled={loading}>
                              Revoke
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {apiKeys.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center text-muted-foreground py-6">
                            No API keys found. Create one above.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* API Key Dialog */}
              <Dialog open={keyDialogOpen} onOpenChange={setKeyDialogOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>API Key Created</DialogTitle>
                    <DialogDescription>
                      Please copy your API key now. For security reasons, it will not be shown again.
                    </DialogDescription>
                  </DialogHeader>
                  {createdKey && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-muted font-mono text-sm break-all">
                        <span className="flex-1">
                          {createdKey.value || createdKey.secretKey || createdKey.token}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            navigator.clipboard.writeText(
                              createdKey.value || createdKey.secretKey || createdKey.token
                            );
                            toast.success("API key copied to clipboard!");
                          }}
                        >
                          <Copy className="size-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                  <DialogFooter>
                    <Button onClick={() => setKeyDialogOpen(false)}>Close</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}

          {/* --- Tab: Payments --- */}
          {activeTab === "payments" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Billing & Subscriptions</CardTitle>
                  <CardDescription>Manage your subscription plans and payment methods.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {billing ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 border rounded-lg bg-card text-card-foreground shadow-sm">
                        <div className="space-y-1">
                          <p className="font-medium text-foreground">Current Plan</p>
                          <p className="text-sm text-muted-foreground">
                            {billing.planName || "Free Plan"}
                          </p>
                        </div>
                        <Badge variant="secondary">{billing.status || "Active"}</Badge>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      No active subscription found. Choose a plan below to get started.
                    </div>
                  )}

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="font-semibold text-foreground">Available Products</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {products.map((prod) => (
                        <div key={prod.id} className="flex flex-col justify-between p-4 border rounded-lg bg-card text-card-foreground shadow-sm">
                          <div className="space-y-1 mb-4">
                            <p className="font-bold text-foreground">{prod.name}</p>
                            <p className="text-xs text-muted-foreground">{prod.description}</p>
                          </div>
                          <Button onClick={() => handleCreateCheckout(prod.id)} disabled={loading} className="w-full">
                            Upgrade Plan
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {invoices.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Invoices</CardTitle>
                    <CardDescription>View and download your past billing invoices.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Invoice ID</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {invoices.map((inv) => (
                          <TableRow key={inv.id}>
                            <TableCell className="font-mono text-xs">{inv.id}</TableCell>
                            <TableCell>{new Date(inv.createdAt).toLocaleDateString()}</TableCell>
                            <TableCell>${(inv.amount / 100).toFixed(2)}</TableCell>
                            <TableCell>
                              <Badge variant={inv.status === "paid" ? "secondary" : "outline"}>
                                {inv.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* --- Tab: Teams --- */}
          {activeTab === "teams" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>My Teams</CardTitle>
                  <CardDescription>Create teams or switch between your active teams.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {project.config.clientTeamCreationEnabled && (
                    <form onSubmit={handleCreateTeam} className="flex gap-2">
                      <div className="flex-1 space-y-2">
                        <Label htmlFor="teamName" className="sr-only">Team Name</Label>
                        <Input
                          id="teamName"
                          placeholder="e.g., Acme Corporation"
                          value={teamName}
                          onChange={(e) => setTeamName(e.target.value)}
                          required
                          disabled={loading}
                        />
                      </div>
                      <Button type="submit" disabled={loading || !teamName}>
                        {loading ? <Loader2 className="size-4 animate-spin mr-2" /> : <Plus className="size-4 mr-2" />}
                        Create Team
                      </Button>
                    </form>
                  )}

                  <div className="space-y-4">
                    {teams.map((team) => (
                      <div key={team.id} className="flex items-center justify-between p-4 border rounded-lg bg-card text-card-foreground shadow-sm">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground">{team.displayName}</span>
                            {user.selectedTeam?.id === team.id && <Badge variant="default">Active</Badge>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {user.selectedTeam?.id !== team.id && (
                            <Button size="sm" variant="outline" onClick={() => handleSelectTeam(team)} disabled={loading}>
                              Switch
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10" onClick={() => handleLeaveTeam(team)} disabled={loading}>
                            Leave
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {user.selectedTeam && (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Team Members — {user.selectedTeam.displayName}</CardTitle>
                      <CardDescription>Invite colleagues and manage team permissions.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <form onSubmit={handleInviteMember} className="flex gap-2">
                        <div className="flex-1 space-y-2">
                          <Label htmlFor="inviteEmail" className="sr-only">Email Address</Label>
                          <Input
                            id="inviteEmail"
                            type="email"
                            placeholder="colleague@example.com"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            required
                            disabled={loading}
                          />
                        </div>
                        <Button type="submit" disabled={loading || !inviteEmail}>
                          {loading ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
                          Invite Member
                        </Button>
                      </form>

                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {teamMembers.map((member) => (
                            <TableRow key={member.id}>
                              <TableCell className="font-medium">{member.displayName || "No Name Set"}</TableCell>
                              <TableCell>{member.primaryEmail}</TableCell>
                              <TableCell>
                                <Badge variant="secondary">{member.role || "Member"}</Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>

                  {project.config.allowTeamApiKeys && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Team API Keys</CardTitle>
                        <CardDescription>Manage API keys for team-level programmatic access.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <form onSubmit={handleCreateTeamApiKey} className="flex gap-2">
                          <div className="flex-1 space-y-2">
                            <Label htmlFor="teamKeyName" className="sr-only">Key Name</Label>
                            <Input
                              id="teamKeyName"
                              placeholder="e.g., Production Deploy Key"
                              value={teamKeyName}
                              onChange={(e) => setTeamKeyName(e.target.value)}
                              required
                              disabled={loading}
                            />
                          </div>
                          <Button type="submit" disabled={loading || !teamKeyName}>
                            {loading ? <Loader2 className="size-4 animate-spin mr-2" /> : <Plus className="size-4 mr-2" />}
                            Create Team Key
                          </Button>
                        </form>

                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Name</TableHead>
                              <TableHead>Created</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {teamKeys.map((key) => (
                              <TableRow key={key.id}>
                                <TableCell className="font-medium">{key.description}</TableCell>
                                <TableCell>{new Date(key.createdAt).toLocaleDateString()}</TableCell>
                              </TableRow>
                            ))}
                            {teamKeys.length === 0 && (
                              <TableRow>
                                <TableCell colSpan={2} className="text-center text-muted-foreground py-6">
                                  No team API keys found. Create one above.
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  )}

                  {/* Team API Key Dialog */}
                  <Dialog open={teamKeyDialogOpen} onOpenChange={setTeamKeyDialogOpen}>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Team API Key Created</DialogTitle>
                        <DialogDescription>
                          Please copy your team API key now. For security reasons, it will not be shown again.
                        </DialogDescription>
                      </DialogHeader>
                      {createdTeamKey && (
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted font-mono text-sm break-all">
                            <span className="flex-1">
                              {createdTeamKey.value || createdTeamKey.secretKey || createdTeamKey.token}
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                navigator.clipboard.writeText(
                                  createdTeamKey.value || createdTeamKey.secretKey || createdTeamKey.token
                                );
                                toast.success("Team API key copied!");
                              }}
                            >
                              <Copy className="size-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                      <DialogFooter>
                        <Button onClick={() => setTeamKeyDialogOpen(false)}>Close</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              )}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

export default function AccountSettingsPage() {
  return (
    <Suspense fallback={<LoadingScreen message="Loading Account Settings..." />}>
      <AccountSettingsContent />
    </Suspense>
  );
}
