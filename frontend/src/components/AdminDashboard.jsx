import { useState, useEffect } from 'react';
import { Users, UserCheck, UserX, TrendingUp, Calendar, Clock, Award, MapPin } from 'lucide-react';
import { motion } from 'motion/react';
import apiFetch, { getApiBase } from '../api';
import { AdminSidebar } from './AdminSidebar';
import { Navbar } from './Navbar';
import { Card } from './ui/card';
import { Progress } from './ui/progress';




export function AdminDashboard({ user, onNavigate, onLogout }) {
  const [stats, setStats] = useState([]);
  const [weeklyData, setWeeklyData] = useState([]);
  const [topDepartments, setTopDepartments] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [debugFaces, setDebugFaces] = useState(null);
  const [loadingDebug, setLoadingDebug] = useState(true);
  const [filterText, setFilterText] = useState('');
  const [sortField, setSortField] = useState('faces');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedUserFaces, setSelectedUserFaces] = useState(null);
  const [showFacesModal, setShowFacesModal] = useState(false);

  // TODO: Replace with actual API calls to backend
  // Endpoints:
  // GET /api/statistics/dashboard
  // GET /api/statistics/weekly
  // GET /api/statistics/departments
  // GET /api/activity/recent
  useEffect(() => {
    const fetchData = async () => {
      try {
        // const [statsRes, weeklyRes, deptsRes, activityRes] = await Promise.all([
        //   fetch('/api/statistics/dashboard').then(r => r.json()),
        //   fetch('/api/statistics/weekly').then(r => r.json()),
        //   fetch('/api/statistics/departments').then(r => r.json()),
        //   fetch('/api/activity/recent').then(r => r.json()),
        // ]);
        // setStats(...); setWeeklyData(...); etc.
        setLoading(false);
      } catch (err) {
        setError('Failed to load dashboard data');
        setLoading(false);
      }
    };
    fetchData();
    // load admin debug faces data
    (async () => {
      try {
        const d = await apiFetch('/api/statistics/debug-faces');
        setDebugFaces(d);
      } catch (e) {
        // ignore — non-admins will get a 403
        setDebugFaces(null);
      } finally {
        setLoadingDebug(false);
      }
    })();
  }, []);

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <AdminSidebar currentPage="dashboard" onNavigate={onNavigate} />
      <div className="flex-1 flex flex-col">
        <Navbar user={user} onLogout={onLogout} />
        <main className="flex-1 p-6">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="mb-6"
          >
            <h1 className="text-gray-900 mb-2">Dashboard Overview</h1>
            <p className="text-gray-600">
              Monitor your attendance system performance and analytics
            </p>
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
                >
                  <Card className="p-6 overflow-hidden relative hover:shadow-xl transition-shadow">
                    <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${stat.color} opacity-10 rounded-full -mr-16 -mt-16`} />
                    <div className="relative">
                      <div className="flex items-center justify-between mb-4">
                        <div className={`${stat.iconBg} w-12 h-12 rounded-lg flex items-center justify-center shadow-lg`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-green-600">{stat.change}</span>
                      </div>
                      <p className="text-gray-600 mb-1">{stat.title}</p>
                      <p className="text-gray-900">{stat.value}</p>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Weekly Attendance Chart */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="lg:col-span-2"
            >
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-gray-900">Weekly Attendance Trend</h2>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>Last 7 Days</span>
                  </div>
                </div>
                <div className="space-y-4">
                  {weeklyData.map((data, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <span className="w-12 text-gray-600">{data.day}</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-8 relative overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(data.attendance / maxAttendance) * 100}%` }}
                          transition={{ delay: 0.5 + index * 0.1, duration: 0.5 }}
                          className="bg-gradient-to-r from-blue-500 to-purple-600 h-full rounded-full flex items-center justify-end pr-3"
                        >
                          <span className="text-white">{data.attendance}%</span>
                        </motion.div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>

            {/* Top Departments */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-6">
                  <Award className="w-5 h-5 text-yellow-500" />
                  <h2 className="text-gray-900">Top Departments</h2>
                </div>
                <div className="space-y-4">
                  {topDepartments.map((dept, index) => {
                    const percentage = Math.round((dept.attendance / dept.total) * 100);
                    return (
                      <div key={index}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-gray-900">{dept.name}</span>
                          <span className="text-gray-600">{dept.attendance}/{dept.total}</span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              </Card>
            </motion.div>
          </div>

          {/* Admin Debug Faces Panel */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-gray-900">Face Recognition Debug (Admin)</h2>
              </div>
              {loadingDebug ? (
                <p className="text-gray-600">Loading debug data...</p>
              ) : debugFaces ? (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-gray-700">Attendance records accepted without face: <strong>{debugFaces.fallback_no_face_count}</strong></p>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Filter by name or ID"
                        value={filterText}
                        onChange={(e) => setFilterText(e.target.value)}
                        className="border px-2 py-1 rounded"
                      />
                      <select value={sortField} onChange={(e) => setSortField(e.target.value)} className="border px-2 py-1 rounded">
                        <option value="faces">Faces</option>
                        <option value="encoding_len">Encoding Len</option>
                        <option value="name">Name</option>
                      </select>
                      <button onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')} className="border px-2 py-1 rounded">
                        {sortOrder === 'asc' ? 'Asc' : 'Desc'}
                      </button>
                    </div>
                  </div>
                  <div className="overflow-x-auto max-h-72">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-gray-600 border-b">
                          <th className="py-2 px-2">User ID</th>
                          <th className="py-2 px-2">Name</th>
                          <th className="py-2 px-2">Faces</th>
                          <th className="py-2 px-2">Encoding</th>
                          <th className="py-2 px-2">Encoding Len</th>
                          <th className="py-2 px-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {debugFaces.per_user
                          .filter((u) => {
                            if (!filterText) return true;
                            const q = filterText.toLowerCase();
                            return (u.name || '').toLowerCase().includes(q) || (u.user_id || '').toLowerCase().includes(q);
                          })
                          .sort((a, b) => {
                            const dir = sortOrder === 'asc' ? 1 : -1;
                            if (sortField === 'faces') return (a.faces - b.faces) * dir;
                            if (sortField === 'encoding_len') return (a.encoding_len - b.encoding_len) * dir;
                            if (sortField === 'name') return ((a.name || '').localeCompare(b.name || '')) * dir;
                            return 0;
                          })
                          .map((u) => (
                            <tr key={u.id} className="border-b">
                              <td className="py-2 px-2 text-gray-900">{u.user_id}</td>
                              <td className="py-2 px-2">{u.name}</td>
                              <td className="py-2 px-2">{u.faces}</td>
                              <td className="py-2 px-2">{u.encoding_present ? 'Yes' : 'No'}</td>
                              <td className="py-2 px-2">{u.encoding_len}</td>
                              <td className="py-2 px-2">
                                <button
                                  onClick={async () => {
                                    try {
                                      const res = await apiFetch(`/api/face?user_id=${u.id}`);
                                      const base = getApiBase();
                                      const imgs = (res.faces || []).map(f => ({ face_id: f.face_id, src: `${base}${f.image_path}` }));
                                      setSelectedUserFaces({ user: u, faces: imgs });
                                      setShowFacesModal(true);
                                    } catch (e) {
                                      setSelectedUserFaces({ user: u, faces: [] });
                                      setShowFacesModal(true);
                                    }
                                  }}
                                  className="px-3 py-1 bg-blue-600 text-white rounded"
                                >
                                  View Faces
                                </button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <p className="text-gray-600">Debug data not available (admin only).</p>
              )}
            </Card>
          </motion.div>

          {/* Faces Modal */}
          {showFacesModal && selectedUserFaces && (
            <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
              <div className="bg-white w-11/12 md:w-3/4 lg:w-1/2 p-6 rounded shadow-lg max-h-[80vh] overflow-auto">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium">Faces for {selectedUserFaces.user.name} ({selectedUserFaces.user.user_id})</h3>
                  <button onClick={() => setShowFacesModal(false)} className="text-gray-600">Close</button>
                </div>
                {selectedUserFaces.faces.length === 0 ? (
                  <p className="text-gray-600">No faces enrolled for this user.</p>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {selectedUserFaces.faces.map((f) => (
                      <div key={f.face_id} className="border rounded overflow-hidden">
                        <img src={f.src} alt={f.face_id} className="w-full h-40 object-cover" />
                        <div className="p-2 text-xs text-gray-600 flex items-center justify-between">
                          <span className="truncate">{f.face_id}</span>
                          <div className="flex gap-2">
                            <button
                              onClick={async () => {
                                if (!confirm('Delete this face? This cannot be undone.')) return;
                                try {
                                  await apiFetch(`/api/face/${f.face_id}`, { method: 'DELETE' });
                                  // remove from UI
                                  setSelectedUserFaces((prev) => ({ ...prev, faces: prev.faces.filter(x => x.face_id !== f.face_id) }));
                                  // refresh debug panel counts
                                  try {
                                    const d = await apiFetch('/api/statistics/debug-faces');
                                    setDebugFaces(d);
                                  } catch (e) { }
                                } catch (e) {
                                  alert('Failed to delete face');
                                }
                              }}
                              className="text-red-600 text-xs"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Recent Activity */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <Clock className="w-5 h-5 text-blue-500" />
                <h2 className="text-gray-900">Recent Activity</h2>
              </div>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <motion.div
                    key={index}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.7 + index * 0.1 }}
                    className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                      <UserCheck className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-900">{activity.user}</p>
                      <p className="text-gray-600">{activity.action}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-600">{activity.time}</p>
                      <div className="flex items-center gap-1 text-gray-500 justify-end">
                        <MapPin className="w-3 h-3" />
                        <p className="text-xs">{activity.location}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </Card>
          </motion.div>
        </main>
      </div>
    </div>
  );
}


