import React, { useMemo } from 'react';
import { Trophy, TrendingUp, Award, Star, Zap, Target } from 'lucide-react';
import { useCanvassingStore } from '../../store/canvassingStore';
import { PROPERTY_STATUS } from '../map/PropertyMarker';

/**
 * Leaderboard Component
 * Gamification and performance rankings
 */
const Leaderboard = () => {
  const { properties, analytics } = useCanvassingStore();

  // Calculate rep performance (mock data for demo - in production, track by user)
  const leaderboardData = useMemo(() => {
    const stats = {
      doorsKnocked: analytics.totalDoorsKnocked || properties.length,
      contactsMade: properties.filter(p => p.status !== PROPERTY_STATUS.NOT_CONTACTED).length,
      appointmentsSet: properties.filter(p => p.status === PROPERTY_STATUS.APPOINTMENT).length,
      sold: properties.filter(p => p.status === PROPERTY_STATUS.SOLD).length,
    };

    const contactRate = stats.doorsKnocked > 0 ? (stats.contactsMade / stats.doorsKnocked * 100).toFixed(1) : 0;
    const conversionRate = stats.contactsMade > 0 ? (stats.sold / stats.contactsMade * 100).toFixed(1) : 0;
    const score = (stats.sold * 100) + (stats.appointmentsSet * 25) + (stats.contactsMade * 5);

    return {
      stats,
      contactRate,
      conversionRate,
      score,
      rank: 1,
      badges: []
    };
  }, [properties, analytics]);

  // Award badges based on performance
  const badges = useMemo(() => {
    const earned = [];
    if (leaderboardData.stats.sold >= 5) earned.push({ name: '5 Sales', icon: Trophy, color: 'yellow' });
    if (leaderboardData.stats.sold >= 10) earned.push({ name: '10 Sales', icon: Trophy, color: 'gold' });
    if (leaderboardData.contactRate >= 50) earned.push({ name: 'Contact Master', icon: Target, color: 'blue' });
    if (leaderboardData.conversionRate >= 10) earned.push({ name: 'Closer', icon: Award, color: 'purple' });
    if (leaderboardData.stats.appointmentsSet >= 20) earned.push({ name: 'Appointment Pro', icon: Star, color: 'green' });
    return earned;
  }, [leaderboardData]);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-900 flex items-center">
          <Trophy className="w-5 h-5 mr-2 text-yellow-500" />
          Performance Leaderboard
        </h3>
        <div className="text-sm text-gray-600">
          Rank: <span className="font-bold text-2xl text-blue-600">#{leaderboardData.rank}</span>
        </div>
      </div>

      {/* Score Card */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-lg mb-6">
        <div className="text-center">
          <div className="text-sm opacity-90 mb-2">Total Score</div>
          <div className="text-5xl font-bold mb-4">{leaderboardData.score}</div>
          <div className="flex items-center justify-center space-x-4 text-sm">
            <div>
              <Zap className="w-4 h-4 inline mr-1" />
              {leaderboardData.stats.sold} Sales
            </div>
            <div>
              <Target className="w-4 h-4 inline mr-1" />
              {leaderboardData.contactRate}% Contact Rate
            </div>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg text-center">
          <div className="text-3xl font-bold text-blue-600">{leaderboardData.stats.doorsKnocked}</div>
          <div className="text-sm text-blue-800">Doors Knocked</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg text-center">
          <div className="text-3xl font-bold text-green-600">{leaderboardData.stats.contactsMade}</div>
          <div className="text-sm text-green-800">Contacts Made</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg text-center">
          <div className="text-3xl font-bold text-purple-600">{leaderboardData.stats.appointmentsSet}</div>
          <div className="text-sm text-purple-800">Appointments</div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg text-center">
          <div className="text-3xl font-bold text-yellow-600">{leaderboardData.stats.sold}</div>
          <div className="text-sm text-yellow-800">Sales Closed</div>
        </div>
      </div>

      {/* Badges */}
      {badges.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Achievements Unlocked</h4>
          <div className="grid grid-cols-2 gap-3">
            {badges.map((badge, index) => {
              const Icon = badge.icon;
              const colors = {
                yellow: 'bg-yellow-100 text-yellow-700 border-yellow-300',
                gold: 'bg-yellow-200 text-yellow-900 border-yellow-400',
                blue: 'bg-blue-100 text-blue-700 border-blue-300',
                purple: 'bg-purple-100 text-purple-700 border-purple-300',
                green: 'bg-green-100 text-green-700 border-green-300',
              };
              return (
                <div
                  key={index}
                  className={`p-3 rounded-lg border-2 ${colors[badge.color]} flex items-center`}
                >
                  <Icon className="w-5 h-5 mr-2" />
                  <span className="text-sm font-medium">{badge.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Progress to Next Level */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Progress to Next Level</span>
          <span className="text-sm text-gray-600">75%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all"
            style={{ width: '75%' }}
          />
        </div>
        <div className="text-xs text-gray-600 mt-2">
          3 more sales needed to reach Level 5
        </div>
      </div>

      {/* Daily Challenge */}
      <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
        <div className="flex items-center mb-2">
          <Zap className="w-5 h-5 text-orange-600 mr-2" />
          <h4 className="font-semibold text-orange-900">Daily Challenge</h4>
        </div>
        <div className="text-sm text-orange-800">
          Complete 50 door knocks today and earn 500 bonus points!
        </div>
        <div className="mt-3 bg-white rounded-full h-2">
          <div
            className="bg-orange-500 h-2 rounded-full"
            style={{ width: `${(leaderboardData.stats.doorsKnocked / 50) * 100}%` }}
          />
        </div>
        <div className="text-xs text-orange-700 mt-1">
          {leaderboardData.stats.doorsKnocked}/50 completed
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
