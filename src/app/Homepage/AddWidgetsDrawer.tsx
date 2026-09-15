import * as React from 'react';
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Content,
  Divider,
  Dropdown,
  DropdownItem,
  DropdownList,
  EmptyState,
  EmptyStateBody,
  EmptyStateFooter,
  ExpandableSection,
  Flex,
  FlexItem,
  FormGroup,
  HelperText,
  HelperTextItem,
  List,
  ListItem,
  MenuToggle,
  type MenuToggleElement,
  Panel,
  PanelMain,
  PanelMainBody,
  TextInput,
  TextInputGroup,
  TextInputGroupMain,
  TextInputGroupUtilities,
  Title,
  Tooltip
} from '@patternfly/react-core';
import { CodeEditor, CodeEditorControl, Language } from '@patternfly/react-code-editor';
import type { editor } from 'monaco-editor';
import { AiSearchIcon, CodeIcon, CopyIcon, CubesIcon, ExternalLinkAltIcon, PanelOpenIcon, PlusCircleIcon, RedoIcon, SearchIcon, SyncAltIcon, TimesIcon, UndoIcon } from '@app/icons/rhUiIcons';
import { HelpPanelContext } from '@app/AppLayout/AppLayout';
import { EXAMPLE_BANK_SEARCH_PROMPTS, filterCatalogWidgetsBySearch } from '@app/Homepage/bankWidgetSearch';
import { BankWidgetCard } from '@app/Homepage/BankWidgetCard';
import { useDashboardBankBridge } from '@app/Homepage/dashboardBankBridge';
import { ADD_WIDGETS_DRAWER_STYLES } from '@app/Homepage/addWidgetsDrawerStyles';
import { HOMEPAGE_WIDGET_CATALOG } from '@app/Homepage/homepageWidgetCatalog';
import type { Widget } from '@app/Homepage/widgetTypes';
import {
  WIDGET_BUILDER_DEFAULT_TITLE,
  WIDGET_BUILDER_FORMAT_LABELS,
  WIDGET_BUILDER_SAMPLES,
  type WidgetBuilderFormat
} from '@app/Homepage/widgetBuilderSamples';
import {
  WIDGET_BUILDER_DEFAULT_HEADER_ICON_ID,
  WIDGET_BUILDER_HEADER_ICON_OPTIONS,
  getWidgetBuilderHeaderIconComponent,
  getWidgetBuilderHeaderIconLabel,
  type WidgetBuilderHeaderIconId
} from '@app/Homepage/widgetBuilderHeaderIcons';
import {
  DEFAULT_WIDGET_BUILDER_PREVIEW_MODEL,
  parseWidgetBuilderCode,
  type WidgetBuilderPreviewModel
} from '@app/Homepage/widgetBuilderPreviewParser';
import { WidgetBuilderPreviewCard } from '@app/Homepage/WidgetBuilderPreviewCard';

const WIDGET_BUILDER_FORMAT_TO_LANGUAGE: Record<WidgetBuilderFormat, Language> = {
  yaml: Language.yaml,
  json: Language.json,
  markdown: Language.markdown
};

const WIDGET_BUILDER_FORMAT_MENU_ORDER: readonly WidgetBuilderFormat[] = ['markdown', 'yaml', 'json'];

/** Debounce before re-parsing widget definition into the preview (manual Refresh applies immediately). */
const WIDGET_BUILDER_PREVIEW_DEBOUNCE_MS = 200;

/** Find widgets bank: green check duration before dissolve-out, then handoff to parent `onAddWidget`. */
const BANK_WIDGET_ADD_CELEBRATION_SUCCESS_MS = 1700;
const BANK_WIDGET_ADD_CELEBRATION_EXIT_MS = 320;

type WidgetBuilderCodeEditorToolbarProps = {
  monacoRef: React.RefObject<editor.IStandaloneCodeEditor | null>;
  /** From Monaco model undo stack — false until there is something to undo. */
  canUndo: boolean;
  /** From Monaco model redo stack — false until an undo left redo entries (standard redo semantics). */
  canRedo: boolean;
  widgetBuilderFormat: WidgetBuilderFormat;
  languageMenuOpen: boolean;
  onLanguageMenuOpenChange: (open: boolean) => void;
  onLanguageMenuSelect: (
    _event: React.MouseEvent<Element, MouseEvent> | undefined,
    value?: string | number
  ) => void;
  toggleLanguageMenu: () => void;
  /** After “Add to dashboard”, lock header actions until Reset. */
  builderLocked: boolean;
};

/** Renders inside PatternFly CodeEditor (under CodeEditorContext) — gray toolbar + compact white language strip. */
const WidgetBuilderCodeEditorToolbar: React.FC<WidgetBuilderCodeEditorToolbarProps> = ({
  monacoRef,
  canUndo,
  canRedo,
  widgetBuilderFormat,
  languageMenuOpen,
  onLanguageMenuOpenChange,
  onLanguageMenuSelect,
  toggleLanguageMenu,
  builderLocked
}) => {
  const [copyTooltipSuccess, setCopyTooltipSuccess] = useState(false);

  return (
    <div className="add-widgets-builder-code-editor-header-toolbar">
      <div className="add-widgets-builder-code-editor-toolbar-gray">
        <CodeEditorControl
          icon={<CopyIcon />}
          aria-label="Copy to clipboard"
          isDisabled={builderLocked}
          tooltipProps={{
            content: copyTooltipSuccess ? 'Copied!' : 'Copy to clipboard',
            position: 'top',
            'aria-live': 'polite',
            entryDelay: 0,
            exitDelay: copyTooltipSuccess ? 1600 : 300,
            onTooltipHidden: () => setCopyTooltipSuccess(false)
          }}
          onClick={(code) => {
            void navigator.clipboard.writeText(code);
            setCopyTooltipSuccess(true);
          }}
        />
      <Tooltip content="Undo" position="top">
        <span style={{ display: 'inline-flex' }}>
          <Button
            variant="plain"
            type="button"
            icon={<UndoIcon />}
            aria-label="Undo"
            isDisabled={builderLocked || !canUndo}
            onClick={() => {
              applyWidgetBuilderMonacoUndoRedo(monacoRef.current, 'undo');
            }}
          />
        </span>
      </Tooltip>
      <Tooltip content="Redo" position="top">
        <span style={{ display: 'inline-flex' }}>
          <Button
            variant="plain"
            type="button"
            icon={<RedoIcon />}
            aria-label="Redo"
            isDisabled={builderLocked || !canRedo}
            onClick={() => {
              applyWidgetBuilderMonacoUndoRedo(monacoRef.current, 'redo');
            }}
          />
        </span>
      </Tooltip>
      <span className="add-widgets-builder-code-editor-toolbar-gray-spacer" aria-hidden />
    </div>
    <div className="add-widgets-builder-code-editor-toolbar-white">
      <Dropdown
        className="add-widgets-builder-language-dropdown"
        isOpen={builderLocked ? false : languageMenuOpen}
        onOpenChange={(open) => {
          if (builderLocked) {
            return;
          }
          onLanguageMenuOpenChange(open);
        }}
        onSelect={onLanguageMenuSelect}
        shouldFocusToggleOnSelect
        popperProps={{ position: 'end' }}
        toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
          <MenuToggle
            ref={toggleRef}
            id="widget-builder-language-toggle"
            variant="plainText"
            onClick={() => {
              if (!builderLocked) {
                toggleLanguageMenu();
              }
            }}
            isExpanded={builderLocked ? false : languageMenuOpen}
            isDisabled={builderLocked}
            aria-label={`Definition language, ${WIDGET_BUILDER_FORMAT_LABELS[widgetBuilderFormat]}. Open menu.`}
          >
            <span className="add-widgets-builder-language-toggle-content">
              <CodeIcon className="add-widgets-builder-language-toggle-icon" aria-hidden />
              {WIDGET_BUILDER_FORMAT_LABELS[widgetBuilderFormat]}
            </span>
          </MenuToggle>
        )}
      >
        <DropdownList>
          {WIDGET_BUILDER_FORMAT_MENU_ORDER.map((fmt) => (
            <DropdownItem
              key={fmt}
              value={fmt}
              isSelected={widgetBuilderFormat === fmt}
              id={`widget-builder-fmt-${fmt}`}
            >
              {WIDGET_BUILDER_FORMAT_LABELS[fmt]}
            </DropdownItem>
          ))}
        </DropdownList>
      </Dropdown>
    </div>
  </div>
  );
};

const WIDGET_BUILDER_EDITOR_OPTIONS: editor.IStandaloneEditorConstructionOptions = {
  wordWrap: 'on',
  scrollBeyondLastLine: false
};

/**
 * Apply undo/redo on the standalone editor. `editor.trigger('editor.action.undo')` often no-ops when
 * invoked from external toolbar buttons; prefer `getAction(...).run()`, then `ITextModel.undo/redo`.
 */
function applyWidgetBuilderMonacoUndoRedo(ed: editor.IStandaloneCodeEditor | null, direction: 'undo' | 'redo'): void {
  if (!ed) {
    return;
  }
  ed.focus();
  const actionId = direction === 'undo' ? 'editor.action.undo' : 'editor.action.redo';
  const action = ed.getAction(actionId);
  if (action?.isSupported()) {
    void action.run();
    return;
  }
  const model = ed.getModel();
  if (!model) {
    return;
  }
  if (direction === 'undo') {
    if (!model.canUndo()) {
      return;
    }
    void Promise.resolve(model.undo());
    return;
  }
  if (!model.canRedo()) {
    return;
  }
  void Promise.resolve(model.redo());
}

/**
 * Default “Recommended for you” widgets — alphabetical by title.
 * When one is added, backfill from the catalog keeps {@link RECOMMENDED_VISIBLE_TARGET} tiles visible.
 */
const RECOMMENDED_BANK_WIDGET_IDS: readonly string[] = [
  'advisor-recommendations',
  'support-cases',
  'red-hat-ai',
  'simple-content-access-sca',
  'vulnerabilities'
];

const RECOMMENDED_VISIBLE_TARGET = RECOMMENDED_BANK_WIDGET_IDS.length;

function getRecommendedBankWidgets(removedWidgets: Widget[]): Widget[] {
  const availableById = new Map(removedWidgets.map((w) => [w.id, w]));
  const result: Widget[] = [];
  const seen = new Set<string>();

  for (const id of RECOMMENDED_BANK_WIDGET_IDS) {
    if (result.length >= RECOMMENDED_VISIBLE_TARGET) {
      break;
    }
    const w = availableById.get(id);
    if (w) {
      result.push(w);
      seen.add(id);
    }
  }

  for (const catalogWidget of HOMEPAGE_WIDGET_CATALOG) {
    if (result.length >= RECOMMENDED_VISIBLE_TARGET) {
      break;
    }
    if (seen.has(catalogWidget.id)) {
      continue;
    }
    const w = availableById.get(catalogWidget.id);
    if (w) {
      result.push(w);
      seen.add(catalogWidget.id);
    }
  }

  return result.sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }));
}

function getAllBankWidgets(): Widget[] {
  return [...HOMEPAGE_WIDGET_CATALOG].sort((a, b) =>
    a.title.localeCompare(b.title, undefined, { sensitivity: 'base' })
  );
}

function getVisiblePreconfiguredBankWidgets(searchQuery: string): Widget[] {
  const q = searchQuery.trim();
  if (q) {
    return filterCatalogWidgetsBySearch(HOMEPAGE_WIDGET_CATALOG, searchQuery);
  }
  return getAllBankWidgets();
}

export interface AddWidgetsDrawerProps {
  isOpen: boolean;
  removedWidgets: Widget[];
  /** Add a pre-configured widget to the page/canvas (no bank drag). */
  onAddWidget: (widget: Widget) => void;
}

/**
 * “Add widgets” bank + widget builder panel from the Homepage, reusable on other surfaces
 * (e.g. editable dashboard). Widgets are added with the + control (not drag).
 */
const AddWidgetsDrawer: React.FC<AddWidgetsDrawerProps> = ({
  isOpen,
  removedWidgets,
  onAddWidget
}) => {
  const [widgetBuilderCode, setWidgetBuilderCode] = useState(() => WIDGET_BUILDER_SAMPLES.markdown);
  const [widgetBuilderFormat, setWidgetBuilderFormat] = useState<WidgetBuilderFormat>('markdown');
  const [widgetBuilderTitle, setWidgetBuilderTitle] = useState(WIDGET_BUILDER_DEFAULT_TITLE);
  const [widgetBuilderHeaderIconId, setWidgetBuilderHeaderIconId] =
    useState<WidgetBuilderHeaderIconId>(WIDGET_BUILDER_DEFAULT_HEADER_ICON_ID);
  const [isWidgetBuilderIconMenuOpen, setIsWidgetBuilderIconMenuOpen] = useState(false);
  const [widgetBuilderPreviewModel, setWidgetBuilderPreviewModel] = useState<WidgetBuilderPreviewModel>(
    () =>
      parseWidgetBuilderCode(WIDGET_BUILDER_SAMPLES.markdown, 'markdown') ?? DEFAULT_WIDGET_BUILDER_PREVIEW_MODEL
  );
  const [widgetBuilderPreviewError, setWidgetBuilderPreviewError] = useState<string | null>(null);
  const [isWidgetBuilderLanguageMenuOpen, setIsWidgetBuilderLanguageMenuOpen] = useState(false);
  const widgetBuilderMonacoEditorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const [widgetBuilderUndoRedo, setWidgetBuilderUndoRedo] = useState({ canUndo: false, canRedo: false });
  const [widgetBuilderAddedToDashboard, setWidgetBuilderAddedToDashboard] = useState(false);

  const refreshWidgetBuilderUndoRedoState = useCallback((targetEditor?: editor.IStandaloneCodeEditor | null) => {
    const model = (targetEditor ?? widgetBuilderMonacoEditorRef.current)?.getModel();
    setWidgetBuilderUndoRedo({
      canUndo: model?.canUndo() ?? false,
      canRedo: model?.canRedo() ?? false
    });
  }, []);

  useEffect(() => {
    if (isOpen) {
      setWidgetBuilderAddedToDashboard(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (widgetBuilderAddedToDashboard) {
      setIsWidgetBuilderIconMenuOpen(false);
      setIsWidgetBuilderLanguageMenuOpen(false);
    }
  }, [widgetBuilderAddedToDashboard]);

  useEffect(() => {
    const sample = WIDGET_BUILDER_SAMPLES[widgetBuilderFormat];
    setWidgetBuilderAddedToDashboard(false);
    setWidgetBuilderCode(sample);
    setWidgetBuilderTitle(WIDGET_BUILDER_DEFAULT_TITLE);
    setWidgetBuilderHeaderIconId(WIDGET_BUILDER_DEFAULT_HEADER_ICON_ID);
    setIsWidgetBuilderIconMenuOpen(false);
    setIsWidgetBuilderLanguageMenuOpen(false);
    setWidgetBuilderPreviewModel(parseWidgetBuilderCode(sample, widgetBuilderFormat) ?? DEFAULT_WIDGET_BUILDER_PREVIEW_MODEL);
    setWidgetBuilderPreviewError(null);
  }, [widgetBuilderFormat]);

  const syncWidgetBuilderPreviewFromCode = useCallback((code: string, format: WidgetBuilderFormat) => {
    const parsed = parseWidgetBuilderCode(code, format);
    if (parsed) {
      setWidgetBuilderPreviewModel(parsed);
      setWidgetBuilderPreviewError(null);
    } else {
      setWidgetBuilderPreviewError(
        'Could not parse the widget definition for this format. Fix the code and try again.'
      );
    }
  }, []);

  /** Live preview: re-parse after edits (debounced). Use Refresh to apply immediately without waiting. */
  useEffect(() => {
    const id = window.setTimeout(() => {
      syncWidgetBuilderPreviewFromCode(widgetBuilderCode, widgetBuilderFormat);
    }, WIDGET_BUILDER_PREVIEW_DEBOUNCE_MS);
    return () => window.clearTimeout(id);
  }, [widgetBuilderCode, widgetBuilderFormat, syncWidgetBuilderPreviewFromCode]);

  const previewFormatLabel = useMemo(
    () => ({ yaml: 'YAML', json: 'JSON', markdown: 'Markdown' }[widgetBuilderFormat]),
    [widgetBuilderFormat]
  );

  const handleWidgetBuilderRefreshPreview = useCallback(() => {
    syncWidgetBuilderPreviewFromCode(widgetBuilderCode, widgetBuilderFormat);
  }, [widgetBuilderCode, widgetBuilderFormat, syncWidgetBuilderPreviewFromCode]);

  const handleWidgetBuilderReset = useCallback(() => {
    const sample = WIDGET_BUILDER_SAMPLES[widgetBuilderFormat];
    setWidgetBuilderAddedToDashboard(false);
    setWidgetBuilderCode(sample);
    setWidgetBuilderTitle(WIDGET_BUILDER_DEFAULT_TITLE);
    setWidgetBuilderHeaderIconId(WIDGET_BUILDER_DEFAULT_HEADER_ICON_ID);
    setIsWidgetBuilderIconMenuOpen(false);
    setIsWidgetBuilderLanguageMenuOpen(false);
    setWidgetBuilderPreviewModel(parseWidgetBuilderCode(sample, widgetBuilderFormat) ?? DEFAULT_WIDGET_BUILDER_PREVIEW_MODEL);
    setWidgetBuilderPreviewError(null);
  }, [widgetBuilderFormat]);

  const handleWidgetBuilderIconMenuSelect = useCallback(
    (_event: React.MouseEvent<Element, MouseEvent> | undefined, value?: string | number) => {
      if (widgetBuilderAddedToDashboard) {
        return;
      }
      if (typeof value === 'string' && WIDGET_BUILDER_HEADER_ICON_OPTIONS.some((o) => o.id === value)) {
        setWidgetBuilderHeaderIconId(value as WidgetBuilderHeaderIconId);
      }
      setIsWidgetBuilderIconMenuOpen(false);
    },
    [widgetBuilderAddedToDashboard]
  );

  const toggleWidgetBuilderIconMenu = useCallback(() => {
    if (widgetBuilderAddedToDashboard) {
      return;
    }
    setIsWidgetBuilderIconMenuOpen((open) => !open);
  }, [widgetBuilderAddedToDashboard]);

  const handleWidgetBuilderLanguageMenuSelect = useCallback(
    (_event: React.MouseEvent<Element, MouseEvent> | undefined, value?: string | number) => {
      if (value === 'yaml' || value === 'json' || value === 'markdown') {
        setWidgetBuilderFormat(value);
      }
      setIsWidgetBuilderLanguageMenuOpen(false);
    },
    []
  );

  const toggleWidgetBuilderLanguageMenu = useCallback(() => {
    setIsWidgetBuilderLanguageMenuOpen((open) => !open);
  }, []);

  const handleWidgetBuilderAddToDashboard = useCallback(() => {
    if (widgetBuilderPreviewError) {
      return;
    }
    onAddWidget({
      id: `widget-builder-${Date.now()}`,
      title: widgetBuilderTitle.trim() || WIDGET_BUILDER_DEFAULT_TITLE,
      type: 'placeholder',
      colSpan: 2,
      rowSpan: 8,
      customBuilder: {
        headerIconId: widgetBuilderHeaderIconId,
        blocks: widgetBuilderPreviewModel.blocks
      }
    });
    setWidgetBuilderAddedToDashboard(true);
  }, [
    onAddWidget,
    widgetBuilderHeaderIconId,
    widgetBuilderPreviewError,
    widgetBuilderPreviewModel.blocks,
    widgetBuilderTitle
  ]);
  const [bankSearchInput, setBankSearchInput] = useState('');
  const [bankSearchQuery, setBankSearchQuery] = useState('');
  const [isExamplePromptsExpanded, setIsExamplePromptsExpanded] = useState(false);
  const [pendingBankAddCelebration, setPendingBankAddCelebration] = useState<
    null | { widget: Widget; phase: 'success' | 'exit' }
  >(null);
  const helpPanelContext = useContext(HelpPanelContext);
  const dashboardBank = useDashboardBankBridge();
  const isBankSearchActive = bankSearchQuery.trim().length > 0;

  const visiblePreconfigured = useMemo(
    () => getVisiblePreconfiguredBankWidgets(bankSearchQuery),
    [bankSearchQuery]
  );

  const handleBankWidgetAdd = useCallback((widget: Widget) => {
    setPendingBankAddCelebration((current) => {
      if (current !== null) {
        return current;
      }
      return { widget, phase: 'success' };
    });
  }, []);

  const renderFindWidgetsBankCard = useCallback(
    (widget: Widget) => {
      const isOnCanvas = dashboardBank?.canvasWidgetIds.has(widget.id) ?? false;
      const hasBridge = dashboardBank != null;
      const addAllowed = !isOnCanvas && hasBridge && (dashboardBank?.canAddWidgets ?? false);
      const disabledAddTooltip = isOnCanvas
        ? ''
        : !hasBridge
          ? 'Open a dashboard from Dashboard Hub to add widgets.'
          : !dashboardBank?.canAddWidgets
            ? 'Widgets cannot be added to the built-in Console default dashboard.'
            : '';

      return (
        <BankWidgetCard
          key={widget.id}
          widget={widget}
          onAdd={handleBankWidgetAdd}
          onRemove={
            isOnCanvas && dashboardBank?.canAddWidgets
              ? (w) => dashboardBank.removeWidgetFromDashboard(w)
              : undefined
          }
          isAlreadyOnDashboard={isOnCanvas}
          addAllowed={addAllowed}
          disabledAddTooltip={disabledAddTooltip}
          celebrationPhase={
            pendingBankAddCelebration?.widget.id === widget.id
              ? pendingBankAddCelebration.phase
              : undefined
          }
        />
      );
    },
    [dashboardBank, handleBankWidgetAdd, pendingBankAddCelebration]
  );

  useEffect(() => {
    if (!pendingBankAddCelebration || pendingBankAddCelebration.phase !== 'success') {
      return;
    }
    const id = window.setTimeout(() => {
      setPendingBankAddCelebration((prev) =>
        prev?.phase === 'success' ? { ...prev, phase: 'exit' } : prev
      );
    }, BANK_WIDGET_ADD_CELEBRATION_SUCCESS_MS);
    return () => clearTimeout(id);
  }, [pendingBankAddCelebration]);

  useEffect(() => {
    if (!pendingBankAddCelebration || pendingBankAddCelebration.phase !== 'exit') {
      return;
    }
    const widget = pendingBankAddCelebration.widget;
    const id = window.setTimeout(() => {
      onAddWidget(widget);
      setPendingBankAddCelebration(null);
    }, BANK_WIDGET_ADD_CELEBRATION_EXIT_MS);
    return () => clearTimeout(id);
  }, [pendingBankAddCelebration, onAddWidget]);

  /** Custom code editor header: gray toolbar (copy / undo / redo), compact white language strip. */
  const widgetBuilderEditorCustomControls = useMemo(
    () => (
      <WidgetBuilderCodeEditorToolbar
        monacoRef={widgetBuilderMonacoEditorRef}
        canUndo={widgetBuilderUndoRedo.canUndo}
        canRedo={widgetBuilderUndoRedo.canRedo}
        widgetBuilderFormat={widgetBuilderFormat}
        languageMenuOpen={isWidgetBuilderLanguageMenuOpen}
        onLanguageMenuOpenChange={setIsWidgetBuilderLanguageMenuOpen}
        onLanguageMenuSelect={handleWidgetBuilderLanguageMenuSelect}
        toggleLanguageMenu={toggleWidgetBuilderLanguageMenu}
        builderLocked={widgetBuilderAddedToDashboard}
      />
    ),
    [
      handleWidgetBuilderLanguageMenuSelect,
      isWidgetBuilderLanguageMenuOpen,
      toggleWidgetBuilderLanguageMenu,
      widgetBuilderFormat,
      widgetBuilderAddedToDashboard,
      widgetBuilderUndoRedo.canRedo,
      widgetBuilderUndoRedo.canUndo
    ]
  );

  /** When the field is empty (cleared, deleted, or only spaces), show featured + example prompts again. */
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

  const openDashboardWidgetsHelpTab = useCallback(() => {
    helpPanelContext?.openHelpPanelWithTab('Dashboard widgets', { variant: 'in-page' });
  }, [helpPanelContext]);

  const openRequestNewWidgetTab = useCallback(() => {
    helpPanelContext?.openHelpPanelToShareGeneralFeedback();
  }, [helpPanelContext]);

  const widgetBankEmptyActions = (
    <EmptyStateFooter>
      <Flex
        justifyContent={{ default: 'justifyContentCenter' }}
        alignItems={{ default: 'alignItemsCenter' }}
        spaceItems={{ default: 'spaceItemsSm' }}
        flexWrap={{ default: 'wrap' }}
        style={{ width: '100%' }}
      >
        <Button
          variant="primary"
          size="sm"
          type="button"
          icon={<PanelOpenIcon aria-hidden />}
          iconPosition="end"
          onClick={openDashboardWidgetsHelpTab}
        >
          View all widgets
        </Button>
        <Button
          variant="secondary"
          size="sm"
          type="button"
          icon={<PanelOpenIcon aria-hidden />}
          iconPosition="end"
          onClick={openRequestNewWidgetTab}
        >
          Request a new widget
        </Button>
      </Flex>
    </EmptyStateFooter>
  );

  return (
    <div className="widget-drawer-side-panel" style={{ width: '100%', minWidth: 0 }}>
      <style>{ADD_WIDGETS_DRAWER_STYLES}</style>
        <Panel className="widget-drawer-panel widget-drawer-panel--side">
          <PanelMain>
            <PanelMainBody>
              <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsMd' }} alignItems={{ default: 'alignItemsFlexStart' }}>
                <Flex
                  direction={{ default: 'column' }}
                  spaceItems={{ default: 'spaceItemsMd' }}
                  alignItems={{ default: 'alignItemsStretch' }}
                  style={{ width: '100%', minHeight: 0 }}
                >
                  <FlexItem className="add-widgets-find-column">
                    <Card isFullHeight className="widget-drawer-section-card widget-drawer-subsection-card">
                      <CardTitle className="widget-drawer-subsection-card-title">
                        <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
                          <span className="widget-drawer-subsection-card-title__icon" aria-hidden>
                            <AiSearchIcon />
                          </span>
                          <Title headingLevel="h2" size="xl">
                            Find widgets
                          </Title>
                        </Flex>
                      </CardTitle>
                      <Divider />
                      <CardBody id="add-widgets-preco-section">
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
                                <TextInputGroup style={{ width: '100%' }}>
                                  <TextInputGroupMain
                                    inputId="add-widgets-bank-search"
                                    icon={
                                      <span className="add-widgets-bank-search-icon" aria-hidden>
                                        <SearchIcon />
                                      </span>
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
                                    name="add-widgets-bank-search"
                                    type="text"
                                    aria-label="What you need your widget to do; press Enter to search"
                                    aria-describedby="add-widgets-bank-search-hint"
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
                              </form>
                              <HelperText>
                                <HelperTextItem id="add-widgets-bank-search-hint">
                                  Hit &lsquo;Enter&rsquo; to send search query
                                </HelperTextItem>
                              </HelperText>
                            </Flex>
                            {!bankSearchQuery.trim() && (
                              <ExpandableSection
                                className="add-widgets-example-prompts"
                                isExpanded={isExamplePromptsExpanded}
                                onToggle={(_e, isExpanded) => setIsExamplePromptsExpanded(isExpanded)}
                                toggleText="Show example prompts"
                              >
                                <List isPlain className="add-widgets-example-prompts-list">
                                  {EXAMPLE_BANK_SEARCH_PROMPTS.map((prompt) => (
                                    <ListItem key={prompt}>
                                      <Button
                                        variant="link"
                                        isInline
                                        type="button"
                                        className="add-widgets-example-prompt-link"
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
                            {visiblePreconfigured.length === 0 ? (
                              <EmptyState variant="xs" headingLevel="h4" titleText={isBankSearchActive ? 'No matching widgets' : 'No widgets available'} icon={isBankSearchActive ? CubesIcon : undefined}>
                                <EmptyStateBody>
                                  {isBankSearchActive
                                    ? 'Try a different search query, or clear the search to see all widgets.'
                                    : 'All available pre-configured widgets are already displayed in your dashboard.'}
                                </EmptyStateBody>
                                {widgetBankEmptyActions}
                              </EmptyState>
                            ) : (
                              <div className="removed-widgets-grid add-widgets-bank-grid">
                                {visiblePreconfigured.map((widget) => renderFindWidgetsBankCard(widget))}
                              </div>
                            )}
                          </Flex>
                        </CardBody>
                    </Card>
                  </FlexItem>
                  <FlexItem flex={{ default: 'flex_1' }} style={{ minWidth: 0, minHeight: 0, flex: '1 1 0%' }}>
                    <Card isFullHeight className="widget-drawer-section-card widget-drawer-subsection-card add-widgets-builder-card">
                      <CardTitle className="widget-drawer-subsection-card-title">
                        <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
                          <span className="widget-drawer-subsection-card-title__icon" aria-hidden>
                            <CodeIcon />
                          </span>
                          <Title headingLevel="h2" size="xl">
                            Widget builder
                          </Title>
                        </Flex>
                      </CardTitle>
                      <Divider />
                      <CardBody id="add-widgets-builder-section" className="add-widgets-builder-section-body">
                          <Content component="p" className="add-widgets-builder-intro">
                            Create custom widget in Markdown, YAML, or JSON. The title and icon are required before you can
                            edit the widget code.{' '}
                            <Button
                              variant="link"
                              isInline
                              icon={<ExternalLinkAltIcon aria-hidden />}
                              iconPosition="end"
                              component="a"
                              href="https://example.com/custom-widgets"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Learn more about creating custom widgets
                            </Button>
                          </Content>
                          <div className="add-widgets-builder-row">
                            <div className="add-widgets-builder-row__editor">
                              <div className="add-widgets-builder-editor-stack">
                                <Flex
                                  className="add-widgets-builder-title-icon-row"
                                  flexWrap={{ default: 'wrap' }}
                                  spaceItems={{ default: 'spaceItemsLg' }}
                                  alignItems={{ default: 'alignItemsFlexEnd' }}
                                >
                                  <FlexItem
                                    flex={{ default: 'flex_1' }}
                                    style={{ minWidth: 'min(100%, 12rem)' }}
                                  >
                                    <FormGroup
                                      isRequired
                                      label="Title"
                                      fieldId="widget-builder-title"
                                      className="add-widgets-builder-title-form-group"
                                    >
                                      <TextInput
                                        isRequired
                                        id="widget-builder-title"
                                        type="text"
                                        value={widgetBuilderTitle}
                                        onChange={(_e, v) => setWidgetBuilderTitle(v)}
                                        aria-label="Widget title shown in the preview header"
                                        isDisabled={widgetBuilderAddedToDashboard}
                                      />
                                    </FormGroup>
                                  </FlexItem>
                                  <FlexItem>
                                    <FormGroup
                                      isRequired
                                      label="Icon"
                                      fieldId="widget-builder-header-icon"
                                      className="add-widgets-builder-icon-form-group"
                                    >
                                      <Dropdown
                                        className="add-widgets-builder-icon-dropdown"
                                        isOpen={widgetBuilderAddedToDashboard ? false : isWidgetBuilderIconMenuOpen}
                                        onOpenChange={(open) => {
                                          if (widgetBuilderAddedToDashboard) {
                                            return;
                                          }
                                          setIsWidgetBuilderIconMenuOpen(open);
                                        }}
                                        onSelect={handleWidgetBuilderIconMenuSelect}
                                        shouldFocusToggleOnSelect
                                        popperProps={{ position: 'start' }}
                                        toggle={(toggleRef: React.Ref<MenuToggleElement>) => {
                                          const SelectedIcon = getWidgetBuilderHeaderIconComponent(
                                            widgetBuilderHeaderIconId
                                          );
                                          const iconLabel = getWidgetBuilderHeaderIconLabel(widgetBuilderHeaderIconId);
                                          return (
                                            <MenuToggle
                                              ref={toggleRef}
                                              id="widget-builder-header-icon"
                                              className="add-widgets-builder-header-icon-toggle"
                                              isExpanded={
                                                widgetBuilderAddedToDashboard ? false : isWidgetBuilderIconMenuOpen
                                              }
                                              isDisabled={widgetBuilderAddedToDashboard}
                                              onClick={toggleWidgetBuilderIconMenu}
                                              aria-label={`Icon: ${iconLabel}. Open icon menu.`}
                                            >
                                              <SelectedIcon
                                                className="add-widgets-builder-header-icon-toggle__icon"
                                                aria-hidden
                                              />
                                            </MenuToggle>
                                          );
                                        }}
                                      >
                                        <DropdownList className="add-widgets-builder-icon-menu-grid">
                                          {WIDGET_BUILDER_HEADER_ICON_OPTIONS.map(({ id, label, Icon }) => (
                                            <DropdownItem
                                              key={id}
                                              value={id}
                                              className="add-widgets-builder-icon-menu-item"
                                              aria-label={label}
                                              icon={<Icon aria-hidden />}
                                              isSelected={widgetBuilderHeaderIconId === id}
                                            >
                                              <span className="pf-v6-u-screen-reader">{label}</span>
                                            </DropdownItem>
                                          ))}
                                        </DropdownList>
                                      </Dropdown>
                                    </FormGroup>
                                  </FlexItem>
                                </Flex>
                                <FormGroup
                                  className="add-widgets-builder-form-group"
                                  fieldId="widget-builder-code-editor"
                                  aria-label="Markdown editor"
                                >
                                  <div id="widget-builder-code-editor">
                                    <CodeEditor
                                      key={widgetBuilderFormat}
                                      className="add-widgets-builder-code-editor"
                                      code={widgetBuilderCode}
                                      onCodeChange={setWidgetBuilderCode}
                                      language={WIDGET_BUILDER_FORMAT_TO_LANGUAGE[widgetBuilderFormat]}
                                      height="100%"
                                      width="100%"
                                      isFullHeight
                                      isReadOnly={widgetBuilderAddedToDashboard}
                                      isLanguageLabelVisible={false}
                                      customControls={widgetBuilderEditorCustomControls}
                                      isLineNumbersVisible={false}
                                      isMinimapVisible={false}
                                      isCopyEnabled={false}
                                      isDownloadEnabled={false}
                                      isUploadEnabled={false}
                                      onEditorDidMount={(ed) => {
                                        widgetBuilderMonacoEditorRef.current = ed;
                                        refreshWidgetBuilderUndoRedoState(ed);
                                        ed.onDidChangeModelContent(() => refreshWidgetBuilderUndoRedoState(ed));
                                        ed.onDidChangeModel(() => refreshWidgetBuilderUndoRedoState(ed));
                                        requestAnimationFrame(() => refreshWidgetBuilderUndoRedoState(ed));
                                      }}
                                      options={WIDGET_BUILDER_EDITOR_OPTIONS}
                                    />
                                  </div>
                                </FormGroup>
                              </div>
                            </div>
                            <div className="add-widgets-builder-row__preview">
                              <Card variant="secondary" className="add-widgets-builder-preview-panel">
                                <CardHeader className="add-widgets-builder-preview-panel-header">
                                  <Flex
                                    justifyContent={{ default: 'justifyContentSpaceBetween' }}
                                    alignItems={{ default: 'alignItemsCenter' }}
                                    flexWrap={{ default: 'wrap' }}
                                    style={{ width: '100%', gap: 'var(--pf-t--global--spacer--sm)' }}
                                  >
                                    <FlexItem>
                                      <Title headingLevel="h5" size="md" style={{ margin: 0 }}>
                                        Preview: {previewFormatLabel}
                                      </Title>
                                    </FlexItem>
                                    <FlexItem>
                                      <Tooltip content="Refresh preview">
                                        <span>
                                          <Button
                                            variant="plain"
                                            type="button"
                                            icon={<SyncAltIcon />}
                                            aria-label="Refresh preview"
                                            onClick={handleWidgetBuilderRefreshPreview}
                                            isDisabled={widgetBuilderAddedToDashboard}
                                          />
                                        </span>
                                      </Tooltip>
                                    </FlexItem>
                                  </Flex>
                                </CardHeader>
                                <CardBody className="add-widgets-builder-preview-panel-body">
                                  {widgetBuilderPreviewError ? (
                                    <Alert variant="danger" isInline title="Preview not updated">
                                      {widgetBuilderPreviewError}
                                    </Alert>
                                  ) : null}
                                  <WidgetBuilderPreviewCard
                                    title={widgetBuilderTitle.trim() || WIDGET_BUILDER_DEFAULT_TITLE}
                                    headerIconId={widgetBuilderHeaderIconId}
                                    blocks={widgetBuilderPreviewModel.blocks}
                                  />
                                  <Flex
                                    className="add-widgets-builder-preview-panel-actions"
                                    justifyContent={{ default: 'justifyContentCenter' }}
                                    alignItems={{ default: 'alignItemsCenter' }}
                                    flexWrap={{ default: 'wrap' }}
                                    spaceItems={{ default: 'spaceItemsMd' }}
                                    fullWidth={{ default: 'fullWidth' }}
                                  >
                                    <FlexItem>
                                      <Button
                                        variant="link"
                                        type="button"
                                        onClick={handleWidgetBuilderReset}
                                      >
                                        Reset to default
                                      </Button>
                                    </FlexItem>
                                    <FlexItem>
                                      {widgetBuilderAddedToDashboard ? (
                                        <Alert variant="success" isPlain isInline title="Added to dashboard!" />
                                      ) : (
                                        <Button
                                          variant="primary"
                                          type="button"
                                          icon={<PlusCircleIcon />}
                                          onClick={handleWidgetBuilderAddToDashboard}
                                        >
                                          Add to dashboard
                                        </Button>
                                      )}
                                    </FlexItem>
                                  </Flex>
                                </CardBody>
                              </Card>
                            </div>
                          </div>
                        </CardBody>
                    </Card>
                  </FlexItem>
                </Flex>
              </Flex>
            </PanelMainBody>
          </PanelMain>
        </Panel>
    </div>
  );
};

export { AddWidgetsDrawer };
