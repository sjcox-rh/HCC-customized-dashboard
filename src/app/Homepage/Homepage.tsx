import * as React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Button,
  Content,
  Divider,
  Dropdown,
  DropdownGroup,
  DropdownItem,
  DropdownList,
  EmptyState,
  EmptyStateBody,
  EmptyStateFooter,
  Flex,
  FlexItem,
  MenuItemAction,
  MenuToggle,
  PageSection,
  Title,
  Tooltip
} from '@patternfly/react-core';
import {
  CodeIcon,
  EllipsisVIcon,
  HomeIcon,
  OutlinedCloneIcon,
  PencilAltIcon,
  PlusCircleIcon,
  RhStandardSunIcon,
  RhUiAsleepIcon,
  RhUiDarkModeIcon,
  RhUiLightModeIcon,
  ShareAltIcon,
  ThumbtackIcon
} from '@app/icons/rhUiIcons';
import { Link, useNavigate } from 'react-router-dom';
import { CONSOLE_DEFAULT_BODY_TITLE } from '@app/DashboardHub/consoleDefaultDashboard';
import { getPrebuiltDashboardAutoSizeWidgetIds, isConsoleDefaultHubRow, isPrebuiltHubRow } from '@app/DashboardHub/prebuiltDashboards';
import { useDashboardData } from '@app/DashboardHub/DashboardDataContext';
import { CopyConfigStringModal } from '@app/DashboardHub/CopyConfigStringModal';
import { DuplicateDashboardModal } from '@app/DashboardHub/DuplicateDashboardModal';
import { PinDashboardModal } from '@app/DashboardHub/PinDashboardModal';
import {
  mergeCanvasWidgetsWithCatalog,
  onDashboardCanvasUpdated,
  resolveDashboardCanvasWidgets,
  serializeDashboardConfigPayload
} from '@app/DashboardHub/dashboardCanvasStorage';
import {
  IMPORT_JSON_CONFIG_MENU_LABEL,
  PIN_DASHBOARD_TO_SERVICES_MENU_LABEL,
  SHARE_DASHBOARD_MENU_LABEL,
} from '@app/useCopyConfigFeedback';
import type { ColumnSpan, RowSpan, Widget } from '@app/Homepage/widgetTypes';
import {
  computeDashboardWidgetPlacements,
  getDashboardGridColumnCount,
  getWidgetsGridColumnStyle,
  ReadOnlyHomepageWidgetFrame,
  WIDGET_GRID_STYLES,
  renderHomepageWidgetContent
} from '@app/Homepage/homepageWidgetGrid';
import { DASHBOARD_CANVAS_LAYOUT_CLASS } from '@app/DashboardHub/dashboardCanvasLayout';
import { useDeferredResizeObserverOffsetWidth } from '@app/useDeferredResizeObserver';
import { MASTHEAD_USER_DISPLAY_NAME } from '@app/mastheadUserDisplayName';

const HOMEPAGE_DASHBOARD_EMPTY_ILLUSTRATION_SRC =
  'https://www.redhat.com/rhdc/managed-files/audience-1_rhai-inference-server-datasheet.webp';

/** Renders in PatternFly `EmptyState` `icon` slot (receives `className` from `EmptyStateIcon`). */
function HomepageDashboardEmptyIllustration({
  className,
  style,
  ...rest
}: React.ImgHTMLAttributes<HTMLImageElement>) {
  return (
    <img
      {...rest}
      src={HOMEPAGE_DASHBOARD_EMPTY_ILLUSTRATION_SRC}
      alt=""
      className={className}
      style={{
        maxWidth: 'min(100%, 320px)',
        width: '100%',
        height: 'auto',
        display: 'block',
        marginInline: 'auto',
        ...style
      }}
    />
  );
}

type GreetingSegment = 'morning' | 'afternoon' | 'evening' | 'night';

function getGreetingSegmentForLocalTime(date: Date): GreetingSegment {
  const h = date.getHours();
  if (h >= 5 && h < 12) {
    return 'morning';
  }
  if (h >= 12 && h < 17) {
    return 'afternoon';
  }
  if (h >= 17 && h < 22) {
    return 'evening';
  }
  return 'night';
}

function HomepageGreetingIcon({ segment }: { segment: GreetingSegment }) {
  switch (segment) {
    case 'morning':
      return <RhStandardSunIcon aria-hidden />;
    case 'afternoon':
      return <RhUiLightModeIcon aria-hidden />;
    case 'evening':
      return <RhUiDarkModeIcon aria-hidden />;
    case 'night':
      return <RhUiAsleepIcon aria-hidden />;
  }
}

const Homepage: React.FunctionComponent = () => {
  const navigate = useNavigate();
  const { rows, setDashboardAsHomepage } = useDashboardData();
  const [displayWidgets, setDisplayWidgets] = useState<Widget[]>([]);
  const [autoSizeWidgetIds, setAutoSizeWidgetIds] = useState<Set<string>>(() => new Set());
  const homepageWidgetsGridRef = useRef<HTMLDivElement>(null);
  const [homepageGridEl, setHomepageGridEl] = useState<HTMLDivElement | null>(null);
  const setHomepageWidgetsGridRef = useCallback((node: HTMLDivElement | null) => {
    homepageWidgetsGridRef.current = node;
    setHomepageGridEl(node);
  }, []);
  const homepageGridWidth = useDeferredResizeObserverOffsetWidth(
    () => homepageGridEl,
    [homepageGridEl, displayWidgets.length]
  );
  const homepageWidgetsGridColumnStyle = useMemo(
    () => getWidgetsGridColumnStyle(homepageGridWidth),
    [homepageGridWidth]
  );
  const [isHomepageKebabOpen, setIsHomepageKebabOpen] = useState(false);
  const [isHomepageHeroMenuOpen, setIsHomepageHeroMenuOpen] = useState(false);
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
  const [isPinDashboardModalOpen, setIsPinDashboardModalOpen] = useState(false);
  const [isCopyConfigModalOpen, setIsCopyConfigModalOpen] = useState(false);

  const closeHomepageHeroMenu = useCallback(() => {
    setIsHomepageHeroMenuOpen(false);
  }, []);

  const greetingSegment = useMemo(() => getGreetingSegmentForLocalTime(new Date()), []);
  /** After “Good …” — late night still says “evening”, not “night”. */
  const greetingTitleWord = useMemo(
    () => (greetingSegment === 'night' ? 'evening' : greetingSegment),
    [greetingSegment]
  );

  const homepageDashboard = useMemo(
    () => rows.find((r) => r.isHomepage),
    [rows]
  );

  const canvasTitle = homepageDashboard
    ? (homepageDashboard.canvasTitle ?? homepageDashboard.name)
    : '';

  /** Hero title in the widget area; built-in dashboard uses a product welcome line instead of the hub name. */
  const homepageDashboardBodyTitle = isConsoleDefaultHubRow(homepageDashboard)
    ? CONSOLE_DEFAULT_BODY_TITLE
    : canvasTitle;

  const sortedHubRows = useMemo(
    () => [...rows].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })),
    [rows]
  );

  const homepageWidgetPlacements = useMemo(() => {
    const n = getDashboardGridColumnCount(homepageGridWidth);
    return computeDashboardWidgetPlacements(displayWidgets, n);
  }, [displayWidgets, homepageGridWidth]);

  const refreshFromStorage = useCallback(() => {
    if (!homepageDashboard) {
      setDisplayWidgets([]);
      setAutoSizeWidgetIds(new Set());
      return;
    }
    const raw = resolveDashboardCanvasWidgets(homepageDashboard);
    if (raw && raw.length > 0) {
      setDisplayWidgets(mergeCanvasWidgetsWithCatalog(raw));
      setAutoSizeWidgetIds(
        isPrebuiltHubRow(homepageDashboard)
          ? new Set(getPrebuiltDashboardAutoSizeWidgetIds(homepageDashboard.id))
          : new Set()
      );
    } else {
      setDisplayWidgets([]);
      setAutoSizeWidgetIds(new Set());
    }
  }, [homepageDashboard]);

  const handleAutoSizeFit = useCallback(
    (id: string, colSpan: ColumnSpan, rowSpan: RowSpan, complete: boolean) => {
      setDisplayWidgets((prev) => prev.map((w) => (w.id === id ? { ...w, colSpan, rowSpan } : w)));
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
    },
    []
  );

  useEffect(() => {
    refreshFromStorage();
  }, [refreshFromStorage]);

  useEffect(() => {
    return onDashboardCanvasUpdated((detail) => {
      if (detail?.dashboardId && detail.dashboardId === homepageDashboard?.id) {
        refreshFromStorage();
      }
    });
  }, [homepageDashboard?.id, refreshFromStorage]);

  const closeHomepageKebab = useCallback(() => {
    setIsHomepageKebabOpen(false);
  }, []);

  const closeDuplicateModal = useCallback(() => {
    setIsDuplicateModalOpen(false);
  }, []);

  const handleDuplicateModalSuccess = useCallback(
    (newId: string) => {
      setIsDuplicateModalOpen(false);
      navigate(`/dashboard-hub/${newId}`);
    },
    [navigate]
  );

  useEffect(() => {
    if (!homepageDashboard) {
      setIsDuplicateModalOpen(false);
    }
  }, [homepageDashboard]);

  const copyConfigString = useMemo(() => {
    if (!homepageDashboard) {
      return '';
    }
    const raw = resolveDashboardCanvasWidgets(homepageDashboard);
    return serializeDashboardConfigPayload({
      dashboardId: homepageDashboard.id,
      name: homepageDashboard.name,
      widgets: raw ?? []
    });
  }, [homepageDashboard]);

  const handleOpenCopyConfigModal = useCallback(() => {
    closeHomepageKebab();
    setIsCopyConfigModalOpen(true);
  }, [closeHomepageKebab]);

  return (
    <>
      <style>{WIDGET_GRID_STYLES}</style>
      <PageSection isWidthLimited={false} className="homepage-hero-header">
        <div className="homepage-hero-header__inner">
          <Flex
            alignItems={{ default: 'alignItemsCenter' }}
            justifyContent={{ default: 'justifyContentSpaceBetween' }}
            flexWrap={{ default: 'wrap' }}
            rowGap={{ default: 'rowGapMd' }}
            style={{ width: '100%' }}
          >
            <FlexItem>
              <Flex
                spaceItems={{ default: 'spaceItemsMd' }}
                alignItems={{ default: 'alignItemsCenter' }}
                style={{ minWidth: 0 }}
              >
                <span className="homepage-hero-greeting__icon" aria-hidden>
                  <HomepageGreetingIcon segment={greetingSegment} />
                </span>
                <Title
                  headingLevel="h1"
                  size="4xl"
                  className="homepage-hero-greeting__title"
                >
                  Good {greetingTitleWord}, {MASTHEAD_USER_DISPLAY_NAME}
                </Title>
              </Flex>
            </FlexItem>
            <FlexItem>
              <Dropdown
                id="homepage-hero-assignment-menu"
                data-hcc-menu-rev="leading-icons-1"
                isOpen={isHomepageHeroMenuOpen}
                isScrollable={false}
                shouldFocusToggleOnSelect
                onOpenChange={setIsHomepageHeroMenuOpen}
                popperProps={{ position: 'end' }}
                toggle={(toggleRef: React.Ref<HTMLButtonElement>) => (
                  <MenuToggle
                    ref={toggleRef}
                    variant="default"
                    isExpanded={isHomepageHeroMenuOpen}
                    aria-label={
                      homepageDashboard
                        ? `Homepage: ${canvasTitle}. Open menu.`
                        : 'No homepage assigned. Open menu to set a dashboard as your homepage.'
                    }
                    onClick={() => setIsHomepageHeroMenuOpen((o) => !o)}
                  >
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        minWidth: 0,
                        maxWidth: 'min(32rem, 70vw)',
                        color: homepageDashboard
                          ? undefined
                          : 'var(--pf-t--global--text--color--subtle)'
                      }}
                    >
                      <HomeIcon
                        style={{ color: 'var(--pf-t--global--icon--Color--200)', flexShrink: 0 }}
                        aria-hidden
                      />
                      <span
                        style={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          minWidth: 0
                        }}
                      >
                        {homepageDashboard ? canvasTitle : 'No homepage assigned'}
                      </span>
                    </span>
                  </MenuToggle>
                )}
              >
                <DropdownGroup label="Set as homepage ..." labelHeadingLevel="h2">
                  <DropdownList>
                    {sortedHubRows.length > 0 ? (
                      sortedHubRows.map((row) => (
                        <DropdownItem
                          key={row.id}
                          value={row.id}
                          isSelected={row.isHomepage === true}
                          onClick={() => {
                            setDashboardAsHomepage(row.id);
                            closeHomepageHeroMenu();
                          }}
                          actions={
                            isPrebuiltHubRow(row) ? (
                              <Tooltip content="System default dashboards are uneditable.">
                                <MenuItemAction
                                  icon={<PencilAltIcon />}
                                  aria-label={`Edit ${row.name} (not available, system dashboards are uneditable)`}
                                  isDisabled
                                  onClick={(e) => {
                                    e?.stopPropagation?.();
                                  }}
                                />
                              </Tooltip>
                            ) : (
                              <MenuItemAction
                                icon={<PencilAltIcon />}
                                aria-label={`Edit ${row.name}`}
                                onClick={(e) => {
                                  e?.stopPropagation?.();
                                  closeHomepageHeroMenu();
                                  navigate(`/dashboard-hub/${row.id}`);
                                }}
                              />
                            )
                          }
                        >
                          {row.name}
                        </DropdownItem>
                      ))
                    ) : (
                      <DropdownItem value="no-dashboards" isDisabled>
                        No dashboards in hub yet
                      </DropdownItem>
                    )}
                  </DropdownList>
                </DropdownGroup>
                <Divider />
                <DropdownGroup label="Create new dashboard" labelHeadingLevel="h2">
                  <DropdownList>
                    <DropdownItem
                      value="hp-menu-blank"
                      icon={
                        <span className="homepage-hero-assignment-menu__leading-icon">
                          <PlusCircleIcon
                            style={{ color: 'var(--pf-t--global--icon--Color--200)' }}
                            aria-hidden
                          />
                        </span>
                      }
                      onClick={() => {
                        closeHomepageHeroMenu();
                        navigate('/dashboard-hub', {
                          state: { fromHome: { openCreate: 'blank' } }
                        });
                      }}
                    >
                      Create from blank
                    </DropdownItem>
                    <DropdownItem
                      value="hp-menu-import"
                      icon={
                        <span className="homepage-hero-assignment-menu__leading-icon">
                          <CodeIcon
                            style={{ color: 'var(--pf-t--global--icon--Color--200)' }}
                            aria-hidden
                          />
                        </span>
                      }
                      onClick={() => {
                        closeHomepageHeroMenu();
                        navigate('/dashboard-hub', {
                          state: { fromHome: { openCreate: 'import' } }
                        });
                      }}
                    >
                      {IMPORT_JSON_CONFIG_MENU_LABEL}
                    </DropdownItem>
                    <DropdownItem
                      value="hp-menu-dup"
                      icon={
                        <span className="homepage-hero-assignment-menu__leading-icon">
                          <OutlinedCloneIcon
                            style={{ color: 'var(--pf-t--global--icon--Color--200)' }}
                            aria-hidden
                          />
                        </span>
                      }
                      onClick={() => {
                        closeHomepageHeroMenu();
                        navigate('/dashboard-hub', {
                          state: { fromHome: { openCreate: 'duplicate' } }
                        });
                      }}
                    >
                      Duplicate existing
                    </DropdownItem>
                  </DropdownList>
                </DropdownGroup>
                <Divider />
                <DropdownList>
                  <DropdownItem
                    value="dashboard-hub"
                    description="Create, manage, and share dashboards"
                    onClick={() => {
                      closeHomepageHeroMenu();
                      navigate('/dashboard-hub');
                    }}
                  >
                    Dashboard hub
                  </DropdownItem>
                </DropdownList>
              </Dropdown>
            </FlexItem>
          </Flex>
        </div>
        <div className="homepage-hero-separator" role="separator" aria-orientation="horizontal" />
      </PageSection>
      <PageSection className="homepage-dashboard-page-section">
        {homepageDashboard ? (
          <>
            <div className={DASHBOARD_CANVAS_LAYOUT_CLASS}>
              <Flex
                alignItems={{ default: 'alignItemsFlexStart' }}
                justifyContent={{ default: 'justifyContentSpaceBetween' }}
                spaceItems={{ default: 'spaceItemsMd' }}
                style={{
                  width: '100%',
                  minWidth: 0,
                  marginBottom: 'var(--pf-t--global--spacer--sm)',
                }}
                className="homepage-dashboard-title-bar"
              >
                <FlexItem className="homepage-dashboard-title" style={{ minWidth: 0, flex: '1 1 auto' }}>
                  <Title headingLevel="h2" size="2xl" className="homepage-dashboard-title__text">
                    {homepageDashboardBodyTitle}
                  </Title>
                </FlexItem>
                <FlexItem
                  className="homepage-dashboard-actions"
                  style={{ flex: '0 0 auto' }}
                >
                  <Flex
                    alignItems={{ default: 'alignItemsCenter' }}
                    spaceItems={{ default: 'spaceItemsSm' }}
                    style={{ flexWrap: 'nowrap' }}
                  >
                    <FlexItem>
                      <Dropdown
                        isOpen={isHomepageKebabOpen}
                        onSelect={() => setIsHomepageKebabOpen(false)}
                        onOpenChange={setIsHomepageKebabOpen}
                        popperProps={{ position: 'end' }}
                        toggle={(toggleRef: React.Ref<HTMLButtonElement>) => (
                            <MenuToggle
                              ref={toggleRef}
                              variant="plain"
                              isExpanded={isHomepageKebabOpen}
                              aria-label="Homepage dashboard actions"
                              onClick={() => {
                                setIsHomepageKebabOpen((o) => !o);
                              }}
                            >
                              <EllipsisVIcon />
                            </MenuToggle>
                        )}
                        shouldFocusToggleOnSelect
                      >
                        <DropdownList>
                          <DropdownItem key="copy-config" onClick={handleOpenCopyConfigModal}>
                            <span
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                            >
                              <ShareAltIcon style={{ color: 'var(--pf-t--global--icon--Color--200)' }} />
                              {SHARE_DASHBOARD_MENU_LABEL}
                            </span>
                          </DropdownItem>
                          <DropdownItem
                            key="duplicate"
                            onClick={() => {
                              closeHomepageKebab();
                              setIsDuplicateModalOpen(true);
                            }}
                          >
                            <span
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                            >
                              <OutlinedCloneIcon style={{ color: 'var(--pf-t--global--icon--Color--200)' }} />
                              Duplicate dashboard
                            </span>
                          </DropdownItem>
                          <DropdownItem
                            key="pin-to-services"
                            onClick={() => {
                              closeHomepageKebab();
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
                          <Divider component="li" role="separator" />
                          <DropdownItem
                            key="dashboard-hub"
                            description="Create, manage, share dashboards"
                            onClick={() => {
                              closeHomepageKebab();
                              navigate('/dashboard-hub');
                            }}
                          >
                            Dashboard Hub
                          </DropdownItem>
                        </DropdownList>
                      </Dropdown>
                    </FlexItem>
                    <FlexItem>
                      {isPrebuiltHubRow(homepageDashboard) ? (
                        <Tooltip content="System default dashboards are not editable. Create a duplicate in order to edit this dashboard.">
                          <Button
                            variant="secondary"
                            icon={<OutlinedCloneIcon />}
                            iconPosition="start"
                            onClick={() => setIsDuplicateModalOpen(true)}
                          >
                            Duplicate dashboard
                          </Button>
                        </Tooltip>
                      ) : (
                        <Button
                          variant="secondary"
                          icon={<PencilAltIcon />}
                          iconPosition="start"
                          onClick={() => navigate(`/dashboard-hub/${homepageDashboard.id}`)}
                        >
                          Edit dashboard
                        </Button>
                      )}
                    </FlexItem>
                  </Flex>
                </FlexItem>
              </Flex>
              <div style={{ marginBottom: 'var(--pf-t--global--spacer--md)' }}>
                <Alert
                  variant="info"
                  isInline
                  isPlain
                  component="p"
                  title={
                    <>
                      We&apos;ve made enhancements to our dashboard, including: creating multiple, saving, sharing,
                      duplicating and more.{' '}
                      <Button
                        component="a"
                        variant="link"
                        isInline
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                        }}
                      >
                        Learn more.
                      </Button>
                    </>
                  }
                />
              </div>
              {displayWidgets.length > 0 ? (
                <div
                  ref={setHomepageWidgetsGridRef}
                  className="widgets-grid homepage-readonly-grid"
                  style={{ minWidth: 0, width: '100%', ...homepageWidgetsGridColumnStyle }}
                  aria-label="Read-only preview of your homepage dashboard"
                >
                  {displayWidgets.map((widget) => (
                    <ReadOnlyHomepageWidgetFrame
                      key={widget.id}
                      widget={widget}
                      gridWidth={homepageGridWidth}
                      placement={homepageWidgetPlacements.get(widget.id) ?? { columnStart: 1, rowStart: 1 }}
                      autoSize={autoSizeWidgetIds.has(widget.id)}
                      onAutoSizeFit={handleAutoSizeFit}
                    >
                      {renderHomepageWidgetContent(widget, {
                        navigate,
                        readOnly: true
                      })}
                    </ReadOnlyHomepageWidgetFrame>
                  ))}
                </div>
              ) : (
                <EmptyState
                  variant="lg"
                  headingLevel="h2"
                  titleText="Populate this dashboard"
                  icon={HomepageDashboardEmptyIllustration}
                >
                  <EmptyStateBody>
                    Create visual at-a-glance views of the most important information about your Red Hat systems,
                    clusters, and more.
                  </EmptyStateBody>
                  <EmptyStateFooter>
                    {isPrebuiltHubRow(homepageDashboard) ? (
                      <Tooltip content="System default dashboards are not editable. Create a duplicate in order to edit this dashboard.">
                        <Button
                          variant="primary"
                          icon={<OutlinedCloneIcon />}
                          iconPosition="start"
                          onClick={() => setIsDuplicateModalOpen(true)}
                        >
                          Duplicate dashboard
                        </Button>
                      </Tooltip>
                    ) : (
                      <Button
                        variant="primary"
                        icon={<PencilAltIcon />}
                        iconPosition="start"
                        onClick={() => navigate(`/dashboard-hub/${homepageDashboard.id}`)}
                      >
                        Edit dashboard
                      </Button>
                    )}
                  </EmptyStateFooter>
                </EmptyState>
              )}
            </div>
          </>
        ) : (
          <Content>
            <p>
              Set a <strong>homepage dashboard</strong> in <Link to="/dashboard-hub">Dashboard Hub</Link> (kebab menu →
              Set as homepage) to show it here. Until then, the widget area is empty.
            </p>
          </Content>
        )}
      </PageSection>
      <CopyConfigStringModal
        isOpen={isCopyConfigModalOpen}
        onClose={() => setIsCopyConfigModalOpen(false)}
        configString={copyConfigString}
      />
      <DuplicateDashboardModal
        isOpen={isDuplicateModalOpen && Boolean(homepageDashboard)}
        onClose={closeDuplicateModal}
        rows={rows}
        initialSourceId={homepageDashboard?.id}
        initialSetAsHomepage
        onSuccess={handleDuplicateModalSuccess}
      />
      <PinDashboardModal
        isOpen={isPinDashboardModalOpen && Boolean(homepageDashboard)}
        onClose={() => setIsPinDashboardModalOpen(false)}
        dashboardId={homepageDashboard?.id ?? ''}
        dashboardName={homepageDashboard?.name ?? ''}
      />
    </>
  );
};

export { Homepage };
