"use client";

import { ReactNode, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  className?: string;
}

export function Modal({ isOpen, onClose, title, children, className }: ModalProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setVisible(true);
      setIsClosing(false);
      document.body.style.overflow = "hidden";
    } else {
      if (visible) {
        setIsClosing(true);
        const timer = setTimeout(() => {
          setVisible(false);
          setIsClosing(false);
          document.body.style.overflow = "unset";
        }, 480);
        return () => clearTimeout(timer);
      }
    }
  }, [isOpen, visible]);

  useEffect(() => {
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  if (!isMounted || !visible) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-0">
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/40 dark:bg-black/75 backdrop-blur-sm ${isClosing ? 'animate-overlay-out' : 'animate-overlay-in'}`}
        onClick={onClose}
      />
      
      {/* Dialog */}
      <div className={cn(
        "relative z-[9999] w-full max-w-md transform overflow-hidden rounded-xl border border-border bg-card shadow-2xl sm:my-8",
        isClosing ? 'animate-modal-out' : 'animate-modal-in',
        className
      )}>
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h3 className="text-lg font-semibold text-foreground tracking-tight">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <span className="sr-only">Close</span>
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-6 py-4">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
