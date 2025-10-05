import React, { useState, useEffect } from 'react';
import { supabase, checkSupabaseConnection, isSupabaseEnabled } from '../lib/supabase';
import { Database, Activity, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export function DatabaseHealthMonitor() {
  const [health, setHealth] = useState({
    connected: false,
    leadsCount: 0,
    jobCountsCount: 0,
    responseTime: 0,
    dbType: 'Unknown'
  });
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const checkHealth = async () => {
      const start = Date.now();

      if (!isSupabaseEnabled()) {
        setHealth({
          connected: true,
          leadsCount: 0,
          jobCountsCount: 0,
          responseTime: 0,
          dbType: 'Google Sheets'
        });
        return;
      }

      const connected = await checkSupabaseConnection();
      const responseTime = Date.now() - start;

      if (!connected) {
        setHealth({
          connected: false,
          leadsCount: 0,
          jobCountsCount: 0,
          responseTime,
          dbType: 'Supabase (Offline)'
        });
        return;
      }

      try {
        const { count: leadsCount } = await supabase
          .from('leads')
          .select('*', { count: 'exact', head: true });

        const { count: jobCountsCount } = await supabase
          .from('job_counts')
          .select('*', { count: 'exact', head: true });

        setHealth({
          connected: true,
          leadsCount: leadsCount || 0,
          jobCountsCount: jobCountsCount || 0,
          responseTime,
          dbType: 'Supabase'
        });
      } catch (error) {
        console.error('Health check error:', error);
        setHealth(prev => ({
          ...prev,
          connected: false,
          responseTime,
          dbType: 'Supabase (Error)'
        }));
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  // Only show in development mode
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-gray-800 text-white rounded-full p-3 shadow-lg hover:bg-gray-700 transition-colors z-50"
        title="Show Database Health"
      >
        <Database className="w-5 h-5" />
      </button>
    );
  }

  const getStatusColor = () => {
    if (!health.connected) return 'bg-red-500';
    if (health.responseTime > 1000) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStatusIcon = () => {
    if (!health.connected) return <XCircle className="w-4 h-4" />;
    if (health.responseTime > 1000) return <AlertCircle className="w-4 h-4" />;
    return <CheckCircle className="w-4 h-4" />;
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-xl p-4 text-sm border border-gray-200 z-50 min-w-[280px]">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-gray-700" />
          <h3 className="font-bold text-gray-900">Database Health</h3>
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          title="Hide"
        >
          ×
        </button>
      </div>

      <div className="space-y-2">
        {/* Connection Status */}
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${getStatusColor()}`}></div>
          <div className="flex items-center gap-1">
            {getStatusIcon()}
            <span className="font-medium">
              {health.connected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>

        {/* Database Type */}
        <div className="flex items-center gap-2 text-gray-600">
          <Activity className="w-4 h-4" />
          <span>Type: {health.dbType}</span>
        </div>

        {/* Response Time */}
        {health.dbType.includes('Supabase') && (
          <div className="text-gray-600">
            <span>Response: </span>
            <span className={health.responseTime > 1000 ? 'text-yellow-600 font-medium' : ''}>
              {health.responseTime}ms
            </span>
          </div>
        )}

        {/* Record Counts */}
        {health.connected && health.dbType.includes('Supabase') && (
          <>
            <div className="text-gray-600">
              Leads: {health.leadsCount.toLocaleString()}
            </div>
            <div className="text-gray-600">
              Job Counts: {health.jobCountsCount.toLocaleString()}
            </div>
          </>
        )}

        {/* Performance Indicator */}
        {health.connected && health.dbType.includes('Supabase') && (
          <div className="pt-2 border-t border-gray-200">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Performance</span>
              <span className={`font-medium ${
                health.responseTime < 200 ? 'text-green-600' :
                health.responseTime < 500 ? 'text-blue-600' :
                health.responseTime < 1000 ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {health.responseTime < 200 ? 'Excellent' :
                 health.responseTime < 500 ? 'Good' :
                 health.responseTime < 1000 ? 'Fair' :
                 'Slow'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Last Updated */}
      <div className="mt-3 pt-2 border-t border-gray-200 text-xs text-gray-400">
        Last checked: {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
}
