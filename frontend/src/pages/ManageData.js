import React, { useState, useEffect } from 'react';
import { getAxes, getIndicators, getValues, updateValue } from '@/api/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

const ManageData = () => {
  const [axes, setAxes] = useState([]);
  const [indicators, setIndicators] = useState([]);
  const [values, setValues] = useState([]);
  const [filteredValues, setFilteredValues] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedQuarter, setSelectedQuarter] = useState('all');
  const [selectedAxis, setSelectedAxis] = useState('all');
  const [loading, setLoading] = useState(false);
  const [editDialog, setEditDialog] = useState({ open: false, value: null });
  const [editForm, setEditForm] = useState({ actual_value: '', notes: '' });

  const years = [2024, 2023, 2022, 2021, 2020];
  const quarters = [1, 2, 3, 4];

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear]);

  useEffect(() => {
    filterValues();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values, selectedQuarter, selectedAxis]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [axesRes, indicatorsRes, valuesRes] = await Promise.all([
        getAxes(),
        getIndicators(),
        getValues({ year: selectedYear })
      ]);
      setAxes(axesRes.data);
      setIndicators(indicatorsRes.data);
      setValues(valuesRes.data);
    } catch (error) {
      toast.error('خطأ في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const filterValues = () => {
    let filtered = [...values];

    if (selectedQuarter !== 'all') {
      filtered = filtered.filter(v => v.quarter === parseInt(selectedQuarter));
    }

    if (selectedAxis !== 'all') {
      const axisIndicators = indicators.filter(i => i.axis_id === selectedAxis).map(i => i.id);
      filtered = filtered.filter(v => axisIndicators.includes(v.indicator_id));
    }

    setFilteredValues(filtered);
  };

  const getIndicatorName = (indicatorId) => {
    const indicator = indicators.find(i => i.id === indicatorId);
    return indicator ? indicator.name_ar : '';
  };

  const getAxisName = (indicatorId) => {
    const indicator = indicators.find(i => i.id === indicatorId);
    if (!indicator) return '';
    const axis = axes.find(a => a.id === indicator.axis_id);
    return axis ? axis.name_ar : '';
  };

  const handleEdit = (value) => {
    setEditForm({
      actual_value: value.actual_value.toString(),
      notes: value.notes || ''
    });
    setEditDialog({ open: true, value });
  };

  const handleUpdate = async () => {
    if (!editDialog.value || !editForm.actual_value) {
      toast.error('يرجى إدخال قيمة صحيحة');
      return;
    }

    try {
      await updateValue(editDialog.value.id, {
        indicator_id: editDialog.value.indicator_id,
        year: editDialog.value.year,
        quarter: editDialog.value.quarter,
        actual_value: parseFloat(editForm.actual_value),
        notes: editForm.notes || null
      });
      toast.success('تم تحديث البيانات بنجاح');
      setEditDialog({ open: false, value: null });
      loadData();
    } catch (error) {
      toast.error('خطأ في تحديث البيانات');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جارٍ تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in" data-testid="manage-data-page">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800">إدارة البيانات</h1>
        <p className="text-gray-600 mt-1">عرض وتعديل البيانات المدخلة</p>
      </div>

      {/* Filters */}
      <div className="bg-white/80 backdrop-blur-lg rounded-lg shadow-sm p-6 border border-white/20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>السنة</Label>
            <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
              <SelectTrigger data-testid="year-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map(y => (
                  <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>الربع</Label>
            <Select value={selectedQuarter} onValueChange={setSelectedQuarter}>
              <SelectTrigger data-testid="quarter-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأرباع</SelectItem>
                {quarters.map(q => (
                  <SelectItem key={q} value={q.toString()}>الربع {q}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>المحور</Label>
            <Select value={selectedAxis} onValueChange={setSelectedAxis}>
              <SelectTrigger data-testid="axis-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع المحاور</SelectItem>
                {axes.map(axis => (
                  <SelectItem key={axis.id} value={axis.id}>{axis.name_ar}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white/80 backdrop-blur-lg rounded-lg shadow-sm overflow-hidden border border-white/20 animate-slide-up">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">المحور</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">المؤشر</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">الربع</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">القيمة</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">الملاحظات</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">إجراءات</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredValues.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    لا توجد بيانات مدخلة
                  </td>
                </tr>
              ) : (
                filteredValues.map((value, index) => (
                  <tr key={value.id} className="hover:bg-green-50 transition-colors" data-testid={`data-row-${index}`}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getAxisName(value.indicator_id)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {getIndicatorName(value.indicator_id)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      Q{value.quarter}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                      {value.actual_value}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {value.notes || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Button
                        onClick={() => handleEdit(value)}
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700"
                        data-testid={`edit-button-${index}`}
                      >
                        ✏️ تعديل
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialog.open} onOpenChange={(open) => setEditDialog({ open, value: null })}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right">تعديل البيانات</DialogTitle>
          </DialogHeader>
          {editDialog.value && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">المؤشر</p>
                <p className="font-medium">{getIndicatorName(editDialog.value.indicator_id)}</p>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">الفترة</p>
                <p className="font-medium">السنة {editDialog.value.year} - الربع {editDialog.value.quarter}</p>
              </div>

              <div>
                <Label>القيمة الفعلية *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={editForm.actual_value}
                  onChange={(e) => setEditForm({ ...editForm, actual_value: e.target.value })}
                  className="text-right"
                  data-testid="edit-value-input"
                />
              </div>

              <div>
                <Label>الملاحظات</Label>
                <Input
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  className="text-right"
                  data-testid="edit-notes-input"
                />
              </div>

              <div className="flex gap-3 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditDialog({ open: false, value: null })}
                >
                  إلغاء
                </Button>
                <Button
                  onClick={handleUpdate}
                  className="bg-green-600 hover:bg-green-700"
                  data-testid="update-button"
                >
                  حفظ التعديلات
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManageData;
