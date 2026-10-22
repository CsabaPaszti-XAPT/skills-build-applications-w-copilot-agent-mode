import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Activity = { _id?: string; type: string; minutes: number; points: number };

export default function Activities() {
  const [activities, setActivities] = useState<Activity[] | null>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let isCurrent = true;
    getJson<{ activities: Activity[] }>('/api/activities')
      .then(({ activities: loadedActivities }) => {
        if (isCurrent) setActivities(loadedActivities);
      })
      .catch(() => {
        if (isCurrent) setHasError(true);
      });

    return () => { isCurrent = false; };
  }, []);

  return (
    <section className="card">
      <div className="card-body">
        <h2 className="h4">Activities</h2>
        <p>Track student activity minutes and points.</p>
        {hasError ? (
          <p role="alert">Unable to load activities.</p>
        ) : activities === null ? (
          <p role="status">Loading activities...</p>
        ) : activities.length === 0 ? (
          <p>No activities yet.</p>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead><tr><th scope="col">Activity</th><th scope="col">Minutes</th><th scope="col">Points</th></tr></thead>
              <tbody>
                {activities.map((activity, index) => (
                  <tr key={activity._id ?? `${activity.type}-${index}`}>
                    <td>{activity.type}</td><td>{activity.minutes}</td><td>{activity.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
