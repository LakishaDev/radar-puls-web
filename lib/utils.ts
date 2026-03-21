// This file is a utility module that provides a function for combining and merging CSS class names. It uses the `clsx` library to conditionally join class names and the `tailwind-merge` library to merge Tailwind CSS classes, ensuring that conflicting classes are resolved correctly. The `cn` function takes any number of class name inputs and returns a single string of merged class names.

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
