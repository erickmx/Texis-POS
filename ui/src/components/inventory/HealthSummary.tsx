import React from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

interface HealthSummaryProps {
  optimizationScore: number;
  urgentItemsCount: number;
}

export const HealthSummary: React.FC<HealthSummaryProps> = ({ 
  optimizationScore, 
  urgentItemsCount 
}) => {
  return (
    <Card className="bg-talavera relative overflow-hidden" shadow>
      {/* Decorative background pattern (simulating the Z-shape in image) */}
      <div className="absolute top-0 right-0 w-64 h-full opacity-10 pointer-events-none">
        <svg viewBox="0 0 200 200" className="w-full h-full text-white fill-current">
          <path d="M40 40 L160 40 L40 160 L160 160" stroke="currentColor" strokeWidth="20" fill="none" />
        </svg>
      </div>

      <div className="relative z-10 flex flex-col gap-6 max-w-lg">
        <div>
          <h2 className="text-white font-display font-bold text-2xl mb-2">Inventory Health Summary</h2>
          <p className="text-white/80 text-sm leading-relaxed">
            Your stock levels are <span className="text-white font-bold">{optimizationScore}% optimized</span>. 
            There are <span className="text-white font-bold">{urgentItemsCount} items</span> requiring immediate 
            reorder to prevent stockouts in the next 7 days.
          </p>
        </div>
        
        <Button variant="ghost" className="bg-white text-primary-container border-none hover:bg-white/90 w-fit h-10 px-6 uppercase tracking-wider text-xs font-bold">
          VIEW URGENT ORDERS
        </Button>
      </div>
    </Card>
  );
};
