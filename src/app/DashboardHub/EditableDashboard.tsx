import * as React from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { RouterBreadcrumbItem } from '@app/RouterBreadcrumbItem';
import {
  Alert,
  Breadcrumb,
  BreadcrumbItem,
  Button,
  Card,
  CardBody,
  CardHeader,
  Content,
  Divider,
  Dropdown,
  DropdownItem,
  DropdownList,
  EmptyState,
  EmptyStateBody,
  EmptyStateFooter,
  EmptyStateVariant,
  Flex,
  FlexItem,
  Form,
  MenuToggle,
  PageSection,
  Spinner,
  Switch,
  FormGroup,
  HelperText,
  HelperTextItem,
  TextInput,
  Title,
  Tooltip
} from '@patternfly/react-core';
import {
  CheckIcon,
  CheckCircleIcon,
  EllipsisVIcon,
  HomeIcon,
  OutlinedCloneIcon,
  OutlinedTrashAltIcon,
  PencilAltIcon,
  PlusCircleIcon,
  ShareAltIcon,
  ThumbtackIcon,
  TimesIcon
} from '@app/icons/rhUiIcons';
import { HelpPanelContext } from '@app/AppLayout/AppLayout';
import { setDashboardBankBridgeState } from '@app/Homepage/dashboardBankBridge';
import { createHomepageWidgetClones } from '@app/Homepage/homepageWidgetCatalog';
import {
  computeDashboardWidgetPlacements,
  getDashboardGridColumnCount,
  getEffectiveColumnSpan,
  getPixelHeightForRowSpan,
  getPixelWidthForColSpan,
  getWidgetsGridColumnStyle,
  ReadOnlyHomepageWidgetFrame,
  renderHomepageWidgetContent,
  SortableWidgetCard,
  WIDGET_GRID_STYLES,
  type WidgetResizePreview
} from '@app/Homepage/homepageWidgetGrid';
import { MIN_ROW_SPAN, type ColumnSpan, type RowSpan, type Widget } from '@app/Homepage/widgetTypes';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  defaultDropAnimationSideEffects,
  pointerWithin,
  rectIntersection,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DropAnimation
} from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, rectSortingStrategy } from '@dnd-kit/sortable';
import { useDashboardData } from '@app/DashboardHub/DashboardDataContext';
import { CONSOLE_DEFAULT_BODY_TITLE } from '@app/DashboardHub/consoleDefaultDashboard';
import {
  getPrebuiltDashboardAutoSizeWidgetIds,
  getPrebuiltDashboardWidgets,
  isConsoleDefaultHubRow,
  isPrebuiltHubRow
} from '@app/DashboardHub/prebuiltDashboards';
import { DASHBOARD_DUPLICATE_NAME_ERROR } from '@app/DashboardHub/dashboardHubMockData';
import {
  mergeCanvasWidgetsWithCatalog,
  readDashboardCanvasWidgets,
  resolveDashboardCanvasWidgets,
  serializeDashboardConfigPayload,
  writeDashboardCanvasWidgets
} from '@app/DashboardHub/dashboardCanvasStorage';
import { DASHBOARD_CANVAS_LAYOUT_CLASS } from '@app/DashboardHub/dashboardCanvasLayout';
import { CopyConfigStringModal } from '@app/DashboardHub/CopyConfigStringModal';
import { DeleteDashboardModal } from '@app/DashboardHub/DeleteDashboardModal';
import { DuplicateDashboardModal } from '@app/DashboardHub/DuplicateDashboardModal';
import { PinDashboardModal } from '@app/DashboardHub/PinDashboardModal';
import {
  PIN_DASHBOARD_TO_SERVICES_MENU_LABEL,
  SHARE_DASHBOARD_MENU_LABEL
} from '@app/useCopyConfigFeedback';
import { scheduleDeferredResizeObserverWork, useDeferredResizeObserverOffsetWidth } from '@app/useDeferredResizeObserver';

type PersistIndicator = 'saved' | 'saving';

interface EditableDashboardCanvasProps {
  /** Persisted in-canvas hero title (usually matched `name` at creation, then independent). */
  canvasTitle: string;
  /** Used when the user saves an empty trimmed value (e.g. dashboard name as safe default). */
  titleFallback: string;
  onCanvasTitleCommit: (title: string) => void;
  canvasWidgets: Widget[];
  autoSizeWidgetIds: ReadonlySet<string>;
  onOpenAddWidgets: () => void;
  onSizeChange: (id: string, colSpan: ColumnSpan, rowSpan: RowSpan) => void;
  onAutoSizeFit: (id: string, colSpan: ColumnSpan, rowSpan: RowSpan, complete: boolean) => void;
  onRemoveWidget: (id: string) => void;
  onReorder: (next: Widget[]) => void;
  /** Built-in console default: show widgets without drag, resize, or title edit. */
  readOnly?: boolean;
}

const EditableDashboardCanvas: React.FC<EditableDashboardCanvasProps> = ({
  canvasTitle,
  titleFallback,
  onCanvasTitleCommit,
  canvasWidgets,
  autoSizeWidgetIds,
  onOpenAddWidgets,
  onSizeChange,
  onAutoSizeFit,
  onRemoveWidget,
  onReorder,
  readOnly = false
}) => {
  const navigate = useNavigate();
  const gridRef = React.useRef<HTMLDivElement>(null);
  const [gridEl, setGridEl] = React.useState<HTMLDivElement | null>(null);
  const setGridRef = React.useCallback((node: HTMLDivElement | null) => {
    gridRef.current = node;
    setGridEl(node);
  }, []);
  const gridWidth = useDeferredResizeObserverOffsetWidth(() => gridEl, [gridEl, canvasWidgets.length]);
  const widgetsGridColumnStyle = React.useMemo(() => getWidgetsGridColumnStyle(gridWidth), [gridWidth]);
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [resizePreview, setResizePreview] = React.useState<WidgetResizePreview | null>(null);

  const gridCollisionDetection = React.useCallback<CollisionDetection>((args) => {
    const pointerCollisions = pointerWithin(args);
    if (pointerCollisions.length > 0) {
      return pointerCollisions;
    }
    return rectIntersection(args);
  }, []);

  const dropAnimation = React.useMemo<DropAnimation>(
    () => ({
      duration: 220,
      easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
      sideEffects: defaultDropAnimationSideEffects({
        styles: {
          active: {
            opacity: '0.4'
          }
        }
      })
    }),
    []
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = React.useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = React.useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);
      if (over && active.id !== over.id) {
        const overId = String(over.id);
        onReorder(
          arrayMove(
            canvasWidgets,
            canvasWidgets.findIndex((w) => w.id === active.id),
            canvasWidgets.findIndex((w) => w.id === overId)
          )
        );
      }
    },
    [canvasWidgets, onReorder]
  );

  const activeWidget = React.useMemo(
    () => (activeId ? canvasWidgets.find((w) => w.id === activeId) : null),
    [activeId, canvasWidgets]
  );

  const dashboardPlacements = React.useMemo(() => {
    const n = getDashboardGridColumnCount(gridWidth);
    return computeDashboardWidgetPlacements(canvasWidgets, n, resizePreview);
  }, [canvasWidgets, gridWidth, resizePreview]);

  const handleResizePreviewStart = React.useCallback((preview: WidgetResizePreview) => {
    setResizePreview(preview);
  }, []);

  const handleResizePreviewChange = React.useCallback((colSpan: ColumnSpan, rowSpan: RowSpan) => {
    setResizePreview((current) =>
      current
        ? {
            ...current,
            colSpan,
            rowSpan
          }
        : null
    );
  }, []);

  const handleResizePreviewEnd = React.useCallback(() => {
    setResizePreview(null);
  }, []);

  const [isEditingSectionTitle, setIsEditingSectionTitle] = React.useState(false);
  const [draftSectionTitle, setDraftSectionTitle] = React.useState(() => canvasTitle);
  const sectionTitleEditorRef = React.useRef<HTMLDivElement>(null);
  const sectionTitleInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!isEditingSectionTitle) {
      setDraftSectionTitle(canvasTitle);
    }
  }, [canvasTitle, isEditingSectionTitle]);

  const applySectionTitle = React.useCallback(() => {
    const next = draftSectionTitle.trim() || titleFallback;
    onCanvasTitleCommit(next);
    setIsEditingSectionTitle(false);
  }, [draftSectionTitle, titleFallback, onCanvasTitleCommit]);

  const cancelSectionTitle = React.useCallback(() => {
    setDraftSectionTitle(canvasTitle);
    setIsEditingSectionTitle(false);
  }, [canvasTitle]);

  const handleSectionTitleEditorBlur = React.useCallback(() => {
    window.setTimeout(() => {
      if (!sectionTitleEditorRef.current?.contains(document.activeElement)) {
        setDraftSectionTitle(canvasTitle);
        setIsEditingSectionTitle(false);
      }
    }, 0);
  }, [canvasTitle]);

  const startEditSectionTitle = React.useCallback(() => {
    setDraftSectionTitle(canvasTitle);
    setIsEditingSectionTitle(true);
  }, [canvasTitle]);

  React.useEffect(() => {
    if (isEditingSectionTitle) {
      sectionTitleInputRef.current?.focus();
      sectionTitleInputRef.current?.select();
    }
  }, [isEditingSectionTitle]);

  return (
    <Card
      isFullHeight
      style={{
        minHeight: 'min(72vh, 720px)',
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        maxWidth: '100%',
        minWidth: 0,
        boxSizing: 'border-box'
      }}
    >
      <CardHeader>
        {readOnly ? (
          <Title headingLevel="h1" size="2xl">
            {canvasTitle}
          </Title>
        ) : !isEditingSectionTitle ? (
          <Flex
            alignItems={{ default: 'alignItemsCenter' }}
            spaceItems={{ default: 'spaceItemsSm' }}
            flexWrap={{ default: 'wrap' }}
            style={{ minWidth: 0, width: '100%' }}
          >
            <FlexItem style={{ minWidth: 0 }}>
              <Title headingLevel="h1" size="2xl">
                {canvasTitle}
              </Title>
            </FlexItem>
            <FlexItem>
              <Button
                variant="plain"
                type="button"
                aria-label="Edit canvas title"
                onClick={startEditSectionTitle}
                icon={<PencilAltIcon />}
              />
            </FlexItem>
          </Flex>
        ) : (
          <div
            ref={sectionTitleEditorRef}
            onBlur={handleSectionTitleEditorBlur}
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: 'var(--pf-t--global--spacer--xs)',
              minWidth: 0,
              width: '100%',
              maxWidth: '100%'
            }}
          >
            <TextInput
              ref={sectionTitleInputRef}
              id="dashboard-canvas-section-title-input"
              type="text"
              value={draftSectionTitle}
              onChange={(_event, value) => setDraftSectionTitle(value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  applySectionTitle();
                }
              }}
              aria-label="Canvas title"
              style={{
                minWidth: 0,
                flex: '1 1 12rem',
                maxWidth: 'min(24rem, 100%)'
              }}
            />
            <Button
              variant="plain"
              type="button"
              aria-label="Apply canvas title"
              onMouseDown={(e) => e.preventDefault()}
              onClick={applySectionTitle}
              icon={<CheckIcon />}
            />
            <Button
              variant="plain"
              type="button"
              aria-label="Cancel canvas title edit"
              onMouseDown={(e) => e.preventDefault()}
              onClick={cancelSectionTitle}
              icon={<TimesIcon />}
            />
          </div>
        )}
      </CardHeader>
      <CardBody style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            minHeight: 'min(56vh, 560px)',
            justifyContent: canvasWidgets.length === 0 ? 'flex-start' : undefined
          }}
        >
          {readOnly ? (
            canvasWidgets.length === 0 ? (
              <EmptyState
                variant={EmptyStateVariant.full}
                headingLevel="h2"
                titleText="No widgets"
                icon={PlusCircleIcon}
              >
                <EmptyStateBody>This dashboard does not display any widgets.</EmptyStateBody>
              </EmptyState>
            ) : (
              <>
                <style>{WIDGET_GRID_STYLES}</style>
                <div
                  ref={setGridRef}
                  className="widgets-grid homepage-readonly-grid"
                  style={{ width: '100%', minWidth: 0, ...widgetsGridColumnStyle }}
                  aria-label="Dashboard widgets (read-only)"
                >
                  {canvasWidgets.map((widget) => (
                    <ReadOnlyHomepageWidgetFrame
                      key={widget.id}
                      widget={widget}
                      gridWidth={gridWidth}
                      placement={dashboardPlacements.get(widget.id) ?? { columnStart: 1, rowStart: 1 }}
                      autoSize={autoSizeWidgetIds.has(widget.id)}
                      onAutoSizeFit={onAutoSizeFit}
                    >
                      {renderHomepageWidgetContent(widget, {
                        navigate,
                        readOnly: true
                      })}
                    </ReadOnlyHomepageWidgetFrame>
                  ))}
                </div>
              </>
            )
          ) : canvasWidgets.length === 0 ? (
            <EmptyState
              variant={EmptyStateVariant.full}
              headingLevel="h2"
              titleText="No widgets yet"
              icon={PlusCircleIcon}
            >
              <EmptyStateBody>
                Add widgets to your dashboard to monitor and take action on the things that are most important to you.
              </EmptyStateBody>
              <EmptyStateFooter>
                <Button variant="primary" icon={<PlusCircleIcon />} onClick={onOpenAddWidgets}>
                  Add widgets
                </Button>
              </EmptyStateFooter>
            </EmptyState>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={gridCollisionDetection}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <style>{WIDGET_GRID_STYLES}</style>
              <div style={{ width: '100%', minWidth: 0 }}>
                <SortableContext items={canvasWidgets.map((w) => w.id)} strategy={rectSortingStrategy}>
                  <div
                    ref={setGridRef}
                    className={`widgets-grid${resizePreview ? ' is-resize-active' : ''}`}
                    style={widgetsGridColumnStyle}
                  >
                    {canvasWidgets.map((widget) => (
                      <SortableWidgetCard
                        key={widget.id}
                        widget={widget}
                        placement={dashboardPlacements.get(widget.id) ?? { columnStart: 1, rowStart: 1 }}
                        onSizeChange={onSizeChange}
                        onAutoSizeFit={onAutoSizeFit}
                        needsAutoSize={autoSizeWidgetIds.has(widget.id)}
                        onResizePreviewStart={handleResizePreviewStart}
                        onResizePreviewChange={handleResizePreviewChange}
                        onResizePreviewEnd={handleResizePreviewEnd}
                        onRemove={onRemoveWidget}
                        gridWidth={gridWidth}
                      >
                        {renderHomepageWidgetContent(widget, { navigate })}
                      </SortableWidgetCard>
                    ))}
                  </div>
                </SortableContext>
                <DragOverlay dropAnimation={dropAnimation}>
                  {activeWidget ? (
                    <div
                      className="widget-grid-drag-overlay"
                      style={{
                        width: getPixelWidthForColSpan(
                          gridWidth,
                          getEffectiveColumnSpan(gridWidth, activeWidget.colSpan)
                        ),
                        height: getPixelHeightForRowSpan(activeWidget.rowSpan),
                        maxWidth: '100%',
                        boxSizing: 'border-box'
                      }}
                    >
                      {renderHomepageWidgetContent(activeWidget, { navigate })}
                    </div>
                  ) : null}
                </DragOverlay>
              </div>
            </DndContext>
          )}
        </div>
      </CardBody>
    </Card>
  );
};

/**
 * Shell for editing a single dashboard. Wire layout, save, widgets, etc. per product spec.
 */
const EditableDashboard: React.FunctionComponent = () => {
  const navigate = useNavigate();
  const { dashboardId } = useParams<{ dashboardId: string }>();
  const {
    rows,
    updateDashboardName,
    updateDashboardDescription,
    updateCanvasTitle,
    isDashboardNameTaken,
    setDashboardAsHomepage,
    removeDashboard
  } = useDashboardData();
  const dashboard = dashboardId ? rows.find((r) => r.id === dashboardId) : undefined;
  const isPrebuilt = Boolean(dashboard && isPrebuiltHubRow(dashboard));
  const isConsoleDefault = Boolean(dashboard && isConsoleDefaultHubRow(dashboard));
  const homepageRow = React.useMemo(() => rows.find((r) => r.isHomepage), [rows]);
  const currentHomepageLabel = homepageRow
    ? (homepageRow.canvasTitle ?? homepageRow.name)
    : 'None';
  const breadcrumbLabel = dashboard?.name ?? 'Dashboard';
  const resolvedCanvasTitle = dashboard ? dashboard.canvasTitle ?? dashboard.name : '';
  const canvasSectionTitle = isConsoleDefault ? CONSOLE_DEFAULT_BODY_TITLE : resolvedCanvasTitle;

  const [autosaveEnabled, setAutosaveEnabled] = React.useState(true);
  const [isKebabOpen, setIsKebabOpen] = React.useState(false);
  const [isCopyConfigModalOpen, setIsCopyConfigModalOpen] = React.useState(false);
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = React.useState(false);
  const [isPinDashboardModalOpen, setIsPinDashboardModalOpen] = React.useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);

  const [localName, setLocalName] = React.useState('');
  const [localDescription, setLocalDescription] = React.useState('');
  const [isNameFieldFocused, setIsNameFieldFocused] = React.useState(false);
  const [isDescriptionFieldFocused, setIsDescriptionFieldFocused] = React.useState(false);
  const [persistIndicator, setPersistIndicator] = React.useState<PersistIndicator>('saved');
  const savingTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const nameEditorRef = React.useRef<HTMLDivElement>(null);
  const descriptionInputRef = React.useRef<HTMLInputElement>(null);
  const descriptionFieldWrapRef = React.useRef<HTMLDivElement>(null);
  const [isDescriptionTruncated, setIsDescriptionTruncated] = React.useState(false);

  const helpPanelContext = React.useContext(HelpPanelContext);
  const [removedWidgets, setRemovedWidgets] = React.useState<Widget[]>(() => createHomepageWidgetClones());
  const [canvasWidgets, setCanvasWidgets] = React.useState<Widget[]>([]);
  const [autoSizeWidgetIds, setAutoSizeWidgetIds] = React.useState<Set<string>>(() => new Set());

  React.useEffect(() => {
    if (dashboard) {
      setLocalName(dashboard.name);
      setLocalDescription(dashboard.description ?? '');
    }
  }, [dashboard?.id, dashboard?.name, dashboard?.description]);

  const measureDescriptionTruncation = React.useCallback(() => {
    const el = descriptionInputRef.current;
    if (!el || !localDescription.trim()) {
      setIsDescriptionTruncated(false);
      return;
    }
    setIsDescriptionTruncated(Math.ceil(el.scrollWidth) > Math.floor(el.clientWidth));
  }, [localDescription]);

  React.useLayoutEffect(() => {
    measureDescriptionTruncation();
  }, [measureDescriptionTruncation]);

  React.useEffect(() => {
    const wrap = descriptionFieldWrapRef.current;
    if (!wrap) {
      return;
    }
    const ro = new ResizeObserver(() => {
      scheduleDeferredResizeObserverWork(measureDescriptionTruncation);
    });
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [measureDescriptionTruncation]);

  /** Load per-dashboard widget layout (session storage) before paint; keeps hub ↔ homepage in sync. */
  React.useLayoutEffect(() => {
    if (!dashboardId) {
      return;
    }
    const all = createHomepageWidgetClones();
    if (isPrebuilt && dashboard) {
      const merged = mergeCanvasWidgetsWithCatalog(getPrebuiltDashboardWidgets(dashboard.id), all);
      setCanvasWidgets(merged);
      setAutoSizeWidgetIds(new Set(getPrebuiltDashboardAutoSizeWidgetIds(dashboard.id)));
      const onCanvas = new Set(merged.map((w) => w.id));
      setRemovedWidgets(all.filter((w) => !onCanvas.has(w.id)));
      skipNextCanvasPersist.current = true;
      return;
    }
    const stored = readDashboardCanvasWidgets(dashboardId);
    if (stored && stored.length > 0) {
      const merged = mergeCanvasWidgetsWithCatalog(stored, all);
      setCanvasWidgets(merged);
      setAutoSizeWidgetIds(new Set());
      const onCanvas = new Set(merged.map((w) => w.id));
      setRemovedWidgets(all.filter((w) => !onCanvas.has(w.id)));
    } else {
      setCanvasWidgets([]);
      setAutoSizeWidgetIds(new Set());
      setRemovedWidgets(all);
    }
    skipNextCanvasPersist.current = true;
  }, [isPrebuilt, dashboardId, dashboard]);

  const skipNextCanvasPersist = React.useRef(false);

  /** Persist layout so the console home can show a read-only replica. */
  React.useEffect(() => {
    if (!dashboardId || isPrebuilt) {
      if (isPrebuilt) {
        skipNextCanvasPersist.current = true;
      }
      return;
    }
    if (skipNextCanvasPersist.current) {
      skipNextCanvasPersist.current = false;
      return;
    }
    writeDashboardCanvasWidgets(dashboardId, canvasWidgets);
  }, [dashboardId, isPrebuilt, canvasWidgets]);

  React.useEffect(
    () => () => {
      if (savingTimerRef.current) {
        clearTimeout(savingTimerRef.current);
      }
    },
    []
  );

  const isDirty = dashboard
    ? localName !== dashboard.name ||
      localDescription.trim() !== (dashboard.description ?? '').trim()
    : false;

  const toolbarNameIsDuplicate = Boolean(
    dashboard && localName.trim() && isDashboardNameTaken(localName, dashboard.id)
  );

  const runAutosavePersistFlow = React.useCallback(() => {
    setPersistIndicator('saving');
    if (savingTimerRef.current) {
      clearTimeout(savingTimerRef.current);
    }
    savingTimerRef.current = setTimeout(() => {
      setPersistIndicator('saved');
      savingTimerRef.current = null;
    }, 650);
  }, []);

  const applyNameChange = React.useCallback(() => {
    if (!dashboard) {
      return;
    }
    const next = localName.trim();
    if (!next) {
      return;
    }
    if (isDashboardNameTaken(next, dashboard.id)) {
      return;
    }
    updateDashboardName(dashboard.id, next);
    if (autosaveEnabled) {
      runAutosavePersistFlow();
    }
    setIsNameFieldFocused(false);
  }, [dashboard, localName, isDashboardNameTaken, updateDashboardName, autosaveEnabled, runAutosavePersistFlow]);

  const applyDescriptionIfDirty = React.useCallback(() => {
    if (!dashboard || isPrebuilt) {
      return;
    }
    const next = localDescription.trim();
    const current = (dashboard.description ?? '').trim();
    if (next === current) {
      return;
    }
    updateDashboardDescription(dashboard.id, next);
    if (autosaveEnabled) {
      runAutosavePersistFlow();
    }
  }, [
    autosaveEnabled,
    dashboard,
    isPrebuilt,
    localDescription,
    runAutosavePersistFlow,
    updateDashboardDescription
  ]);

  const applyDescriptionChange = React.useCallback(() => {
    applyDescriptionIfDirty();
    setIsDescriptionFieldFocused(false);
  }, [applyDescriptionIfDirty]);

  const handleDescriptionBlur = React.useCallback(() => {
    if (!dashboard || isPrebuilt || !autosaveEnabled) {
      return;
    }
    const next = localDescription.trim();
    const current = (dashboard.description ?? '').trim();
    if (next === current) {
      return;
    }
    updateDashboardDescription(dashboard.id, next);
    runAutosavePersistFlow();
  }, [
    autosaveEnabled,
    dashboard,
    isPrebuilt,
    localDescription,
    runAutosavePersistFlow,
    updateDashboardDescription
  ]);

  const cancelNameChange = React.useCallback(() => {
    if (!dashboard) {
      return;
    }
    setLocalName(dashboard.name);
    setIsNameFieldFocused(false);
  }, [dashboard]);

  const cancelDescriptionChange = React.useCallback(() => {
    if (!dashboard) {
      return;
    }
    setLocalDescription(dashboard.description ?? '');
    setIsDescriptionFieldFocused(false);
  }, [dashboard]);

  const handleNameEditorBlur = React.useCallback(() => {
    window.setTimeout(() => {
      if (!nameEditorRef.current?.contains(document.activeElement)) {
        setIsNameFieldFocused(false);
        setIsDescriptionFieldFocused(false);
        if (autosaveEnabled) {
          if (dashboard) {
            setLocalName(dashboard.name);
            setLocalDescription(dashboard.description ?? '');
          }
        }
      }
    }, 0);
  }, [autosaveEnabled, dashboard]);

  const handleSaveManual = React.useCallback(() => {
    applyNameChange();
    applyDescriptionIfDirty();
  }, [applyDescriptionIfDirty, applyNameChange]);

  const handleCancelManual = React.useCallback(() => {
    cancelNameChange();
    if (dashboard) {
      setLocalDescription(dashboard.description ?? '');
    }
  }, [cancelNameChange, dashboard]);

  const pendingScrollWidgetRef = React.useRef<string | null>(null);

  const handleAddWidgetFromBank = React.useCallback((widget: Widget) => {
    setRemovedWidgets((prev) => prev.filter((w) => w.id !== widget.id));
    setCanvasWidgets((prev) => {
      if (prev.some((w) => w.id === widget.id)) {
        return prev;
      }
      return [...prev, { ...widget, rowSpan: MIN_ROW_SPAN }];
    });
    setAutoSizeWidgetIds((ids) => new Set(ids).add(widget.id));
    pendingScrollWidgetRef.current = widget.id;
  }, []);

  const handleRemoveFromCanvas = React.useCallback(
    (widgetId: string) => {
      const w = canvasWidgets.find((x) => x.id === widgetId);
      if (w) {
        setCanvasWidgets((prev) => prev.filter((x) => x.id !== widgetId));
        setRemovedWidgets((prev) => [...prev, w]);
        setAutoSizeWidgetIds((ids) => {
          if (!ids.has(widgetId)) {
            return ids;
          }
          const next = new Set(ids);
          next.delete(widgetId);
          return next;
        });
      }
    },
    [canvasWidgets]
  );

  const handleRemoveWidgetFromBank = React.useCallback(
    (widget: Widget) => {
      handleRemoveFromCanvas(widget.id);
    },
    [handleRemoveFromCanvas]
  );

  React.useEffect(() => {
    if (!dashboardId) {
      setDashboardBankBridgeState(null);
      return;
    }
    setDashboardBankBridgeState({
      canvasWidgetIds: new Set(canvasWidgets.map((w) => w.id)),
      addWidgetToDashboard: handleAddWidgetFromBank,
      removeWidgetFromDashboard: handleRemoveWidgetFromBank,
      canAddWidgets: !isPrebuilt,
    });
  }, [dashboardId, canvasWidgets, handleAddWidgetFromBank, handleRemoveWidgetFromBank, isPrebuilt]);

  React.useEffect(
    () => () => {
      setDashboardBankBridgeState(null);
    },
    []
  );

  const handleAutoSizeFit = React.useCallback(
    (id: string, colSpan: ColumnSpan, rowSpan: RowSpan, complete: boolean) => {
      setCanvasWidgets((prev) => prev.map((w) => (w.id === id ? { ...w, colSpan, rowSpan } : w)));
      if (!complete) {
        return;
      }
      setAutoSizeWidgetIds((ids) => {
        if (!ids.has(id)) {
          return ids;
        }
        const next = new Set(ids);
        next.delete(id);
        return next;
      });
      if (pendingScrollWidgetRef.current === id) {
        pendingScrollWidgetRef.current = null;
        requestAnimationFrame(() => {
          const el = document.querySelector(`[data-widget-id="${id}"]`);
          el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        });
      }
    },
    []
  );

  const handleCanvasSizeChange = React.useCallback((id: string, colSpan: ColumnSpan, rowSpan: RowSpan) => {
    setAutoSizeWidgetIds((ids) => {
      if (!ids.has(id)) {
        return ids;
      }
      const next = new Set(ids);
      next.delete(id);
      return next;
    });
    setCanvasWidgets((prev) => prev.map((w) => (w.id === id ? { ...w, colSpan, rowSpan } : w)));
  }, []);

  const handleCanvasReorder = React.useCallback((next: Widget[]) => {
    setCanvasWidgets(next);
  }, []);

  const isAddWidgetsPanelOpen = helpPanelContext?.isAddWidgetsPanelOpen ?? false;

  const toggleAddWidgets = React.useCallback(() => {
    if (isPrebuilt) {
      return;
    }
    if (isAddWidgetsPanelOpen) {
      helpPanelContext?.closeHelpPanel();
    } else {
      helpPanelContext?.openHelpPanelWithTab('Dashboard widgets', { variant: 'in-page' });
    }
  }, [isPrebuilt, helpPanelContext, isAddWidgetsPanelOpen]);

  const copyConfigString = React.useMemo(() => {
    if (!dashboard) {
      return '';
    }
    const raw = resolveDashboardCanvasWidgets(dashboard);
    return serializeDashboardConfigPayload({
      dashboardId: dashboard.id,
      name: dashboard.name,
      widgets: raw ?? []
    });
  }, [dashboard]);

  const handleOpenCopyConfigModal = React.useCallback(() => {
    setIsKebabOpen(false);
    setIsCopyConfigModalOpen(true);
  }, []);

  const handleKebabDuplicate = React.useCallback(() => {
    if (!dashboard) {
      return;
    }
    setIsKebabOpen(false);
    setIsDuplicateModalOpen(true);
  }, [dashboard]);

  const handleDuplicateModalSuccess = React.useCallback(
    (newId: string) => {
      setIsDuplicateModalOpen(false);
      navigate(`/dashboard-hub/${newId}`);
    },
    [navigate]
  );

  const handleKebabDelete = React.useCallback(() => {
    if (!dashboard || isPrebuiltHubRow(dashboard)) {
      return;
    }
    setIsKebabOpen(false);
    setIsDeleteModalOpen(true);
  }, [dashboard]);

  const handleDeleteDashboardConfirm = React.useCallback(() => {
    if (!dashboard || isPrebuiltHubRow(dashboard)) {
      return;
    }
    removeDashboard(dashboard.id);
    setIsDeleteModalOpen(false);
    navigate('/dashboard-hub');
  }, [dashboard, navigate, removeDashboard]);

  const dashboardBody = dashboard ? (
    <div className={DASHBOARD_CANVAS_LAYOUT_CLASS}>
        {isPrebuilt ? (
          <PageSection hasBodyWrapper={false}>
            <Alert
              variant="info"
              isInline
              isPlain
              title={
                isConsoleDefault
                  ? "The 'Console-default' dashboard is a system maintained dashboard and you cannot edit it. You may duplicate it and copy its JSON config though."
                  : 'This is a system-maintained dashboard and cannot be edited. You may duplicate it and copy its JSON config though.'
              }
            />
          </PageSection>
        ) : null}
        <PageSection
          hasBodyWrapper={false}
          className="hcc-editable-dashboard-toolbar-section"
          style={{
            paddingTop: 0,
            width: '100%',
            maxWidth: '100%',
            minWidth: 0,
            boxSizing: 'border-box'
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '100%',
              minWidth: 0,
              boxSizing: 'border-box'
            }}
          >
          <div
            role="toolbar"
            aria-label="Dashboard editor"
            className="editable-dashboard-toolbar"
          >
            <div className="editable-dashboard-toolbar__meta">
              <div
                ref={nameEditorRef}
                className="editable-dashboard-meta-editor"
                onBlur={handleNameEditorBlur}
              >
                <div className="editable-dashboard-name-editor">
                  <Form
                    className="editable-dashboard-toolbar-meta-form editable-dashboard-name-group"
                    onSubmit={(event) => event.preventDefault()}
                  >
                    <div className="editable-dashboard-toolbar-field editable-dashboard-toolbar-field--name">
                      <div className="editable-dashboard-toolbar-field__row">
                        <div className="editable-dashboard-name-input-wrap">
                    <FormGroup
                      fieldId="dashboard-name-input"
                      label="Name"
                      className="editable-dashboard-toolbar-form-group"
                    >
                      <div
                        className={
                          dashboard.isHomepage
                            ? 'editable-dashboard-name-input-inner editable-dashboard-name-input-inner--home'
                            : 'editable-dashboard-name-input-inner'
                        }
                      >
                        {dashboard.isHomepage ? (
                          <span
                            className="editable-dashboard-name-input__home-icon"
                            title="Console homepage"
                            aria-hidden
                          >
                            <HomeIcon />
                          </span>
                        ) : null}
                        <TextInput
                          className={
                            isPrebuilt
                              ? 'editable-dashboard-name-input editable-dashboard-name-input--non-interactive'
                              : 'editable-dashboard-name-input'
                          }
                          id="dashboard-name-input"
                          type="text"
                          value={localName}
                          readOnlyVariant={isPrebuilt ? 'default' : undefined}
                          tabIndex={isPrebuilt ? -1 : undefined}
                          onMouseDown={
                            isPrebuilt
                              ? (e: React.MouseEvent<HTMLInputElement>) => {
                                  e.preventDefault();
                                }
                              : undefined
                          }
                          onChange={(_event, value) => setLocalName(value)}
                          onFocus={() => {
                            if (!isPrebuilt) {
                              setIsNameFieldFocused(true);
                              setIsDescriptionFieldFocused(false);
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key !== 'Enter') {
                              return;
                            }
                            e.preventDefault();
                            if (!dashboard) {
                              return;
                            }
                            if (!localName.trim() || localName.trim() === dashboard.name) {
                              return;
                            }
                            if (isDashboardNameTaken(localName, dashboard.id)) {
                              return;
                            }
                            applyNameChange();
                          }}
                          validated={toolbarNameIsDuplicate ? 'error' : 'default'}
                          aria-describedby={
                            toolbarNameIsDuplicate ? 'dashboard-name-duplicate-error' : undefined
                          }
                        />
                      </div>
                    </FormGroup>
                        </div>
                        {!isPrebuilt && isNameFieldFocused && (
                          <span className="editable-dashboard-meta-inline-actions">
                            <Button
                              variant="plain"
                              type="button"
                              className="editable-dashboard-meta-inline-action editable-dashboard-meta-inline-action--apply"
                              aria-label="Apply dashboard name"
                              icon={
                                <span className="editable-dashboard-meta-inline-action__apply-icon" aria-hidden>
                                  <CheckIcon />
                                </span>
                              }
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={applyNameChange}
                              isDisabled={
                                !localName.trim() ||
                                localName.trim() === dashboard.name ||
                                toolbarNameIsDuplicate
                              }
                            />
                            <Button
                              variant="plain"
                              type="button"
                              aria-label="Cancel dashboard name edit"
                              icon={<TimesIcon />}
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={cancelNameChange}
                            />
                          </span>
                        )}
                      </div>
                    </div>
                    <div
                      ref={descriptionFieldWrapRef}
                      className="editable-dashboard-toolbar-field editable-dashboard-toolbar-field--description"
                    >
                      <div className="editable-dashboard-toolbar-field__row">
                        <div className="editable-dashboard-description-input-wrap">
                      <FormGroup
                        fieldId="dashboard-description-input"
                        label="Description"
                        className="editable-dashboard-toolbar-form-group"
                      >
                      <TextInput
                        ref={descriptionInputRef}
                        id="dashboard-description-input"
                        type="text"
                        value={localDescription}
                        onChange={(_event, value) => setLocalDescription(value)}
                        onFocus={() => {
                          if (!isPrebuilt) {
                            setIsDescriptionFieldFocused(true);
                            setIsNameFieldFocused(false);
                          }
                        }}
                        onBlur={handleDescriptionBlur}
                        onKeyDown={(e) => {
                          if (e.key !== 'Enter') {
                            return;
                          }
                          e.preventDefault();
                          if (!dashboard || isPrebuilt) {
                            return;
                          }
                          const next = localDescription.trim();
                          const current = (dashboard.description ?? '').trim();
                          if (next === current) {
                            return;
                          }
                          applyDescriptionChange();
                        }}
                        onMouseDown={
                          isPrebuilt
                            ? (e: React.MouseEvent<HTMLInputElement>) => {
                                e.preventDefault();
                              }
                            : undefined
                        }
                        maxLength={500}
                        readOnly={isPrebuilt}
                        readOnlyVariant={isPrebuilt ? 'default' : undefined}
                        tabIndex={isPrebuilt ? -1 : undefined}
                        placeholder="(Optional) Short description of the dashboard"
                        className={
                          isPrebuilt
                            ? 'editable-dashboard-description-input editable-dashboard-description-input--readonly'
                            : 'editable-dashboard-description-input'
                        }
                      />
                      </FormGroup>
                      {isDescriptionTruncated && localDescription.trim() ? (
                        <Tooltip
                          triggerRef={descriptionInputRef}
                          content={localDescription}
                          position="bottom"
                          aria="none"
                        />
                      ) : null}
                        </div>
                        {!isPrebuilt && isDescriptionFieldFocused && (
                          <span className="editable-dashboard-meta-inline-actions">
                            <Button
                              variant="plain"
                              type="button"
                              className="editable-dashboard-meta-inline-action editable-dashboard-meta-inline-action--apply"
                              aria-label="Apply dashboard description"
                              icon={
                                <span className="editable-dashboard-meta-inline-action__apply-icon" aria-hidden>
                                  <CheckIcon />
                                </span>
                              }
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={applyDescriptionChange}
                              isDisabled={
                                localDescription.trim() === (dashboard.description ?? '').trim()
                              }
                            />
                            <Button
                              variant="plain"
                              type="button"
                              aria-label="Cancel dashboard description edit"
                              icon={<TimesIcon />}
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={cancelDescriptionChange}
                            />
                          </span>
                        )}
                      </div>
                    </div>
                  </Form>
                  {toolbarNameIsDuplicate && (
                    <HelperText isLiveRegion>
                      <HelperTextItem
                        id="dashboard-name-duplicate-error"
                        variant="error"
                        component="div"
                      >
                        {DASHBOARD_DUPLICATE_NAME_ERROR}
                      </HelperTextItem>
                    </HelperText>
                  )}
                </div>
              </div>
            </div>
            <div className="editable-dashboard-toolbar__actions">
              <Flex
                flexWrap={{ default: 'wrap' }}
                justifyContent={{ default: 'justifyContentFlexEnd' }}
                alignItems={{ default: 'alignItemsCenter' }}
                spaceItems={{ default: 'spaceItemsMd' }}
                style={{ width: '100%', maxWidth: '100%', minWidth: 0 }}
              >
                  {!isPrebuilt && !autosaveEnabled && (
                    <>
                      <FlexItem>
                        <Button variant="secondary" onClick={handleSaveManual} isDisabled={!isDirty}>
                          Save
                        </Button>
                      </FlexItem>
                      <FlexItem>
                        <Button variant="link" onClick={handleCancelManual} isDisabled={!isDirty}>
                          Cancel
                        </Button>
                      </FlexItem>
                    </>
                  )}
                  {autosaveEnabled && (
                    <FlexItem>
                      <Flex
                        spaceItems={{ default: 'spaceItemsSm' }}
                        alignItems={{ default: 'alignItemsCenter' }}
                        style={{ minHeight: '32px' }}
                      >
                        {persistIndicator === 'saving' ? (
                          <>
                            <Spinner size="sm" aria-label="Saving" />
                            <span
                              style={{
                                color: 'var(--pf-t--global--text--color--subtle)',
                                fontSize: 'var(--pf-t--global--font--size--body--default)'
                              }}
                            >
                              Saving ...
                            </span>
                          </>
                        ) : (
                          <>
                            <CheckCircleIcon
                              style={{
                                color: 'var(--pf-t--global--text--color--subtle)',
                                fontSize: '1rem'
                              }}
                              aria-hidden
                            />
                            <span
                              style={{
                                color: 'var(--pf-t--global--text--color--subtle)',
                                fontSize: 'var(--pf-t--global--font--size--body--default)'
                              }}
                            >
                              Saved
                            </span>
                          </>
                        )}
                      </Flex>
                    </FlexItem>
                  )}
                  {isPrebuilt ? (
                    <FlexItem>
                      <Tooltip
                        content="System default dashboards are not editable. Create a duplicate in order to edit this dashboard."
                        position="bottom"
                      >
                        <Button
                          variant="secondary"
                          icon={<OutlinedCloneIcon />}
                          onClick={handleKebabDuplicate}
                        >
                          Duplicate dashboard
                        </Button>
                      </Tooltip>
                    </FlexItem>
                  ) : (
                    <>
                      <FlexItem>
                        <Switch
                          id={`dashboard-autosave-${dashboard.id}`}
                          label="Autosave"
                          isChecked={autosaveEnabled}
                          onChange={(_event, checked) => setAutosaveEnabled(checked)}
                        />
                      </FlexItem>
                      <FlexItem>
                        <Button
                          variant="plain"
                          className={`editable-dashboard-toolbar-plain-icon-action${isAddWidgetsPanelOpen ? ' editable-dashboard-toolbar-plain-icon-action--active' : ''}`}
                          onClick={toggleAddWidgets}
                        >
                          <span className="editable-dashboard-toolbar-icon-label__inner">
                            <span className="editable-dashboard-toolbar-icon-label__icon" aria-hidden>
                              <PlusCircleIcon />
                            </span>
                            <span className="editable-dashboard-toolbar-icon-label__label">Add widgets</span>
                          </span>
                        </Button>
                      </FlexItem>
                    </>
                  )}
                  <FlexItem>
                    <Dropdown
                      isOpen={isKebabOpen}
                      onSelect={() => setIsKebabOpen(false)}
                      onOpenChange={setIsKebabOpen}
                      popperProps={{ position: 'right' }}
                      toggle={(toggleRef) => (
                          <MenuToggle
                            ref={toggleRef}
                            aria-label="Dashboard actions"
                            variant="plain"
                            isExpanded={isKebabOpen}
                            onClick={() => setIsKebabOpen(!isKebabOpen)}
                          >
                            <EllipsisVIcon />
                          </MenuToggle>
                      )}
                      shouldFocusToggleOnSelect
                    >
                      <DropdownList>
                        <DropdownItem
                          isDisabled={Boolean(dashboard.isHomepage)}
                          description={`Current: ${currentHomepageLabel}`}
                          onClick={() => {
                            setDashboardAsHomepage(dashboard.id);
                            setIsKebabOpen(false);
                          }}
                        >
                          <span
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                          >
                            <HomeIcon style={{ color: 'var(--pf-t--global--icon--Color--200)' }} />
                            Set as homepage
                          </span>
                        </DropdownItem>
                        <DropdownItem
                          onClick={() => {
                            setIsKebabOpen(false);
                            setIsPinDashboardModalOpen(true);
                          }}
                        >
                          <span
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                          >
                            <ThumbtackIcon style={{ color: 'var(--pf-t--global--icon--Color--200)' }} />
                            {PIN_DASHBOARD_TO_SERVICES_MENU_LABEL}
                          </span>
                        </DropdownItem>
                        <DropdownItem onClick={handleOpenCopyConfigModal}>
                          <span
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                          >
                            <ShareAltIcon style={{ color: 'var(--pf-t--global--icon--Color--200)' }} />
                            {SHARE_DASHBOARD_MENU_LABEL}
                          </span>
                        </DropdownItem>
                        <DropdownItem onClick={handleKebabDuplicate}>
                          <span
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                          >
                            <OutlinedCloneIcon style={{ color: 'var(--pf-t--global--icon--Color--200)' }} />
                            Duplicate dashboard
                          </span>
                        </DropdownItem>
                        <Divider component="li" role="separator" />
                        <DropdownItem
                          isDanger={!isPrebuilt}
                          isDisabled={isPrebuilt}
                          onClick={handleKebabDelete}
                        >
                          <span
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                          >
                            <OutlinedTrashAltIcon
                              style={{
                                color: isPrebuilt
                                  ? 'var(--pf-t--global--icon--Color--200)'
                                  : 'var(--pf-t--global--danger-color--200)'
                              }}
                            />
                            Delete dashboard
                          </span>
                        </DropdownItem>
                      </DropdownList>
                    </Dropdown>
                  </FlexItem>
                </Flex>
            </div>
          </div>

          </div>
        </PageSection>

        <PageSection className="hcc-editable-dashboard-canvas-section">
          <EditableDashboardCanvas
            key={dashboard.id}
            canvasTitle={canvasSectionTitle}
            titleFallback={dashboard.name}
            onCanvasTitleCommit={(title) => updateCanvasTitle(dashboard.id, title)}
            canvasWidgets={canvasWidgets}
            autoSizeWidgetIds={autoSizeWidgetIds}
            onOpenAddWidgets={toggleAddWidgets}
            onSizeChange={handleCanvasSizeChange}
            onAutoSizeFit={handleAutoSizeFit}
            onRemoveWidget={handleRemoveFromCanvas}
            onReorder={handleCanvasReorder}
            readOnly={isPrebuilt}
          />
        </PageSection>
    </div>
  ) : null;

  return (
    <div className="editable-dashboard-page">
      <PageSection hasBodyWrapper={false}>
        <Breadcrumb>
          <RouterBreadcrumbItem to="/">Home</RouterBreadcrumbItem>
          <RouterBreadcrumbItem to="/dashboard-hub">Dashboard Hub</RouterBreadcrumbItem>
          <BreadcrumbItem isActive>{breadcrumbLabel}</BreadcrumbItem>
        </Breadcrumb>
      </PageSection>

      {dashboardBody}

      {!dashboard && (
        <PageSection>
          <Title headingLevel="h1" size="2xl">
            {breadcrumbLabel}
          </Title>
          <Content style={{ marginTop: 'var(--pf-t--global--spacer--md)' }}>
            <p style={{ margin: 0, color: 'var(--pf-t--global--text--color--subtle)' }}>
              Unknown dashboard id: <strong>{dashboardId}</strong>.{' '}
              <Link to="/dashboard-hub">Back to Dashboard Hub</Link>
            </p>
          </Content>
        </PageSection>
      )}

      {dashboard ? (
        <>
          <CopyConfigStringModal
            isOpen={isCopyConfigModalOpen}
            onClose={() => setIsCopyConfigModalOpen(false)}
            configString={copyConfigString}
          />
          <DuplicateDashboardModal
            isOpen={isDuplicateModalOpen}
            onClose={() => setIsDuplicateModalOpen(false)}
            rows={rows}
            initialSourceId={dashboard.id}
            initialSetAsHomepage={false}
            onSuccess={handleDuplicateModalSuccess}
          />
          <PinDashboardModal
            isOpen={isPinDashboardModalOpen}
            onClose={() => setIsPinDashboardModalOpen(false)}
            dashboardId={dashboard.id}
            dashboardName={dashboard.name}
          />
          <DeleteDashboardModal
            isOpen={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            dashboardName={dashboard.name}
            onConfirm={handleDeleteDashboardConfirm}
          />
        </>
      ) : null}
    </div>
  );
};

export { EditableDashboard };
