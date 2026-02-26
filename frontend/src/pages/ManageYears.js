import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';

const ManageYears = () => {
  const [years, setYears] = useState([2024, 2023, 2022, 2021, 2020]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newYear, setNewYear] = useState('');

  const handleAddYear = () => {
    const yearNum = parseInt(newYear);
    
    if (!newYear || isNaN(yearNum)) {
      toast.error('يرجى إدخال سنة صحيحة');
      return;
    }

    if (yearNum < 2000 || yearNum > 2100) {
      toast.error('السنة يجب أن تكون بين 2000 و 2100');
      return;
    }

    if (years.includes(yearNum)) {
      toast.error('السنة موجودة مسبقاً');
      return;
    }

    const newYears = [yearNum, ...years].sort((a, b) => b - a);
    setYears(newYears);
    localStorage.setItem('system_years', JSON.stringify(newYears));
    toast.success(`تم إضافة السنة ${yearNum} بنجاح`);
    setNewYear('');
    setIsDialogOpen(false);
  };

  const handleRemoveYear = (year) => {
    if (years.length <= 1) {
      toast.error('يجب أن يبقى سنة واحدة على الأقل');
      return;
    }

    const newYears = years.filter(y => y !== year);
    setYears(newYears);
    localStorage.setItem('system_years', JSON.stringify(newYears));
    toast.success(`تم حذف السنة ${year}`);
  };

  const currentYear = new Date().getFullYear();

  return (
    <div className="space-y-6 animate-fade-in" data-testid="manage-years-page">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">إدارة السنوات</h1>
          <p className="text-gray-600 mt-1">إضافة وحذف السنوات المتاحة في النظام</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700" data-testid="add-year-button">
              ➕ إضافة سنة جديدة
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md" dir="rtl">
            <DialogHeader>
              <DialogTitle className="text-right">إضافة سنة جديدة</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>السنة *</Label>
                <Input
                  type="number"
                  value={newYear}
                  onChange={(e) => setNewYear(e.target.value)}
                  placeholder="مثال: 2025"
                  className="text-right text-lg"
                  min="2000"
                  max="2100"
                  data-testid="year-input"
                />
                <p className="text-xs text-gray-500 mt-1">السنة يجب أن تكون بين 2000 و 2100</p>
              </div>

              <div className="flex gap-3 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    setNewYear('');
                  }}
                >
                  إلغاء
                </Button>
                <Button
                  onClick={handleAddYear}
                  className="bg-green-600 hover:bg-green-700"
                  data-testid="submit-year-button"
                >
                  إضافة
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Years Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {years.map((year, index) => (
          <div
            key={year}
            className="bg-white/80 backdrop-blur-lg rounded-lg shadow-sm p-6 border border-white/20 hover:shadow-lg transition-all duration-300 card-hover animate-scale-in"
            style={{ animationDelay: `${index * 50}ms` }}
            data-testid={`year-card-${index}`}
          >
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-800 mb-2">{year}</div>
              {year === currentYear && (
                <span className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold mb-3">
                  السنة الحالية
                </span>
              )}
              <div className="mt-4">
                <Button
                  onClick={() => handleRemoveYear(year)}
                  variant="outline"
                  size="sm"
                  className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                  disabled={years.length <= 1}
                  data-testid={`delete-year-${year}`}
                >
                  🗑️ حذف
                </Button>
              </div>
            </div>
          </div>
        ))}

        {/* Add new year card */}
        <div
          className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg shadow-sm p-6 border-2 border-dashed border-green-300 hover:border-green-500 transition-all duration-300 cursor-pointer animate-scale-in"
          onClick={() => setIsDialogOpen(true)}
          style={{ animationDelay: `${years.length * 50}ms` }}
        >
          <div className="text-center h-full flex flex-col items-center justify-center">
            <div className="text-5xl text-green-500 mb-2">➕</div>
            <p className="text-gray-600 font-medium">إضافة سنة</p>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-800 mb-2">💡 ملاحظات</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• السنوات المضافة ستظهر في جميع قوائم اختيار السنة في النظام</li>
          <li>• يمكنك إضافة سنوات مستقبلية للتخطيط المسبق</li>
          <li>• لا يمكن حذف السنة إذا كانت الوحيدة في النظام</li>
          <li>• السنوات محفوظة محلياً في المتصفح</li>
        </ul>
      </div>
    </div>
  );
};

export default ManageYears;
