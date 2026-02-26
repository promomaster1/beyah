import React, { useState, useEffect } from 'react';
import { getAxes, getIndicators, getTargets, upsertTarget } from '@/api/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const Targets = () => {
  const [axes, setAxes] = useState([]);
  const [indicators, setIndicators] = useState([]);
  const [targets, setTargets] = useState([]);
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [editingTargets, setEditingTargets] = useState({});

  const years = [2024, 2025, 2026, 2027];

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [axesRes, indicatorsRes, targetsRes] = await Promise.all([
        getAxes(),
        getIndicators(),
        getTargets(year)
      ]);
      setAxes(axesRes.data);
      setIndicators(indicatorsRes.data);
      setTargets(targetsRes.data);
      
      // Initialize editing targets
      const editTargets = {};
      targetsRes.data.forEach(t => {
        editTargets[t.indicator_id] = t.target_value;
      });
      setEditingTargets(editTargets);
    } catch (error) {
      toast.error('خطأ في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const handleTargetChange = (indicatorId, value) => {
    setEditingTargets(prev => ({
      ...prev,
      [indicatorId]: value
    }));
  };

  const handleSaveTarget = async (indicatorId) => {
    const value = editingTargets[indicatorId];
    if (!value || value <= 0) {
      toast.error('يرجى إدخال قيمة صحيحة');
      return;
    }

    try {
      await upsertTarget({
        indicator_id: indicatorId,
        year: year,
        target_value: parseFloat(value)
      });
      toast.success('تم حفظ الهدف بنجاح');
      loadData();
    } catch (error) {
      toast.error('خطأ في حفظ الهدف');
    }
  };

  const getTargetForIndicator = (indicatorId) => {
    return targets.find(t => t.indicator_id === indicatorId);
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
    <div className="space-y-6" data-testid="targets-page">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">إدارة الأهداف</h1>
          <p className="text-gray-600 mt-1">تحديد الأهداف السنوية للمؤشرات</p>
        </div>
        <div className="flex items-center space-x-reverse space-x-2">
          <span className="text-sm text-gray-600">السنة:</span>
          <Select value={year.toString()} onValueChange={(v) => setYear(parseInt(v))}>
            <SelectTrigger className="w-32" data-testid="year-selector">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map(y => (
                <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {axes.map(axis => {
        const axisIndicators = indicators.filter(i => i.axis_id === axis.id);
        if (axisIndicators.length === 0) return null;

        return (
          <div key={axis.id} className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">{axis.name_ar}</h2>
            <div className="space-y-3">
              {axisIndicators.map(indicator => {
                const target = getTargetForIndicator(indicator.id);
                const currentValue = editingTargets[indicator.id] || target?.target_value || '';

                return (
                  <div key={indicator.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">{indicator.name_ar}</p>
                      <p className="text-sm text-gray-500">
                        {indicator.type === 'performance' ? 'مؤشر أداء' : 'مؤشر نتيجة'} • الوحدة: {indicator.unit}
                      </p>
                    </div>
                    <div className="w-40">
                      <Input
                        type="number"
                        step="0.01"
                        value={currentValue}
                        onChange={(e) => handleTargetChange(indicator.id, e.target.value)}
                        placeholder="الهدف"
                        className="text-center"
                        data-testid={`target-input-${indicator.id}`}
                      />
                    </div>
                    <Button
                      onClick={() => handleSaveTarget(indicator.id)}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      data-testid={`save-target-${indicator.id}`}
                    >
                      حفظ
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Targets;