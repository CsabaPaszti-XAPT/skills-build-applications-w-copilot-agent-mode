import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Team = { _id?: string; name: string; mascot?: string; members: string[] };

export default function Teams() {
  const [teams, setTeams] = useState<Team[] | null>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let isCurrent = true;
    getJson<{ teams: Team[] }>('/api/teams')
      .then(({ teams: loadedTeams }) => {
        if (isCurrent) setTeams(loadedTeams);
      })
      .catch(() => {
        if (isCurrent) setHasError(true);
      });

    return () => { isCurrent = false; };
  }, []);

  return (
    <section className="card">
      <div className="card-body">
        <h2 className="h4">Teams</h2>
        <p>Manage teams and members.</p>
        {hasError ? (
          <p role="alert">Unable to load teams.</p>
        ) : teams === null ? (
          <p role="status">Loading teams...</p>
        ) : teams.length === 0 ? (
          <p>No teams yet.</p>
        ) : (
          <ul className="list-group list-group-flush">
            {teams.map((team, index) => (
              <li className="list-group-item px-0" key={team._id ?? `${team.name}-${index}`}>
                <h3 className="h5">{team.name}</h3>
                {team.mascot && <p className="mb-1">Mascot: {team.mascot}</p>}
                <p className="mb-1">Members ({team.members.length})</p>
                {team.members.length > 0 && <ul>{team.members.map((member, memberIndex) => <li key={`${member}-${memberIndex}`}>{member}</li>)}</ul>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
