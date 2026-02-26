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
        scale: 3, // Increased scale for better quality
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: reportRef.current.scrollWidth,
        height: reportRef.current.scrollHeight
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Calculate dimensions to fit page width
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = pdfWidth / imgWidth;
      
      const scaledWidth = pdfWidth;
      const scaledHeight = imgHeight * ratio;

      let position = 0;
      let heightLeft = scaledHeight;

      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, scaledWidth, scaledHeight, undefined, 'FAST');
      heightLeft -= pdfHeight;

      // Add additional pages if needed
      while (heightLeft > 0) {
        position = heightLeft - scaledHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, scaledWidth, scaledHeight, undefined, 'FAST');
        heightLeft -= pdfHeight;
      }

      // Save PDF
      pdf.save(`تقرير-جمعية-البيئة-${year}.pdf`);
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
      <div ref={reportRef} className="bg-white p-12 print-container" style={{ minHeight: '1000px', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header - Always on first page */}
        <div className="text-center mb-12 pb-8 border-b-4 border-green-600 page-break-after">
          <div className="flex justify-center items-center mb-6">
            <img src="/logo.png" alt="جمعية البيئة بحائل" className="w-40 h-40" />
          </div>
          <h1 className="text-5xl font-bold text-gray-800 mb-3">جمعية البيئة بحائل</h1>
          <h2 className="text-3xl font-semibold text-green-600 mb-2">نظام تتبع مؤشرات الأداء</h2>
          <p className="text-2xl text-gray-600 font-medium">التقرير السنوي {year}</p>
        </div>

        {/* Overall Score Section - Always on second page */}
        <div className="mb-12 page-break-after">
          <h3 className="text-3xl font-bold text-gray-800 mb-6 text-center">الأداء الإجمالي</h3>
          <div className="bg-gradient-to-r from-green-500 to-blue-500 rounded-2xl p-12 text-white text-center">
            <div className="text-8xl font-bold mb-3" data-testid="report-overall-score">
              {reportData?.overall_score?.toFixed(1)}%
            </div>
            <p className="text-2xl font-medium">نسبة الإنجاز الكلية</p>
          </div>
        </div>

        {/* Axes Summary - On separate page */}
        <div className="mb-12 page-break-after">
          <h3 className="text-3xl font-bold text-gray-800 mb-6">ملخص المحاور</h3>
          <div className="grid grid-cols-1 gap-6">
            {reportData?.axes?.map((axisData, index) => {
              const avgAchievement = axisData.indicators?.length > 0
                ? (axisData.indicators.reduce((sum, i) => sum + i.achievement_percent, 0) / axisData.indicators.length)
                : 0;
              
              return (
                <div key={axisData.axis.id} className="border-2 border-gray-200 rounded-xl p-6 page-break-inside-avoid" data-testid={`report-axis-${index}`}>
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-2xl font-bold text-gray-800">{axisData.axis.name_ar}</h4>
                    <div className="text-left">
                      <div className={`text-3xl font-bold ${
                        avgAchievement >= 100 ? 'text-green-600' : 
                        avgAchievement >= 80 ? 'text-yellow-600' : 
                        'text-red-600'
                      }`}>
                        {avgAchievement.toFixed(1)}%
                      </div>
                      <div className="text-base text-gray-500">{axisData.indicators?.length || 0} مؤشر</div>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
                    <div
                      className={`h-4 rounded-full ${
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

        {/* Detailed Axes - Each axis starts on new page */}
        {reportData?.axes?.map((axisData, axisIndex) => (
          <div key={axisData.axis.id} className="mb-12 page-break-before page-break-after page-break-inside-avoid">
            <div className="bg-gray-100 p-6 rounded-xl mb-6">
              <h3 className="text-2xl font-bold text-gray-800">
                المحور {axisIndex + 1}: {axisData.axis.name_ar}
              </h3>
            </div>

            {/* Performance Indicators */}
            <div className="mb-6 page-break-inside-avoid">
              <h4 className="text-xl font-semibold text-blue-700 mb-4 border-b-2 border-blue-200 pb-3">
                📊 مؤشرات الأداء
              </h4>
              <div className="space-y-3">
                {axisData.indicators
                  ?.filter(i => i.indicator.type === 'performance')
                  ?.map((item, idx) => (
                    <div key={item.indicator.id} className="flex justify-between items-center p-4 bg-blue-50 rounded-lg border border-blue-100 page-break-inside-avoid">
                      <div className="flex-1">
                        <p className="text-base font-medium text-gray-800 mb-1">{item.indicator.name_ar}</p>
                        <p className="text-sm text-gray-600">
                          الهدف: {item.target_value} {item.indicator.unit} | الفعلي: {item.total_actual} {item.indicator.unit}
                        </p>
                      </div>
                      <div className={`text-2xl font-bold ${
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
            <div className="mb-6 page-break-inside-avoid">
              <h4 className="text-xl font-semibold text-purple-700 mb-4 border-b-2 border-purple-200 pb-3">
                🎯 مؤشرات النتائج
              </h4>
              <div className="space-y-3">
                {axisData.indicators
                  ?.filter(i => i.indicator.type === 'outcome')
                  ?.map((item, idx) => (
                    <div key={item.indicator.id} className="flex justify-between items-center p-4 bg-purple-50 rounded-lg border border-purple-100 page-break-inside-avoid">
                      <div className="flex-1">
                        <p className="text-base font-medium text-gray-800 mb-1">{item.indicator.name_ar}</p>
                        <p className="text-sm text-gray-600">
                          الهدف: {item.target_value} {item.indicator.unit} | الفعلي: {item.total_actual} {item.indicator.unit}
                        </p>
                      </div>
                      <div className={`text-2xl font-bold ${
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
