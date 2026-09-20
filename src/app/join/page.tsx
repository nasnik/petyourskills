import React from "react";
import { JoinForm } from "./join-form";
import { getPysGuestNameFromCookie } from "@/actions/collaboration";

export default async function JoinPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { code } = await searchParams;
  const initialCode = typeof code === "string" ? code : "";
  const initialName = (await getPysGuestNameFromCookie()) ?? "";

  return <JoinForm initialCode={initialCode} initialName={initialName} />;
}
