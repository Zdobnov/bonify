import { useEffect } from 'react';
import type {
  TransactionEventType,
  TransactionStreamEvent,
} from '../api/transactions';
import { SSE_BASE_URL } from '../config/api';

const TRANSACTION_EVENTS_POLL_INTERVAL_MS = 30_000; // 30s, polling delay
const TRANSACTION_EVENTS_REQUEST_TIMEOUT_MS = 35_000; // 35, polling timeout

type LambdaProxySseResponse = {
  body?: string;
};

type UseTransactionEventsParams = {
  onEvent: (event: TransactionStreamEvent) => void;
  userId: string | null;
};

const parseSseBody = (body: string) => {
  return body
    .split(/\n\n+/)
    .map((chunk) => {
      const lines = chunk.split('\n');
      const idLine = lines.find((line) => line.startsWith('id: '));
      const eventTypeLine = lines.find((line) => line.startsWith('event: '));
      const dataLines = lines.filter((line) => line.startsWith('data: '));

      if (!eventTypeLine || dataLines.length === 0) {
        return null;
      }

      const data = JSON.parse(dataLines.map((line) => line.replace('data: ', '')).join('\n'));

      return {
        data,
        event: eventTypeLine.replace('event: ', '') as TransactionEventType,
        id: idLine ? idLine.replace('id: ', '') : null,
      };
    })
    .filter((event): event is TransactionStreamEvent => Boolean(event));
};

const fetchLambdaProxySseEvents = async (url: string, signal: AbortSignal) => {
  const response = await fetch(url, { signal });
  const responseBody = await response.text();
  const payload = JSON.parse(responseBody) as LambdaProxySseResponse;

  if (!payload.body) {
    return [];
  }

  return parseSseBody(payload.body);
};

export const useTransactionEvents = ({ onEvent, userId }: UseTransactionEventsParams) => {
  useEffect(() => {
    if (!userId) {
      return;
    }

    const url = `${SSE_BASE_URL}/api/users/${userId}/transaction-events`;
    let isDisposed = false;
    let timerId: number | undefined;
    let currentRequestAbortController: AbortController | undefined;
    const scheduleNextFetch = () => {
      if (isDisposed) {
        return;
      }

      timerId = window.setTimeout(fetchEvents, TRANSACTION_EVENTS_POLL_INTERVAL_MS);
    };
    const fetchEvents = () => {
      if (isDisposed) {
        return;
      }

      currentRequestAbortController = new AbortController();
      const requestTimeoutId = window.setTimeout(() => {
        currentRequestAbortController?.abort();
      }, TRANSACTION_EVENTS_REQUEST_TIMEOUT_MS);

      void fetchLambdaProxySseEvents(url, currentRequestAbortController.signal)
        .then((events) => {
          events.forEach(onEvent);
        })
        .catch((error) => {
          if (!currentRequestAbortController?.signal.aborted && !isDisposed) {
            console.error('Failed to read fallback transaction events:', error);
          }
        })
        .finally(() => {
          window.clearTimeout(requestTimeoutId);
          currentRequestAbortController = undefined;
          scheduleNextFetch();
        });
    };

    scheduleNextFetch();

    return () => {
      isDisposed = true;
      currentRequestAbortController?.abort();

      if (timerId) {
        window.clearTimeout(timerId);
      }
    };
  }, [onEvent, userId]);
};
