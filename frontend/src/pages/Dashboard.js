import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getDashboard } from '@/api/api';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const Dashboard = () => {
  const [year, setYear] = useState(new Date().getFullYear());
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  const years = [2024, 2023, 2022, 2021, 2020];

  useEffect(() => {
    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year]);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const response = await getDashboard(year);
      setDashboardData(response.data);
    } catch (error) {
      toast.error('خطأ في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'green': return 'bg-green-100 border-green-300 text-green-800';
      case 'yellow': return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      case 'red': return 'bg-red-100 border-red-300 text-red-800';
      default: return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'green': return '✓';
      case 'yellow': return '⚠';
      case 'red': return '✗';
      default: return '?';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'green': return 'ممتاز';
      case 'yellow': return 'جيد';
      case 'red': return 'يحتاج تحسين';
      default: return 'غير محدد';
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
    <div className="space-y-6" data-testid="dashboard-page">
      {/* Header */}
      <div className="flex justify-between items-center animate-slide-down">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">لوحة المعلومات</h1>
          <p className="text-gray-600 mt-1">نظرة عامة على أداء المحاور</p>
        </div>
        <div className="flex items-center space-x-reverse space-x-4">
          <div className="flex items-center space-x-reverse space-x-2">
            <span className="text-sm text-gray-600">السنة:</span>
            <Select value={year.toString()} onValueChange={(v) => setYear(parseInt(v))}>
              <SelectTrigger className="w-32 bg-white/80 backdrop-blur-lg" data-testid="year-selector">
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
      </div>

      {/* Overall Score */}
      <div className="bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 rounded-xl p-8 text-white shadow-lg hover:shadow-2xl transition-all duration-300 animate-scale-in">
        <div className="text-center">
          <p className="text-lg opacity-90 mb-2">الأداء الإجمالي</p>
          <div className="text-6xl font-bold mb-2 animate-float" data-testid="overall-score">
            {dashboardData?.overall_score?.toFixed(1)}%
          </div>
          <p className="text-sm opacity-90">للعام {year}</p>
        </div>
      </div>

      {/* Axes Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {dashboardData?.axes?.map((axisData, index) => (
          <Link
            key={axisData.axis.id}
            to={`/axis/${axisData.axis.id}`}
            data-testid={`axis-card-${index}`}
          >
            <div className={`border-2 rounded-xl p-6 transition-all hover:shadow-lg cursor-pointer ${getStatusColor(axisData.status)}`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold mb-2">{axisData.axis.name_ar}</h3>
                  <p className="text-sm opacity-75">
                    {axisData.indicators_count} مؤشر
                  </p>
                </div>
                <div className="text-3xl">
                  {getStatusIcon(axisData.status)}
                </div>
              </div>

              <div className="mt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">نسبة الإنجاز</span>
                  <span className="text-2xl font-bold" data-testid={`axis-${index}-achievement`}>
                    {axisData.achievement_percent}%
                  </span>
                </div>
                <div className="w-full bg-white bg-opacity-50 rounded-full h-3">
                  <div
                    className="bg-current rounded-full h-3 transition-all"
                    style={{ width: `${Math.min(axisData.achievement_percent, 100)}%` }}
                  ></div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-current border-opacity-20">
                <span className="text-sm font-medium">
                  الحالة: {getStatusLabel(axisData.status)}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Legend */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold text-gray-700 mb-3">دليل الألوان</h3>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="flex items-center space-x-reverse space-x-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span>ممتاز: ≥ 100%</span>
          </div>
          <div className="flex items-center space-x-reverse space-x-2">
            <div className="w-4 h-4 bg-yellow-500 rounded"></div>
            <span>جيد: 80-99%</span>
          </div>
          <div className="flex items-center space-x-reverse space-x-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span>يحتاج تحسين: &lt; 80%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
