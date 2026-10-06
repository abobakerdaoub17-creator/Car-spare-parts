import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { useNotifications } from '../../context/NotificationContext';
import { Lock, Mail, Wrench, Shield, ArrowLeft } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, switchDemoRole } = useAuth();
  const { showToast } = useNotifications();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      showToast('يرجى إدخال البريد الإلكتروني', 'warning');
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      showToast('تم تسجيل الدخول بنجاح!', 'success');
    } catch (err: any) {
      showToast('فشل تسجيل الدخول: يرجى التحقق من البيانات', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = (role: UserRole) => {
    switchDemoRole(role);
    const roleName =
      role === 'admin'
        ? 'المدير العام'
        : role === 'sales'
        ? 'مسؤول المبيعات'
        : role === 'warehouse'
        ? 'أمين المستودع'
        : 'المحاسب المالي';
    showToast(`تم الدخول بصلاحية: ${roleName}`, 'success');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-100 text-slate-900 font-sans">
      <div className="w-full max-w-md bg-white rounded-xl border border-slate-200 p-8 shadow-sm space-y-6">
        {/* Brand Logo & Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
            <Wrench className="h-7 w-7" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 mt-3">
            منظومة إدارة قطع غيار السيارات
          </h1>
          <p className="text-xs text-slate-500">
            السوق الليبي • تسجيل الدخول للمستخدمين والموظفين
          </p>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 mb-1.5 font-semibold">البريد الإلكتروني:</label>
            <div className="relative">
              <Mail className="absolute right-3.5 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@almadar.ly"
                className="w-full rounded-lg border border-slate-300 bg-white pr-10 pl-3 py-2 text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 mb-1.5 font-semibold">كلمة المرور:</label>
            <div className="relative">
              <Lock className="absolute right-3.5 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-slate-300 bg-white pr-10 pl-3 py-2 text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 hover:bg-blue-700 py-2.5 font-bold text-white transition shadow-sm active:scale-98 disabled:opacity-50 text-xs"
          >
            {loading ? 'جاري التحقق...' : 'تسجيل الدخول'}
          </button>
        </form>

        {/* Quick 1-Click Role Switcher for Instant Testing */}
        <div className="border-t border-slate-100 pt-4 space-y-2">
          <div className="text-[11px] text-slate-500 font-semibold text-center mb-2">
            تجربة فورية للصلاحيات (بدون كتابة كلمة مرور):
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleQuickDemoLogin('admin')}
              className="flex items-center justify-between p-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition"
            >
              <span className="font-semibold">المدير العام</span>
              <span className="text-[10px] text-slate-400 font-mono">Admin</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemoLogin('sales')}
              className="flex items-center justify-between p-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700 transition"
            >
              <span className="font-semibold">مسؤول مبيعات</span>
              <span className="text-[10px] text-slate-400 font-mono">Sales</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemoLogin('warehouse')}
              className="flex items-center justify-between p-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-amber-50 hover:border-amber-200 hover:text-amber-700 transition"
            >
              <span className="font-semibold">أمين مستودع</span>
              <span className="text-[10px] text-slate-400 font-mono">Store</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemoLogin('accountant')}
              className="flex items-center justify-between p-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-purple-50 hover:border-purple-200 hover:text-purple-700 transition"
            >
              <span className="font-semibold">محاسب مالي</span>
              <span className="text-[10px] text-slate-400 font-mono">Finance</span>
            </button>
          </div>
        </div>

        {/* Quiet footer */}
        <div className="text-center text-[11px] text-slate-400 border-t border-slate-100 pt-3">
          دينار ليبي (د.ل) • متوافق مع كافة الأجهزة والمتصفحات
        </div>
      </div>
    </div>
  );
};
