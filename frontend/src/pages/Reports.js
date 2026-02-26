import React, { useState, useEffect } from 'react';
import { getAnnualReport } from '@/api/api';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import jsPDF from 'jspdf';

const Reports = () => {
  const [year, setYear] = useState(new Date().getFullYear());
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  const years = [2024, 2023, 2022, 2021, 2020];

  useEffect(() => {
    loadReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year]);

  const loadReport = async () => {
    setLoading(true);
    try {
      const response = await getAnnualReport(year);
      setReportData(response.data);
    } catch (error) {
      toast.error('خطأ في تحميل التقرير');
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = async () => {
    if (!reportData) return;
    
    setGenerating(true);
    try {
      // Create PDF - simple version for now
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Note: Arabic text in jsPDF requires special handling
      // For now, this is a simplified version
      
      let yPos = 20;
      
      // Title
      doc.setFontSize(20);
      doc.text(`EPOS Annual Report ${year}`, 105, yPos, { align: 'center' });
      
      yPos += 15;
      doc.setFontSize(14);
      doc.text(`Overall Score: ${reportData.overall_score?.toFixed(1)}%`, 105, yPos, { align: 'center' });
      
      yPos += 20;
      doc.setFontSize(12);
      
      // Add axes summary
      reportData.axes?.forEach((axisData, index) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        
        doc.setFontSize(14);
        doc.text(`Axis ${index + 1}: ${axisData.axis.name_ar}`, 20, yPos);
        yPos += 8;
        
        doc.setFontSize(10);
        doc.text(`Indicators: ${axisData.indicators?.length || 0}`, 20, yPos);
        yPos += 15;
      });

      // Save PDF
      doc.save(`EPOS-Report-${year}.pdf`);
      toast.success('تم توليد التقرير بنجاح');
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('خطأ في توليد PDF');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جارٍ تحميل التقرير...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="reports-page">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">التقارير السنوية</h1>
          <p className="text-gray-600 mt-1">عرض وتوليد التقارير</p>
        </div>
        <div className="flex items-center gap-4">
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
          <Button 
            onClick={generatePDF}
            className="bg-green-600 hover:bg-green-700"
            disabled={generating || !reportData}
            data-testid="generate-pdf-button"
          >
            {generating ? 'جارٍ التوليد...' : '📄 توليد PDF'}
          </Button>
        </div>
      </div>

      {/* Overall Summary */}
      <div className="bg-gradient-to-r from-green-500 to-blue-500 rounded-xl p-8 text-white shadow-lg">
        <div className="text-center">
          <p className="text-lg opacity-90 mb-2">الأداء الإجمالي للعام {year}</p>
          <div className="text-6xl font-bold mb-2" data-testid="report-overall-score">
            {reportData?.overall_score?.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Axes Summary */}
      <div className="grid grid-cols-1 gap-6">
        {reportData?.axes?.map((axisData, index) => (
          <div key={axisData.axis.id} className="bg-white border border-gray-200 rounded-lg p-6" data-testid={`report-axis-${index}`}>
            <h2 className="text-xl font-bold text-gray-800 mb-4">{axisData.axis.name_ar}</h2>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">عدد المؤشرات</p>
                <p className="text-2xl font-bold text-gray-800">{axisData.indicators?.length || 0}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">متوسط الإنجاز</p>
                <p className="text-2xl font-bold text-gray-800">
                  {(axisData.indicators?.reduce((sum, i) => sum + i.achievement_percent, 0) / (axisData.indicators?.length || 1))?.toFixed(1)}%
                </p>
              </div>
            </div>

            {/* Top Indicators */}
            <div>
              <h3 className="font-semibold text-gray-700 mb-3">أفضل 3 مؤشرات:</h3>
              <div className="space-y-2">
                {axisData.indicators
                  ?.sort((a, b) => b.achievement_percent - a.achievement_percent)
                  ?.slice(0, 3)
                  ?.map((indicator, idx) => (
                    <div key={indicator.indicator.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-800">{indicator.indicator.name_ar}</span>
                      <span className="text-sm font-bold text-green-600">{indicator.achievement_percent}%</span>
                    </div>
                  ))
                }
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-800 mb-2">💡 ملاحظة</h3>
        <p className="text-sm text-blue-700">
          يتضمن التقرير ملخصاً لجميع المحاور والمؤشرات للعام المختار. يمكن طباعة التقرير وتقديمه لمجلس الإدارة.
        </p>
      </div>
    </div>
  );
};

export default Reports;
