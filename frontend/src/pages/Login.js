import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(username, password);
      toast.success('تم تسجيل الدخول بنجاح!');
      navigate('/dashboard');
    } catch (error) {
      toast.error('خطأ في اسم المستخدم أو كلمة المرور');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 relative overflow-hidden" dir="rtl">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-teal-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      <div className="max-w-md w-full mx-4 relative z-10">
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20 animate-fade-in">
          {/* Logo & Title */}
          <div className="text-center mb-8">
            <div className="inline-block mb-4 animate-float">
              <img src="/logo.png" alt="جمعية البيئة بحائل" className="w-32 h-32 mx-auto" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2 animate-slide-down">جمعية البيئة بحائل</h1>
            <p className="text-gray-600 animate-slide-down animation-delay-100">نظام تتبع مؤشرات الأداء</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="username" className="text-right block mb-2">اسم المستخدم</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="أدخل اسم المستخدم"
                className="text-right"
                required
                data-testid="login-username-input"
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-right block mb-2">كلمة المرور</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="أدخل كلمة المرور"
                className="text-right"
                required
                data-testid="login-password-input"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full bg-green-600 hover:bg-green-700"
              disabled={loading}
              data-testid="login-submit-button"
            >
              {loading ? 'جارٍ تسجيل الدخول...' : 'تسجيل الدخول'}
            </Button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 text-center mb-2 font-semibold">بيانات تجريبية:</p>
            <div className="text-xs text-gray-600 space-y-1">
              <p>• <strong>مدير:</strong> admin / admin123</p>
              <p>• <strong>مدخل بيانات:</strong> data_entry / data123</p>
              <p>• <strong>مشاهد:</strong> viewer / viewer123</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;