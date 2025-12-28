"use client";

import { useState, useEffect, useCallback } from "react";
import { Check, Loader2, Search, X, UserPlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface UserOption {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface UserSelectProps {
  /** Called when user selection changes */
  onSelect: (users: UserOption[]) => void;
  /** Allow selecting multiple users */
  multiple?: boolean;
  /** User IDs to exclude from the list (e.g., already added) */
  excludeIds?: string[];
  /** Emails to exclude from the list (for legacy members without user_id) */
  excludeEmails?: string[];
  /** Placeholder text for search input */
  placeholder?: string;
  /** Currently selected users (controlled) */
  selectedUsers?: UserOption[];
  /** Maximum number of users to show in results */
  maxResults?: number;
  /** Class name for the container */
  className?: string;
}

export function UserSelect({
  onSelect,
  multiple = false,
  excludeIds = [],
  excludeEmails = [],
  placeholder = "Search users by name or email...",
  selectedUsers = [],
  maxResults = 10,
  className,
}: UserSelectProps) {
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch users when search changes
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set("search", debouncedSearch);
      params.set("limit", String(maxResults + excludeIds.length)); // Get extra to account for excluded
      // Note: We don't exclude from API - we show them as disabled instead

      const res = await fetch(`/api/admin/users?${params}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, excludeIds.length, maxResults]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const isSelected = (userId: string) =>
    selectedUsers.some((u) => u.id === userId);

  const toggleUser = (user: UserOption) => {
    if (multiple) {
      if (isSelected(user.id)) {
        onSelect(selectedUsers.filter((u) => u.id !== user.id));
      } else {
        onSelect([...selectedUsers, user]);
      }
    } else {
      onSelect([user]);
    }
  };

  const removeUser = (userId: string) => {
    onSelect(selectedUsers.filter((u) => u.id !== userId));
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={placeholder}
          className="pl-10"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* Selected Users (if multiple) */}
      {multiple && selectedUsers.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedUsers.map((user) => (
            <div
              key={user.id}
              className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-primary/10 text-primary text-sm"
            >
              <span>
                {user.first_name} {user.last_name}
              </span>
              <button
                type="button"
                onClick={() => removeUser(user.id)}
                className="hover:bg-primary/20 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* User List */}
      <div className="max-h-60 overflow-y-auto rounded-lg border border-border">
        {users.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
            <UserPlus className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-sm">
              {debouncedSearch
                ? "No users found matching your search"
                : "No users available"}
            </p>
          </div>
        )}

        {users.map((user) => {
          const selected = isSelected(user.id);
          const isExcluded =
            excludeIds.includes(user.id) ||
            excludeEmails.includes(user.email.toLowerCase());
          return (
            <button
              key={user.id}
              type="button"
              onClick={() => !isExcluded && toggleUser(user)}
              disabled={isExcluded}
              className={cn(
                "w-full flex items-center gap-3 p-3 text-left transition-colors",
                isExcluded
                  ? "opacity-50 cursor-not-allowed bg-muted/30"
                  : selected
                    ? "bg-primary/5 hover:bg-primary/10"
                    : "hover:bg-secondary/50",
                "border-b border-border last:border-b-0",
              )}
            >
              {multiple && (
                <div
                  className={cn(
                    "w-5 h-5 rounded border flex items-center justify-center shrink-0",
                    isExcluded
                      ? "bg-muted border-muted-foreground/20"
                      : selected
                        ? "bg-primary border-primary text-primary-foreground"
                        : "border-muted-foreground/30",
                  )}
                >
                  {(selected || isExcluded) && <Check className="w-3 h-3" />}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium truncate">
                    {user.first_name} {user.last_name}
                  </p>
                  {isExcluded && (
                    <span className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded shrink-0">
                      Already added
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {user.email}
                </p>
              </div>
              {!multiple && selected && !isExcluded && (
                <Check className="w-4 h-4 text-primary shrink-0" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
