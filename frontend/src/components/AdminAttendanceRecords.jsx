import { useState } from 'react';
import { Users, UserCheck, UserX, MapPin, Calendar, Clock, Download } from 'lucide-react';
import { motion } from 'motion/react';
import { AdminSidebar } from './AdminSidebar';
import { Navbar } from './Navbar';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';






export function AdminAttendanceRecords({ user, onNavigate, onLogout }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState('2024');
  const [selectedMonth, setSelectedMonth] = useState('11');
  const [selectedDay, setSelectedDay] = useState('14');

  // Generate years (current year and previous 5 years)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 6 }, (_, i) => (currentYear - i).toString());

  const months = [
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
  ];

  // Generate days based on selected month
  const getDaysInMonth = () => {
    const daysInMonth = new Date(parseInt(selectedYear), parseInt(selectedMonth), 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => (i + 1).toString());
  };

  // Mock data for 50 users (roles: 'admin' or 'employee')
  const allUsers = Array.from({ length: 50 }, (_, i) => {
    const isPresent = Math.random() > 0.3;
    const role = i % 10 === 0 ? 'admin' : 'employee';
    const departments = role === 'employee'
      ? ['Engineering', 'Marketing', 'Sales', 'HR', 'Finance', 'Operations']
      : ['Administration', 'Operations'];

    return {
      id: `${role === 'employee' ? 'EMP' : 'ADM'}${String(i + 1).padStart(3, '0')}`,
      name: `User ${i + 1}`,
      role,
      department: departments[i % departments.length],
      status: isPresent ? 'Present' : 'Absent',
      loginTime: isPresent ? `0${Math.floor(Math.random() * 3) + 8}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')} AM` : null,
      location: isPresent ? ['New York, USA', 'London, UK', 'Mumbai, India', 'Tokyo, Japan', 'Sydney, Australia'][Math.floor(Math.random() * 5)] : null,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`,
    };
  });

  const filteredUsers = allUsers.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const presentCount = allUsers.filter((u) => u.status === 'Present').length;
  const absentCount = allUsers.filter((u) => u.status === 'Absent').length;
  const attendanceRate = Math.round((presentCount / allUsers.length) * 100);

  const stats = [
    {
      title: 'Total Users',
      value: allUsers.length.toString(),
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      iconBg: 'bg-blue-500',
    },
    {
      title: 'Present',
      value: presentCount.toString(),
      icon: UserCheck,
      color: 'from-green-500 to-green-600',
      iconBg: 'bg-green-500',
    },
    {
      title: 'Absent',
      value: absentCount.toString(),
      icon: UserX,
      color: 'from-red-500 to-red-600',
      iconBg: 'bg-red-500',
    },
    {
      title: 'Rate',
      value: `${attendanceRate}%`,
      icon: Calendar,
      color: 'from-purple-500 to-purple-600',
      iconBg: 'bg-purple-500',
    },
  ];

  const handleExport = (format) => {
    console.log(`Exporting as ${format.toUpperCase()}...`);
  };

  const selectedDate = `${months.find(m => m.value === selectedMonth)?.label} ${selectedDay}, ${selectedYear}`;

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <AdminSidebar currentPage="attendance-records" onNavigate={onNavigate} />
      <div className="flex-1 flex flex-col">
        <Navbar user={user} onLogout={onLogout} />
        <main className="flex-1 p-6">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="mb-6"
          >
            <h1 className="text-gray-900 mb-2">Attendance Records</h1>
            <p className="text-gray-600">
              View and verify all user attendance records with advanced filtering
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
                      <div className={`${stat.iconBg} w-12 h-12 rounded-lg flex items-center justify-center mb-4 shadow-lg`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <p className="text-gray-600 mb-1">{stat.title}</p>
                      <p className="text-gray-900">{stat.value}</p>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {/* Filter Section */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="p-6 mb-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    type="text"
                    placeholder="Search by name, ID, or department..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full"
                  />
                </div>

                <div className="flex gap-2 flex-wrap">
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((year) => (
                        <SelectItem key={year} value={year}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Month" />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map((month) => (
                        <SelectItem key={month.value} value={month.value}>
                          {month.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={selectedDay} onValueChange={setSelectedDay}>
                    <SelectTrigger className="w-24">
                      <SelectValue placeholder="Day" />
                    </SelectTrigger>
                    <SelectContent>
                      {getDaysInMonth().map((day) => (
                        <SelectItem key={day} value={day}>
                          {day}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button onClick={() => handleExport('csv')} variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    CSV
                  </Button>

                  <Button onClick={() => handleExport('pdf')} variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    PDF
                  </Button>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2 text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>Showing records for {selectedDate}</span>
              </div>
            </Card>
          </motion.div>

          {/* User Attendance Grid */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="p-6">
              <h2 className="text-gray-900 mb-4">
                All Users - {selectedDate}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-h-[600px] overflow-y-auto">
                {filteredUsers.map((userData, index) => (
                  <motion.div
                    key={userData.id}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: index * 0.02 }}
                    whileHover={{ scale: 1.02 }}
                    className="cursor-pointer"
                  >
                    <Card className={`p-4 hover:shadow-lg transition-all ${userData.status === 'Present' ? 'border-l-4 border-green-500' : 'border-l-4 border-red-500'
                      }`}>
                      <div className="flex items-start gap-3">
                        <img
                          src={userData.avatar}
                          alt={userData.name}
                          className="w-12 h-12 rounded-full"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="text-gray-900 truncate">{userData.name}</h3>
                          <p className="text-gray-500">{userData.id}</p>
                          <p className="text-gray-600">{userData.department}</p>
                          <Badge
                            variant={userData.status === 'Present' ? 'default' : 'secondary'}
                            className={userData.status === 'Present' ? 'bg-green-500' : 'bg-red-500'}
                          >
                            {userData.status}
                          </Badge>
                          {userData.status === 'Present' && (
                            <div className="mt-2 space-y-1">
                              <div className="flex items-center gap-1 text-gray-600">
                                <Clock className="w-3 h-3" />
                                <span className="text-xs">{userData.loginTime}</span>
                              </div>
                              <div className="flex items-center gap-1 text-gray-600">
                                <MapPin className="w-3 h-3" />
                                <span className="text-xs truncate">{userData.location}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
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



