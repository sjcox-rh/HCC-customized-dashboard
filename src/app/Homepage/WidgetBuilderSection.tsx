import * as React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  CardBody,
  CardHeader,
  Content,
  Dropdown,
  DropdownItem,
  DropdownList,
  Flex,
  FlexItem,
  FormGroup,
  MenuToggle,
  type MenuToggleElement,
  TextInput,
  Title,
  Tooltip
} from '@patternfly/react-core';
import { CodeEditor, CodeEditorControl, Language } from '@patternfly/react-code-editor';
import type { editor } from 'monaco-editor';
import { CodeIcon, CopyIcon, ExternalLinkAltIcon, PlusCircleIcon, RedoIcon, SyncAltIcon, UndoIcon } from '@app/icons/rhUiIcons';
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
import type { Widget } from '@app/Homepage/widgetTypes';

const WIDGET_BUILDER_FORMAT_TO_LANGUAGE: Record<WidgetBuilderFormat, Language> = {
  yaml: Language.yaml,
  json: Language.json,
  markdown: Language.markdown
};

const WIDGET_BUILDER_FORMAT_MENU_ORDER: readonly WidgetBuilderFormat[] = ['markdown', 'yaml', 'json'];

const WIDGET_BUILDER_PREVIEW_DEBOUNCE_MS = 200;

const WIDGET_BUILDER_EDITOR_OPTIONS: editor.IStandaloneEditorConstructionOptions = {
  wordWrap: 'on',
  scrollBeyondLastLine: false
};

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

type WidgetBuilderCodeEditorToolbarProps = {
  monacoRef: React.RefObject<editor.IStandaloneCodeEditor | null>;
  canUndo: boolean;
  canRedo: boolean;
  widgetBuilderFormat: WidgetBuilderFormat;
  languageMenuOpen: boolean;
  onLanguageMenuOpenChange: (open: boolean) => void;
  onLanguageMenuSelect: (
    _event: React.MouseEvent<Element, MouseEvent> | undefined,
    value?: string | number
  ) => void;
  toggleLanguageMenu: () => void;
  builderLocked: boolean;
};

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

export interface WidgetBuilderSectionProps {
  onAddWidget: (widget: Widget) => void;
  canAddWidgets: boolean;
}

const WidgetBuilderSection: React.FC<WidgetBuilderSectionProps> = ({ onAddWidget, canAddWidgets }) => {
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

  return (
    <div className="add-widgets-builder-card">
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
            Widget builder
          </Title>
        </FlexItem>
      </Flex>
      <div id="add-widgets-builder-section" className="add-widgets-builder-section-body">
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
                    isReadOnly={widgetBuilderAddedToDashboard || !canAddWidgets}
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
                        isDisabled={!canAddWidgets}
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
      </div>
    </div>
  );
};

export { WidgetBuilderSection };
