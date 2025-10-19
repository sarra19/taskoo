import type { Metadata } from "next";
import React from "react";

import TaskListPage from "./(others-pages)/(task)/list/page";

export const metadata: Metadata = {
  title:
    "Taskoo",
  description: "Task Management Application",
};

export default function Ecommerce() {
  return (
        <TaskListPage />

  

     
  
  );
}
