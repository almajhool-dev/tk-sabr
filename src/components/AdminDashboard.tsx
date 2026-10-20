import React from 'react';
/** Admin-only data must be verified and authorized on the backend. */
export const AdminDashboard: React.FC = () => (
  <div className="max-w-lg mx-auto my-20 p-7 rounded-2xl border border-amber-500/40 text-amber-200 bg-gray-950 text-center">
    لوحة الإدارة المالية غير مفعلة حتى ربط مصادقة إدارية موثوقة، قاعدة بيانات، وبوابة دفع رسمية.
  </div>
);
