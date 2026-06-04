import type { QueryStatus } from '@tanstack/react-query';
import type { ReliabilityResponse } from '../../shared/api/reliability';
import './ScoreBreakdown.css';

type ScoreBreakdownProps = {
  positiveSignals: string[];
  reliability?: ReliabilityResponse;
  riskSignals: string[];
  status: QueryStatus;
};

export const ScoreBreakdown = ({
  positiveSignals,
  reliability,
  riskSignals,
  status,
}: ScoreBreakdownProps) => (
  <article className="dashboard__card score-breakdown">
    <h2 className="dashboard__card-title">Score Breakdown</h2>
    {status === 'pending' && <p className="dashboard__card-status">Loading...</p>}
    {status === 'error' && (
      <p className="dashboard__card-status dashboard__card-status--error">
        Failed to load score breakdown.
      </p>
    )}
    {reliability && (
      <div className="score-breakdown__content">
        <dl className="score-breakdown__signals">
          <div className="score-breakdown__signal">
            <dt>Income Regularity</dt>
            <dd>{reliability.metrics.income_regularity}</dd>
          </div>
          <div className="score-breakdown__signal">
            <dt>Income Coverage Ratio</dt>
            <dd>{reliability.metrics.income_coverage_ratio}</dd>
          </div>
          <div className="score-breakdown__signal">
            <dt>Essential Payments Consistency</dt>
            <dd>{Math.round(reliability.metrics.essential_payments_consistency * 100)}%</dd>
          </div>
          <div className="score-breakdown__signal">
            <dt>Resilience Adjustments</dt>
            <dd>
              {reliability.metrics.good_months} good months,{' '}
              {reliability.metrics.negative_balance_days} negative balance day(s),{' '}
              {reliability.metrics.late_fee_events} late fee(s)
            </dd>
          </div>
        </dl>

        <div className="score-breakdown__explanation">
          <section>
            <h3 className="dashboard__section-title">Positive signals</h3>
            {positiveSignals.length > 0 ? (
              <ul className="score-breakdown__drivers score-breakdown__drivers--positive">
                {positiveSignals.map((driver) => (
                  <li key={driver}>{driver}</li>
                ))}
              </ul>
            ) : (
              <p className="dashboard__card-status">No positive signals detected.</p>
            )}
          </section>
          <section>
            <h3 className="dashboard__section-title">Risk signals</h3>
            {riskSignals.length > 0 ? (
              <ul className="score-breakdown__drivers score-breakdown__drivers--risk">
                {riskSignals.map((driver) => (
                  <li key={driver}>{driver}</li>
                ))}
              </ul>
            ) : (
              <p className="dashboard__card-status">No risk signals detected.</p>
            )}
          </section>
        </div>
      </div>
    )}
  </article>
);
