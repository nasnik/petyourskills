import React from "react";
import { JoinForm } from "./join-form";

export default async function JoinPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { code } = await searchParams;
  const initialCode = typeof code === "string" ? code : "";

  return <JoinForm initialCode={initialCode} />;
}
