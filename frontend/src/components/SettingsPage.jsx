import { useState } from 'react';
import { Lock, Key, Camera, Link, Save } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Separator } from './ui/separator';




export function SettingsPage({ user, onNavigate, onLogout }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [lmsApiKey, setLmsApiKey] = useState('');
  const [hrmApiKey, setHrmApiKey] = useState('');
  const [cameraAccess, setCameraAccess] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [exportFormat, setExportFormat] = useState('csv');

  const handlePasswordChange = (e) => {
    e.preventDefault();
    console.log('Changing password...');
    // Reset form
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleApiKeySave = () => {
    console.log('Saving API keys...');
  };

  const handleProfileUpdate = () => {
    console.log('Updating profile...');
  };

  const handlePhotoChange = () => {
    console.log('Changing photo...');
  };

  const handleExport = () => {
    console.log(`Exporting data in ${exportFormat} format...`);
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar currentPage="settings" onNavigate={onNavigate} userRole={user.role} />
      <div className="flex-1 flex flex-col">
        <Navbar user={user} onLogout={onLogout} />
        <main className="flex-1 p-6">
          <div className="mb-6">
            <h1 className="text-gray-900 mb-2">Settings</h1>
            <p className="text-gray-600">
              Manage your account settings and preferences
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Profile Settings */}
            <Card className="p-6">
              <h2 className="text-gray-900 mb-4">Profile Settings</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center text-white">
                    <span className="text-2xl">{user.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <Button variant="outline" onClick={handlePhotoChange}>Change Photo</Button>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="profile-name">Full Name</Label>
                  <Input id="profile-name" defaultValue={user.name} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="profile-email">Email</Label>
                  <Input id="profile-email" type="email" defaultValue={user.email} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="profile-role">Role</Label>
                  <Input id="profile-role" defaultValue={user.role} disabled className="capitalize" />
                </div>

                <Button onClick={handleProfileUpdate} className="w-full bg-blue-600 hover:bg-blue-700">
                  <Save className="w-4 h-4 mr-2" />
                  Update Profile
                </Button>
              </div>
            </Card>

            {/* Change Password */}
            <Card className="p-6">
              <h2 className="text-gray-900 mb-4">Change Password</h2>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      id="current-password"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="pl-10"
                      placeholder="Enter current password"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      id="new-password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="pl-10"
                      placeholder="Enter new password"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10"
                      placeholder="Confirm new password"
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                  <Lock className="w-4 h-4 mr-2" />
                  Change Password
                </Button>
              </form>
            </Card>

            {/* System Preferences */}
            <Card className="p-6">
              <h2 className="text-gray-900 mb-4">System Preferences</h2>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="camera-access" className="flex items-center gap-2">
                      <Camera className="w-4 h-4" />
                      Camera Access
                    </Label>
                    <p className="text-gray-500">Allow the system to access your camera</p>
                  </div>
                  <Switch
                    id="camera-access"
                    checked={cameraAccess}
                    onCheckedChange={setCameraAccess}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="notifications">Notifications</Label>
                    <p className="text-gray-500">Receive attendance notifications</p>
                  </div>
                  <Switch
                    id="notifications"
                    checked={notifications}
                    onCheckedChange={setNotifications}
                  />
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Data Export Format</Label>
                  <div className="flex gap-2">
                    <Button
                      variant={exportFormat === 'csv' ? 'default' : 'outline'}
                      className={exportFormat === 'csv' ? 'flex-1 bg-blue-600' : 'flex-1'}
                      onClick={() => setExportFormat('csv')}
                    >
                      CSV
                    </Button>
                    <Button
                      variant={exportFormat === 'pdf' ? 'default' : 'outline'}
                      className={exportFormat === 'pdf' ? 'flex-1 bg-blue-600' : 'flex-1'}
                      onClick={() => setExportFormat('pdf')}
                    >
                      PDF
                    </Button>
                    <Button
                      variant={exportFormat === 'excel' ? 'default' : 'outline'}
                      className={exportFormat === 'excel' ? 'flex-1 bg-blue-600' : 'flex-1'}
                      onClick={() => setExportFormat('excel')}
                    >
                      Excel
                    </Button>
                  </div>
                </div>
                <Button onClick={handleExport} className="w-full mt-2 bg-green-600 hover:bg-green-700">
                  Export Data
                </Button>
              </div>
            </Card>

        {/* API Integration */}
        <Card className="p-6">
          <h2 className="text-gray-900 mb-4">API Integration</h2>
          <p className="text-gray-600 mb-4">
            Connect your LMS or HRM software via API keys
          </p>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="lms-api">LMS API Key</Label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  id="lms-api"
                  type="password"
                  value={lmsApiKey}
                  onChange={(e) => setLmsApiKey(e.target.value)}
                  className="pl-10"
                  placeholder="Enter LMS API key"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="hrm-api">HRM API Key</Label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  id="hrm-api"
                  type="password"
                  value={hrmApiKey}
                  onChange={(e) => setHrmApiKey(e.target.value)}
                  className="pl-10"
                  placeholder="Enter HRM API key"
                />
              </div>
            </div>

            <Button onClick={handleApiKeySave} className="w-full bg-blue-600 hover:bg-blue-700">
              <Link className="w-4 h-4 mr-2" />
              Save API Keys
            </Button>

            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-blue-800">
                <strong>Note:</strong> API keys are encrypted and stored securely. Use these to
                connect with external LMS/HRM systems.
              </p>
            </div>
          </div>
        </Card>
          </div>
        </main>
      </div>
    </div>
  );
}


