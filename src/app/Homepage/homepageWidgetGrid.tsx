import * as React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { NavigateFunction } from 'react-router-dom';
import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Content,
  Divider,
  Dropdown,
  DropdownItem,
  DropdownList,
  Flex,
  FlexItem,
  Icon,
  MenuToggle,
  SimpleList,
  SimpleListItem,
  MenuToggleElement,
  Title
} from '@patternfly/react-core';
import { ArrowRightIcon, EllipsisVIcon, ExternalLinkAltIcon, GripVerticalIcon } from '@app/icons/rhUiIcons';
import { WidgetCardHeaderLayout, WIDGET_CARD_HEADER_LAYOUT_STYLES } from '@app/Homepage/widgetCardHeaderLayout';
import {
  AnsibleWidgetBody,
  BIG_THREE_PRODUCT_LINKS,
  BIG_THREE_PRODUCT_WIDGET_STYLES,
  BigThreeProductHeader,
  OpenshiftWidgetBody,
  RhelWidgetBody
} from '@app/Homepage/bigThreeProductWidgets';
import { EventsWidgetBody, EventsWidgetHeader, EVENTS_WIDGET_STYLES } from '@app/Homepage/eventsWidget';
import {
  ImageBuilderWidgetBody,
  ImageBuilderWidgetHeader,
  IMAGE_BUILDER_WIDGET_STYLES
} from '@app/Homepage/imageBuilderWidget';
import {
  FavoriteServicesWidgetBody,
  FavoriteServicesWidgetHeader,
  FAVORITE_SERVICES_WIDGET_STYLES
} from '@app/Homepage/favoriteServicesWidget';
import {
  IntegrationsWidgetBody,
  IntegrationsWidgetHeader,
  INTEGRATIONS_WIDGET_STYLES
} from '@app/Homepage/integrationsWidget';
import {
  MyAccountWidgetBody,
  MyAccountWidgetHeader,
  MY_ACCOUNT_WIDGET_STYLES
} from '@app/Homepage/myAccountWidget';
import {
  QuayIoWidgetBody,
  QuayIoWidgetHeader,
  QUAY_IO_WIDGET_STYLES
} from '@app/Homepage/quayIoWidget';
import { RedHatAiWidgetBody, RedHatAiWidgetHeader, RED_HAT_AI_WIDGET_STYLES } from '@app/Homepage/redHatAiWidget';
import { SubscriptionsWidgetBody, SubscriptionsWidgetHeader, SUBSCRIPTIONS_WIDGET_STYLES } from '@app/Homepage/subscriptionsWidget';
import {
  SupportCasesWidgetBody,
  SupportCasesWidgetHeader,
  SUPPORT_CASES_WIDGET_STYLES
} from '@app/Homepage/supportCasesWidget';
import {
  BookmarkedLearningResourcesWidgetBody,
  BookmarkedLearningResourcesWidgetHeader,
  BOOKMARKED_LEARNING_RESOURCES_WIDGET_STYLES
} from '@app/Homepage/bookmarkedLearningResourcesWidget';
import {
  RecentClustersWidgetBody,
  RecentClustersWidgetHeader,
  RECENT_CLUSTERS_WIDGET_STYLES
} from '@app/Homepage/recentClustersWidget';
import {
  ClusterStatusWidgetBody,
  ClusterStatusWidgetHeader,
  CLUSTER_STATUS_WIDGET_STYLES
} from '@app/Homepage/clusterStatusWidget';
import {
  AnsibleSubscriptionUsageWidgetBody,
  AnsibleSubscriptionUsageWidgetHeader,
  OpenshiftSubscriptionUsageWidgetBody,
  OpenshiftSubscriptionUsageWidgetHeader,
  RhelSubscriptionUsageWidgetBody,
  RhelSubscriptionUsageWidgetHeader,
  SUBSCRIPTION_USAGE_WIDGET_STYLES
} from '@app/Homepage/subscriptionUsageWidget';
import {
  CostManagementWidgetBody,
  CostManagementWidgetHeader,
  COST_MANAGEMENT_WIDGET_STYLES
} from '@app/Homepage/costManagementWidget';
import {
  AdvisorRecommendationsWidgetBody,
  AdvisorRecommendationsWidgetHeader,
  ADVISOR_RECOMMENDATIONS_WIDGET_STYLES
} from '@app/Homepage/advisorRecommendationsWidget';
import {
  VulnerabilitiesWidgetBody,
  VulnerabilitiesWidgetHeader,
  VULNERABILITIES_WIDGET_STYLES
} from '@app/Homepage/vulnerabilitiesWidget';
import {
  RedHatSatelliteWidgetBody,
  RedHatSatelliteWidgetHeader,
  RED_HAT_SATELLITE_WIDGET_STYLES
} from '@app/Homepage/redHatSatelliteWidget';
import {
  ActivationKeysWidgetBody,
  ActivationKeysWidgetHeader,
  ACTIVATION_KEYS_WIDGET_STYLES
} from '@app/Homepage/activationKeysWidget';
import {
  ManifestsWidgetBody,
  ManifestsWidgetHeader,
  MANIFESTS_WIDGET_STYLES
} from '@app/Homepage/manifestsWidget';
import {
  SimpleContentAccessWidgetBody,
  SimpleContentAccessWidgetHeader,
  SIMPLE_CONTENT_ACCESS_WIDGET_STYLES
} from '@app/Homepage/simpleContentAccessWidget';
import { CustomBuilderWidgetBody, CUSTOM_BUILDER_WIDGET_STYLES } from '@app/Homepage/customBuilderWidget';
import { getWidgetBuilderHeaderIconComponent } from '@app/Homepage/widgetBuilderHeaderIcons';
import { CLUSTER_STATUS_DISPLAY_STYLES } from '@app/Homepage/clusterStatusDisplay';
import { WidgetColSpanContext } from '@app/Homepage/widgetColSpanContext';
import { WIDGET_DESCRIPTION_LIST_STYLES } from '@app/Homepage/widgetDescriptionList';
import { MAX_ROW_SPAN, MIN_ROW_SPAN, type ColumnSpan, type RowSpan, type Widget } from '@app/Homepage/widgetTypes';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Resizable, type ResizeCallback, type ResizeStartCallback } from 're-resizable';
import { scheduleDeferredResizeObserverWork } from '@app/useDeferredResizeObserver';


export const ROW_HEIGHT = 80; // Logical row height in pixels (two grid sub-rows)

/** Grid track height — half of {@link ROW_HEIGHT} for finer vertical resize steps. */
export const GRID_ROW_HEIGHT = ROW_HEIGHT / 2;

/**
 * Pixel gap between grid tracks — must match `gap` in `WIDGET_GRID_STYLES`
 * (`var(--pf-t--global--spacer--md)`, 16px in default PatternFly tokens).
 */
export const GAP = 16;

/**
 * Column count for packing, resize snaps, and `grid-template-columns`.
 * Uses the measured `.widgets-grid` width — not viewport media queries — so layout matches
 * the main content column when a sidebar or max-width wrapper is present.
 */
export function getDashboardGridColumnCount(gridWidth: number): number {
  const w =
    gridWidth > 0
      ? gridWidth
      : typeof window !== 'undefined'
        ? window.innerWidth
        : 1600;
  if (w <= 768) {
    return 1;
  }
  if (w <= 1200) {
    return 2;
  }
  return 4;
}

/** Inline grid columns — must stay in sync with {@link getDashboardGridColumnCount}. */
export function getWidgetsGridColumnStyle(gridWidth: number): React.CSSProperties {
  const n = getDashboardGridColumnCount(gridWidth);
  return { gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` };
}

export function getWidgetGridSingleColumnWidth(gridWidth: number): number {
  const n = getDashboardGridColumnCount(gridWidth);
  return (gridWidth - GAP * (n - 1)) / n;
}

/** Pixel width for `colSpan` consecutive columns at this grid width (incl. internal gaps). */
export function getPixelWidthForColSpan(gridWidth: number, colSpan: ColumnSpan): number {
  const cw = getWidgetGridSingleColumnWidth(gridWidth);
  return cw * colSpan + GAP * (colSpan - 1);
}

/** Clamp catalog column span to the live grid so we never span past implicit columns (prevents overlap). */
export function getEffectiveColumnSpan(gridWidth: number, colSpan: ColumnSpan): ColumnSpan {
  const n = getDashboardGridColumnCount(gridWidth);
  const capped = Math.min(colSpan, n);
  return (capped >= 1 ? capped : 1) as ColumnSpan;
}

/** 1-based CSS grid line where the widget’s top-left cell starts (computed packing). */
export interface DashboardWidgetPlacement {
  columnStart: number;
  rowStart: number;
}

/** Bias toward the next row span when dragging height (0.5 = midpoint; lower = snap sooner). */
export const ROW_HEIGHT_SNAP_RATIO = 0.06;

const ALL_ROW_SPANS: RowSpan[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

/** Pixel height for `rowSpan` grid tracks — must match CSS grid span sizing (`grid-auto-rows` + `gap`). */
export function getPixelHeightForRowSpan(rowSpan: RowSpan): number {
  return GRID_ROW_HEIGHT * rowSpan + GAP * Math.max(0, rowSpan - 1);
}

/** Human-readable logical row count for resize preview (e.g. 5 units → "2.5"). */
export function formatWidgetRowSpanLabel(rowSpan: RowSpan): string {
  if (rowSpan % 2 === 0) {
    return String(rowSpan / 2);
  }
  return (rowSpan / 2).toFixed(1);
}

/** Row span from pixel height using tighter snap thresholds than a pure midpoint. */
export function getRowSpanFromPixelHeight(height: number): RowSpan {
  for (let i = 0; i < ALL_ROW_SPANS.length; i++) {
    const current = getPixelHeightForRowSpan(ALL_ROW_SPANS[i]);
    const next = ALL_ROW_SPANS[i + 1] ? getPixelHeightForRowSpan(ALL_ROW_SPANS[i + 1]) : Infinity;
    const threshold = current + (next - current) * ROW_HEIGHT_SNAP_RATIO;
    if (height < threshold) {
      return ALL_ROW_SPANS[i];
    }
  }

  return MAX_ROW_SPAN;
}

/** Smallest row span whose grid track height fits `requiredHeight` (px). */
export function getMinimumRowSpanForPixelHeight(requiredHeight: number): RowSpan {
  const safeHeight = Math.max(0, Math.ceil(requiredHeight));

  for (const span of ALL_ROW_SPANS) {
    if (getPixelHeightForRowSpan(span) >= safeHeight) {
      return span;
    }
  }

  return MAX_ROW_SPAN;
}

/** True when body content or a nested scroll region is taller than its visible box. */
export function widgetCardBodyHasVerticalClipping(widgetRoot: HTMLElement): boolean {
  const bodyContent = widgetRoot.querySelector<HTMLElement>('.widget-card__body-content');
  if (!bodyContent) {
    return false;
  }

  if (bodyContent.scrollHeight > bodyContent.clientHeight + 1) {
    return true;
  }

  const descendants = Array.from(bodyContent.querySelectorAll<HTMLElement>('*'));
  for (const element of descendants) {
    const { overflowY, overflow } = getComputedStyle(element);
    const scrollable =
      overflowY === 'auto' || overflowY === 'scroll' || overflow === 'auto' || overflow === 'scroll';
    if (scrollable && element.scrollHeight > element.clientHeight + 1) {
      return true;
    }
  }

  return false;
}

function sumElementHeights(elements: (HTMLElement | null | undefined)[]): number {
  return elements.reduce((total, element) => total + (element?.getBoundingClientRect().height ?? 0), 0);
}

/** Sum the natural laid-out height of widget body content (not the grid cell). */
function measurePinnedWidgetBodyNaturalHeight(bodyContent: HTMLElement): number {
  const directChild = bodyContent.firstElementChild;
  if (!(directChild instanceof HTMLElement)) {
    return bodyContent.scrollHeight;
  }

  const directStyle = getComputedStyle(directChild);
  const padding =
    parseFloat(directStyle.paddingTop) + parseFloat(directStyle.paddingBottom);
  const directHeight = directChild.getBoundingClientRect().height;

  if (directHeight > 0) {
    return directHeight + padding;
  }

  return bodyContent.scrollHeight;
}

/** Measure the pixel height needed to show a widget card header, body, and footer without clipping. */
export function measureWidgetCardFitHeight(
  widgetRoot: HTMLElement,
  options: { naturalLayout?: boolean } = {}
): number | null {
  const naturalLayout =
    options.naturalLayout ?? widgetRoot.classList.contains('is-auto-sizing');

  const card = widgetRoot.querySelector<HTMLElement>('.widget-card');
  if (!card) {
    return null;
  }

  const header = card.querySelector<HTMLElement>('.pf-v6-c-card__header');
  const divider = card.querySelector<HTMLElement>('.pf-v6-c-divider');
  const cardBody = card.querySelector<HTMLElement>('.widget-card__body, .pf-v6-c-card__body');
  const bodyContent = card.querySelector<HTMLElement>('.widget-card__body-content');
  const footer = card.querySelector<HTMLElement>('.pf-v6-c-card__footer');

  if (!bodyContent) {
    return null;
  }

  const cardStyles = getComputedStyle(card);
  const bodyPadding =
    cardBody != null
      ? parseFloat(getComputedStyle(cardBody).paddingTop) +
        parseFloat(getComputedStyle(cardBody).paddingBottom)
      : 0;
  const borderHeight =
    parseFloat(cardStyles.borderTopWidth) + parseFloat(cardStyles.borderBottomWidth);

  if (naturalLayout) {
    const chromeHeight = sumElementHeights([header, divider, footer]) + bodyPadding + borderHeight;
    const bodyNaturalHeight = measurePinnedWidgetBodyNaturalHeight(bodyContent);
    return Math.ceil(chromeHeight + bodyNaturalHeight);
  }

  let total = sumElementHeights([header, divider, footer]) + bodyPadding + bodyContent.scrollHeight + borderHeight;

  return Math.ceil(total);
}

export type WidgetAutoSizeFitHandler = (
  id: string,
  colSpan: ColumnSpan,
  rowSpan: RowSpan,
  complete: boolean
) => void;

/** Measure and apply the minimum row span that fits widget body + footer content. */
export function useWidgetAutoSizeMeasurement({
  enabled,
  paused = false,
  wrapperRef,
  widgetId,
  widgetColSpan,
  gridWidth,
  onAutoSizeFit
}: {
  enabled: boolean;
  paused?: boolean;
  wrapperRef: React.RefObject<HTMLElement | null>;
  widgetId: string;
  widgetColSpan: ColumnSpan;
  gridWidth: number;
  onAutoSizeFit: WidgetAutoSizeFitHandler;
}) {
  const previousFitRowSpanRef = useRef<RowSpan | null>(null);

  useEffect(() => {
    if (!enabled) {
      previousFitRowSpanRef.current = null;
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled || paused) {
      return undefined;
    }

    const wrapper = wrapperRef.current;
    if (!wrapper) {
      return undefined;
    }

    let cancelled = false;
    let debounceId = 0;

    const runMeasure = () => {
      if (cancelled) {
        return;
      }

      const fitHeight = measureWidgetCardFitHeight(wrapper, { naturalLayout: true });
      if (fitHeight == null) {
        return;
      }

      let fitRowSpan = getMinimumRowSpanForPixelHeight(fitHeight);
      if (
        !wrapper.classList.contains('is-auto-sizing') &&
        widgetCardBodyHasVerticalClipping(wrapper) &&
        fitRowSpan < MAX_ROW_SPAN
      ) {
        fitRowSpan = clampRowSpan(fitRowSpan + 1);
      }

      const fitColSpan = getEffectiveColumnSpan(gridWidth, widgetColSpan);
      const isStable =
        previousFitRowSpanRef.current === fitRowSpan &&
        (!widgetCardBodyHasVerticalClipping(wrapper) || wrapper.classList.contains('is-auto-sizing'));
      previousFitRowSpanRef.current = fitRowSpan;
      onAutoSizeFit(widgetId, fitColSpan, fitRowSpan, isStable);
    };

    const scheduleMeasure = () => {
      window.clearTimeout(debounceId);
      debounceId = window.setTimeout(() => {
        scheduleDeferredResizeObserverWork(() => {
          window.requestAnimationFrame(() => {
            window.requestAnimationFrame(runMeasure);
          });
        });
      }, 150);
    };

    const observer = new ResizeObserver(scheduleMeasure);
    observer.observe(wrapper);
    const card = wrapper.querySelector('.widget-card');
    if (card) {
      observer.observe(card);
    }
    scheduleMeasure();

    return () => {
      cancelled = true;
      window.clearTimeout(debounceId);
      observer.disconnect();
    };
  }, [enabled, paused, gridWidth, widgetId, widgetColSpan, onAutoSizeFit, wrapperRef]);
}

/** Clamp and coerce persisted row span values. */
export function clampRowSpan(value: number): RowSpan {
  const rounded = Math.round(value);
  const clamped = Math.max(MIN_ROW_SPAN, Math.min(MAX_ROW_SPAN, rounded));
  return clamped as RowSpan;
}

/** Migrate v1 full-row spans (1–6) to half-row units (2–12). */
export function migrateLegacyRowSpan(rowSpan: number): RowSpan {
  const n = Math.round(rowSpan);
  if (n >= 1 && n <= 6) {
    return (n * 2) as RowSpan;
  }
  return clampRowSpan(n);
}

/** Live resize preview — used to reflow displaced widgets while dragging. */
export interface WidgetResizePreview {
  widgetId: string;
  colSpan: ColumnSpan;
  rowSpan: RowSpan;
  anchorPlacement: DashboardWidgetPlacement;
}

function getWidgetGridSize(
  widget: Widget,
  columnCount: number,
  resizePreview?: WidgetResizePreview | null
): { cw: number; rh: number } {
  const cols = Math.max(1, columnCount);
  if (resizePreview?.widgetId === widget.id) {
    return {
      cw: Math.min(resizePreview.colSpan, cols),
      rh: resizePreview.rowSpan
    };
  }
  return {
    cw: Math.min(widget.colSpan, cols),
    rh: widget.rowSpan
  };
}

function placementsOverlap(
  a: DashboardWidgetPlacement,
  aCols: number,
  aRows: number,
  b: DashboardWidgetPlacement,
  bCols: number,
  bRows: number
): boolean {
  const aColEnd = a.columnStart + aCols;
  const aRowEnd = a.rowStart + aRows;
  const bColEnd = b.columnStart + bCols;
  const bRowEnd = b.rowStart + bRows;

  return (
    a.columnStart < bColEnd &&
    b.columnStart < aColEnd &&
    a.rowStart < bRowEnd &&
    b.rowStart < aRowEnd
  );
}

function unmarkPlacement(
  occupied: boolean[][],
  placement: DashboardWidgetPlacement,
  cols: number,
  rows: number
) {
  const startCol = placement.columnStart - 1;
  const startRow = placement.rowStart - 1;
  for (let r = startRow; r < startRow + rows; r++) {
    for (let c = startCol; c < startCol + cols; c++) {
      if (occupied[r]?.[c]) {
        occupied[r][c] = false;
      }
    }
  }
}

/**
 * First-fit packing in DOM order: assigns non-overlapping grid starts so resize/reflow shifts later widgets
 * instead of painting on top of each other.
 */
export function computeDashboardWidgetPlacements(
  widgets: readonly Widget[],
  columnCount: number,
  resizePreview?: WidgetResizePreview | null
): Map<string, DashboardWidgetPlacement> {
  const placements = new Map<string, DashboardWidgetPlacement>();
  const cols = Math.max(1, columnCount);
  const occupied: boolean[][] = [];
  const maxScanRows = 1000;

  const ensureRow = (r: number) => {
    while (occupied.length <= r) {
      occupied.push(Array.from({ length: cols }, () => false));
    }
  };

  const canPlace = (row: number, col: number, cw: number, rh: number): boolean => {
    if (col + cw > cols) {
      return false;
    }
    for (let r = row; r < row + rh; r++) {
      ensureRow(r);
      for (let c = col; c < col + cw; c++) {
        if (occupied[r][c]) {
          return false;
        }
      }
    }
    return true;
  };

  const mark = (row: number, col: number, cw: number, rh: number) => {
    for (let r = row; r < row + rh; r++) {
      ensureRow(r);
      for (let c = col; c < col + cw; c++) {
        occupied[r][c] = true;
      }
    }
  };

  const placeFirstFit = (widget: Widget): boolean => {
    const { cw, rh } = getWidgetGridSize(widget, cols, resizePreview);
    for (let row = 0; row < maxScanRows; row++) {
      for (let col = 0; col <= cols - cw; col++) {
        if (canPlace(row, col, cw, rh)) {
          mark(row, col, cw, rh);
          placements.set(widget.id, { columnStart: col + 1, rowStart: row + 1 });
          return true;
        }
      }
    }
    return false;
  };

  const resizeIndex = resizePreview
    ? widgets.findIndex((widget) => widget.id === resizePreview.widgetId)
    : -1;

  if (resizePreview && resizeIndex >= 0) {
    for (let i = 0; i < resizeIndex; i++) {
      placeFirstFit(widgets[i]);
    }

    const resizedWidget = widgets[resizeIndex];
    const { cw, rh } = getWidgetGridSize(resizedWidget, cols, resizePreview);
    const anchorCol = resizePreview.anchorPlacement.columnStart - 1;
    const anchorRow = resizePreview.anchorPlacement.rowStart - 1;

    if (anchorCol + cw <= cols && canPlace(anchorRow, anchorCol, cw, rh)) {
      mark(anchorRow, anchorCol, cw, rh);
      placements.set(resizedWidget.id, resizePreview.anchorPlacement);
    } else {
      placeFirstFit(resizedWidget);
    }

    const resizedPlacement = placements.get(resizedWidget.id);
    const displaced: Widget[] = [];

    if (resizedPlacement) {
      for (let i = 0; i < resizeIndex; i++) {
        const earlier = widgets[i];
        const earlierPlacement = placements.get(earlier.id);
        if (!earlierPlacement) {
          continue;
        }
        const earlierSize = getWidgetGridSize(earlier, cols, null);
        if (
          placementsOverlap(
            resizedPlacement,
            cw,
            rh,
            earlierPlacement,
            earlierSize.cw,
            earlierSize.rh
          )
        ) {
          unmarkPlacement(occupied, earlierPlacement, earlierSize.cw, earlierSize.rh);
          placements.delete(earlier.id);
          displaced.push(earlier);
        }
      }
    }

    for (let i = resizeIndex + 1; i < widgets.length; i++) {
      displaced.push(widgets[i]);
    }

    for (const widget of displaced) {
      const existingPlacement = placements.get(widget.id);
      if (existingPlacement) {
        const size = getWidgetGridSize(widget, cols, null);
        unmarkPlacement(occupied, existingPlacement, size.cw, size.rh);
        placements.delete(widget.id);
      }
      placeFirstFit(widget);
    }
  } else {
    for (const widget of widgets) {
      placeFirstFit(widget);
    }
  }

  return placements;
}

// Sortable Widget Card Component with Resizable
interface SortableWidgetCardProps {
  widget: Widget;
  /** Pinned grid position from {@link computeDashboardWidgetPlacements} (reflows when sizes change). */
  placement: DashboardWidgetPlacement;
  children: React.ReactElement<{
    dragHandleProps?: Record<string, unknown>;
    onRemove?: () => void;
  }>;
  onSizeChange: (id: string, colSpan: ColumnSpan, rowSpan: RowSpan) => void;
  onAutoSizeFit: (id: string, colSpan: ColumnSpan, rowSpan: RowSpan, complete: boolean) => void;
  needsAutoSize: boolean;
  onResizePreviewStart: (
    preview: WidgetResizePreview
  ) => void;
  onResizePreviewChange: (colSpan: ColumnSpan, rowSpan: RowSpan) => void;
  onResizePreviewEnd: () => void;
  onRemove: (id: string) => void;
  gridWidth: number;
}

export const SortableWidgetCard: React.FC<SortableWidgetCardProps> = ({
  widget,
  placement,
  children,
  onSizeChange,
  onAutoSizeFit,
  needsAutoSize,
  onResizePreviewStart,
  onResizePreviewChange,
  onResizePreviewEnd,
  onRemove,
  gridWidth
}) => {
  const [isResizing, setIsResizing] = useState(false);
  const [previewColSpan, setPreviewColSpan] = useState<ColumnSpan>(widget.colSpan);
  const [previewRowSpan, setPreviewRowSpan] = useState<RowSpan>(widget.rowSpan);
  const [liveSize, setLiveSize] = useState<{ width: number; height: number } | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: widget.id,
    disabled: isResizing,
    animateLayoutChanges: () => false
  });

  const setWrapperRef = useCallback(
    (node: HTMLDivElement | null) => {
      wrapperRef.current = node;
      setNodeRef(node);
    },
    [setNodeRef]
  );

  const columnCount = getDashboardGridColumnCount(gridWidth);
  const effectiveColSpan = getEffectiveColumnSpan(gridWidth, widget.colSpan);

  const allowedColSpans = useMemo((): ColumnSpan[] => {
    const max = Math.min(4, columnCount);
    return [1, 2, 3, 4].filter((s) => s <= max) as ColumnSpan[];
  }, [columnCount]);

  const getHeightForSpan = (span: RowSpan): number => {
    return getPixelHeightForRowSpan(span);
  };

  const getWidthForSpan = (span: ColumnSpan): number => {
    return getPixelWidthForColSpan(gridWidth, span);
  };

  const getColSpanFromWidth = (width: number): ColumnSpan => {
    let closestSpan: ColumnSpan = allowedColSpans[0] ?? 1;
    let minDiff = Infinity;

    for (const span of allowedColSpans) {
      const spanWidth = getWidthForSpan(span);
      const diff = Math.abs(width - spanWidth);
      if (diff < minDiff) {
        minDiff = diff;
        closestSpan = span;
      }
    }

    return closestSpan;
  };

  const getRowSpanFromHeight = (height: number): RowSpan => {
    return getRowSpanFromPixelHeight(height);
  };

  useWidgetAutoSizeMeasurement({
    enabled: needsAutoSize,
    paused: isResizing || isDragging,
    wrapperRef,
    widgetId: widget.id,
    widgetColSpan: widget.colSpan,
    gridWidth,
    onAutoSizeFit
  });

  useEffect(() => {
    if (!isResizing) {
      setPreviewColSpan(widget.colSpan);
      setPreviewRowSpan(widget.rowSpan);
      setLiveSize(null);
    }
  }, [widget.colSpan, widget.rowSpan, isResizing]);

  const handleResizeStart: ResizeStartCallback = (_e, _direction, ref) => {
    const startWidth = ref.offsetWidth;
    const startHeight = ref.offsetHeight;
    setIsResizing(true);
    setPreviewColSpan(widget.colSpan);
    setPreviewRowSpan(widget.rowSpan);
    setLiveSize({ width: startWidth, height: startHeight });
    onResizePreviewStart({
      widgetId: widget.id,
      colSpan: widget.colSpan,
      rowSpan: widget.rowSpan,
      anchorPlacement: placement
    });
  };

  const handleResize: ResizeCallback = (_e, _direction, ref) => {
    const newWidth = ref.offsetWidth;
    const newHeight = ref.offsetHeight;
    const nextColSpan = getColSpanFromWidth(newWidth);
    const nextRowSpan = getRowSpanFromHeight(newHeight);
    setLiveSize({ width: newWidth, height: newHeight });
    setPreviewColSpan(nextColSpan);
    setPreviewRowSpan(nextRowSpan);
    onResizePreviewChange(nextColSpan, nextRowSpan);
  };

  const handleResizeStop: ResizeCallback = (_e, _direction, ref) => {
    const newWidth = ref.offsetWidth;
    const newHeight = ref.offsetHeight;
    const newColSpan = getColSpanFromWidth(newWidth);
    const newRowSpan = getRowSpanFromHeight(newHeight);
    onSizeChange(widget.id, newColSpan, newRowSpan);
    onResizePreviewEnd();
    setIsResizing(false);
    setLiveSize(null);
  };

  const displayColSpan = isResizing
    ? getEffectiveColumnSpan(gridWidth, previewColSpan)
    : effectiveColSpan;
  const displayRowSpan = isResizing ? previewRowSpan : widget.rowSpan;

  const style: React.CSSProperties = {
    transform: isDragging ? undefined : CSS.Transform.toString(transform),
    transition: isResizing || isDragging ? 'none' : transition,
    zIndex: isDragging ? 1000 : isResizing ? 999 : 'auto',
    gridColumn: `${placement.columnStart} / span ${displayColSpan}`,
    gridRow: `${placement.rowStart} / span ${displayRowSpan}`,
    alignSelf: isResizing || needsAutoSize ? 'start' : undefined,
    minWidth: 0,
    minHeight: 0,
    boxSizing: 'border-box'
  };

  const snappedWidth = getWidthForSpan(displayColSpan);
  const snappedHeight = getHeightForSpan(displayRowSpan);
  const currentWidth = liveSize?.width ?? snappedWidth;
  const currentHeight = liveSize?.height ?? snappedHeight;
  const minColSpan = allowedColSpans[0] ?? 1;
  const maxColSpan = allowedColSpans[allowedColSpans.length - 1] ?? 4;

  return (
    <div
      ref={setWrapperRef}
      style={style}
      data-widget-id={widget.id}
      className={`widget-wrapper${isDragging ? ' is-dragging' : ''}${isResizing ? ' is-resizing' : ''}${needsAutoSize ? ' is-auto-sizing' : ''}`}
    >
      <WidgetColSpanContext.Provider value={displayColSpan}>
        <Resizable
        className={`widget-resizable-root ${isResizing ? 'resizing' : ''}`}
        size={{ width: currentWidth, height: currentHeight }}
        minWidth={getWidthForSpan(minColSpan)}
        maxWidth={getWidthForSpan(maxColSpan)}
        minHeight={getHeightForSpan(MIN_ROW_SPAN)}
        maxHeight={getHeightForSpan(MAX_ROW_SPAN)}
        enable={{
          top: false,
          right: true,
          bottom: true,
          left: false,
          topRight: false,
          bottomRight: true,
          bottomLeft: false,
          topLeft: false
        }}
        handleClasses={{
          right: 'resize-handle resize-handle-right',
          bottom: 'resize-handle resize-handle-bottom',
          bottomRight: 'resize-handle resize-handle-corner'
        }}
        snap={{
          x: allowedColSpans.map((span) => getWidthForSpan(span)),
          y: ALL_ROW_SPANS.map((span) => getHeightForSpan(span))
        }}
        snapGap={2}
        onResizeStart={handleResizeStart}
        onResize={handleResize}
        onResizeStop={handleResizeStop}
      >
        <div className={`resize-preview-indicator ${isResizing ? 'visible' : ''}`}>
          {previewColSpan}×{formatWidgetRowSpanLabel(previewRowSpan)}
        </div>

        {(() => {
          type InjectedChildProps = {
            dragHandleProps?: Record<string, unknown>;
            onRemove?: () => void;
          };

          return React.isValidElement<InjectedChildProps>(children)
            ? React.cloneElement(children, {
                dragHandleProps: { ...attributes, ...listeners },
                onRemove: () => onRemove(widget.id)
              })
            : children;
        })()}
      </Resizable>
      </WidgetColSpanContext.Provider>
    </div>
  );
};

// Generic Widget Card Component
interface WidgetCardProps {
  title: string;
  /** Catalog widget id — used for header lead icon */
  widgetId: string;
  children: React.ReactNode;
  footerContent?: React.ReactNode;
  headerExtra?: React.ReactNode;
  className?: string;
  dragHandleProps?: Record<string, unknown>;
  isFullHeight?: boolean;
  onRemove?: () => void;
  /** Hides kebab, drag, and remove — for read-only surfaces (e.g. console home). */
  readOnly?: boolean;
}

export const WidgetCard: React.FC<WidgetCardProps> = ({ 
  title,
  widgetId,
  children, 
  footerContent, 
  headerExtra, 
  className = '',
  dragHandleProps,
  isFullHeight = true,
  onRemove,
  readOnly = false,
}) => {
  const [isActionsOpen, setIsActionsOpen] = useState(false);

  const onActionsToggle = () => {
    setIsActionsOpen(!isActionsOpen);
  };

  const onActionsSelect = () => {
    setIsActionsOpen(false);
  };

  const handleRemove = () => {
    setIsActionsOpen(false);
    if (onRemove) {
      onRemove();
    }
  };

  const widgetHeaderToolbar = (
    <>
      <Dropdown
        isOpen={isActionsOpen}
        onSelect={onActionsSelect}
        onOpenChange={setIsActionsOpen}
        toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
          <MenuToggle
            ref={toggleRef}
            onClick={onActionsToggle}
            variant="plain"
            isExpanded={isActionsOpen}
            aria-label="Widget actions"
          >
            <EllipsisVIcon />
          </MenuToggle>
        )}
        popperProps={{ position: 'right' }}
      >
        <DropdownList>
          <DropdownItem key="remove" onClick={handleRemove}>
            Remove widget
          </DropdownItem>
        </DropdownList>
      </Dropdown>
      <Button
        variant="plain"
        aria-label="Drag to reorder"
        style={{ cursor: 'grab', touchAction: 'none' }}
        {...dragHandleProps}
      >
        <GripVerticalIcon />
      </Button>
    </>
  );

  const renderCardHeader = () => {
    const toolbar = readOnly ? undefined : widgetHeaderToolbar;

    if (headerExtra && React.isValidElement(headerExtra)) {
      return React.cloneElement(
        headerExtra as React.ReactElement<{ toolbar?: React.ReactNode }>,
        { toolbar }
      );
    }

    return <WidgetCardHeaderLayout widgetId={widgetId} title={title} toolbar={toolbar} />;
  };

  if (readOnly) {
    return (
      <Card
        isFullHeight={isFullHeight}
        className={`widget-card ${className}${footerContent ? ' widget-card--has-card-footer' : ''}`}
      >
        <CardHeader>{renderCardHeader()}</CardHeader>
        <Divider />
        <CardBody className="widget-card__body">
          <div className="widget-card__body-content">{children}</div>
        </CardBody>
        {footerContent && <CardFooter>{footerContent}</CardFooter>}
      </Card>
    );
  }

  return (
    <Card
      isFullHeight={isFullHeight}
      className={`widget-card ${className}${footerContent ? ' widget-card--has-card-footer' : ''}`}
    >
      <CardHeader>{renderCardHeader()}</CardHeader>
      <Divider />
      <CardBody className="widget-card__body">
        <div className="widget-card__body-content">{children}</div>
      </CardBody>
      {footerContent && (
        <CardFooter>
          {footerContent}
        </CardFooter>
      )}
    </Card>
  );
};

const RECENTLY_VISITED_LINKS: Array<{ label: string; href: string; bundle?: string }> = [
  { label: 'Dashboard Hub', href: '/dashboard-hub' },
  { label: 'Alert manager', href: '/alert-manager', bundle: 'Settings' },
  { label: 'Data integration', href: '/data-integration', bundle: 'Settings' },
  { label: 'My user access', href: '/my-user-access', bundle: 'IAM' },
  { label: 'Event log', href: '/event-log', bundle: 'Settings' }
];

export function renderHomepageWidgetContent(
  widget: Widget,
  context: {
    navigate: NavigateFunction;
    dragHandleProps?: Record<string, unknown>;
    onRemove?: () => void;
    readOnly?: boolean;
  }
) {
  const { navigate, dragHandleProps, onRemove, readOnly } = context;
    switch (widget.id) {
      case 'rhel':
        return (
          <WidgetCard
            onRemove={onRemove}
            title={widget.title}
            widgetId={widget.id}
            className="widget-card--pinned-body-footer"
            dragHandleProps={dragHandleProps}
            readOnly={readOnly}
            headerExtra={
              <BigThreeProductHeader
                widgetId={widget.id}
                title={widget.title}
                dashboardHref={BIG_THREE_PRODUCT_LINKS.rhel.dashboard}
              />
            }
          >
            <RhelWidgetBody />
          </WidgetCard>
        );

      case 'openshift':
        return (
          <WidgetCard
            title={widget.title}
            widgetId={widget.id}
            className="widget-card--pinned-body-footer"
            dragHandleProps={dragHandleProps}
            onRemove={onRemove}
            readOnly={readOnly}
            headerExtra={
              <BigThreeProductHeader
                widgetId={widget.id}
                title={widget.title}
                dashboardHref={BIG_THREE_PRODUCT_LINKS.openshift.dashboard}
              />
            }
          >
            <OpenshiftWidgetBody />
          </WidgetCard>
        );

      case 'ansible':
        return (
          <WidgetCard
            title={widget.title}
            widgetId={widget.id}
            className="widget-card--pinned-body-footer"
            dragHandleProps={dragHandleProps}
            onRemove={onRemove}
            readOnly={readOnly}
            headerExtra={
              <BigThreeProductHeader
                widgetId={widget.id}
                title={widget.title}
                dashboardHref={BIG_THREE_PRODUCT_LINKS.ansible.dashboard}
              />
            }
          >
            <AnsibleWidgetBody />
          </WidgetCard>
        );

      case 'recently-visited':
        return (
          <WidgetCard 
            title={widget.title}
            widgetId={widget.id}
            className="widget-card--recently-visited"
            dragHandleProps={dragHandleProps}
            onRemove={onRemove}
            readOnly={readOnly}
          >
            <SimpleList aria-label="Recently visited">
                  {RECENTLY_VISITED_LINKS.map(({ label, href, bundle }) => (
                    <SimpleListItem
                      key={href}
                      component="a"
                      href={href}
                      onClick={(event) => {
                        event.preventDefault();
                        navigate(href);
                      }}
                    >
                      <span className="recently-visited-item">
                        <span className="recently-visited-item__label">{label}</span>
                        {bundle ? (
                          <span className="recently-visited-item__bundle">{bundle}</span>
                        ) : null}
                      </span>
                    </SimpleListItem>
                  ))}
            </SimpleList>
          </WidgetCard>
        );

      case 'my-favorite-services':
        return (
          <WidgetCard
            title={widget.title}
            widgetId={widget.id}
            className="widget-card--favorite-services"
            dragHandleProps={dragHandleProps}
            onRemove={onRemove}
            readOnly={readOnly}
            headerExtra={<FavoriteServicesWidgetHeader title={widget.title} />}
          >
            <FavoriteServicesWidgetBody navigate={navigate} />
          </WidgetCard>
        );

      case 'image-builder':
        return (
          <WidgetCard
            title={widget.title}
            widgetId={widget.id}
            className="widget-card--pinned-body-footer"
            dragHandleProps={dragHandleProps}
            onRemove={onRemove}
            readOnly={readOnly}
            headerExtra={<ImageBuilderWidgetHeader title={widget.title} />}
          >
            <ImageBuilderWidgetBody />
          </WidgetCard>
        );

      case 'explore-capabilities':
        return (
          <WidgetCard
            title={widget.title}
            widgetId={widget.id}
            className="widget-card--explore-capabilities"
            dragHandleProps={dragHandleProps}
            onRemove={onRemove}
            readOnly={readOnly}
          >
            <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsMd' }}>
              {/* First row - 3 cards */}
              <FlexItem>
                <Flex direction={{ default: 'row' }} spaceItems={{ default: 'spaceItemsMd' }} flexWrap={{ default: 'wrap' }}>
                  <FlexItem flex={{ default: 'flex_1' }} style={{ minWidth: '180px' }}>
                    <Card 
                      onClick={() => navigate('/tour')} 
                      className="explore-capability-card"
                      isCompact
                      variant="secondary"
                    >
                      <CardBody>
                        <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsSm' }}>
                          <FlexItem>
                            <Title headingLevel="h4" size="md">
                              Get started with a tour
                            </Title>
                          </FlexItem>
                          <FlexItem>
                            <Content component="small">
                              Take a quick guided tour to understand how the Red Hat Hybrid Cloud Console's capabilities will increase your efficiency
                            </Content>
                          </FlexItem>
                        </Flex>
                      </CardBody>
                    </Card>
                  </FlexItem>
                  <FlexItem flex={{ default: 'flex_1' }} style={{ minWidth: '180px' }}>
                    <Card 
                      onClick={() => navigate('/openshift-aws')} 
                      className="explore-capability-card"
                      isCompact
                      variant="secondary"
                    >
                      <CardBody>
                        <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsSm' }}>
                          <FlexItem>
                            <Title headingLevel="h4" size="md">
                              Try OpenShift on AWS
                            </Title>
                          </FlexItem>
                          <FlexItem>
                            <Content component="small">
                              Quickly build, deploy, and scale applications with Red Hat OpenShift Service on AWS (ROSA), our fully-managed turnkey application platform.
                            </Content>
                          </FlexItem>
                        </Flex>
                      </CardBody>
                    </Card>
                  </FlexItem>
                  <FlexItem flex={{ default: 'flex_1' }} style={{ minWidth: '180px' }}>
                    <Card 
                      onClick={() => navigate('/developer-sandbox')} 
                      className="explore-capability-card"
                      isCompact
                      variant="secondary"
                    >
                      <CardBody>
                        <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsSm' }}>
                          <FlexItem>
                            <Title headingLevel="h4" size="md">
                              Try our products in the Developer Sandbox
                            </Title>
                          </FlexItem>
                          <FlexItem>
                            <Content component="small">
                              The Developer Sandbox offers no-cost access to Red Hat products and technologies for trial use - no setup or configuration necessary.
                            </Content>
                          </FlexItem>
                        </Flex>
                      </CardBody>
                    </Card>
                  </FlexItem>
                </Flex>
              </FlexItem>
              {/* Second row - 2 cards */}
              <FlexItem>
                <Flex direction={{ default: 'row' }} spaceItems={{ default: 'spaceItemsMd' }} justifyContent={{ default: 'justifyContentFlexStart' }} flexWrap={{ default: 'wrap' }}>
                  <FlexItem flex={{ default: 'flex_1' }} style={{ minWidth: '180px', maxWidth: 'calc(33.333% - 8px)' }}>
                    <Card 
                      onClick={() => navigate('/rhel-analysis')} 
                      className="explore-capability-card"
                      isCompact
                      variant="secondary"
                    >
                      <CardBody>
                        <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsSm' }}>
                          <FlexItem>
                            <Title headingLevel="h4" size="md">
                              Analyze RHEL environments
                            </Title>
                          </FlexItem>
                          <FlexItem>
                            <Content component="small">
                              Analyze platforms and applications from the console to better manage your hybrid cloud environments.
                            </Content>
                          </FlexItem>
                        </Flex>
                      </CardBody>
                    </Card>
                  </FlexItem>
                  <FlexItem flex={{ default: 'flex_1' }} style={{ minWidth: '180px', maxWidth: 'calc(33.333% - 8px)' }}>
                    <Card 
                      onClick={() => navigate('/centos-rhel-conversion')} 
                      className="explore-capability-card"
                      isCompact
                      variant="secondary"
                    >
                      <CardBody>
                        <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsSm' }}>
                          <FlexItem>
                            <Title headingLevel="h4" size="md">
                              Convert from CentOS to RHEL
                            </Title>
                          </FlexItem>
                          <FlexItem>
                            <Content component="small">
                              Seamlessly migrate your CentOS systems to Red Hat Enterprise Linux with our conversion tools and guidance.
                            </Content>
                          </FlexItem>
                        </Flex>
                      </CardBody>
                    </Card>
                  </FlexItem>
                </Flex>
              </FlexItem>
            </Flex>
          </WidgetCard>
        );

      case 'red-hat-ai':
        return (
          <WidgetCard
            title={widget.title}
            widgetId={widget.id}
            className="widget-card--pinned-body-footer"
            dragHandleProps={dragHandleProps}
            onRemove={onRemove}
            readOnly={readOnly}
            headerExtra={<RedHatAiWidgetHeader title={widget.title} />}
          >
            <RedHatAiWidgetBody />
          </WidgetCard>
        );

      case 'subscriptions':
        return (
          <WidgetCard
            title={widget.title}
            widgetId={widget.id}
            className="widget-card--subscriptions"
            dragHandleProps={dragHandleProps}
            onRemove={onRemove}
            readOnly={readOnly}
            headerExtra={
              <SubscriptionsWidgetHeader title={widget.title} />
            }
          >
            <SubscriptionsWidgetBody />
          </WidgetCard>
        );

      case 'events':
        return (
          <WidgetCard
            title={widget.title}
            widgetId={widget.id}
            className="widget-card--events widget-card--pinned-body-footer"
            dragHandleProps={dragHandleProps}
            onRemove={onRemove}
            readOnly={readOnly}
            headerExtra={<EventsWidgetHeader title={widget.title} />}
          >
            <EventsWidgetBody />
          </WidgetCard>
        );

      case 'support-cases':
        return (
          <WidgetCard
            title={widget.title}
            widgetId={widget.id}
            className="widget-card--support-cases widget-card--pinned-body-footer"
            dragHandleProps={dragHandleProps}
            onRemove={onRemove}
            readOnly={readOnly}
            headerExtra={<SupportCasesWidgetHeader title={widget.title} />}
          >
            <SupportCasesWidgetBody />
          </WidgetCard>
        );

      case 'integrations':
        return (
          <WidgetCard
            title={widget.title}
            widgetId={widget.id}
            className="widget-card--integrations widget-card--pinned-body-footer"
            dragHandleProps={dragHandleProps}
            onRemove={onRemove}
            readOnly={readOnly}
            headerExtra={<IntegrationsWidgetHeader title={widget.title} />}
          >
            <IntegrationsWidgetBody />
          </WidgetCard>
        );

      case 'quay-io':
        return (
          <WidgetCard
            title={widget.title}
            widgetId={widget.id}
            className="widget-card--quay-io widget-card--pinned-body-footer"
            dragHandleProps={dragHandleProps}
            onRemove={onRemove}
            readOnly={readOnly}
            headerExtra={<QuayIoWidgetHeader title={widget.title} />}
          >
            <QuayIoWidgetBody />
          </WidgetCard>
        );

      case 'bookmarked-learning-resources':
        return (
          <WidgetCard
            title={widget.title}
            widgetId={widget.id}
            className="widget-card--bookmarked-learning-resources widget-card--pinned-body-footer"
            dragHandleProps={dragHandleProps}
            onRemove={onRemove}
            readOnly={readOnly}
            headerExtra={<BookmarkedLearningResourcesWidgetHeader title={widget.title} />}
          >
            <BookmarkedLearningResourcesWidgetBody />
          </WidgetCard>
        );

      case 'recent-clusters':
        return (
          <WidgetCard
            title={widget.title}
            widgetId={widget.id}
            className="widget-card--recent-clusters"
            dragHandleProps={dragHandleProps}
            onRemove={onRemove}
            readOnly={readOnly}
            headerExtra={<RecentClustersWidgetHeader title={widget.title} />}
          >
            <RecentClustersWidgetBody />
          </WidgetCard>
        );

      case 'cluster-status':
        return (
          <WidgetCard
            title={widget.title}
            widgetId={widget.id}
            className="widget-card--cluster-status"
            dragHandleProps={dragHandleProps}
            onRemove={onRemove}
            readOnly={readOnly}
            headerExtra={<ClusterStatusWidgetHeader title={widget.title} />}
          >
            <ClusterStatusWidgetBody />
          </WidgetCard>
        );

      case 'openshift-subscription-usage':
        return (
          <WidgetCard
            title={widget.title}
            widgetId={widget.id}
            className="widget-card--subscription-usage"
            dragHandleProps={dragHandleProps}
            onRemove={onRemove}
            readOnly={readOnly}
            headerExtra={<OpenshiftSubscriptionUsageWidgetHeader title={widget.title} />}
          >
            <OpenshiftSubscriptionUsageWidgetBody />
          </WidgetCard>
        );

      case 'rhel-subscription-usage':
        return (
          <WidgetCard
            title={widget.title}
            widgetId={widget.id}
            className="widget-card--subscription-usage"
            dragHandleProps={dragHandleProps}
            onRemove={onRemove}
            readOnly={readOnly}
            headerExtra={<RhelSubscriptionUsageWidgetHeader title={widget.title} />}
          >
            <RhelSubscriptionUsageWidgetBody />
          </WidgetCard>
        );

      case 'ansible-subscription-usage':
        return (
          <WidgetCard
            title={widget.title}
            widgetId={widget.id}
            className="widget-card--subscription-usage"
            dragHandleProps={dragHandleProps}
            onRemove={onRemove}
            readOnly={readOnly}
            headerExtra={<AnsibleSubscriptionUsageWidgetHeader title={widget.title} />}
          >
            <AnsibleSubscriptionUsageWidgetBody />
          </WidgetCard>
        );

      case 'openshift-cost-management':
        return (
          <WidgetCard
            title={widget.title}
            widgetId={widget.id}
            className="widget-card--cost-management"
            dragHandleProps={dragHandleProps}
            onRemove={onRemove}
            readOnly={readOnly}
            headerExtra={<CostManagementWidgetHeader title={widget.title} />}
          >
            <CostManagementWidgetBody />
          </WidgetCard>
        );

      case 'advisor-recommendations':
        return (
          <WidgetCard
            title={widget.title}
            widgetId={widget.id}
            className="widget-card--advisor-recommendations widget-card--pinned-body-footer"
            dragHandleProps={dragHandleProps}
            onRemove={onRemove}
            readOnly={readOnly}
            headerExtra={<AdvisorRecommendationsWidgetHeader title={widget.title} />}
          >
            <AdvisorRecommendationsWidgetBody defaultProductTab={widget.defaultProductTab} />
          </WidgetCard>
        );

      case 'vulnerabilities':
        return (
          <WidgetCard
            title={widget.title}
            widgetId={widget.id}
            className="widget-card--vulnerabilities widget-card--pinned-body-footer"
            dragHandleProps={dragHandleProps}
            onRemove={onRemove}
            readOnly={readOnly}
            headerExtra={<VulnerabilitiesWidgetHeader title={widget.title} />}
          >
            <VulnerabilitiesWidgetBody defaultProductTab={widget.defaultProductTab} />
          </WidgetCard>
        );

      case 'red-hat-satellite':
        return (
          <WidgetCard
            title={widget.title}
            widgetId={widget.id}
            className="widget-card--red-hat-satellite"
            dragHandleProps={dragHandleProps}
            onRemove={onRemove}
            readOnly={readOnly}
            headerExtra={<RedHatSatelliteWidgetHeader title={widget.title} />}
          >
            <RedHatSatelliteWidgetBody />
          </WidgetCard>
        );

      case 'my-account':
        return (
          <WidgetCard
            title={widget.title}
            widgetId={widget.id}
            className="widget-card--my-account widget-card--pinned-body-footer"
            dragHandleProps={dragHandleProps}
            onRemove={onRemove}
            readOnly={readOnly}
            headerExtra={<MyAccountWidgetHeader title={widget.title} />}
          >
            <MyAccountWidgetBody />
          </WidgetCard>
        );

      case 'activation-keys':
        return (
          <WidgetCard
            title={widget.title}
            widgetId={widget.id}
            className="widget-card--activation-keys widget-card--pinned-body-footer"
            dragHandleProps={dragHandleProps}
            onRemove={onRemove}
            readOnly={readOnly}
            headerExtra={<ActivationKeysWidgetHeader title={widget.title} />}
          >
            <ActivationKeysWidgetBody />
          </WidgetCard>
        );

      case 'manifests':
        return (
          <WidgetCard
            title={widget.title}
            widgetId={widget.id}
            className="widget-card--manifests widget-card--pinned-body-footer"
            dragHandleProps={dragHandleProps}
            onRemove={onRemove}
            readOnly={readOnly}
            headerExtra={<ManifestsWidgetHeader title={widget.title} />}
          >
            <ManifestsWidgetBody />
          </WidgetCard>
        );

      case 'simple-content-access-sca':
        return (
          <WidgetCard
            title={widget.title}
            widgetId={widget.id}
            className="widget-card--simple-content-access-sca widget-card--pinned-body-footer"
            dragHandleProps={dragHandleProps}
            onRemove={onRemove}
            readOnly={readOnly}
            headerExtra={<SimpleContentAccessWidgetHeader title={widget.title} />}
          >
            <SimpleContentAccessWidgetBody />
          </WidgetCard>
        );

      // Widget builder output and legacy placeholders
      default:
        if (widget.customBuilder) {
          const HeaderIcon = getWidgetBuilderHeaderIconComponent(widget.customBuilder.headerIconId);
          return (
            <WidgetCard
              title={widget.title}
              widgetId={widget.id}
              className="widget-card--custom-builder"
              dragHandleProps={dragHandleProps}
              onRemove={onRemove}
              readOnly={readOnly}
              headerExtra={
                <WidgetCardHeaderLayout
                  widgetId={widget.id}
                  title={widget.title}
                  headerLeadIcon={HeaderIcon}
                />
              }
            >
              <CustomBuilderWidgetBody blocks={widget.customBuilder.blocks} />
            </WidgetCard>
          );
        }

        return (
          <WidgetCard
            title={widget.title}
            widgetId={widget.id}
            dragHandleProps={dragHandleProps}
            onRemove={onRemove}
            readOnly={readOnly}
            footerContent={
              widget.footerText && (
                <Button
                  variant="link"
                  iconPosition="end"
                  icon={<ArrowRightIcon />}
                  onClick={() => widget.navigateTo && navigate(widget.navigateTo)}
                >
                  {widget.footerText}
                </Button>
              )
            }
          >
            <Content
              component="p"
              style={{ color: 'var(--pf-t--global--text--color--subtle, var(--pf-v6-global--Color--200))' }}
            >
              Widget content will be added in a follow-up.
            </Content>
          </WidgetCard>
        );
    }
}

/** Non-interactive grid cell — same grid placement as sortable widgets, without DnD or resize. */
export function ReadOnlyHomepageWidgetFrame({
  widget,
  gridWidth,
  placement,
  children,
  autoSize = false,
  onAutoSizeFit
}: {
  widget: Widget;
  /** Width of `.widgets-grid` (ResizeObserver); omit only if unavailable (falls back to wide desktop). */
  gridWidth?: number;
  placement: DashboardWidgetPlacement;
  children: React.ReactNode;
  autoSize?: boolean;
  onAutoSizeFit?: WidgetAutoSizeFitHandler;
}) {
  const w = gridWidth ?? 1600;
  const effectiveColSpan = getEffectiveColumnSpan(w, widget.colSpan);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const needsAutoSize = autoSize && Boolean(onAutoSizeFit);

  useWidgetAutoSizeMeasurement({
    enabled: needsAutoSize,
    wrapperRef,
    widgetId: widget.id,
    widgetColSpan: widget.colSpan,
    gridWidth: w,
    onAutoSizeFit: onAutoSizeFit ?? (() => undefined)
  });

  const explicitWidth = getPixelWidthForColSpan(w, effectiveColSpan);
  const explicitHeight = getPixelHeightForRowSpan(widget.rowSpan);

  const style: React.CSSProperties = {
    gridColumn: `${placement.columnStart} / span ${effectiveColSpan}`,
    gridRow: `${placement.rowStart} / span ${widget.rowSpan}`,
    alignSelf: needsAutoSize ? 'start' : undefined,
    minWidth: 0,
    minHeight: 0,
    boxSizing: 'border-box'
  };
  return (
    <WidgetColSpanContext.Provider value={effectiveColSpan}>
      <div
        ref={wrapperRef}
        className={`widget-wrapper read-only-homepage-widget${needsAutoSize ? ' is-auto-sizing' : ''}`}
        style={style}
      >
        <div
          className="widget-resizable-root"
          style={{
            width: explicitWidth,
            height: needsAutoSize ? undefined : explicitHeight,
            boxSizing: 'border-box'
          }}
        >
          {children}
        </div>
      </div>
    </WidgetColSpanContext.Provider>
  );
}

export const WIDGET_GRID_STYLES = `
    ${BIG_THREE_PRODUCT_WIDGET_STYLES}
    ${RED_HAT_AI_WIDGET_STYLES}
    ${IMAGE_BUILDER_WIDGET_STYLES}
    ${FAVORITE_SERVICES_WIDGET_STYLES}
    ${SUBSCRIPTIONS_WIDGET_STYLES}
    ${SUPPORT_CASES_WIDGET_STYLES}
    ${EVENTS_WIDGET_STYLES}
    ${INTEGRATIONS_WIDGET_STYLES}
    ${QUAY_IO_WIDGET_STYLES}
    ${BOOKMARKED_LEARNING_RESOURCES_WIDGET_STYLES}
    ${RECENT_CLUSTERS_WIDGET_STYLES}
    ${CLUSTER_STATUS_DISPLAY_STYLES}
    ${CLUSTER_STATUS_WIDGET_STYLES}
    ${SUBSCRIPTION_USAGE_WIDGET_STYLES}
    ${COST_MANAGEMENT_WIDGET_STYLES}
    ${ADVISOR_RECOMMENDATIONS_WIDGET_STYLES}
    ${VULNERABILITIES_WIDGET_STYLES}
    ${CUSTOM_BUILDER_WIDGET_STYLES}
    ${RED_HAT_SATELLITE_WIDGET_STYLES}
    ${ACTIVATION_KEYS_WIDGET_STYLES}
    ${MANIFESTS_WIDGET_STYLES}
    ${SIMPLE_CONTENT_ACCESS_WIDGET_STYLES}
    ${WIDGET_DESCRIPTION_LIST_STYLES}
    ${MY_ACCOUNT_WIDGET_STYLES}
    ${WIDGET_CARD_HEADER_LAYOUT_STYLES}
    .pf-v6-c-card.explore-capability-card {
      cursor: pointer !important;
      border: 1px solid var(--pf-v6-global--BorderColor--100) !important;
      transition: all 0.2s ease-in-out !important;
    }
    .pf-v6-c-card.explore-capability-card:hover {
      border: 1px solid var(--pf-v6-global--primary-color--100) !important;
      box-shadow: var(--pf-v6-global--BoxShadow--md) !important;
      background-color: var(--pf-v6-global--BackgroundColor--300) !important;
      transform: translateY(-2px) !important;
    }
    .pf-v6-c-card.explore-capability-card:active {
      transform: translateY(0px) !important;
    }
    
    /* Column count is set inline via getWidgetsGridColumnStyle() — not viewport media queries */
    .widgets-grid {
      display: grid;
      grid-auto-rows: ${GRID_ROW_HEIGHT}px;
      grid-auto-flow: row;
      gap: ${GAP}px;
      align-items: stretch;
      width: 100%;
      min-width: 0;
    }

    .widgets-grid > .widget-wrapper {
      min-width: 0;
      min-height: 0;
      box-sizing: border-box;
    }

    .widgets-grid > .widget-wrapper.is-resizing {
      align-self: start;
    }

    .widgets-grid.is-resize-active > .widget-wrapper:not(.is-resizing) {
      transition:
        grid-row-start 180ms ease,
        grid-column-start 180ms ease,
        grid-row-end 180ms ease,
        grid-column-end 180ms ease;
    }

    .widget-resizable-root {
      box-sizing: border-box;
      min-width: 0 !important;
      min-height: 0 !important;
      max-width: 100%;
    }

    .widget-resizable-root .widget-card {
      min-width: 0;
    }
    
    /* Widget wrapper */
    .widget-wrapper {
      position: relative;
    }

    .widget-wrapper.read-only-homepage-widget .widget-resizable-root {
      min-width: 0 !important;
      max-width: 100%;
      display: flex;
      flex-direction: column;
    }

    .widget-wrapper.read-only-homepage-widget .widget-resizable-root .widget-card {
      flex: 1 1 auto;
      min-height: 0;
    }

    .widget-card--explore-capabilities .widget-card__body,
    .widget-card--explore-capabilities .pf-v6-c-card__body {
      flex-grow: 0 !important;
    }

    .widget-card--explore-capabilities .widget-card__body-content {
      flex: none !important;
    }

    .widget-wrapper.is-dragging {
      z-index: 1;
    }

    .widget-wrapper.is-dragging .widget-card {
      opacity: 0.35;
      outline: 2px dashed var(--pf-v6-global--BorderColor--200);
      outline-offset: -2px;
    }

    .widget-wrapper.is-resizing {
      z-index: 999;
    }

    /* During auto-size, unlock flex/scroll constraints so natural content height can be measured. */
    .widget-wrapper.is-auto-sizing {
      overflow: visible;
      z-index: 2;
    }

    .widget-wrapper.is-auto-sizing .widget-resizable-root {
      height: auto !important;
      min-height: 0 !important;
      max-height: none !important;
    }

    .widget-wrapper.is-auto-sizing .widget-card {
      height: auto !important;
      min-height: 0 !important;
    }

    .widget-wrapper.is-auto-sizing .widget-card__body,
    .widget-wrapper.is-auto-sizing .widget-card .pf-v6-c-card__body {
      flex-grow: 0 !important;
      min-height: 0 !important;
      height: auto !important;
      overflow: visible !important;
    }

    .widget-wrapper.is-auto-sizing .widget-card__body-content {
      flex: none !important;
      min-height: 0 !important;
      height: auto !important;
      overflow: visible !important;
      display: block !important;
    }

    .widget-wrapper.is-auto-sizing .widget-card__body-content > * {
      height: auto !important;
      min-height: auto !important;
      max-height: none !important;
      overflow: visible !important;
      flex: none !important;
    }

    .widget-wrapper.is-auto-sizing .widget-card__body-content [class*='__content'],
    .widget-wrapper.is-auto-sizing .widget-card__body-content [class*='__footer'],
    .widget-wrapper.is-auto-sizing .widget-card__body-content [class*='__actions'],
    .widget-wrapper.is-auto-sizing .widget-card__body-content [class*='__create'] {
      flex: none !important;
      height: auto !important;
      min-height: auto !important;
      overflow: visible !important;
    }

    .widget-wrapper.is-auto-sizing .widget-card__body-content [class*='__table-wrap'] {
      overflow: visible !important;
      flex: none !important;
      height: auto !important;
    }

    .widget-wrapper.is-auto-sizing .subscriptions-widget-body {
      grid-auto-rows: auto !important;
      align-content: start !important;
      height: auto !important;
    }

    .widget-wrapper.is-auto-sizing .subscriptions-widget-body .subscriptions-status-alert {
      height: auto !important;
    }

    .widget-wrapper.is-auto-sizing .vulnerabilities-widget--wide,
    .widget-wrapper.is-auto-sizing .vulnerabilities-widget--wide .vulnerabilities-widget__panel,
    .widget-wrapper.is-auto-sizing .vulnerabilities-widget--wide .vulnerabilities-widget__content {
      flex: none !important;
      height: auto !important;
      min-height: auto !important;
    }

    .widget-grid-drag-overlay {
      opacity: 0.96;
      box-shadow: var(--pf-v6-global--BoxShadow--xl);
      cursor: grabbing;
      pointer-events: none;
    }

    .widget-grid-drag-overlay .widget-card {
      border-color: var(--pf-v6-global--primary-color--100);
      box-shadow: var(--pf-v6-global--BoxShadow--xl);
    }
    
    /* Widget card fills its container */
    .widget-card {
      height: 100% !important;
      display: flex !important;
      flex-direction: column !important;
      --pf-v6-c-card--first-child--PaddingBlockStart: var(--pf-t--global--spacer--sm);
    }
    
    .widget-card .widget-card__body,
    .widget-card .pf-v6-c-card__body {
      flex-grow: 1 !important;
      min-height: 0 !important;
      display: flex !important;
      flex-direction: column !important;
      overflow: hidden !important;
      padding-block-end: var(--pf-t--global--spacer--md);
      padding-inline-start: var(--pf-t--global--spacer--md);
      padding-inline-end: var(--pf-t--global--spacer--md);
    }

    .widget-card .widget-card__body-content {
      flex: 1 1 auto;
      min-height: 0;
      min-width: 0;
    }

    .widget-card:not(.widget-card--pinned-body-footer) .widget-card__body-content {
      overflow: auto;
    }

    .widget-card--pinned-body-footer .widget-card__body-content {
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    /* Tight space above pinned in-card actions; card body keeps md padding below footer */
    .widget-card--pinned-body-footer .widget-card__body-content > [class*='-widget'] {
      gap: var(--pf-t--global--spacer--xs);
      row-gap: var(--pf-t--global--spacer--xs);
    }

    .widget-card--pinned-body-footer .widget-card__body-content [class*='__actions'],
    .widget-card--pinned-body-footer .widget-card__body-content [class*='__footer'],
    .widget-card--pinned-body-footer .widget-card__body-content [class*='__pagination'],
    .widget-card--pinned-body-footer .widget-card__body-content [class*='__create'] {
      margin-top: 0;
      padding-block-start: 0;
    }

    .widget-card--has-card-footer .widget-card__body-content {
      overflow: auto;
    }

    .widget-card.widget-card--recently-visited .pf-v6-c-card__body,
    .widget-card.widget-card--favorite-services .pf-v6-c-card__body,
    .widget-card.widget-card--events .pf-v6-c-card__body,
    .widget-card.widget-card--support-cases .pf-v6-c-card__body,
    .widget-card.widget-card--bookmarked-learning-resources .pf-v6-c-card__body,
    .widget-card.widget-card--recent-clusters .pf-v6-c-card__body {
      padding-inline-start: 4px !important;
      padding-inline-end: 4px !important;
    }

    .widget-card.widget-card--subscription-usage .widget-card__body,
    .widget-card.widget-card--subscription-usage .pf-v6-c-card__body {
      padding-inline-start: 0 !important;
      padding-inline-end: 0 !important;
      padding-block-end: 0 !important;
    }

    .widget-card.widget-card--cost-management .widget-card__body,
    .widget-card.widget-card--cost-management .pf-v6-c-card__body {
      padding-inline-start: 0 !important;
      padding-inline-end: 0 !important;
      padding-block-end: 0 !important;
    }

    .widget-card.widget-card--advisor-recommendations .widget-card__body,
    .widget-card.widget-card--advisor-recommendations .pf-v6-c-card__body {
      padding-inline-start: 0 !important;
      padding-inline-end: 0 !important;
      padding-block-end: 0 !important;
    }

    .widget-card.widget-card--vulnerabilities .widget-card__body,
    .widget-card.widget-card--vulnerabilities .pf-v6-c-card__body {
      padding-inline-start: 0 !important;
      padding-inline-end: 0 !important;
      padding-block-end: 0 !important;
    }

    .widget-card.pf-v6-c-card > .pf-v6-c-divider + .pf-v6-c-card__body {
      padding-block-start: var(--pf-t--global--spacer--md);
    }

    .widget-card.widget-card--subscription-usage.pf-v6-c-card > .pf-v6-c-divider + .pf-v6-c-card__body {
      padding-block-start: 0 !important;
    }

    .widget-card.widget-card--cost-management.pf-v6-c-card > .pf-v6-c-divider + .pf-v6-c-card__body {
      padding-block-start: 0 !important;
    }

    .widget-card.widget-card--advisor-recommendations.pf-v6-c-card > .pf-v6-c-divider + .pf-v6-c-card__body {
      padding-block-start: 0 !important;
    }

    .widget-card.widget-card--vulnerabilities.pf-v6-c-card > .pf-v6-c-divider + .pf-v6-c-card__body {
      padding-block-start: 0 !important;
    }
    
    .widget-card .pf-v6-c-card__header,
    .widget-card .pf-v6-c-card__footer {
      flex-shrink: 0 !important;
    }

    .widget-card .pf-v6-c-card__header {
      align-items: flex-start;
      padding-block-start: calc(var(--pf-t--global--spacer--sm) + var(--pf-t--global--spacer--xs));
      padding-block-end: calc(var(--pf-t--global--spacer--sm) + var(--pf-t--global--spacer--xs));
    }

    .widget-card .pf-v6-c-card__header:not(:last-child) {
      padding-block-end: calc(var(--pf-t--global--spacer--sm) + var(--pf-t--global--spacer--xs));
    }

    .widget-card .pf-v6-c-card__header-main {
      min-width: 0;
      width: 100%;
    }
    
    /* Resize handle styles */
    .resize-handle {
      background: transparent !important;
      z-index: 10;
      transition: background-color 0.2s ease;
      touch-action: none;
    }
    
    .resize-handle-right {
      cursor: ew-resize !important;
    }
    
    .resize-handle-right:hover {
      background: linear-gradient(to right, transparent, var(--pf-v6-global--primary-color--100), transparent) !important;
      opacity: 0.5;
    }
    
    .resize-handle-bottom {
      cursor: ns-resize !important;
    }
    
    .resize-handle-bottom:hover {
      background: linear-gradient(to bottom, transparent, var(--pf-v6-global--primary-color--100), transparent) !important;
      opacity: 0.5;
    }
    
    .resize-handle-corner {
      cursor: nwse-resize !important;
      position: relative;
    }
    
    .resize-handle-corner::before {
      content: '';
      position: absolute;
      right: 6px;
      bottom: 6px;
      width: 10px;
      height: 10px;
      border-right: 2px solid var(--pf-v6-global--BorderColor--200);
      border-bottom: 2px solid var(--pf-v6-global--BorderColor--200);
      opacity: 0.6;
      transition: all 0.2s ease;
    }
    
    .resize-handle-corner:hover::before {
      border-color: var(--pf-v6-global--primary-color--100);
      opacity: 1;
    }
    
    /* Resizing state */
    .resizing {
      z-index: 999 !important;
    }
    
    .resizing .widget-card {
      box-shadow: var(--pf-v6-global--BoxShadow--lg) !important;
      border-color: var(--pf-v6-global--primary-color--100) !important;
    }
    
    /* Preview indicator */
    .resize-preview-indicator {
      position: absolute;
      top: 8px;
      left: 50%;
      transform: translateX(-50%);
      background: var(--pf-v6-global--primary-color--100);
      color: white;
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
      opacity: 0;
      transition: opacity 0.2s ease;
      pointer-events: none;
      z-index: 1000;
      white-space: nowrap;
    }
    
    .resize-preview-indicator.visible {
      opacity: 1;
    }

    .recently-visited-item {
      display: flex;
      flex-direction: column;
      gap: var(--pf-t--global--spacer--xs);
    }

    .recently-visited-item__bundle {
      font-size: var(--pf-t--global--font--size--body--sm);
      color: var(--pf-t--global--text--color--subtle);
    }
`;
