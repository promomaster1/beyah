import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAxisDetails } from '@/api/api';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';

const AxisDetails = () => {
  const { axisId } = useParams();
  const navigate = useNavigate();
  const [year, setYear] = useState(new Date().getFullYear());
  const [axisData, setAxisData] = useState(null);
  const [loading, setLoading] = useState(true);

  const years = [2024, 2023, 2022, 2021, 2020];

  useEffect(() => {
    loadAxisDetails();
  }, [axisId, year]);

  const loadAxisDetails = async () => {
    setLoading(true);
    try {
      const response = await getAxisDetails(axisId, year);
      setAxisData(response.data);
    } catch (error) {
      toast.error('خطأ في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const getChartData = (indicator) => {
    return [
      { quarter: 'Q1', value: indicator.quarterly_values[1] || 0 },
      { quarter: 'Q2', value: indicator.quarterly_values[2] || 0 },
      { quarter: 'Q3', value: indicator.quarterly_values[3] || 0 },
      { quarter: 'Q4', value: indicator.quarterly_values[4] || 0 },
    ];
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

  const performanceIndicators = axisData?.indicators?.filter(i => i.indicator.type === 'performance') || [];
  const outcomeIndicators = axisData?.indicators?.filter(i => i.indicator.type === 'outcome') || [];

  return (
    <div className="space-y-6" data-testid="axis-details-page">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <Button variant="ghost" onClick={() => navigate('/dashboard')} className="mb-2">
            ← العودة للوحة المعلومات
          </Button>
          <h1 className="text-3xl font-bold text-gray-800">{axisData?.axis?.name_ar}</h1>
          <p className="text-gray-600 mt-1">تفاصيل المؤشرات والأداء</p>
        </div>
        <div className="flex items-center space-x-reverse space-x-2">
          <span className="text-sm text-gray-600">السنة:</span>
          <Select value={year.toString()} onValueChange={(v) => setYear(parseInt(v))}>
            <SelectTrigger className="w-32">
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

      {/* Performance Indicators */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">مؤشرات الأداء</h2>
        <div className="space-y-6">
          {performanceIndicators.map((item, index) => (
            <div key={item.indicator.id} className="bg-white border border-gray-200 rounded-lg p-6" data-testid={`performance-indicator-${index}`}>
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-800">{item.indicator.name_ar}</h3>
                  <p className="text-sm text-gray-500 mt-1">الوحدة: {item.indicator.unit}</p>
                </div>
                <div className="text-left">
                  <div className="text-sm text-gray-600">نسبة الإنجاز</div>
                  <div className={`text-2xl font-bold ${item.achievement_percent >= 100 ? 'text-green-600' : item.achievement_percent >= 80 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {item.achievement_percent}%
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="text-sm text-gray-600">الهدف السنوي</div>
                  <div className="text-xl font-bold text-blue-600">{item.target_value} {item.indicator.unit}</div>
                </div>
                <div className="bg-green-50 rounded-lg p-3">
                  <div className="text-sm text-gray-600">الإنجاز الفعلي</div>
                  <div className="text-xl font-bold text-green-600">{item.total_actual} {item.indicator.unit}</div>
                </div>
              </div>

              {/* Chart */}
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={getChartData(item)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="quarter" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Outcome Indicators */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">مؤشرات النتائج</h2>
        <div className="space-y-6">
          {outcomeIndicators.map((item, index) => (
            <div key={item.indicator.id} className="bg-white border border-gray-200 rounded-lg p-6" data-testid={`outcome-indicator-${index}`}>
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-800">{item.indicator.name_ar}</h3>
                  <p className="text-sm text-gray-500 mt-1">الوحدة: {item.indicator.unit}</p>
                </div>
                <div className="text-left">
                  <div className="text-sm text-gray-600">نسبة الإنجاز</div>
                  <div className={`text-2xl font-bold ${item.achievement_percent >= 100 ? 'text-green-600' : item.achievement_percent >= 80 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {item.achievement_percent}%
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="text-sm text-gray-600">الهدف السنوي</div>
                  <div className="text-xl font-bold text-blue-600">{item.target_value} {item.indicator.unit}</div>
                </div>
                <div className="bg-green-50 rounded-lg p-3">
                  <div className="text-sm text-gray-600">الإنجاز الفعلي</div>
                  <div className="text-xl font-bold text-green-600">{item.total_actual} {item.indicator.unit}</div>
                </div>
              </div>

              {/* Chart */}
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={getChartData(item)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="quarter" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AxisDetails;
