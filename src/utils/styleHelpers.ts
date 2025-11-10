// src/utils/styleHelpers.ts

import type { Theme } from "../types";

export const getStatusClasses = (status: string, theme: Theme): string => {
  const isDark = theme === "dark";
  switch (status) {
    case "Confirmed":
    case "Completed":
      return isDark
        ? "bg-green-500/20 text-green-400 ring-1 ring-inset ring-green-500/30"
        : "bg-green-100 text-green-800 ring-1 ring-inset ring-green-200";
    case "Pending":
      return isDark
        ? "bg-yellow-500/20 text-yellow-400 ring-1 ring-inset ring-yellow-500/30"
        : "bg-yellow-100 text-yellow-800 ring-1 ring-inset ring-yellow-200";
    case "Cancelled":
      return isDark
        ? "bg-red-500/20 text-red-400 ring-1 ring-inset ring-red-500/30"
        : "bg-red-100 text-red-800 ring-1 ring-inset ring-red-200";
    default:
      return isDark
        ? "bg-gray-500/20 text-gray-400 ring-1 ring-inset ring-gray-500/30"
        : "bg-gray-100 text-gray-800 ring-1 ring-inset ring-gray-200";
  }
};

export const getCardClasses = (theme: Theme): string => {
  return theme === "dark"
    ? "bg-white/5 border-white/10 shadow-premium"
    : "bg-white shadow-premium border border-gray-200";
};

export const getTextMuted = (theme: Theme): string => {
  return theme === "dark" ? "text-gray-400" : "text-gray-500";
};

export const getTextHeader = (theme: Theme): string => {
  return theme === "dark" ? "text-white" : "text-gray-800";
};

export const getInputClasses = (theme: Theme): string => {
  return theme === "dark"
    ? "bg-gray-900 border-gray-700 text-white focus:border-brand-yellow focus:ring-brand-yellow/50"
    : "bg-gray-50 border-brand-teal/20 text-gray-800 focus:border-brand-teal focus:ring-brand-teal/50";
};
