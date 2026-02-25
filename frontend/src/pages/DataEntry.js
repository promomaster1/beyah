import React, { useState, useEffect } from 'react';
import { getAxes, getIndicators, createValue } from '@/api/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const DataEntry = () => {
  const [axes, setAxes] = useState([]);
  const [indicators, setIndicators] = useState([]);
  const [selectedAxis, setSelectedAxis] = useState('');
  const [selectedIndicator, setSelectedIndicator] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [quarter, setQuarter] = useState(1);
  const [value, setValue] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const years = [2024, 2023, 2022, 2021, 2020];
  const quarters = [1, 2, 3, 4];

  useEffect(() => {
    loadAxes();
  }, []);

  useEffect(() => {
    if (selectedAxis) {
      loadIndicators(selectedAxis);
    } else {
      setIndicators([]);
      setSelectedIndicator('');
    }
  }, [selectedAxis]);

  const loadAxes = async () => {
    try {
      const response = await getAxes();
      setAxes(response.data);
    } catch (error) {
      toast.error('خطأ في تحميل المحاور');
    }
  };

  const loadIndicators = async (axisId) => {
    try {
      const response = await getIndicators(axisId);
      setIndicators(response.data);
    } catch (error) {
      toast.error('خطأ في تحميل المؤشرات');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedIndicator || !value) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    setLoading(true);
    try {
      await createValue({
        indicator_id: selectedIndicator,
        year: parseInt(year),
        quarter: parseInt(quarter),
        actual_value: parseFloat(value),
        notes: notes || null
      });
      toast.success('تم إضافة القيمة بنجاح');
      // Reset form
      setValue('');
      setNotes('');
    } catch (error) {
      if (error.response?.status === 400) {
        toast.error('البيانات موجودة مسبقاً لهذه الفترة');
      } else {
        toast.error('خطأ في إضافة القيمة');
      }
    } finally {
      setLoading(false);
    }
  };

  const selectedIndicatorData = indicators.find(i => i.id === selectedIndicator);

  return (
    <div className="space-y-6" data-testid="data-entry-page">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">إدخال البيانات</h1>
        <p className="text-gray-600 mt-1">إضافة قيم المؤشرات الربع سنوية</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Year & Quarter */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="year" className="text-right block mb-2">السنة *</Label>
              <Select value={year.toString()} onValueChange={(v) => setYear(parseInt(v))}>
                <SelectTrigger data-testid="year-select">
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
              <Label htmlFor="quarter" className="text-right block mb-2">الربع *</Label>
              <Select value={quarter.toString()} onValueChange={(v) => setQuarter(parseInt(v))}>
                <SelectTrigger data-testid="quarter-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {quarters.map(q => (
                    <SelectItem key={q} value={q.toString()}>الربع {q}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Axis */}
          <div>
            <Label htmlFor="axis" className="text-right block mb-2">المحور *</Label>
            <Select value={selectedAxis} onValueChange={setSelectedAxis}>
              <SelectTrigger data-testid="axis-select">
                <SelectValue placeholder="اختر المحور" />
              </SelectTrigger>
              <SelectContent>
                {axes.map(axis => (
                  <SelectItem key={axis.id} value={axis.id}>{axis.name_ar}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Indicator */}
          <div>
            <Label htmlFor="indicator" className="text-right block mb-2">المؤشر *</Label>
            <Select value={selectedIndicator} onValueChange={setSelectedIndicator} disabled={!selectedAxis}>
              <SelectTrigger data-testid="indicator-select">
                <SelectValue placeholder="اختر المؤشر" />
              </SelectTrigger>
              <SelectContent>
                {indicators.map(indicator => (
                  <SelectItem key={indicator.id} value={indicator.id}>
                    {indicator.name_ar} ({indicator.type === 'performance' ? 'أداء' : 'نتيجة'})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedIndicatorData && (
              <p className="text-sm text-gray-500 mt-2">
                الوحدة: {selectedIndicatorData.unit}
              </p>
            )}
          </div>

          {/* Value */}
          <div>
            <Label htmlFor="value" className="text-right block mb-2">القيمة الفعلية *</Label>
            <Input
              id="value"
              type="number"
              step="0.01"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="أدخل القيمة"
              className="text-right"
              required
              data-testid="value-input"
            />
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes" className="text-right block mb-2">ملاحظات (اختياري)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="أضف أي ملاحظات إضافية"
              className="text-right"
              rows={3}
              data-testid="notes-input"
            />
          </div>

          <Button 
            type="submit" 
            className="w-full bg-green-600 hover:bg-green-700"
            disabled={loading}
            data-testid="submit-button"
          >
            {loading ? 'جارٍ الحفظ...' : 'حفظ البيانات'}
          </Button>
        </form>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-800 mb-2">💡 ملاحظات هامة</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• يجب إدخال قيمة واحدة فقط لكل مؤشر في كل ربع</li>
          <li>• تأكد من دقة البيانات قبل الحفظ</li>
          <li>• يمكنك إضافة ملاحظات توضيحية لكل قيمة</li>
        </ul>
      </div>
    </div>
  );
};

export default DataEntry;