import * as React from 'react';
import { useCallback, useContext, useMemo, useState } from 'react';
import {
  Button,
  Content,
  Dropdown,
  EmptyState,
  EmptyStateBody,
  EmptyStateFooter,
  ExpandableSection,
  Flex,
  FlexItem,
  Label,
  LabelGroup,
  List,
  ListItem,
  MenuItem,
  MenuList,
  MenuToggle,
  Tab,
  Tabs,
  TabTitleText,
  TextInputGroup,
  TextInputGroupMain,
  TextInputGroupUtilities,
  Title
} from '@patternfly/react-core';
import { CubesIcon, TimesIcon } from '@app/icons/rhUiIcons';
import SparkleIcon from '@app/bgimages/sparkle-icon.svg';
import { HelpPanelContext } from '@app/AppLayout/AppLayout';
import { BankWidgetCard } from '@app/Homepage/BankWidgetCard';
import {
  EXAMPLE_BANK_SEARCH_PROMPTS,
  filterCatalogWidgetsBySearch
} from '@app/Homepage/bankWidgetSearch';
import { useDashboardBankBridge } from '@app/Homepage/dashboardBankBridge';
import { HOMEPAGE_WIDGET_CATALOG } from '@app/Homepage/homepageWidgetCatalog';
import { WidgetBuilderSection } from '@app/Homepage/WidgetBuilderSection';
import { ADD_WIDGETS_DRAWER_STYLES } from '@app/Homepage/addWidgetsDrawerStyles';
import {
  createInitialPortfolioFilterState,
  filterWidgetsByPortfolioTags,
  getPortfolioFilterLabel,
  WIDGET_PORTFOLIO_FILTERS
} from '@app/Homepage/homepageWidgetPortfolioFilters';

/** Font Awesome Free Solid `fa-filter` (Font Awesome Free License). */
function FaFilterIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" aria-hidden width="1em" height="1em">
      <path
        fill="currentColor"
        d="M3.9 54.9C10.5 40.9 24.5 32 40 32H472c15.5 0 29.5 8.9 36.1 22.9s4.6 30.5-5.2 42.5L320 320.9V448c0 12.1-6.8 23.2-17.7 28.6s-23.8 4.3-33.5-3l-64-48c-8.1-6-12.8-15.5-12.8-25.6V320.9L9 97.3C-.7 85.4-2.8 68.8 3.9 54.9z"
      />
    </svg>
  );
}

/**
 * Help panel “Dashboard widgets” tab: full catalog + same search behavior as Find widgets in the widget bank.
 */
const DashboardWidgetsHelpPanelContent: React.FunctionComponent = () => {
  const dashboardBank = useDashboardBankBridge();
  const helpPanelContext = useContext(HelpPanelContext);
  const [activeTab, setActiveTab] = useState<string | number>('find-widgets');
  const [bankSearchInput, setBankSearchInput] = useState('');
  const [bankSearchQuery, setBankSearchQuery] = useState('');
  const [isExamplePromptsExpanded, setIsExamplePromptsExpanded] = useState(false);
  const [isPortfolioFilterOpen, setIsPortfolioFilterOpen] = useState(false);
  const [portfolioFilters, setPortfolioFilters] = useState<Record<string, boolean>>(createInitialPortfolioFilterState);

  const selectedPortfolioFilterIds = useMemo(() => {
    const ids = new Set<string>();
    for (const [id, on] of Object.entries(portfolioFilters)) {
      if (on) {
        ids.add(id);
      }
    }
    return ids;
  }, [portfolioFilters]);

  /** Active filters in stable catalog order (for chips). */
  const activePortfolioFilterIdsOrdered = useMemo(
    () => WIDGET_PORTFOLIO_FILTERS.map((f) => f.id).filter((id) => portfolioFilters[id]),
    [portfolioFilters]
  );

  /** Widgets that match the search query (portfolio filters applied on top). */
  const searchMatchedWidgets = useMemo(
    () => filterCatalogWidgetsBySearch(HOMEPAGE_WIDGET_CATALOG, bankSearchQuery),
    [bankSearchQuery]
  );

  const visibleWidgets = useMemo(
    () => filterWidgetsByPortfolioTags(searchMatchedWidgets, selectedPortfolioFilterIds),
    [searchMatchedWidgets, selectedPortfolioFilterIds]
  );

  const { availableWidgets, alreadyAddedWidgets } = useMemo(() => {
    const available: typeof visibleWidgets = [];
    const added: typeof visibleWidgets = [];
    for (const widget of visibleWidgets) {
      if (dashboardBank?.canvasWidgetIds.has(widget.id)) {
        added.push(widget);
      } else {
        available.push(widget);
      }
    }
    return { availableWidgets: available, alreadyAddedWidgets: added };
  }, [visibleWidgets, dashboardBank?.canvasWidgetIds]);

  const resetFindWidgetsSearchToDefault = useCallback(() => {
    setBankSearchInput('');
    setBankSearchQuery('');
    setIsExamplePromptsExpanded(false);
  }, []);

  const submitBankSearch = useCallback(() => {
    const trimmed = bankSearchInput.trim();
    setBankSearchQuery(trimmed);
    if (trimmed === '') {
      setIsExamplePromptsExpanded(false);
    }
  }, [bankSearchInput]);

  const applyExamplePromptSearch = useCallback((prompt: string) => {
    const trimmed = prompt.trim();
    setBankSearchInput(trimmed);
    setBankSearchQuery(trimmed);
    setIsExamplePromptsExpanded(false);
  }, []);

  const openRequestNewWidgetTab = useCallback(() => {
    helpPanelContext?.openHelpPanelToShareGeneralFeedback();
  }, [helpPanelContext]);

  const onPortfolioFilterSelect = useCallback(
    (_event: React.MouseEvent<Element> | undefined, itemId: string | number | undefined) => {
      if (itemId === undefined) {
        return;
      }
      const key = String(itemId);
      setPortfolioFilters((prev) => ({ ...prev, [key]: !prev[key] }));
    },
    []
  );

  const removePortfolioFilter = useCallback((filterId: string) => {
    setPortfolioFilters((prev) => ({ ...prev, [filterId]: false }));
  }, []);

  const clearAllPortfolioFilters = useCallback(() => {
    setPortfolioFilters(createInitialPortfolioFilterState());
  }, []);

  const widgetCatalogEmptyActions = (
    <EmptyStateFooter>
      <Flex spaceItems={{ default: 'spaceItemsSm' }} flexWrap={{ default: 'wrap' }}>
        <Button variant="primary" size="sm" type="button" onClick={resetFindWidgetsSearchToDefault}>
          View all widgets
        </Button>
        <Button variant="secondary" size="sm" type="button" onClick={openRequestNewWidgetTab}>
          Request a new widget
        </Button>
      </Flex>
    </EmptyStateFooter>
  );

  const handleAddWidgetFromBuilder = useCallback(
    (widget: import('@app/Homepage/widgetTypes').Widget) => {
      dashboardBank?.addWidgetToDashboard(widget);
    },
    [dashboardBank]
  );

  const canAddWidgets = dashboardBank?.canAddWidgets ?? false;

  const renderWidgetCard = useCallback(
    (widget: import('@app/Homepage/widgetTypes').Widget) => {
      const isOnCanvas = dashboardBank?.canvasWidgetIds.has(widget.id) ?? false;
      const hasBridge = dashboardBank != null;
      const addAllowed = !isOnCanvas && hasBridge && dashboardBank.canAddWidgets;
      const disabledAddTooltip = isOnCanvas
        ? ''
        : !hasBridge
          ? 'Open a dashboard from Dashboard Hub to add widgets.'
          : !dashboardBank.canAddWidgets
            ? 'Widgets cannot be added to the built-in Console default dashboard.'
            : '';

      return (
        <div key={widget.id} role="listitem">
          <BankWidgetCard
            widget={widget}
            onAdd={(w) => dashboardBank?.addWidgetToDashboard(w)}
            onRemove={
              isOnCanvas && dashboardBank?.canAddWidgets
                ? (w) => dashboardBank.removeWidgetFromDashboard(w)
                : undefined
            }
            isAlreadyOnDashboard={isOnCanvas}
            addAllowed={addAllowed}
            disabledAddTooltip={disabledAddTooltip}
          />
        </div>
      );
    },
    [dashboardBank]
  );

  return (
    <div className="dashboard-widgets-help-panel">
      <style>{ADD_WIDGETS_DRAWER_STYLES}</style>
      <Tabs
        activeKey={activeTab}
        onSelect={(_e, key) => setActiveTab(key)}
        isFilled
        aria-label="Add widgets tabs"
        style={{ marginBottom: 0 }}
      >
        <Tab eventKey="find-widgets" title={<TabTitleText>Find widgets</TabTitleText>}>
          <div style={{ padding: '24px' }}>
            <Flex
              justifyContent={{ default: 'justifyContentSpaceBetween' }}
              alignItems={{ default: 'alignItemsCenter' }}
              flexWrap={{ default: 'wrap' }}
              style={{
                width: '100%',
                gap: 'var(--pf-t--global--spacer--sm)',
                marginBottom: '16px'
              }}
            >
              <FlexItem>
                <Title headingLevel="h3" size="lg" style={{ margin: 0 }}>
                  Find widgets
                </Title>
              </FlexItem>
              <FlexItem>
                <Button variant="secondary" size="sm" type="button" onClick={openRequestNewWidgetTab}>
                  Request a new widget
                </Button>
              </FlexItem>
            </Flex>

            <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsMd' }} style={{ width: '100%' }}>
              <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsSm' }} style={{ width: '100%' }}>
                <form
                  onSubmit={(e) => e.preventDefault()}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      submitBankSearch();
                    }
                  }}
                  style={{ width: '100%' }}
                >
                  <Flex
                    alignItems={{ default: 'alignItemsCenter' }}
                    spaceItems={{ default: 'spaceItemsSm' }}
                    style={{ width: '100%' }}
                  >
                    <FlexItem flex={{ default: 'flex_1' }} style={{ minWidth: 0 }}>
                      <TextInputGroup style={{ width: '100%' }}>
                        <TextInputGroupMain
                          inputId="dashboard-widgets-help-search"
                          icon={
                            <img
                              src={SparkleIcon}
                              alt=""
                              aria-hidden
                              width={16}
                              height={16}
                              style={{ display: 'block' }}
                            />
                          }
                          placeholder="What do you need your widget to do?"
                          value={bankSearchInput}
                          onChange={(_e, v) => {
                            if (v.trim() === '') {
                              resetFindWidgetsSearchToDefault();
                            } else {
                              setBankSearchInput(v);
                            }
                          }}
                          name="dashboard-widgets-help-search"
                          type="text"
                          aria-label="What you need your widget to do; press Enter to search"
                        />
                        {!!bankSearchInput && (
                          <TextInputGroupUtilities>
                            <Button
                              variant="plain"
                              type="button"
                              aria-label="Clear search"
                              icon={<TimesIcon />}
                              onClick={resetFindWidgetsSearchToDefault}
                            />
                          </TextInputGroupUtilities>
                        )}
                      </TextInputGroup>
                    </FlexItem>
                    <FlexItem>
                      <Dropdown
                        isOpen={isPortfolioFilterOpen}
                        onOpenChange={setIsPortfolioFilterOpen}
                        onSelect={onPortfolioFilterSelect}
                        shouldFocusToggleOnSelect={false}
                        popperProps={{ direction: 'down', position: 'end', enableFlip: true }}
                        toggle={(toggleRef) => (
                          <MenuToggle
                            ref={toggleRef}
                            variant="plain"
                            aria-label="Filter widgets by portfolio"
                            icon={<FaFilterIcon />}
                            isExpanded={isPortfolioFilterOpen}
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsPortfolioFilterOpen(!isPortfolioFilterOpen);
                            }}
                          />
                        )}
                      >
                        <MenuList aria-label="Portfolio filters">
                          {WIDGET_PORTFOLIO_FILTERS.map(({ id, label }) => (
                            <MenuItem key={id} itemId={id} hasCheckbox isSelected={portfolioFilters[id] ?? false}>
                              {label}
                            </MenuItem>
                          ))}
                        </MenuList>
                      </Dropdown>
                    </FlexItem>
                  </Flex>
                </form>

                {activePortfolioFilterIdsOrdered.length > 0 && (
                  <Flex
                    alignItems={{ default: 'alignItemsCenter' }}
                    flexWrap={{ default: 'wrap' }}
                    spaceItems={{ default: 'spaceItemsMd' }}
                    style={{ width: '100%', rowGap: 'var(--pf-t--global--spacer--xs)' }}
                  >
                    <LabelGroup aria-label="Active portfolio filters">
                      {activePortfolioFilterIdsOrdered.map((filterId) => (
                        <Label key={filterId} onClose={() => removePortfolioFilter(filterId)}>
                          {getPortfolioFilterLabel(filterId)}
                        </Label>
                      ))}
                    </LabelGroup>
                    <Button variant="link" isInline type="button" onClick={clearAllPortfolioFilters}>
                      Clear filters
                    </Button>
                  </Flex>
                )}
              </Flex>

              {!bankSearchQuery.trim() && (
                <ExpandableSection
                  className="dashboard-widgets-help-example-prompts"
                  isExpanded={isExamplePromptsExpanded}
                  onToggle={(_e, isExpanded) => setIsExamplePromptsExpanded(isExpanded)}
                  toggleText="Show example prompts"
                >
                  <List isPlain>
                    {EXAMPLE_BANK_SEARCH_PROMPTS.map((prompt) => (
                      <ListItem key={prompt}>
                        <Button
                          variant="link"
                          isInline
                          type="button"
                          onClick={() => applyExamplePromptSearch(prompt)}
                          aria-label={`Search widgets: ${prompt}`}
                        >
                          {prompt}
                        </Button>
                      </ListItem>
                    ))}
                  </List>
                </ExpandableSection>
              )}

              {visibleWidgets.length === 0 ? (
                <EmptyState variant="xs" headingLevel="h4" titleText="No matching widgets" icon={CubesIcon}>
                  <EmptyStateBody>
                    Try a different search query, adjust portfolio filters, or clear filters to see more widgets.
                  </EmptyStateBody>
                  {widgetCatalogEmptyActions}
                </EmptyState>
              ) : (
                <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsLg' }} style={{ width: '100%' }}>
                  {availableWidgets.length > 0 && (
                    <FlexItem style={{ width: '100%' }}>
                      <Title headingLevel="h4" size="md" style={{ marginBottom: 'var(--pf-t--global--spacer--sm)' }}>
                        Available to add ({availableWidgets.length})
                      </Title>
                      <div className="removed-widgets-grid add-widgets-bank-grid" role="list">
                        {availableWidgets.map(renderWidgetCard)}
                      </div>
                    </FlexItem>
                  )}
                  {alreadyAddedWidgets.length > 0 && (
                    <FlexItem style={{ width: '100%' }}>
                      <Title headingLevel="h4" size="md" style={{ marginBottom: 'var(--pf-t--global--spacer--sm)' }}>
                        Already on dashboard ({alreadyAddedWidgets.length})
                      </Title>
                      <div className="removed-widgets-grid add-widgets-bank-grid" role="list">
                        {alreadyAddedWidgets.map(renderWidgetCard)}
                      </div>
                    </FlexItem>
                  )}
                </Flex>
              )}
            </Flex>
          </div>
        </Tab>
        <Tab eventKey="widget-builder" title={<TabTitleText>Widget builder</TabTitleText>}>
          <div style={{ padding: '24px' }}>
            <WidgetBuilderSection
              onAddWidget={handleAddWidgetFromBuilder}
              canAddWidgets={canAddWidgets}
            />
          </div>
        </Tab>
      </Tabs>
    </div>
  );
};

export { DashboardWidgetsHelpPanelContent };
