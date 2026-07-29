"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronDown, Shield } from "lucide-react";

interface RoleOption {
  value: string;
  label: string;
}

interface RoleSelectProps {
  adminRole: string;
  value: string;
  onChange: (val: string) => void;
  modalContext?: 'agents' | 'user-accounts';
}

// Role untuk konteks Agents (teknikal/operasional)
const AGENTS_ROLES: RoleOption[] = [
  { value: "EXECUTIVE", label: "Executive" },
  { value: "TENANT_ADMIN", label: "Tenant Admin" },
  { value: "SOC_ANALYST", label: "SOC Analyst" },
  { value: "ENGINEER", label: "Engineer" },
];

// Role untuk konteks User Accounts (customer/client)
const USER_ACCOUNTS_ROLES_SUPER: RoleOption[] = [
  { value: "COMPANY_ADMIN", label: "Company Admin" },
  { value: "COMPANY_OPERATOR", label: "Company Operator" },
  { value: "COMPANY_VIEWER", label: "Company Viewer" },
];

const USER_ACCOUNTS_ROLES_COMPANY: RoleOption[] = [
  { value: "COMPANY_OPERATOR", label: "Company Operator" },
  { value: "COMPANY_VIEWER", label: "Company Viewer" },
];

export default function RoleSelect({ adminRole, value, onChange, modalContext = 'user-accounts' }: RoleSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Pilih role options berdasarkan konteks modal
  const options: RoleOption[] = (() => {
    if (modalContext === 'agents') {
      // Agents page: selalu tampilkan role teknikal saja
      return AGENTS_ROLES;
    }
    // User Accounts page: tampilkan COMPANY_* sesuai admin role
    if (adminRole === 'SUPER_ADMIN' || adminRole === 'EXECUTIVE') return USER_ACCOUNTS_ROLES_SUPER;
    return USER_ACCOUNTS_ROLES_COMPANY;
  })();

  const currentOption = options.find((opt) => opt.value === value) || options[0];

  // Set default role if current value is not in the options
  useEffect(() => {
    if (options.length > 0 && !options.some((opt) => opt.value === value)) {
      onChange(options[0].value);
    }
  }, [adminRole, value, onChange, options]);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  return (
    <div className="relative w-full" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center justify-between w-full px-3 py-2.5 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500 hover:border-slate-500 transition-colors text-left"
      >
        <span className="truncate">{currentOption?.label || value}</span>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${
            isOpen ? "rotate-180 text-amber-500" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-50 py-1 custom-scrollbar">
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full px-3 py-2 text-sm text-left transition-colors truncate flex items-center justify-between ${
                  isSelected
                    ? "bg-amber-600/20 text-amber-400 font-medium"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <span>{opt.label}</span>
                {isSelected && <Shield className="w-3.5 h-3.5 text-amber-400" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
