"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { getLikedThreadIds } from "@/lib/actions/user.actions";

type LikeStateContextValue = {
  likedThreadIds: Set<string>;
  setLiked: (threadId: string, liked: boolean) => void;
  isLoading: boolean;
};

const LikeStateContext = createContext<LikeStateContextValue | null>(null);

export function LikeStateProvider({ children }: { children: React.ReactNode }) {
  const [likedThreadIds, setLikedThreadIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    getLikedThreadIds()
      .then((ids) => {
        if (active) setLikedThreadIds(new Set(ids));
      })
      .catch((error) => console.error("Unable to load liked threads:", error))
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const setLiked = (threadId: string, liked: boolean) => {
    setLikedThreadIds((current) => {
      const next = new Set(current);
      if (liked) next.add(threadId);
      else next.delete(threadId);
      return next;
    });
  };

  return (
    <LikeStateContext.Provider value={{ likedThreadIds, setLiked, isLoading }}>
      {children}
    </LikeStateContext.Provider>
  );
}

export function useLikeState() {
  const context = useContext(LikeStateContext);
  if (!context) {
    throw new Error("useLikeState must be used within LikeStateProvider.");
  }
  return context;
}
