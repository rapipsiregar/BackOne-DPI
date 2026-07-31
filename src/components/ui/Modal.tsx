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
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-2 sm:p-4">
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-slate-950/80 backdrop-blur-md ${isClosing ? 'animate-overlay-out' : 'animate-overlay-in'}`}
        style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
        onClick={onClose}
      />
      
      {/* Dialog */}
      <div className={cn(
        "relative z-[9999] w-full max-w-md transform overflow-hidden rounded-2xl border border-border bg-card shadow-2xl sm:my-8",
        isClosing ? 'animate-modal-out' : 'animate-modal-in',
        className
      )}>
        <div className="flex items-center justify-between border-b border-border px-4 sm:px-6 py-3 sm:py-4">
          <h3 className="text-base sm:text-lg font-semibold text-foreground tracking-tight">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <span className="sr-only">Close</span>
            <X className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        </div>
        <div className="px-4 sm:px-6 py-3.5 sm:py-4">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
