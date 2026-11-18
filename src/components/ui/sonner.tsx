"use client";

import { Toaster as Sonner } from "sonner";

function Toaster() {
  return (
    <Sonner
      position="top-center"
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast: "!rounded-2xl !font-sans !shadow-lift",
        },
      }}
    />
  );
}

export { Toaster };
