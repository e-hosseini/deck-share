"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ShareRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const deckId = params.id as string;

  useEffect(() => {
    router.replace(`/decks/${deckId}?share=open`);
  }, [deckId, router]);

  return null;
}
