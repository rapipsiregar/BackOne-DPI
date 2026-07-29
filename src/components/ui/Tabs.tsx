import React, { useState } from 'react';

interface TabProps {
  label: string;
  children: React.ReactNode;
}

export function Tab({ children }: TabProps) {
  return <>{children}</>;
}

interface TabsProps {
  children: React.ReactElement<TabProps>[];
}

export function Tabs({ children }: TabsProps) {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex space-x-1 border-b border-white/10 overflow-x-auto pb-1">
        {React.Children.map(children, (child, index) => {
          if (!React.isValidElement(child)) return null;
          const isActive = index === activeTab;
          return (
            <button
              key={index}
              onClick={() => setActiveTab(index)}
              className={`
                px-4 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap
                ${isActive 
                  ? 'bg-blue-600/20 text-blue-400 border-b-2 border-blue-500' 
                  : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'}
              `}
            >
              {child.props.label}
            </button>
          );
        })}
      </div>
      <div className="mt-4">
        {React.Children.map(children, (child, index) => {
          if (index !== activeTab) return null;
          return child;
        })}
      </div>
    </div>
  );
}
