"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Wallet, Plus, Minus, Search, RefreshCw, DollarSign } from "lucide-react";

interface UserCredits {
  user_id: string;
  email: string;
  credits_balance: number;
  updated_at: string | null;
}

interface Props {
  users: UserCredits[];
}

export default function AdminCreditsClient({ users }: Props) {
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserCredits | null>(null);
  const [dollarAmount, setDollarAmount] = useState<number>(45);
  const [description, setDescription] = useState("");
  const [isGranting, setIsGranting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isAdding, setIsAdding] = useState(true);
  const [userList, setUserList] = useState<UserCredits[]>(users);

  const CREDIT_VALUE = 45;

  useEffect(() => {
    setUserList(users);
  }, [users]);

  const filteredUsers = userList.filter(
    (u) => u.email.toLowerCase().includes(search.toLowerCase())
  );

  // Total balance in dollars
  const totalBalanceDollars = userList.reduce((sum, u) => sum + u.credits_balance, 0) * CREDIT_VALUE;

  const grantCredits = async (userId: string, credits: number, description: string) => {
    // TODO: Call server action or API route
    return { success: true, newBalance: credits };
  };

  const handleGrantCredits = async () => {
    if (!selectedUser || dollarAmount === 0) return;
    const credits = Math.round(dollarAmount / CREDIT_VALUE);
    if (credits === 0) {
      alert("Amount must be at least $45");
      return;
    }
    const finalCredits = isAdding ? credits : -credits;
    setIsGranting(true);
    try {
      const res = await grantCredits(selectedUser.user_id, finalCredits, description);
      if (res.success) {
        setUserList((prev) =>
          prev.map((u) =>
            u.user_id === selectedUser.user_id
              ? { ...u, credits_balance: res.newBalance ?? u.credits_balance + finalCredits }
              : u
          )
        );
        setShowModal(false);
        setSelectedUser(null);
        setDollarAmount(45);
        setDescription("");
      } else {
        alert(res.error || "Failed to update balance");
      }
    } catch (err) {
      console.error("Failed to update balance", err);
      alert("Failed to update balance");
    } finally {
      setIsGranting(false);
    }
  };

  const openGrantModal = (user: UserCredits, adding: boolean) => {
    setSelectedUser(user);
    setIsAdding(adding);
    setDollarAmount(45);
    setDescription("");
    setShowModal(true);
  };

  // ...existing UI rendering code...
  return (
    <div>
      {/* Render user credits UI here using userList, filteredUsers, and handlers */}
      {/* ...existing code... */}
    </div>
  );
}
