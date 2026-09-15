import * as React from 'react';

const COPY_FEEDBACK_DURATION_MS = 2000;

/** Menu / action label for copying a dashboard’s serialized JSON configuration. */
export const COPY_JSON_CONFIG_MENU_LABEL = 'Copy JSON config';

/** Menu / action label for the dropdown item that opens the copy-config modal. */
export const SHARE_DASHBOARD_MENU_LABEL = 'Share dashboard';

/** Menu / action label for importing a dashboard from pasted JSON configuration. */
export const IMPORT_JSON_CONFIG_MENU_LABEL = 'Import JSON config';

/** Menu / action label for pinning a dashboard to the services menu. */
export const PIN_DASHBOARD_TO_SERVICES_MENU_LABEL = 'Pin dashboard to services';

/** Form label for the JSON config paste field in the import modal. */
export const IMPORT_JSON_CONFIG_PASTE_LABEL = 'Paste JSON config';

/** Tooltip shown on kebab/menu toggles after copying a dashboard configuration string. */
export const COPY_CONFIG_STRING_TOOLTIP_CONTENT =
  'Config copied. You may share with others.';

/** Brief copy-success tooltip on a single kebab (homepage / dashboard detail). */
export function useCopyConfigFeedback(durationMs = COPY_FEEDBACK_DURATION_MS): {
  copiedTooltipVisible: boolean;
  triggerCopiedFeedback: () => void;
} {
  const [copiedTooltipVisible, setCopiedTooltipVisible] = React.useState(false);
  const timeoutRef = React.useRef<number | undefined>(undefined);

  const triggerCopiedFeedback = React.useCallback(() => {
    const prev = timeoutRef.current;
    if (prev !== undefined) {
      window.clearTimeout(prev);
    }
    setCopiedTooltipVisible(true);
    timeoutRef.current = window.setTimeout(() => {
      setCopiedTooltipVisible(false);
      timeoutRef.current = undefined;
    }, durationMs);
  }, [durationMs]);

  React.useEffect(
    () => () => {
      const prev = timeoutRef.current;
      if (prev !== undefined) {
        window.clearTimeout(prev);
      }
    },
    []
  );

  return { copiedTooltipVisible, triggerCopiedFeedback };
}

/** Brief copy-success tooltip on hub table row kebabs (which row was copied). */
export function useCopyConfigRowFeedback(durationMs = COPY_FEEDBACK_DURATION_MS): {
  copiedFeedbackRowId: string | null;
  triggerCopiedFeedbackForRow: (rowId: string) => void;
} {
  const [copiedFeedbackRowId, setCopiedFeedbackRowId] = React.useState<string | null>(null);
  const timeoutRef = React.useRef<number | undefined>(undefined);

  const triggerCopiedFeedbackForRow = React.useCallback(
    (rowId: string) => {
      const prev = timeoutRef.current;
      if (prev !== undefined) {
        window.clearTimeout(prev);
      }
      setCopiedFeedbackRowId(rowId);
      timeoutRef.current = window.setTimeout(() => {
        setCopiedFeedbackRowId(null);
        timeoutRef.current = undefined;
      }, durationMs);
    },
    [durationMs]
  );

  React.useEffect(
    () => () => {
      const prev = timeoutRef.current;
      if (prev !== undefined) {
        window.clearTimeout(prev);
      }
    },
    []
  );

  return { copiedFeedbackRowId, triggerCopiedFeedbackForRow };
}
