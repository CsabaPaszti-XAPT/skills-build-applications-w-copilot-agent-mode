import { Types } from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw Object.assign(new Error('Activity input is required'), { status: 400 });
  }

  const { userId, teamId, type, minutes } = input as Record<string, unknown>;
  if (
    typeof userId !== 'string' || !Types.ObjectId.isValid(userId) ||
    typeof teamId !== 'string' || !Types.ObjectId.isValid(teamId) ||
    typeof type !== 'string' || !type.trim() ||
    typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes <= 0
  ) {
    throw Object.assign(new Error('Activity requires valid userId, teamId, type, and positive minutes'), { status: 400 });
  }

  const [user, team] = await Promise.all([User.findById(userId), Team.findById(teamId)]);
  if (!user || !team) {
    throw Object.assign(new Error('Activity user or team was not found'), { status: 404 });
  }

  return Activity.create({
    user: user._id,
    team: team._id,
    type: type.trim(),
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw Object.assign(new Error('Team input is required'), { status: 400 });
  }

  const { name, mascot, members = [] } = input as Record<string, unknown>;
  if (
    typeof name !== 'string' || !name.trim() ||
    typeof mascot !== 'string' || !mascot.trim() ||
    !Array.isArray(members) ||
    members.some((member) => typeof member !== 'string' || !Types.ObjectId.isValid(member))
  ) {
    throw Object.assign(new Error('Team requires a name, mascot, and valid member IDs'), { status: 400 });
  }

  const memberIds = members as string[];
  if (memberIds.length && await User.countDocuments({ _id: { $in: memberIds } }) !== new Set(memberIds).size) {
    throw Object.assign(new Error('One or more team members were not found'), { status: 404 });
  }

  return Team.create({ name: name.trim(), mascot: mascot.trim(), members: memberIds });
}

export async function getLeaderboard() {
  const totals = await Activity.aggregate([
    { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    {
      $lookup: {
        from: Team.collection.name,
        localField: '_id',
        foreignField: '_id',
        as: 'team',
      },
    },
    { $unwind: '$team' },
    { $project: { _id: 0, teamName: '$team.name', totalPoints: 1 } },
    { $sort: { totalPoints: -1, teamName: 1 } },
  ]);

  return totals.map((entry, index) => ({ ...entry, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail });
  if (!user) {
    throw Object.assign(new Error('User was not found'), { status: 404 });
  }

  const [activities, workouts] = await Promise.all([
    Activity.find({ user: user._id }).sort({ occurredAt: -1 }).lean(),
    Workout.find().lean(),
  ]);
  const goal = user.fitnessGoal.toLowerCase();
  const activityFocus = (type: string) => {
    const normalized = type.toLowerCase();
    if (['run', 'running', 'cycle', 'cycling', 'cardio'].includes(normalized)) return 'endurance';
    if (normalized.includes('strength')) return 'strength';
    return normalized;
  };

  return workouts
    .map((workout) => {
      const focus = workout.focus.toLowerCase();
      const matchesGoal = focus === goal;
      const matchingActivity = activities.find((activity) => activityFocus(activity.type) === focus);
      return {
        workout,
        score: Number(matchesGoal) * 2 + Number(Boolean(matchingActivity)),
        reason: matchesGoal && matchingActivity
          ? `Matches your ${goal} goal and recent ${matchingActivity.type} activity.`
          : matchesGoal
            ? `Matches your ${goal} fitness goal.`
            : matchingActivity
              ? `Builds on your recent ${matchingActivity.type} activity.`
              : `Supports your ${goal} fitness goal.`,
      };
    })
    .sort((first, second) => second.score - first.score)
    .map(({ workout, reason }) => ({ ...workout, reason }));
}

export { User };
