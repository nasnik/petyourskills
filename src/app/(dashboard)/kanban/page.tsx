"use client";

import React from "react";
import { KanbanBoard } from "@/components/kanban/kanban-board";

export default function KanbanPage() {
  return (
    <div className="space-y-6">
      <KanbanBoard />
    </div>
  );
}
