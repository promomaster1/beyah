import React, { useState, useEffect } from 'react';
import { getAxes, getIndicators, createIndicator } from '@/api/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';

const Indicators = () => {
  const [axes, setAxes] = useState([]);
  const [indicators, setIndicators] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    axis_id: '',
    name_ar: '',
    type: 'performance',
    unit: '',
    description: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [axesRes, indicatorsRes] = await Promise.all([
        getAxes(),
        getIndicators()
      ]);
      setAxes(axesRes.data);
      setIndicators(indicatorsRes.data);
    } catch (error) {
      toast.error('خطأ في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.axis_id || !formData.name_ar || !formData.unit) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    try {
      await createIndicator(formData);
      toast.success('تم إضافة المؤشر بنجاح');
      setIsDialogOpen(false);
      setFormData({
        axis_id: '',
        name_ar: '',
        type: 'performance',
        unit: '',
        description: ''
      });
      loadData();
    } catch (error) {
      toast.error('خطأ في إضافة المؤشر');
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
    <div className="space-y-6" data-testid="indicators-page">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">إدارة المؤشرات</h1>
          <p className="text-gray-600 mt-1">إضافة وعرض المؤشرات</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700" data-testid="add-indicator-button">
              + إضافة مؤشر جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl" dir="rtl">
            <DialogHeader>
              <DialogTitle className="text-right">إضافة مؤشر جديد</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>المحور *</Label>
                <Select value={formData.axis_id} onValueChange={(v) => setFormData({...formData, axis_id: v})}>
                  <SelectTrigger data-testid="dialog-axis-select">
                    <SelectValue placeholder="اختر المحور" />
                  </SelectTrigger>
                  <SelectContent>
                    {axes.map(axis => (
                      <SelectItem key={axis.id} value={axis.id}>{axis.name_ar}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>اسم المؤشر *</Label>
                <Input
                  value={formData.name_ar}
                  onChange={(e) => setFormData({...formData, name_ar: e.target.value})}
                  placeholder="أدخل اسم المؤشر"
                  className="text-right"
                  required
                  data-testid="dialog-name-input"
                />
              </div>

              <div>
                <Label>نوع المؤشر *</Label>
                <Select value={formData.type} onValueChange={(v) => setFormData({...formData, type: v})}>
                  <SelectTrigger data-testid="dialog-type-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="performance">مؤشر أداء</SelectItem>
                    <SelectItem value="outcome">مؤشر نتيجة</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>الوحدة *</Label>
                <Input
                  value={formData.unit}
                  onChange={(e) => setFormData({...formData, unit: e.target.value})}
                  placeholder="% أو عدد أو ريال إلخ..."
                  className="text-right"
                  required
                  data-testid="dialog-unit-input"
                />
              </div>

              <div>
                <Label>الوصف (اختياري)</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="وصف مختصر للمؤشر"
                  className="text-right"
                  rows={3}
                  data-testid="dialog-description-input"
                />
              </div>

              <div className="flex gap-3 justify-end">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit" className="bg-green-600 hover:bg-green-700" data-testid="dialog-submit-button">
                  حفظ
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {axes.map(axis => {
        const axisIndicators = indicators.filter(i => i.axis_id === axis.id);
        if (axisIndicators.length === 0) return null;

        return (
          <div key={axis.id} className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">{axis.name_ar}</h2>
            <div className="space-y-2">
              {axisIndicators.map((indicator, idx) => (
                <div key={indicator.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg" data-testid={`indicator-item-${idx}`}>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">{indicator.name_ar}</p>
                    <p className="text-sm text-gray-500">
                      {indicator.type === 'performance' ? 'مؤشر أداء' : 'مؤشر نتيجة'} • الوحدة: {indicator.unit}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      indicator.type === 'performance' 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-purple-100 text-purple-700'
                    }`}>
                      {indicator.type === 'performance' ? 'أداء' : 'نتيجة'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Indicators;
