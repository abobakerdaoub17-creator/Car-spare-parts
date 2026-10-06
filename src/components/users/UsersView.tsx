import React, { useState, useEffect } from 'react';
import { db } from '../../services/db';
import { AppUser, AuditLog, UserRole } from '../../types';
import { DEMO_USERS, useAuth } from '../../context/AuthContext';
import {
  ShieldCheck,
  Users,
  History,
  Lock,
  KeyRound,
  CheckCircle2,
  XCircle,
  X,
} from 'lucide-react';

export const UsersView: React.FC = () => {
  const { user, switchDemoRole } = useAuth();
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [activeTab, setActiveTab] = useState<'roles' | 'audit'>('roles');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  useEffect(() => {
    setAuditLogs(db.getAuditLogs());
  }, []);

  const roleDefinitions: Array<{
    role: UserRole;
    title: string;
    description: string;
    permissions: string[];
    user: AppUser;
  }> = [
    {
      role: 'admin',
      title: 'مدير النظام (Admin)',
      description: 'كامل الصلاحيات والإشراف المالي، إعدادات المتجر، والتدقيق والرقابة.',
      permissions: ['جميع الصلاحيات بلا قيود', 'اعتماد جلسات الجرد', 'إلغاء الفواتير Void', 'عرض التقارير المالية والأرباح', 'إدارة المستخدمين وقاعدة البيانات'],
      user: DEMO_USERS.admin,
    },
    {
      role: 'sales',
      title: 'مسؤول المبيعات (Sales)',
      description: 'إصدار الفواتير بنقطة البيع POS، إدارة بيانات العملاء، والتحصيل النقدي.',
      permissions: ['نقطة البيع POS وطباعة الإيصالات', 'البحث السريع عن القطع والسيارات', 'إضافة وتعديل بيانات العملاء', 'تسجيل دفعات العملاء ومرتجعات البيع'],
      user: DEMO_USERS.sales,
    },
    {
      role: 'warehouse',
      title: 'أمين المستودع (Warehouse)',
      description: 'إدارة كتالوج قطع الغيار، الأرقام البديلة، استلام المشتريات، والجرد الفعلي.',
      permissions: ['إضافة وتعديل قطع الغيار والأرقام البديلة', 'توافق السيارات والموديلات', 'تسجيل فواتير الشراء وتوريد المخزون', 'إثبات التالف وإجراء حصر الجرد الدوري'],
      user: DEMO_USERS.warehouse,
    },
    {
      role: 'accountant',
      title: 'المحاسب المالي (Accountant)',
      description: 'متابعة الديون، قيود الخزينة والصندوق، المصروفات التشغيلية والتقارير المالية.',
      permissions: ['كشوف حسابات العملاء وسداد ديون الموردين', 'إدارة الخزينة والصندوق والعهد النقدية', 'تسجيل المصروفات التشغيلية', 'استخراج تقارير الأرباح والمبيعات'],
      user: DEMO_USERS.accountant,
    },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
        <div>
          <h1 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-blue-600" />
            المستخدمون والصلاحيات وسجل التدقيق (Audit Logs)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            مصفوفة الصلاحيات (RBAC) وسجل العمليات الحساسة لمتابعة الأنشطة والتغييرات
          </p>
        </div>

        <div className="flex rounded-lg bg-slate-100 p-1 border border-slate-200 text-xs">
          <button
            onClick={() => setActiveTab('roles')}
            className={`rounded-md px-3 py-1 font-semibold transition ${
              activeTab === 'roles' ? 'bg-white text-slate-900 font-bold shadow-2xs' : 'text-slate-600'
            }`}
          >
            المستخدمون والأدوار
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`rounded-md px-3 py-1 font-semibold transition ${
              activeTab === 'audit' ? 'bg-white text-slate-900 font-bold shadow-2xs' : 'text-slate-600'
            }`}
          >
            سجل التدقيق والمراقبة ({auditLogs.length})
          </button>
        </div>
      </div>

      {/* ROLES TAB */}
      {activeTab === 'roles' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {roleDefinitions.map((item) => {
            const isCurrent = user?.role === item.role;

            return (
              <div
                key={item.role}
                className={`bg-white rounded-xl border p-5 shadow-xs transition space-y-4 flex flex-col justify-between ${
                  isCurrent
                    ? 'border-blue-500 ring-1 ring-blue-500/20'
                    : 'border-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        <h3 className="font-bold text-sm text-slate-900">{item.title}</h3>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{item.description}</p>
                    </div>

                    {isCurrent && (
                      <span className="rounded bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-200">
                        الدور النشط حالياً
                      </span>
                    )}
                  </div>

                  {/* Account Details */}
                  <div className="mt-3 rounded-lg bg-slate-50 p-3 border border-slate-200 text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">اسم المستخدم:</span>
                      <strong className="text-slate-900">{item.user.name}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">البريد الإلكتروني:</span>
                      <span className="font-mono text-slate-700">{item.user.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">الصلاحية البرمجية:</span>
                      <span className="font-mono font-bold text-blue-600 uppercase">{item.role}</span>
                    </div>
                  </div>

                  {/* Permissions Checklist */}
                  <div className="mt-3">
                    <span className="text-[11px] font-bold text-slate-700 block mb-1.5">
                      الصلاحيات الممنوحة:
                    </span>
                    <ul className="space-y-1 text-xs text-slate-600">
                      {item.permissions.map((p, idx) => (
                        <li key={idx} className="flex items-center gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    {isCurrent ? 'الحساب مسجل الدخول به الآن' : 'تبديل فوري لتجربة الصلاحيات'}
                  </span>
                  {!isCurrent && (
                    <button
                      onClick={() => switchDemoRole(item.role)}
                      className="rounded-lg bg-slate-100 hover:bg-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-800 transition"
                    >
                      تجربة تسجيل الدخول
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* AUDIT LOG TAB */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-900">سجل النشاط والعمليات الحساسة</h2>
            <span className="text-xs text-slate-500 font-mono">{auditLogs.length} سجلات محفوظة</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-700 font-bold">
                <tr>
                  <th className="p-3">التاريخ والوقت</th>
                  <th className="p-3">الموظف / المستخدم</th>
                  <th className="p-3">نوع الحركة</th>
                  <th className="p-3">الكيان / الجدول</th>
                  <th className="p-3">رقم المرجع / المعرف</th>
                  <th className="p-3">تفاصيل الحركة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      لا توجد عمليات تدقيق مسجلة حتى الآن
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/70 transition">
                      <td className="p-3 text-slate-600 font-mono">
                        {new Date(log.timestamp).toLocaleString('ar-LY')}
                      </td>
                      <td className="p-3 font-semibold text-slate-900">{log.userName}</td>
                      <td className="p-3">
                        <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-700 font-mono border border-slate-200 uppercase">
                          {log.action}
                        </span>
                      </td>
                      <td className="p-3 text-slate-700">{log.entity}</td>
                      <td className="p-3 font-mono text-slate-500">{log.entityId}</td>
                      <td className="p-3">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="rounded bg-slate-100 hover:bg-slate-200 px-2.5 py-1 text-[11px] font-medium text-slate-700 transition"
                        >
                          عرض تفاصيل التغيير
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Details modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <History className="h-5 w-5 text-blue-600" />
                تفاصيل حركة التدقيق: {selectedLog.action} ({selectedLog.entity})
              </h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[11px]">المستخدم:</span>
                  <strong className="text-slate-800">{selectedLog.userName}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">التاريخ والوقت:</span>
                  <span className="text-slate-700 font-mono">{new Date(selectedLog.timestamp).toLocaleString('ar-LY')}</span>
                </div>
              </div>

              <div>
                <span className="font-bold text-slate-700 block mb-1">البيانات المسجلة (JSON):</span>
                <pre className="p-3 rounded-lg bg-slate-900 text-slate-100 text-[11px] font-mono overflow-x-auto max-h-60" dir="ltr">
                  {JSON.stringify(selectedLog.details, null, 2)}
                </pre>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedLog(null)}
                className="rounded-lg bg-slate-800 hover:bg-slate-900 px-4 py-1.5 text-xs font-bold text-white transition"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
