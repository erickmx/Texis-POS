import React from 'react';
import { Pencil } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Icon } from '../ui/Icon';
import { Card } from '../ui/Card';

export interface Product {
  id: string;
  name: string;
  sku: string;
  description: string;
  stockLevel: number;
  buyPrice: number;
  salePrice: number;
  image: string;
}

interface ProductTableProps {
  products: Product[];
}

const getStockStatus = (level: number) => {
  if (level <= 0) return { label: 'OUT OF STOCK', variant: 'outline' as const };
  if (level <= 10) return { label: 'LOW STOCK', variant: 'secondary' as const };
  return { label: 'IN STOCK', variant: 'primary' as const };
};

export const ProductTable: React.FC<ProductTableProps> = ({ products }) => {
  return (
    <Card className="!p-0 overflow-hidden" shadow>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-solid border-outline-variant/10 bg-[#f8f9fa]">
              <th className="px-6 py-6 text-[10px] font-bold tracking-[0.2em] text-on-surface-variant/40 uppercase">Product</th>
              <th className="px-6 py-6 text-[10px] font-bold tracking-[0.2em] text-on-surface-variant/40 uppercase">SKU</th>
              <th className="px-6 py-6 text-[10px] font-bold tracking-[0.2em] text-on-surface-variant/40 uppercase">Stock Level</th>
              <th className="px-6 py-6 text-[10px] font-bold tracking-[0.2em] text-on-surface-variant/40 uppercase text-right">Buy Price</th>
              <th className="px-6 py-6 text-[10px] font-bold tracking-[0.2em] text-on-surface-variant/40 uppercase text-right">Sale Price</th>
              <th className="px-6 py-6 text-[10px] font-bold tracking-[0.2em] text-on-surface-variant/40 uppercase text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/10">
            {products.map((product) => {
              const status = getStockStatus(product.stockLevel);
              const stockPercentage = Math.min((product.stockLevel / 100) * 100, 100);

              return (
                <tr key={product.id} className="hover:bg-surface-container-low transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-sm bg-surface-container overflow-hidden flex-shrink-0">
                        {/* Placeholder for real images */}
                        <div className="w-full h-full bg-surface-container-high flex items-center justify-center text-[10px] text-on-surface-variant/40">
                          {product.name.charAt(0)}
                        </div>
                      </div>
                      <div>
                        <p className="font-display font-bold text-on-surface text-sm">{product.name}</p>
                        <p className="text-xs text-on-surface-variant/60">{product.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="bg-[#f0f2f5] text-on-surface-variant/70 px-2 py-0.5 rounded-sm text-[9px] font-bold tracking-widest font-mono uppercase">
                      {product.sku}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col gap-2 min-w-[160px]">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-on-surface">{product.stockLevel} Units</span>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </div>
                      <div className="h-1.5 w-full bg-surface-container-high rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            status.variant === 'primary' ? 'bg-primary-container' : 
                            status.variant === 'secondary' ? 'bg-secondary-container' : 'bg-[#e53935]'
                          }`}
                          style={{ width: `${stockPercentage}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right font-medium text-sm text-on-surface">
                    ${product.buyPrice.toFixed(2)}
                  </td>
                  <td className="px-6 py-5 text-right font-display font-bold text-sm text-primary-container">
                    ${product.salePrice.toFixed(2)}
                  </td>
                  <td className="px-6 py-5 text-right">
                    <button className="p-2 hover:bg-surface-container rounded-sm transition-colors opacity-0 group-hover:opacity-100">
                      <Icon icon={Pencil} size={16} className="text-on-surface-variant hover:text-primary" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {/* Pagination Placeholder */}
      <div className="px-6 py-4 border-t border-solid border-outline-variant bg-surface-container-lowest flex items-center justify-between">
        <p className="text-xs text-on-surface-variant/60">Showing 1 to {products.length} of {products.length} products</p>
        <div className="flex gap-2">
          <button className="w-8 h-8 rounded-sm border border-solid border-outline-variant flex items-center justify-center text-xs text-on-surface-variant hover:bg-surface-container-low transition-colors">&lt;</button>
          <button className="w-8 h-8 rounded-sm bg-primary-container text-white flex items-center justify-center text-xs font-bold">1</button>
          <button className="w-8 h-8 rounded-sm border border-solid border-outline-variant flex items-center justify-center text-xs text-on-surface-variant hover:bg-surface-container-low transition-colors">&gt;</button>
        </div>
      </div>
    </Card>
  );
};
