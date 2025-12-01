import { useState, useEffect } from 'react';
import apiFetch from '../api';
import { Users, UserCheck, UserX, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { Card } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';

export function Dashboard({ user, onNavigate, onLogout }) {
  const [stats, setStats] = useState([]);
  const [recentAttendance, setRecentAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // TODO: Replace with actual API call to backend
  // Expected endpoint: GET /api/statistics/dashboard
  // Expected response: { totalUsers, presentToday, absentToday, attendanceRate, recentRecords }
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await apiFetch('/api/statistics/dashboard');
        // adapt response to UI shape if necessary
        if (data) {
          setStats([
            { title: 'Total Users', value: String(data.totalUsers || 0), icon: Users, iconBg: 'bg-blue-500', color: 'from-blue-500 to-blue-400', trend: '' },
            { title: 'Present Today', value: String(data.presentToday || 0), icon: UserCheck, iconBg: 'bg-green-500', color: 'from-green-500 to-green-400', trend: '' },
            { title: 'Absent Today', value: String(data.absentToday || 0), icon: UserX, iconBg: 'bg-red-500', color: 'from-red-500 to-red-400', trend: '' },
            { title: 'Attendance Rate', value: `${String(data.attendanceRate || 0)}%`, icon: TrendingUp, iconBg: 'bg-indigo-500', color: 'from-indigo-500 to-indigo-400', trend: '' }
          ]);
          setRecentAttendance(data.recentRecords || []);
        }
      } catch (err) {
        setError((err && err.body && err.body.error) || 'Failed to load statistics');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const currentTime = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <Sidebar currentPage="dashboard" onNavigate={onNavigate} userRole={user.role} />
      <div className="flex-1 flex flex-col">
        <Navbar user={user} onLogout={onLogout} />
        <main className="flex-1 p-6">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="mb-6"
          >
            <h1 className="text-gray-900 mb-2">Welcome back, {user.name}!</h1>
            <p className="text-gray-600">
              Here's what's happening with your attendance system today.
            </p>
            <p className="text-gray-900 mt-2">Current Time{currentTime}</p>
          </motion.div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                >
                  <Card className="p-6 overflow-hidden relative hover:shadow-xl transition-all cursor-pointer">
                    <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${stat.color} opacity-10 rounded-full -mr-16 -mt-16`} />
                    <div className="relative">
                      <div className="flex items-center justify-between mb-4">
                        <div className={`${stat.iconBg} w-12 h-12 rounded-lg flex items-center justify-center shadow-lg`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-green-600">{stat.trend}</span>
                      </div>
                      <p className="text-gray-600 mb-1">{stat.title}</p>
                      <p className="text-gray-900">{stat.value}</p>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {/* Recent Attendance */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="p-6">
              <h2 className="text-gray-900 mb-4">Recent Attendance</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-gray-600">Name</th>
                      <th className="text-left py-3 px-4 text-gray-600">Department</th>
                      <th className="text-left py-3 px-4 text-gray-600">Time</th>
                      <th className="text-left py-3 px-4 text-gray-600">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentAttendance.map((record) => (
                      <motion.tr
                        key={record.id}
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.6 + record.id * 0.1 }}
                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                      >
                        <td className="py-3 px-4 text-gray-900">{record.name}</td>
                        <td className="py-3 px-4 text-gray-600">{record.department}</td>
                        <td className="py-3 px-4 text-gray-600">{record.time}</td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-800">
                            {record.status}
                          </span>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </motion.div>
        </main>
      </div>
    </div>
  );
}


