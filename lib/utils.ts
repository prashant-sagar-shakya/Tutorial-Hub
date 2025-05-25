import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function ny(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export const loadScript = (src: string): Promise<boolean> => {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => {
      resolve(true);
    };
    script.onerror = () => {
      console.error(`Error loading script: ${src}`);
      resolve(false);
    };
    document.body.appendChild(script);
  });
};
