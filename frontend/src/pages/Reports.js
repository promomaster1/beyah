import React, { useState, useEffect, useRef } from 'react';
import { getAnnualReport } from '@/api/api';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const Reports = () => {
  const [year, setYear] = useState(new Date().getFullYear());
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const reportRef = useRef(null);

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
    if (!reportData || !reportRef.current) return;
    
    setGenerating(true);
    try {
      toast.info('جارٍ إنشاء التقرير...');
      
      // Capture the report content as image using html2canvas
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 0;

      // Check if content needs multiple pages
      const pageHeight = imgHeight * ratio;
      let heightLeft = pageHeight;
      let position = 0;

      // Add first page
      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      heightLeft -= pdfHeight;

      // Add additional pages if needed
      while (heightLeft > 0) {
        position = heightLeft - pageHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', imgX, position, imgWidth * ratio, imgHeight * ratio);
        heightLeft -= pdfHeight;
      }

      // Save PDF
      pdf.save(`تقرير-EPOS-${year}.pdf`);
      toast.success('تم توليد التقرير بنجاح! 📄');
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('خطأ في توليد التقرير');
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
      {/* Header */}
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
            {generating ? 'جارٍ التوليد...' : '📄 تحميل PDF'}
          </Button>
        </div>
      </div>

      {/* Report Content - This will be captured for PDF */}
      <div ref={reportRef} className="bg-white p-8" style={{ minHeight: '1000px' }}>
        {/* Header */}
        <div className="text-center mb-8 pb-6 border-b-2 border-green-600">
          <div className="flex justify-center items-center mb-4">
            <div className="p-3 bg-green-100 rounded-full">
              <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">نظام EPOS</h1>
          <h2 className="text-2xl font-semibold text-green-600 mb-1">جمعية البيئة بحائل</h2>
          <p className="text-xl text-gray-600">التقرير السنوي {year}</p>
          <p className="text-sm text-gray-500 mt-2">تاريخ الإصدار: {new Date().toLocaleDateString('ar-SA')}</p>
        </div>

        {/* Overall Score Section */}
        <div className="mb-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-4 text-center">الأداء الإجمالي</h3>
          <div className="bg-gradient-to-r from-green-500 to-blue-500 rounded-xl p-8 text-white text-center">
            <div className="text-7xl font-bold mb-2" data-testid="report-overall-score">
              {reportData?.overall_score?.toFixed(1)}%
            </div>
            <p className="text-xl">نسبة الإنجاز الكلية</p>
          </div>
        </div>

        {/* Axes Summary */}
        <div className="mb-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-4">ملخص المحاور</h3>
          <div className="grid grid-cols-1 gap-4">
            {reportData?.axes?.map((axisData, index) => {
              const avgAchievement = axisData.indicators?.length > 0
                ? (axisData.indicators.reduce((sum, i) => sum + i.achievement_percent, 0) / axisData.indicators.length)
                : 0;
              
              return (
                <div key={axisData.axis.id} className="border-2 border-gray-200 rounded-lg p-4" data-testid={`report-axis-${index}`}>
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-lg font-bold text-gray-800">{axisData.axis.name_ar}</h4>
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${
                        avgAchievement >= 100 ? 'text-green-600' : 
                        avgAchievement >= 80 ? 'text-yellow-600' : 
                        'text-red-600'
                      }`}>
                        {avgAchievement.toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-500">{axisData.indicators?.length || 0} مؤشر</div>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
                    <div
                      className={`h-3 rounded-full ${
                        avgAchievement >= 100 ? 'bg-green-600' : 
                        avgAchievement >= 80 ? 'bg-yellow-500' : 
                        'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(avgAchievement, 100)}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detailed Axes */}
        {reportData?.axes?.map((axisData, axisIndex) => (
          <div key={axisData.axis.id} className="mb-8 break-inside-avoid">
            <div className="bg-gray-100 p-4 rounded-lg mb-4">
              <h3 className="text-xl font-bold text-gray-800">
                المحور {axisIndex + 1}: {axisData.axis.name_ar}
              </h3>
            </div>

            {/* Performance Indicators */}
            <div className="mb-4">
              <h4 className="text-lg font-semibold text-blue-700 mb-3 border-b border-blue-200 pb-2">
                📊 مؤشرات الأداء
              </h4>
              <div className="space-y-2">
                {axisData.indicators
                  ?.filter(i => i.indicator.type === 'performance')
                  ?.map((item, idx) => (
                    <div key={item.indicator.id} className="flex justify-between items-center p-3 bg-blue-50 rounded border border-blue-100">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">{item.indicator.name_ar}</p>
                        <p className="text-xs text-gray-600">
                          الهدف: {item.target_value} {item.indicator.unit} | الفعلي: {item.total_actual} {item.indicator.unit}
                        </p>
                      </div>
                      <div className={`text-lg font-bold ${
                        item.achievement_percent >= 100 ? 'text-green-600' : 
                        item.achievement_percent >= 80 ? 'text-yellow-600' : 
                        'text-red-600'
                      }`}>
                        {item.achievement_percent.toFixed(1)}%
                      </div>
                    </div>
                  ))
                }
              </div>
            </div>

            {/* Outcome Indicators */}
            <div className="mb-4">
              <h4 className="text-lg font-semibold text-purple-700 mb-3 border-b border-purple-200 pb-2">
                🎯 مؤشرات النتائج
              </h4>
              <div className="space-y-2">
                {axisData.indicators
                  ?.filter(i => i.indicator.type === 'outcome')
                  ?.map((item, idx) => (
                    <div key={item.indicator.id} className="flex justify-between items-center p-3 bg-purple-50 rounded border border-purple-100">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">{item.indicator.name_ar}</p>
                        <p className="text-xs text-gray-600">
                          الهدف: {item.target_value} {item.indicator.unit} | الفعلي: {item.total_actual} {item.indicator.unit}
                        </p>
                      </div>
                      <div className={`text-lg font-bold ${
                        item.achievement_percent >= 100 ? 'text-green-600' : 
                        item.achievement_percent >= 80 ? 'text-yellow-600' : 
                        'text-red-600'
                      }`}>
                        {item.achievement_percent.toFixed(1)}%
                      </div>
                    </div>
                  ))
                }
              </div>
            </div>
          </div>
        ))}

        {/* Footer */}
        <div className="mt-12 pt-6 border-t-2 border-gray-300 text-center text-sm text-gray-600">
          <p className="mb-2">هذا التقرير تم إنشاؤه تلقائياً بواسطة نظام EPOS</p>
          <p>جمعية البيئة بحائل - {year}</p>
          <div className="mt-4 flex justify-center items-center space-x-reverse space-x-4">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded ml-2"></div>
              <span className="text-xs">ممتاز ≥100%</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-yellow-500 rounded ml-2"></div>
              <span className="text-xs">جيد 80-99%</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-500 rounded ml-2"></div>
              <span className="text-xs">يحتاج تحسين &lt;80%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-800 mb-2">💡 ملاحظة</h3>
        <p className="text-sm text-blue-700">
          يتضمن التقرير ملخصاً لجميع المحاور والمؤشرات للعام المختار. اضغط على زر "تحميل PDF" لتحميل التقرير بصيغة PDF مع دعم كامل للنصوص العربية.
        </p>
      </div>
    </div>
  );
};

export default Reports;
