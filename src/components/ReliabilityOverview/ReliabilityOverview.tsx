import type { QueryStatus } from '@tanstack/react-query';

import type { ReliabilityResponse } from '../../shared/api/reliability';
import { getScoringWindow } from '../../shared/utils/date';

import './ReliabilityOverview.css';

type ReliabilityOverviewProps = {
  reliability?: ReliabilityResponse;
  status: QueryStatus;
};

export const ReliabilityOverview = ({ reliability, status }: ReliabilityOverviewProps) => {
  const scoringWindow = reliability ? getScoringWindow(reliability.from) : null;
  const scoreBandClassName = reliability
    ? `reliability-overview__band reliability-overview__band--${reliability.score_band.toLowerCase()}`
    : 'reliability-overview__band';

  return (
    <article className="dashboard__card reliability-overview">
      <h2 className="dashboard__card-title">Reliability Overview</h2>
      {status === 'pending' && <p className="dashboard__card-status">Loading...</p>}
      {status === 'error' && (
        <p className="dashboard__card-status dashboard__card-status--error">
          Failed to load reliability.
        </p>
      )}
      {reliability && (
        <div className="reliability-overview__content">
          <section>
            <h3 className="dashboard__section-title">Reliability score</h3>
            <strong className="reliability-overview__score">
              {reliability.reliability_index}
            </strong>
          </section>
          <section>
            <h3 className="dashboard__section-title">Score band</h3>
            <span className={scoreBandClassName}>{reliability.score_band}</span>
          </section>
          <section>
            <h3 className="dashboard__section-title">Scoring window</h3>
            <p className="dashboard__section-text">
              6 months: from {scoringWindow?.from} to {scoringWindow?.to}
            </p>
          </section>
          <section>
            <h3 className="dashboard__section-title">Key metrics</h3>
            <dl className="reliability-overview__metrics">
              <div className="reliability-overview__metric">
                <dt>Good months</dt>
                <dd>{reliability.metrics.good_months}/6</dd>
              </div>
              <div className="reliability-overview__metric">
                <dt>Negative balance days</dt>
                <dd>{reliability.metrics.negative_balance_days}</dd>
              </div>
              <div className="reliability-overview__metric">
                <dt>Late fee events</dt>
                <dd>{reliability.metrics.late_fee_events}</dd>
              </div>
            </dl>
          </section>
          <section>
            <h3 className="dashboard__section-title">Score drivers</h3>
            <ul className="reliability-overview__drivers">
              {reliability.drivers.map((driver, index) => (
                <li key={`${driver}-${index}`}>{driver}</li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </article>
  );
};
