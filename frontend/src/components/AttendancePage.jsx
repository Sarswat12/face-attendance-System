import { useState, useEffect, useRef } from 'react';
import apiFetch, { uploadSingle } from '../api';
import { useToast } from './ui/Toast';
import { Camera, CheckCircle, Download, Calendar } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';






export function AttendancePage({ user, onNavigate, onLogout }) {
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [recognizedUser, setRecognizedUser] = useState(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [recognitionProgress, setRecognitionProgress] = useState(0);
  const [matchConfidence, setMatchConfidence] = useState(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [filterDate, setFilterDate] = useState('');
  const [todayRecord, setTodayRecord] = useState(null);
  const [loadingToday, setLoadingToday] = useState(true);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loadingRecords, setLoadingRecords] = useState(true);

  const handleStartRecognition = () => {
    // Start camera to capture a frame for recognition
    startCamera();
  };
  const toastApi = useToast();

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
      streamRef.current = stream;
      // Mount the video element first so videoRef.current is defined
      setIsCameraOn(true);
      // wait a tick for the element to render and attach ref
      await new Promise((r) => setTimeout(r, 0));
      if (videoRef.current) {
        try {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        } catch (err) {
          // autoplay policies may block play; the stream is still attached and will play on user interaction
          console.warn('video play error', err);
        }
      }
      setRecognizedUser(null);
      setMatchConfidence(null);
    } catch (err) {
      console.error('Camera error', err);
      toastApi.push({ type: 'error', message: 'Camera access denied or unavailable' });
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setIsCameraOn(false);
  };

  const captureAndRecognize = async () => {
    if (!videoRef.current) return;
    setIsRecognizing(true);
    setRecognitionProgress(0);
    try {
      const w = videoRef.current.videoWidth || 640;
      const h = videoRef.current.videoHeight || 480;
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0, w, h);
      const blob = await new Promise((res) => canvas.toBlob(res, 'image/png'));
      if (!blob) throw new Error('Failed to capture image');
      const file = new File([blob], `capture_${Date.now()}.png`, { type: 'image/png' });

      // Attempt to get geolocation (optional but important for attendance tracking)
      let coords = {};
      if (navigator.geolocation) {
        try {
          coords = await new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
              console.warn('Geolocation request timed out after 5 seconds');
              resolve({});
            }, 5000);

            navigator.geolocation.getCurrentPosition(
              (pos) => {
                clearTimeout(timeoutId);
                const lat = pos.coords.latitude;
                const lon = pos.coords.longitude;
                console.log('Geolocation obtained:', { latitude: lat, longitude: lon });
                resolve({ latitude: lat, longitude: lon });
              },
              (err) => {
                clearTimeout(timeoutId);
                console.warn('Geolocation error:', err.message);
                // User denied permission or other error - continue without geolocation
                resolve({});
              },
              { 
                timeout: 5000,
                enableHighAccuracy: true,
                maximumAge: 0 // Get fresh location
              }
            );
          });
        } catch (e) {
          console.warn('Geolocation exception:', e);
          coords = {};
        }
      } else {
        console.warn('Geolocation not supported in this browser');
      }

      console.log('Sending attendance with coords:', coords);
      const res = await uploadSingle('/api/attendance/mark', file, (p) => setRecognitionProgress(p), coords);
      // Expecting { success: true, user_id, name, distance? }
      if (res && (res.success || res.matched || res.marked)) {
        const rec = res.record || res;
        const name = rec.name || res.name || res.user_name || 'Unknown';
        const id = rec.userId || rec.user_id || res.user_id || res.id;
        const timestamp = rec.local_time || rec.local_time || rec.local_time || new Date().toLocaleString();
        setRecognizedUser({ name, id, timestamp, latitude: rec.latitude, longitude: rec.longitude });
        if (typeof res.distance === 'number') setMatchConfidence(Math.max(0, Math.round((1 - res.distance) * 100)));
        toastApi.push({ type: 'success', message: `Recognized: ${name}` });
        // Refresh today's attendance and records so UI updates immediately
        try {
          const today = await apiFetch('/api/attendance/today');
          setTodayRecord(today.record || today.summary || null);
        } catch (e) {
          console.warn('Failed to refresh today record', e);
        }
        try {
          const recs = await apiFetch('/api/attendance/records');
          setAttendanceRecords(recs.records || recs || []);
        } catch (e) {
          console.warn('Failed to refresh attendance records', e);
        }
      } else if (res && res.user) {
        setRecognizedUser({ name: res.user.name, id: res.user.id, timestamp: new Date().toLocaleString() });
        toastApi.push({ type: 'success', message: `Recognized: ${res.user.name}` });
      } else {
        setRecognizedUser({ name: null, id: null, timestamp: new Date().toLocaleString(), failed: true });
        toastApi.push({ type: 'error', message: 'No match found' });
      }
    } catch (err) {
      console.error('Recognition failed', err);
      // Attempt to extract server error code/message for friendlier UX
      let serverErr = null;
      try {
        serverErr = err?.response?.data?.error || err?.response?.data?.message || null;
      } catch (e) {
        serverErr = null;
      }

      if (serverErr === 'no enrolled faces available for recognition' || serverErr === 'face_not_recognized') {
        setRecognizedUser({ name: null, id: null, failed: true });
        toastApi.push({ type: 'error', message: 'No matching face found. Please enroll your face or try again.' });
      } else if (serverErr === 'identity_mismatch') {
        // identity mismatch returned as 403; inform user they tried to mark as another person
        const detail = err?.response?.data?.message || 'Identity does not match enrolled face';
        setRecognizedUser({ name: null, id: null, failed: true });
        toastApi.push({ type: 'error', message: detail });
      } else {
        setRecognizedUser({ name: null, id: null, failed: true });
        toastApi.push({ type: 'error', message: 'Recognition failed' });
      }
    } finally {
      setIsRecognizing(false);
      setRecognitionProgress(0);
      // keep camera on so user can retry, or you can stop here:
      // stopCamera();
    }
  };

  // Load today's attendance on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await apiFetch('/api/attendance/today');
        if (mounted) {
          setTodayRecord(data.record || data.summary || null);
        }
      } catch (err) {
        console.error('Failed to load today attendance', err);
      } finally {
        setLoadingToday(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Monitor stream tracks for ended/stopped events so we can surface a message
  useEffect(() => {
    if (!streamRef.current) return;
    const tracks = streamRef.current.getTracks();
    const onEnded = () => {
      toastApi.push({ type: 'error', message: 'Camera disconnected' });
      setIsCameraOn(false);
    };
    tracks.forEach((t) => t.addEventListener('ended', onEnded));
    return () => {
      tracks.forEach((t) => t.removeEventListener('ended', onEnded));
    };
  }, [isCameraOn]);

  // fetch attendance records list (used in table) — backend should provide this endpoint
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await apiFetch('/api/attendance/records');
        if (mounted) setAttendanceRecords(data.records || data || []);
      } catch (err) {
        console.error('Failed to load attendance records', err);
        if (import.meta.env.DEV) {
          // in dev only: leave empty or add minimal sample if desired
          setAttendanceRecords([]);
        }
      } finally {
        if (mounted) setLoadingRecords(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const handleExportCSV = () => {
    // Mock CSV export
    console.log('Exporting attendance records to CSV...');
  };

  const handleExportPDF = () => {
    // Mock PDF export
    console.log('Exporting attendance records to PDF...');
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar currentPage="attendance" onNavigate={onNavigate} userRole={user.role} />
      <div className="flex-1 flex flex-col">
        <Navbar user={user} onLogout={onLogout} />
        <main className="flex-1 p-6">
          <div className="mb-6">
            <h1 className="text-gray-900 mb-2">Attendance Records</h1>
            <p className="text-gray-600">
              Mark your attendance using face recognition or view attendance history
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Face Recognition */}
            <Card className="lg:col-span-1 p-6">
              <h2 className="text-gray-900 mb-4">Mark Attendance</h2>

              <div className="aspect-square bg-gray-900 rounded-lg mb-4 flex items-center justify-center relative overflow-hidden">
                {!isCameraOn && !isRecognizing && !recognizedUser && (
                  <div className="text-center">
                    <Camera className="w-16 h-16 text-gray-600 mx-auto mb-2" />
                    <p className="text-gray-400">Click below to start camera</p>
                  </div>
                )}

                {isCameraOn && (
                  <video ref={videoRef} className="w-full h-full object-cover" muted autoPlay playsInline />
                )}

                {isRecognizing && (
                  <div className="absolute inset-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-32 h-32 border-4 border-blue-400 rounded-full flex items-center justify-center mb-4 animate-pulse">
                        <Camera className="w-16 h-16 text-blue-200" />
                      </div>
                      <p className="text-white">Recognizing...</p>
                    </div>
                  </div>
                )}

                {recognizedUser && (
                  <div className="absolute inset-0 w-full h-full bg-green-900 bg-opacity-40 flex items-center justify-center pointer-events-none">
                    <div className="text-center text-white">
                      <CheckCircle className="w-20 h-20 mx-auto mb-4" />
                      <p className="mb-1">{recognizedUser.failed ? 'No match' : 'Success'}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2 mb-3">
                {!isCameraOn ? (
                  <Button onClick={startCamera} className="flex-1 bg-blue-600 hover:bg-blue-700">
                    <Camera className="w-5 h-5 mr-2" />
                    Start Camera
                  </Button>
                ) : (
                  <>
                    <Button onClick={captureAndRecognize} disabled={isRecognizing} className="flex-1 bg-blue-600 hover:bg-blue-700">
                      <Camera className="w-5 h-5 mr-2" />
                      Capture & Recognize
                    </Button>
                    <Button onClick={stopCamera} variant="outline" className="w-36">
                      Stop Camera
                    </Button>
                  </>
                )}
              </div>

              {recognitionProgress > 0 && (
                <div className="mb-3">
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div className="h-3 bg-blue-500" style={{ width: `${recognitionProgress}%`, transition: 'width 200ms ease' }} />
                  </div>
                  <p className="text-sm text-gray-300 text-center mt-1">Uploading: {recognitionProgress}%</p>
                </div>
              )}

              {recognizedUser && (
                <Card className="p-4 bg-green-50 border-green-200">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Name:</span>
                      <span className="text-gray-900">{recognizedUser.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">ID:</span>
                      <span className="text-gray-900">{recognizedUser.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-600">{recognizedUser.status}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Time:</span>
                      <span className="text-gray-900">{recognizedUser.timestamp}</span>
                    </div>
                  </div>
                </Card>
              )}
            </Card>

            {/* Attendance History */}
            <Card className="lg:col-span-2 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-gray-900">Today's Attendance</h2>
                  <div className="flex gap-2">
                  <Button onClick={handleExportCSV} variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    CSV
                  </Button>
                  <Button onClick={handleExportPDF} variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    PDF
                  </Button>
                </div>
              </div>

              <div className="mb-4">
                <Label htmlFor="filter-date">Filter by Date</Label>
                <div className="flex gap-2 mt-2">
                  <div className="relative flex-1">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      id="filter-date"
                      type="date"
                      value={filterDate}
                      onChange={(e) => setFilterDate(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Button variant="outline">Apply</Button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-gray-600">User ID</th>
                      <th className="text-left py-3 px-4 text-gray-600">Name</th>
                      <th className="text-left py-3 px-4 text-gray-600">Department</th>
                      <th className="text-left py-3 px-4 text-gray-600">Timestamp</th>
                      <th className="text-left py-3 px-4 text-gray-600">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingRecords ? (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-gray-500">Loading records...</td>
                      </tr>
                    ) : attendanceRecords.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-gray-500">No attendance records found.</td>
                      </tr>
                    ) : (
                      attendanceRecords.map((record) => (
                        <tr key={record.id || record.userId || Math.random()} className="border-b border-gray-100">
                          <td className="py-3 px-4 text-gray-900">{record.userId || record.user_id || record.id}</td>
                          <td className="py-3 px-4 text-gray-900">{record.name}</td>
                          <td className="py-3 px-4 text-gray-600">{record.department}</td>
                          <td className="py-3 px-4 text-gray-600">{record.timestamp || record.time || record.marked_at}</td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full ${record.status === 'Present'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                                }`}
                            >
                              {record.status || record.state || 'Unknown'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}


