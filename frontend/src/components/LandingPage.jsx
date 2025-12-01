import { motion } from 'motion/react';
import { Scan, Shield, Zap, Clock, TrendingUp, Users, ArrowRight, CheckCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';

 

export function LandingPage({ onGetStarted }) {
  const features = [
    {
      icon: Scan,
      title: 'AI Face Recognition',
      description: 'Advanced facial recognition technology for accurate attendance tracking',
      color: 'from-blue-500 to-blue-600',
    },
    {
      icon: Shield,
      title: 'Secure & Reliable',
      description: 'Bank-level security with encrypted data storage and privacy protection',
      color: 'from-green-500 to-green-600',
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Mark attendance in seconds with instant face detection and verification',
      color: 'from-purple-500 to-purple-600',
    },
    {
      icon: Clock,
      title: 'Real-time Tracking',
      description: 'Monitor attendance in real-time with live updates and notifications',
      color: 'from-orange-500 to-orange-600',
    },
    {
      icon: TrendingUp,
      title: 'Analytics & Reports',
      description: 'Comprehensive analytics and exportable reports for better insights',
      color: 'from-pink-500 to-pink-600',
    },
    {
      icon: Users,
      title: 'Multi-role Support',
      description: 'Perfect for schools, colleges, and companies with role-based access',
      color: 'from-indigo-500 to-indigo-600',
    },
  ];

  const benefits = [
    'No more manual attendance hassles',
    'Eliminate buddy punching and proxy attendance',
    'Save hours of administrative time',
    'Get accurate attendance data instantly',
    'Seamless integration with LMS & HRM',
    'Cloud-based with 99.9% uptime',
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-8">
        <nav className="flex items-center justify-between mb-16">
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="flex items-center gap-3"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <Scan className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-gray-900">FaceAttend</h2>
              <p className="text-gray-600">AI-Powered System</p>
            </div>
          </motion.div>
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
          >
            <Button onClick={onGetStarted} variant="outline">
              Sign In
            </Button>
          </motion.div>
        </nav>

        <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
          <motion.div
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-gray-900 mb-4 leading-tight">
              Smart Attendance
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Made Simple
              </span>
            </h1>
            <p className="text-gray-600 mb-8">
              Transform your attendance management with AI-powered face recognition.
              Secure, fast, and incredibly easy to use for schools, colleges, and companies.
            </p>
            <div className="flex gap-4">
              <Button
                onClick={onGetStarted}
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
              >
                Get Started
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button size="lg" variant="outline">
                Watch Demo
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-6 mt-12">
              <div>
                <h3 className="text-gray-900">10K+</h3>
                <p className="text-gray-600">Active Users</p>
              </div>
              <div>
                <h3 className="text-gray-900">99.9%</h3>
                <p className="text-gray-600">Accuracy</p>
              </div>
              <div>
                <h3 className="text-gray-900">24/7</h3>
                <p className="text-gray-600">Support</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="relative z-10">
              <Card className="p-8 backdrop-blur-sm bg-white/90 shadow-2xl">
                <div className="aspect-video bg-gradient-to-br from-blue-900 to-purple-900 rounded-xl flex items-center justify-center mb-4">
                  <Scan className="w-24 h-24 text-blue-200 animate-pulse" />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-gray-900">Attendance Marked</p>
                      <p className="text-gray-500">John Doe - 09:15 AM</p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-400 rounded-3xl opacity-20 blur-3xl" />
          </motion.div>
        </div>

        {/* Features Section */}
        <div className="mb-20">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center mb-12"
          >
            <h2 className="text-gray-900 mb-4">Powerful Features</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Everything you need for modern attendance management in one platform
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                >
                  <Card className="p-6 h-full hover:shadow-xl transition-all">
                    <div className={`w-14 h-14 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-4 shadow-lg`}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-gray-900 mb-2">{feature.title}</h3>
                    <p className="text-gray-600">{feature.description}</p>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Benefits Section */}
        <div className="mb-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <h2 className="text-gray-900 mb-4">Why Choose FaceAttend?</h2>
              <p className="text-gray-600 mb-6">
                Join thousands of organizations that trust FaceAttend for their attendance management needs.
              </p>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={index}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                    className="flex items-center gap-3"
                  >
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                    <p className="text-gray-700">{benefit}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <Card className="p-8 bg-gradient-to-br from-blue-600 to-purple-600 text-white">
                <h3 className="text-white mb-4">Ready to get started?</h3>
                <p className="text-blue-100 mb-6">
                  Set up your attendance system in minutes. No credit card required.
                </p>
                <Button
                  onClick={onGetStarted}
                  size="lg"
                  className="w-full bg-white text-blue-600 hover:bg-gray-100"
                >
                  Start Free Trial
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <div className="mt-6 pt-6 border-t border-blue-400">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-white mb-1">Free</p>
                      <p className="text-blue-100">Setup</p>
                    </div>
                    <div>
                      <p className="text-white mb-1">24/7</p>
                      <p className="text-blue-100">Support</p>
                    </div>
                    <div>
                      <p className="text-white mb-1">Secure</p>
                      <p className="text-blue-100">Data</p>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>

        {/* Footer */}
        <motion.footer
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="border-t border-gray-200 pt-8 text-center text-gray-600"
        >
          <p>© 2024 FaceAttend. All rights reserved.</p>
        </motion.footer>
      </div>
    </div>
  );
}


