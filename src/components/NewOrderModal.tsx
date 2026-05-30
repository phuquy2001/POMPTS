import React, { useState } from 'react';
import { X, Calendar, Layers, Plus } from 'lucide-react';
import { Product } from '../types';

interface NewOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onCreateOrder: (orderData: any) => Promise<void>;
}

export const NewOrderModal: React.FC<NewOrderModalProps> = ({ 
  isOpen, 
  onClose, 
  products, 
  onCreateOrder 
}) => {
  const [orderNumber, setOrderNumber] = useState('');
  const [productCode, setProductCode] = useState('');
  const [qtyOrdered, setQtyOrdered] = useState(50);
  const [plannedStartDate, setPlannedStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [plannedEndDate, setPlannedEndDate] = useState(
    new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto generate standard LSX format order number if empty
  const handleAutoGenerateCode = () => {
    const code = `LSX-2026-${Math.floor(Math.random() * 9000 + 1000)}`;
    setOrderNumber(code);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber || !productCode || qtyOrdered <= 0) return;

    setIsSubmitting(true);
    const selectedProduct = products.find(p => p.code === productCode);
    try {
      await onCreateOrder({
        orderNumber,
        productCode,
        productName: selectedProduct?.name || 'Sản phẩm nội thất',
        qtyOrdered: Number(qtyOrdered),
        status: 'RELEASED',
        plannedStartDate,
        plannedEndDate
      });
      // Reset state
      setOrderNumber('');
      setProductCode('');
      setQtyOrdered(50);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-scale-in">
        
        {/* Modal Header */}
        <div className="bg-slate-950 p-4 font-bold text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-amber-500" />
            <span className="text-sm tracking-wide uppercase">Khởi Tạo Lệnh Sản Xuất Mới</span>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-all cursor-pointer p-1 rounded-lg hover:bg-slate-900"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Order No */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700">Mã lệnh sẳn xuất (LSX)</label>
              <button
                type="button"
                onClick={handleAutoGenerateCode}
                className="text-[10px] text-amber-600 hover:text-amber-500 font-bold font-mono uppercase"
              >
                [Auto Gen CODE]
              </button>
            </div>
            <input
              type="text"
              required
              placeholder="Ví dụ: LSX-221"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Product Select */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Cấu hình sản phẩm chế tác</label>
            <select
              value={productCode}
              onChange={(e) => setProductCode(e.target.value)}
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-amber-500"
            >
              <option value="">-- Chọn thành phẩm nội thất --</option>
              {products.map((p) => (
                <option key={p.id} value={p.code}>
                  {p.name} ({p.code})
                </option>
              ))}
            </select>
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Số lượng đặt hàng chi tiết (Cái / Bộ)</label>
            <input
              type="number"
              min="1"
              required
              value={qtyOrdered}
              onChange={(e) => setQtyOrdered(Math.max(1, parseInt(e.target.value) || 0))}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-amber-500 font-mono font-bold"
            />
          </div>

          {/* Planned Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Ngày khởi chạy hoạch</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="date"
                  required
                  value={plannedStartDate}
                  onChange={(e) => setPlannedStartDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Hạn đóng gói dự lường</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="date"
                  required
                  value={plannedEndDate}
                  onChange={(e) => setPlannedEndDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Info notification */}
          <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 text-[10px] text-slate-500 leading-relaxed font-sans">
            📌 <strong>TỰ ĐỘNG HÓA KỸ THUẬT:</strong> Hệ thống sẽ tự động đối sánh mã sản phẩm để thiết lập danh sách định mức định ngạch nguyên vật liệu xả thô <strong>(BOM Bill of Materials)</strong> cùng 6 công việc con <strong>(Routing Steps)</strong> tuần tự trải khắp các tổ mộc gốc.
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-xs font-bold cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !orderNumber || !productCode}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all shadow flex items-center gap-1 cursor-pointer disabled:opacity-50"
            >
              <Plus className="h-4 w-4 shrink-0" />
              <span>{isSubmitting ? 'ĐANG TẠO...' : 'PHÁT HÀNH LỆNH'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
