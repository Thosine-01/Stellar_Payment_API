"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export type TeamRole = "Owner" | "Administrator" | "Developer" | "Support" | "Viewer";

export interface TeamMember {
  id: string;
  email: string;
  role: TeamRole;
  status: "Active" | "Invited";
  joinedAt: string;
}

const DEFAULT_MEMBERS: TeamMember[] = [
  {
    id: "mem_1",
    email: "owner@pluto.storage",
    role: "Owner",
    status: "Active",
    joinedAt: "2026-01-10",
  },
  {
    id: "mem_2",
    email: "lead-dev@pluto.storage",
    role: "Developer",
    status: "Active",
    joinedAt: "2026-03-15",
  },
  {
    id: "mem_3",
    email: "support-agent@pluto.storage",
    role: "Support",
    status: "Invited",
    joinedAt: "2026-05-27",
  },
];

const ROLE_DESCRIPTIONS: Record<TeamRole, string> = {
  Owner: "Full access to billing, key rotation, database, and all settings.",
  Administrator: "Can manage all settings, webhooks, and team members except key rotation.",
  Developer: "Can read/write API keys, view payment logs, and test in sandbox.",
  Support: "Can view payments, access dashboard charts, and process refunds.",
  Viewer: "Read-only access to dashboard statistics and payment logs.",
};

export default function UserPermissionsManager() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<TeamRole>("Developer");
  const [isInviting, setIsInviting] = useState(false);
  const [filterRole, setFilterRole] = useState<string>("All");

  // Load from localStorage or default on mount
  useEffect(() => {
    const saved = localStorage.getItem("pluto_team_members");
    if (saved) {
      try {
        setMembers(JSON.parse(saved));
      } catch {
        setMembers(DEFAULT_MEMBERS);
      }
    } else {
      setMembers(DEFAULT_MEMBERS);
      localStorage.setItem("pluto_team_members", JSON.stringify(DEFAULT_MEMBERS));
    }
  }, []);

  const saveToStorage = (updatedList: TeamMember[]) => {
    localStorage.setItem("pluto_team_members", JSON.stringify(updatedList));
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) {
      toast.error("Please enter a valid email address.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteEmail.trim())) {
      toast.error("Invalid email address format.");
      return;
    }

    if (members.some((m) => m.email.toLowerCase() === inviteEmail.trim().toLowerCase())) {
      toast.error("A team member with this email already exists.");
      return;
    }

    setIsInviting(true);

    const newMember: TeamMember = {
      id: `mem_${Date.now()}`,
      email: inviteEmail.trim().toLowerCase(),
      role: inviteRole,
      status: "Invited",
      joinedAt: new Date().toISOString().split("T")[0],
    };

    // Keep reference of previous list for rollback if API fails
    const previousMembers = [...members];

    // Optimistic Update: Immediately add the new member to the list
    const optimisticallyUpdatedMembers = [...members, newMember];
    setMembers(optimisticallyUpdatedMembers);
    setInviteEmail("");

    try {
      // Simulate API network request latency
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          // 95% success rate for simulation
          if (Math.random() > 0.05) {
            resolve(true);
          } else {
            reject(new Error("API server timed out"));
          }
        }, 800);
      });

      saveToStorage(optimisticallyUpdatedMembers);
      toast.success(`Successfully invited ${newMember.email} as ${newMember.role}`);
    } catch (err: unknown) {
      // Revert/Rollback on failure
      setMembers(previousMembers);
      const msg = err instanceof Error ? err.message : "Failed to invite user";
      toast.error(`Error: ${msg}. Reverted state.`);
    } finally {
      setIsInviting(false);
    }
  };

  const handleRoleChange = async (memberId: string, newRole: TeamRole) => {
    const previousMembers = [...members];

    // Optimistic Update: Immediately update role in list state
    const optimisticallyUpdatedMembers = members.map((m) =>
      m.id === memberId ? { ...m, role: newRole } : m
    );
    setMembers(optimisticallyUpdatedMembers);

    try {
      // Simulate API latency
      await new Promise((resolve) => setTimeout(resolve, 500));
      saveToStorage(optimisticallyUpdatedMembers);
      toast.success("Team member role successfully updated.");
    } catch {
      // Revert/Rollback on failure
      setMembers(previousMembers);
      toast.error("Failed to update role. Reverted state.");
    }
  };

  const handleRevoke = async (memberId: string) => {
    const targetMember = members.find((m) => m.id === memberId);
    if (!targetMember) return;

    if (targetMember.role === "Owner") {
      toast.error("The account Owner's permissions cannot be revoked.");
      return;
    }

    if (!confirm(`Are you sure you want to revoke access for ${targetMember.email}?`)) {
      return;
    }

    const previousMembers = [...members];

    // Optimistic Update: Immediately remove member from list state
    const optimisticallyUpdatedMembers = members.filter((m) => m.id !== memberId);
    setMembers(optimisticallyUpdatedMembers);

    try {
      // Simulate API latency
      await new Promise((resolve) => setTimeout(resolve, 600));
      saveToStorage(optimisticallyUpdatedMembers);
      toast.success(`Revoked access for ${targetMember.email}`);
    } catch {
      // Revert/Rollback on failure
      setMembers(previousMembers);
      toast.error("Failed to revoke access. Reverted state.");
    }
  };

  const filteredMembers = filterRole === "All"
    ? members
    : members.filter((m) => m.role === filterRole);

  return (
    <div className="flex flex-col gap-8">
      {/* Invite Member form */}
      <section 
        aria-labelledby="invite-section-title"
        className="rounded-2xl border border-[#E8E8E8] bg-white p-6 md:p-8 flex flex-col gap-6"
      >
        <div>
          <h2 id="invite-section-title" className="text-lg font-bold text-[#0A0A0A] mb-1">
            Invite Team Member
          </h2>
          <p className="text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider">
            Add team members and define their exact workspace accessibility level.
          </p>
        </div>

        <form onSubmit={handleInvite} className="flex flex-col gap-4 md:flex-row md:items-end">
          <div className="flex-1 flex flex-col gap-2">
            <label htmlFor="invite-email-input" className="text-[10px] font-bold uppercase tracking-widest text-[#6B6B6B]">
              Email Address
            </label>
            <input
              id="invite-email-input"
              type="email"
              placeholder="e.g. dev@pluto.storage"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              disabled={isInviting}
              className="h-11 rounded-xl border border-[#E8E8E8] bg-[#F9F9F9] px-4 text-sm text-[#0A0A0A] placeholder-slate-400 focus:border-[#4a6fa5] focus:bg-white outline-none transition-all disabled:opacity-50"
            />
          </div>

          <div className="w-full md:w-56 flex flex-col gap-2">
            <label htmlFor="invite-role-select" className="text-[10px] font-bold uppercase tracking-widest text-[#6B6B6B]">
              Workspace Role
            </label>
            <select
              id="invite-role-select"
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as TeamRole)}
              disabled={isInviting}
              className="h-11 rounded-xl border border-[#E8E8E8] bg-[#F9F9F9] px-4 text-xs font-bold uppercase tracking-wider text-[#0A0A0A] focus:border-[#4a6fa5] focus:bg-white outline-none transition-all disabled:opacity-50"
            >
              <option value="Administrator">Administrator</option>
              <option value="Developer">Developer</option>
              <option value="Support">Support</option>
              <option value="Viewer">Viewer</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={isInviting || !inviteEmail}
            className="h-11 rounded-xl bg-[#4a6fa5] px-6 text-xs font-bold uppercase tracking-widest text-white hover:bg-[#3d6494] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm flex items-center justify-center gap-2 whitespace-nowrap active:scale-[0.98]"
          >
            {isInviting ? (
              <>
                <svg className="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Sending...
              </>
            ) : (
              "Send Invite"
            )}
          </button>
        </form>

        {/* Role description box */}
        <div className="rounded-xl border border-pluto-200 bg-pluto-50 p-4">
          <p className="text-xs font-bold text-pluto-800 uppercase tracking-widest mb-1.5">
            Role Access Level: {inviteRole}
          </p>
          <p className="text-xs text-pluto-700 leading-relaxed font-medium">
            {ROLE_DESCRIPTIONS[inviteRole]}
          </p>
        </div>
      </section>

      {/* Member List section */}
      <section 
        aria-labelledby="member-section-title"
        className="rounded-2xl border border-[#E8E8E8] bg-white p-6 md:p-8 flex flex-col gap-6"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 id="member-section-title" className="text-lg font-bold text-[#0A0A0A] mb-1">
              Active Workspace Team
            </h2>
            <p className="text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider">
              {filteredMembers.length} active or pending members on your merchant account.
            </p>
          </div>

          {/* Role Filter */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <label htmlFor="role-filter-select" className="text-[10px] font-bold uppercase tracking-widest text-[#6B6B6B] whitespace-nowrap">
              Filter:
            </label>
            <select
              id="role-filter-select"
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="h-9 rounded-lg border border-[#E8E8E8] bg-white px-2 text-[10px] font-bold uppercase tracking-wider text-[#0A0A0A] outline-none"
            >
              <option value="All">All Roles</option>
              <option value="Owner">Owner</option>
              <option value="Administrator">Administrator</option>
              <option value="Developer">Developer</option>
              <option value="Support">Support</option>
              <option value="Viewer">Viewer</option>
            </select>
          </div>
        </div>

        {/* Table of Members */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E8E8E8] pb-3">
                <th className="pb-3 text-[10px] font-bold uppercase tracking-widest text-[#6B6B6B]">Member / Email</th>
                <th className="pb-3 text-[10px] font-bold uppercase tracking-widest text-[#6B6B6B]">Workspace Role</th>
                <th className="pb-3 text-[10px] font-bold uppercase tracking-widest text-[#6B6B6B]">Connection</th>
                <th className="pb-3 text-[10px] font-bold uppercase tracking-widest text-[#6B6B6B] text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence initial={false}>
                {filteredMembers.map((member) => (
                  <motion.tr
                    key={member.id}
                    initial={{ opacity: 0, height: 0, y: -10 }}
                    animate={{ opacity: 1, height: "auto", y: 0 }}
                    exit={{ opacity: 0, height: 0, y: 10 }}
                    transition={{ type: "spring", stiffness: 350, damping: 26 }}
                    className="border-b border-[#F5F5F5] group/row"
                  >
                    <td className="py-4.5 pr-4 align-middle">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-bold text-[#0A0A0A]">{member.email}</span>
                        <span className="text-[9px] font-bold uppercase tracking-widest text-[#A0A0A0]">
                          Joined on {member.joinedAt}
                        </span>
                      </div>
                    </td>

                    <td className="py-4.5 pr-4 align-middle">
                      {member.role === "Owner" ? (
                        <span className="text-xs font-bold text-pluto-800 uppercase tracking-widest bg-pluto-50 border border-pluto-200 rounded-lg px-3 py-1">
                          Owner
                        </span>
                      ) : (
                        <select
                          aria-label={`Change role for ${member.email}`}
                          value={member.role}
                          onChange={(e) => handleRoleChange(member.id, e.target.value as TeamRole)}
                          className="h-8 rounded-lg border border-[#E8E8E8] bg-transparent px-2.5 text-xs font-bold uppercase tracking-wider text-[#0A0A0A] hover:bg-[#F9F9F9] focus:bg-white focus:border-[#4a6fa5] outline-none transition-colors"
                        >
                          <option value="Administrator">Admin</option>
                          <option value="Developer">Developer</option>
                          <option value="Support">Support</option>
                          <option value="Viewer">Viewer</option>
                        </select>
                      )}
                    </td>

                    <td className="py-4.5 pr-4 align-middle">
                      <div className="flex items-center gap-2">
                        <span 
                          className={`h-1.5 w-1.5 rounded-full ${
                            member.status === "Active" ? "bg-green-500 animate-none" : "bg-[#8A8A8A] animate-pulse"
                          }`} 
                        />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#6B6B6B]">
                          {member.status}
                        </span>
                      </div>
                    </td>

                    <td className="py-4.5 align-middle text-right">
                      {member.role !== "Owner" && (
                        <button
                          type="button"
                          onClick={() => handleRevoke(member.id)}
                          aria-label={`Revoke access for ${member.email}`}
                          className="rounded-lg border border-red-100 bg-red-50/50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-red-600 hover:bg-red-100 active:scale-[0.96] transition-all"
                        >
                          Revoke
                        </button>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>

              {filteredMembers.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-xs font-semibold text-[#6B6B6B] uppercase tracking-widest">
                    No team members match this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
