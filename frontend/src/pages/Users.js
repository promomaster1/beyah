import React, { useState, useEffect } from 'react';
import { getUsers, createUser } from '@/api/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    role: 'data_entry'
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await getUsers();
      setUsers(response.data);
    } catch (error) {
      toast.error('خطأ في تحميل المستخدمين');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.username || !formData.password || !formData.name) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    try {
      await createUser(formData);
      toast.success('تم إضافة المستخدم بنجاح');
      setIsDialogOpen(false);
      setFormData({
        username: '',
        password: '',
        name: '',
        role: 'data_entry'
      });
      loadUsers();
    } catch (error) {
      if (error.response?.status === 400) {
        toast.error('اسم المستخدم موجود مسبقاً');
      } else {
        toast.error('خطأ في إضافة المستخدم');
      }
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'admin': return 'مدير النظام';
      case 'data_entry': return 'مدخل بيانات';
      case 'board_viewer': return 'مشاهد مجلس الإدارة';
      default: return role;
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-700';
      case 'data_entry': return 'bg-blue-100 text-blue-700';
      case 'board_viewer': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
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
    <div className="space-y-6" data-testid="users-page">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">إدارة المستخدمين</h1>
          <p className="text-gray-600 mt-1">إضافة وعرض المستخدمين</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700" data-testid="add-user-button">
              + إضافة مستخدم جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md" dir="rtl">
            <DialogHeader>
              <DialogTitle className="text-right">إضافة مستخدم جديد</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>الاسم الكامل *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="أدخل الاسم الكامل"
                  className="text-right"
                  required
                  data-testid="dialog-name-input"
                />
              </div>

              <div>
                <Label>اسم المستخدم *</Label>
                <Input
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  placeholder="أدخل اسم المستخدم"
                  className="text-right"
                  required
                  data-testid="dialog-username-input"
                />
              </div>

              <div>
                <Label>كلمة المرور *</Label>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  placeholder="أدخل كلمة المرور"
                  className="text-right"
                  required
                  data-testid="dialog-password-input"
                />
              </div>

              <div>
                <Label>الدور *</Label>
                <Select value={formData.role} onValueChange={(v) => setFormData({...formData, role: v})}>
                  <SelectTrigger data-testid="dialog-role-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">مدير النظام</SelectItem>
                    <SelectItem value="data_entry">مدخل بيانات</SelectItem>
                    <SelectItem value="board_viewer">مشاهد مجلس الإدارة</SelectItem>
                  </SelectContent>
                </Select>
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

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                الاسم
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                اسم المستخدم
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                الدور
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                تاريخ الإنشاء
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user, index) => (
              <tr key={user.id} data-testid={`user-row-${index}`}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-700 font-semibold">{user.name.charAt(0)}</span>
                    </div>
                    <div className="mr-4">
                      <div className="text-sm font-medium text-gray-900">{user.name}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{user.username}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                    {getRoleLabel(user.role)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(user.created_at).toLocaleDateString('ar-SA')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-800 mb-2">💡 ملاحظات</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• <strong>مدير النظام:</strong> صلاحيات كاملة</li>
          <li>• <strong>مدخل البيانات:</strong> يمكنه إدخال البيانات فقط</li>
          <li>• <strong>مشاهد مجلس الإدارة:</strong> يمكنه عرض التقارير فقط</li>
        </ul>
      </div>
    </div>
  );
};

export default Users;
