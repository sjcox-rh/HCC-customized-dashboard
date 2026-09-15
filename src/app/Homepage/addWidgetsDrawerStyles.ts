/** Styles for the Homepage / dashboard “Add widgets” drawer and bank (shared). */
export const ADD_WIDGETS_DRAWER_STYLES = `
    .widget-drawer-side-panel {
      height: 100%;
      overflow-y: auto;
    }

    .widget-drawer-panel--side {
      height: 100%;
    }

    .widget-drawer-panel {
      background-color: var(--pf-t--global--background--color--secondary--default);
      border: none;
      border-radius: var(--pf-v6-c-card--BorderRadius, var(--pf-t--global--border--radius--medium, 8px));
      overflow: hidden;
      position: relative;
      z-index: 100;
      min-height: 0;
    }
    
    .widget-drawer-panel .pf-v6-c-panel__main-body {
      padding: var(--pf-t--global--spacer--lg);
      min-height: 0;
    }
    
    .widget-drawer-panel .pf-v6-c-panel__main {
      min-height: 0;
    }

    .widget-drawer-section-card {
      --pf-v6-c-card--BorderColor: transparent !important;
      --pf-v6-c-card--BorderWidth: 0 !important;
      border: none !important;
      box-shadow: none !important;
    }
    
    /* White subsection panels: flat fill, no outer card border */
    .widget-drawer-side-panel .widget-drawer-subsection-card {
      --pf-v6-c-card--BackgroundColor: var(--pf-t--global--background--color--100);
      border: none !important;
      --pf-v6-c-card--BorderColor: transparent !important;
      --pf-v6-c-card--BorderWidth: 0 !important;
      box-shadow: none !important;
    }

    /* CardTitle + Divider: standard PF subsection header without flattening Title size */
    .widget-drawer-side-panel .widget-drawer-subsection-card-title.pf-v6-c-card__title {
      --pf-v6-c-card__title--FontSize: inherit;
      --pf-v6-c-card__title--LineHeight: inherit;
      padding-block: var(--pf-t--global--spacer--md);
      padding-inline: var(--pf-t--global--spacer--lg);
      box-sizing: border-box;
      background: var(--pf-t--global--background--color--100);
    }

    .widget-drawer-side-panel .widget-drawer-subsection-card-title__icon {
      display: inline-flex;
      flex-shrink: 0;
      line-height: 0;
      color: var(--pf-t--global--icon--color--default);
    }

    .widget-drawer-side-panel .widget-drawer-subsection-card-title__icon svg {
      width: 1.25rem;
      height: 1.25rem;
    }

    .widget-drawer-side-panel .widget-drawer-subsection-card > .pf-v6-c-divider {
      margin: 0;
    }

    .add-widgets-example-prompts {
      --pf-v6-c-expandable-section--BackgroundColor: transparent;
    }

    .widget-drawer-side-panel .add-widgets-example-prompts-list {
      --pf-v6-c-list--item--RowGap: var(--pf-t--global--spacer--sm);
    }

    .widget-drawer-side-panel .add-widgets-example-prompt-link {
      --pf-v6-c-button--FontSize: var(--pf-t--global--font--size--body--default);
      text-align: left;
      height: auto;
      white-space: normal;
      padding-block: 2px;
    }
    
    .removed-widgets-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: var(--pf-t--global--spacer--md);
      margin-top: var(--pf-t--global--spacer--md);
    }

    .add-widgets-bank-grid {
      margin-top: 0;
      gap: var(--pf-t--global--spacer--sm);
    }

    .add-widgets-bank-add {
      flex-shrink: 0;
    }

    .widget-drawer-side-panel .add-widgets-bank-search-icon {
      display: inline-flex;
      line-height: 0;
      color: var(--pf-t--global--icon--color--default);
    }

    .widget-drawer-side-panel .add-widgets-bank-search-icon svg {
      display: block;
    }

    /* Find widgets column: stack vertically in side panel */
    .widget-drawer-side-panel .add-widgets-find-column {
      flex: 1 1 100%;
      min-width: 0;
      max-width: 100%;
      min-height: 0;
    }

    /* Widget builder card: fill column height so the editor can stretch */
    .widget-drawer-side-panel .add-widgets-builder-card.pf-v6-c-card {
      min-height: 0;
    }

    /* Expanded builder body: flex column so the editor row can grow */
    .widget-drawer-side-panel .add-widgets-builder-section-body.pf-v6-c-card__body {
      display: flex;
      flex-direction: column;
      flex: 1 1 auto;
      min-height: 0;
    }

    .widget-drawer-side-panel .add-widgets-builder-intro {
      flex-shrink: 0;
      margin: 0 0 var(--pf-t--global--spacer--md) 0;
      color: var(--pf-t--global--text--color--subtle, var(--pf-v6-global--Color--200));
      font-size: var(--pf-t--global--font--size--body--default);
    }

    /* Widget builder: code editor + preview in a row; preview wraps below when width is tight */
    .widget-drawer-side-panel .add-widgets-builder-row {
      display: flex;
      flex-direction: row;
      flex-wrap: wrap;
      align-items: stretch;
      gap: var(--pf-t--global--spacer--md);
      width: 100%;
      flex: 1 1 auto;
      min-height: 0;
    }

    .widget-drawer-side-panel .add-widgets-builder-row__editor {
      display: flex;
      flex-direction: column;
      flex: 1 1 280px;
      min-width: 0;
      min-height: 0;
      max-width: 100%;
    }

    .widget-drawer-side-panel .add-widgets-builder-editor-stack {
      display: flex;
      flex-direction: column;
      row-gap: var(--pf-t--global--spacer--md);
      flex: 1 1 auto;
      min-height: 0;
      min-width: 0;
      width: 100%;
    }

    /* Title + Icon: side-by-side FormGroups */
    .widget-drawer-side-panel .add-widgets-builder-title-icon-row {
      width: 100%;
      flex-shrink: 0;
    }

    .widget-drawer-side-panel .add-widgets-builder-title-form-group.pf-v6-c-form__group,
    .widget-drawer-side-panel .add-widgets-builder-icon-form-group.pf-v6-c-form__group {
      margin: 0;
    }

    .widget-drawer-side-panel .add-widgets-builder-title-form-group .pf-v6-c-form-control {
      width: 100%;
    }

    /* Icon-only MenuToggle — matches TextInput control height */
    .widget-drawer-side-panel .add-widgets-builder-header-icon-toggle.pf-v6-c-menu-toggle {
      min-width: auto;
      width: fit-content;
      justify-content: center;
    }

    .widget-drawer-side-panel .add-widgets-builder-header-icon-toggle__icon {
      display: block;
      width: 1.125rem;
      height: 1.125rem;
      color: var(--pf-t--global--icon--color--brand--default);
    }

    /*
     * Icon picker: 4×4 grid (icon-only). Selectors must not be scoped to the drawer wrapper — the Dropdown
     * menu is portaled to document.body, outside the drawer subtree.
     */
    .add-widgets-builder-icon-menu-grid.pf-v6-c-menu__list {
      display: grid !important;
      grid-template-columns: repeat(4, 2.75rem);
      grid-auto-rows: auto;
      gap: var(--pf-t--global--spacer--xs);
      min-width: auto;
      width: max-content;
      max-width: none;
      padding: var(--pf-t--global--spacer--sm);
    }

    .add-widgets-builder-icon-menu-grid.pf-v6-c-menu__list > .pf-v6-c-menu__list-item {
      margin: 0;
      align-items: stretch;
      border-radius: var(--pf-t--global--border--radius--small);
      overflow: hidden;
    }

    .add-widgets-builder-icon-menu-item.pf-v6-c-menu__item {
      align-items: center;
      justify-content: center;
      min-width: 2.75rem;
      min-height: 2.75rem;
      padding: var(--pf-t--global--spacer--xs);
      border-radius: var(--pf-t--global--border--radius--small);
      /* PF defaults menu rows to text-start + growing label — collapse label so the icon centers */
      --pf-v6-c-menu__item--PaddingInlineStart: var(--pf-t--global--spacer--xs);
      --pf-v6-c-menu__item--PaddingInlineEnd: var(--pf-t--global--spacer--xs);
      --pf-v6-c-menu__item--PaddingBlockStart: var(--pf-t--global--spacer--xs);
      --pf-v6-c-menu__item--PaddingBlockEnd: var(--pf-t--global--spacer--xs);
    }

    .add-widgets-builder-icon-menu-item .pf-v6-c-menu__item-main {
      position: relative;
      justify-content: center;
      align-items: center;
      column-gap: 0;
      flex: 1 1 auto;
      min-height: 0;
    }

    .add-widgets-builder-icon-menu-grid .pf-v6-c-menu__item-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      margin: 0;
    }

    .add-widgets-builder-icon-menu-grid .pf-v6-c-menu__item-text {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
      flex-grow: 0 !important;
    }

    /* Default menu icon color; brand when selected */
    .add-widgets-builder-icon-menu-grid .add-widgets-builder-icon-menu-item svg {
      width: 1.25rem;
      height: 1.25rem;
      color: var(--pf-t--global--icon--color--default);
    }

    .add-widgets-builder-icon-menu-grid .pf-v6-c-menu__list-item.pf-m-selected .add-widgets-builder-icon-menu-item svg,
    .add-widgets-builder-icon-menu-grid .add-widgets-builder-icon-menu-item.pf-m-selected svg,
    .add-widgets-builder-icon-menu-grid .add-widgets-builder-icon-menu-item[aria-selected='true'] svg {
      color: var(--pf-t--global--icon--color--brand--default);
    }

    /* Selected icon: brand ring like a focused icon control */
    .add-widgets-builder-icon-menu-grid .add-widgets-builder-icon-menu-item.pf-v6-c-menu__item.pf-m-selected,
    .add-widgets-builder-icon-menu-grid .pf-v6-c-menu__list-item.pf-m-selected .add-widgets-builder-icon-menu-item.pf-v6-c-menu__item,
    .add-widgets-builder-icon-menu-grid .add-widgets-builder-icon-menu-item.pf-v6-c-menu__item[aria-selected='true'] {
      box-shadow: inset 0 0 0 var(--pf-t--global--border--width--control--focused, 2px)
        var(--pf-t--global--border--color--brand--default);
    }

    /* Selection state uses menu background; hide separate checkmark so the grid stays icon-only. */
    .add-widgets-builder-icon-menu-grid .pf-v6-c-menu__item-select-icon {
      display: none;
    }

    .widget-drawer-side-panel .add-widgets-builder-form-group.pf-v6-c-form__group {
      display: flex;
      flex-direction: column;
      flex: 1 1 auto;
      min-height: 0;
      align-items: stretch;
    }

    .widget-drawer-side-panel .add-widgets-builder-form-group.pf-v6-c-form__group .pf-v6-c-form__group-control {
      display: flex;
      flex-direction: column;
      flex: 1 1 auto;
      min-height: 0;
      align-self: stretch;
    }

    .widget-drawer-side-panel #widget-builder-code-editor {
      display: flex;
      flex-direction: column;
      flex: 1 1 auto;
      min-height: 0;
    }

    .widget-drawer-side-panel .add-widgets-builder-row__editor .add-widgets-builder-code-editor.pf-v6-c-code-editor {
      width: 100%;
      flex: 1 1 auto;
      /* Floor height when the flex chain has no definite block size; grows when the builder card stretches */
      min-height: min(14rem, 40vh);
      height: 100%;
    }

    .widget-drawer-side-panel .add-widgets-builder-row__editor .add-widgets-builder-code-editor .pf-v6-c-code-editor__main {
      min-height: 0;
    }

    /* Widget builder code editor: gray toolbar (grows) + white strip (fit-content, language only). */
    .widget-drawer-side-panel .add-widgets-builder-row__editor .add-widgets-builder-code-editor.pf-v6-c-code-editor .pf-v6-c-code-editor__controls {
      flex: 1 1 auto;
      min-width: 0;
      align-items: stretch;
      flex-wrap: nowrap;
    }

    .widget-drawer-side-panel .add-widgets-builder-code-editor .pf-v6-c-code-editor__header-content {
      align-items: stretch;
      background-color: var(--pf-t--global--background--color--primary--default);
      padding-block: 0;
      padding-inline: 0;
    }

    .widget-drawer-side-panel .add-widgets-builder-code-editor-header-toolbar {
      display: flex;
      flex: 1 1 auto;
      min-width: 0;
      align-items: stretch;
    }

    .widget-drawer-side-panel .add-widgets-builder-code-editor-toolbar-gray {
      display: flex;
      flex: 1 1 auto;
      min-width: 0;
      align-items: center;
      flex-wrap: wrap;
      gap: var(--pf-v6-c-code-editor__controls--Gap, var(--pf-t--global--spacer--sm));
      padding-inline: var(--pf-t--global--spacer--sm);
      padding-block: var(--pf-t--global--spacer--xs);
      background-color: var(--pf-t--global--background--color--secondary--default);
      border-inline-end: var(--pf-t--global--border--width--box--default) solid var(--pf-t--global--border--color--default);
    }

    .widget-drawer-side-panel .add-widgets-builder-code-editor-toolbar-gray-spacer {
      flex: 1 1 auto;
      min-width: var(--pf-t--global--spacer--sm);
    }

    .widget-drawer-side-panel .add-widgets-builder-code-editor-toolbar-white {
      display: flex;
      flex: 0 0 auto;
      align-items: center;
      align-self: stretch;
      width: fit-content;
      max-width: 100%;
      padding-inline: var(--pf-t--global--spacer--sm);
      padding-block: var(--pf-t--global--spacer--xs);
      background-color: var(--pf-t--global--background--color--primary--default);
    }

    .widget-drawer-side-panel .add-widgets-builder-language-toggle-content {
      display: inline-flex;
      align-items: center;
      gap: var(--pf-t--global--spacer--xs);
    }

    .widget-drawer-side-panel .add-widgets-builder-language-toggle-icon {
      flex-shrink: 0;
      width: 1rem;
      height: 1rem;
      color: var(--pf-t--global--icon--color--default);
    }

    .widget-drawer-side-panel .add-widgets-builder-row__preview {
      display: flex;
      flex-direction: column;
      flex: 1 1 300px;
      min-width: 0;
      min-height: 0;
      width: 100%;
      box-sizing: border-box;
      align-self: stretch;
    }

    /* Grey preview shell: no outer card border — inner sample widget is the only bordered card (matches dashboard). */
    .widget-drawer-side-panel .add-widgets-builder-preview-panel.pf-v6-c-card {
      flex: 1 1 auto;
      min-height: 0;
      width: 100%;
      max-width: 100%;
      overflow: visible;
      border: none;
      box-shadow: none;
      --pf-v6-c-card--first-child--PaddingBlockStart: var(--pf-t--global--spacer--sm);
      --pf-v6-c-card--child--PaddingInlineEnd: var(--pf-t--global--spacer--md);
      --pf-v6-c-card--child--PaddingBlockEnd: var(--pf-t--global--spacer--md);
      --pf-v6-c-card--child--PaddingInlineStart: var(--pf-t--global--spacer--md);
      --pf-v6-c-card--c-divider--child--PaddingBlockStart: var(--pf-t--global--spacer--sm);
    }

    .widget-drawer-side-panel .add-widgets-builder-preview-panel-header.pf-v6-c-card__header {
      padding-block: var(--pf-t--global--spacer--sm);
    }

    .widget-drawer-side-panel .add-widgets-builder-preview-panel-body.pf-v6-c-card__body {
      display: flex;
      flex-direction: column;
      flex: 1 1 auto;
      min-height: 0;
      gap: var(--pf-t--global--spacer--md);
    }

    .widget-drawer-side-panel .add-widgets-builder-preview-panel-actions.pf-v6-l-flex {
      margin-top: auto;
      flex-shrink: 0;
      width: 100%;
    }

    /* Inner “dashboard widget” sample card: single PF card chrome like grid widgets; height from content only */
    .widget-drawer-side-panel .widget-builder-sample-preview-card.pf-v6-c-card {
      height: fit-content;
      overflow: visible;
      width: 100%;
      max-width: 100%;
    }

    .removed-widget-card {
      cursor: pointer;
      transition: all 0.2s ease-in-out;
      border: 2px dashed var(--pf-v6-global--BorderColor--100);
      background-color: var(--pf-v6-global--BackgroundColor--100);
    }
    
    .removed-widget-card:hover {
      border-color: var(--pf-v6-global--primary-color--100);
      box-shadow: var(--pf-v6-global--BoxShadow--sm);
      transform: translateY(-2px);
    }
    
    .bank-widget-wrapper {
      cursor: default;
    }

    .bank-widget-wrapper--celebrate-exit {
      pointer-events: none;
      opacity: 0;
      transform: scale(0.97);
      transition: opacity 300ms ease, transform 300ms ease;
    }

    @media (prefers-reduced-motion: reduce) {
      .bank-widget-wrapper--celebrate-exit {
        transform: none;
        transition: opacity 200ms ease;
      }
    }
    
    .bank-widget-card {
      transition: all 0.2s ease-in-out;
      border: 2px dashed var(--pf-v6-global--BorderColor--100);
      background-color: var(--pf-v6-global--BackgroundColor--100);
    }
    
    .bank-widget-wrapper:hover .bank-widget-card {
      border-color: var(--pf-v6-global--primary-color--100);
      box-shadow: var(--pf-v6-global--BoxShadow--sm);
    }

    .bank-widget-card__action-slot.pf-v6-l-flex__item,
    .bank-widget-card__action-slot {
      flex-shrink: 0;
      width: 2.25rem;
      min-height: 2.25rem;
      display: inline-flex !important;
      align-items: center;
      justify-content: center;
    }

    .bank-widget-card__action-slot svg {
      width: 1.125rem;
      height: 1.125rem;
    }

    .bank-widget-card__action-slot .pf-v6-c-button.pf-m-plain {
      --pf-v6-c-button--PaddingInlineStart: var(--pf-t--global--spacer--xs);
      --pf-v6-c-button--PaddingInlineEnd: var(--pf-t--global--spacer--xs);
    }

    .bank-widget-card__added-indicator,
    .bank-widget-card__added-action {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      line-height: 0;
    }

    .bank-widget-card__added-indicator {
      color: var(--pf-t--global--icon--color--status--success--default);
    }

    .bank-widget-card__added-action.pf-v6-c-button.pf-m-plain {
      --pf-v6-c-button--PaddingBlockStart: 0;
      --pf-v6-c-button--PaddingBlockEnd: 0;
      min-block-size: 2.25rem;
    }

    .bank-widget-card__added-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .bank-widget-card__added-icon--check {
      color: var(--pf-t--global--icon--color--status--success--default);
    }

    .bank-widget-card__added-icon--remove {
      display: none;
      color: var(--pf-t--global--icon--color--brand--default);
    }

    .bank-widget-card__added-action:hover .bank-widget-card__added-icon--check,
    .bank-widget-card__added-action:focus-visible .bank-widget-card__added-icon--check {
      display: none;
    }

    .bank-widget-card__added-action:hover .bank-widget-card__added-icon--remove,
    .bank-widget-card__added-action:focus-visible .bank-widget-card__added-icon--remove {
      display: inline-flex;
      color: var(--pf-t--global--icon--color--brand--hover);
    }

    .bank-widget-card__added-icon svg,
    .bank-widget-card__added-icon .pf-v6-svg {
      width: 1.125rem;
      height: 1.125rem;
      color: inherit;
      fill: currentColor;
    }

    .bank-widget-card__added-icon svg path,
    .bank-widget-card__added-icon .pf-v6-svg path {
      fill: currentColor;
    }

    .drag-overlay {
      opacity: 0.9;
      box-shadow: var(--pf-v6-global--BoxShadow--xl) !important;
      cursor: grabbing !important;
    }
`;
