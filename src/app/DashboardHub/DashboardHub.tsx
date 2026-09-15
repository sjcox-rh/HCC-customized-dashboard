import * as React from 'react';
import { RouterBreadcrumbItem } from '@app/RouterBreadcrumbItem';
import {
  Breadcrumb,
  BreadcrumbItem,
  Button,
  Checkbox,
  Content,
  Divider,
  Dropdown,
  DropdownItem,
  DropdownList,
  Flex,
  FlexItem,
  Form,
  FormGroup,
  HelperText,
  HelperTextItem,
  MenuToggle,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalVariant,
  PageSection,
  TextInput,
  Title,
  Tooltip
} from '@patternfly/react-core';
import {
  ISortBy,
  OnSort,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr
} from '@patternfly/react-table';
import {
  CodeIcon,
  EllipsisVIcon,
  ExternalLinkAltIcon,
  HomeIcon,
  OutlinedCloneIcon,
  OutlinedTrashAltIcon,
  OutlinedWindowRestoreIcon,
  PencilAltIcon,
  PlusCircleIcon,
  ShareAltIcon,
  ThIcon,
  ThumbtackIcon
} from '@app/icons/rhUiIcons';
import type { HubRow } from '@app/DashboardHub/dashboardHubMockData';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDashboardData } from '@app/DashboardHub/DashboardDataContext';
import { DASHBOARD_DUPLICATE_NAME_ERROR } from '@app/DashboardHub/dashboardHubMockData';
import { resolveDashboardCanvasWidgets, serializeDashboardConfigPayload } from '@app/DashboardHub/dashboardCanvasStorage';
import { isPrebuiltHubRow } from '@app/DashboardHub/prebuiltDashboards';
import { CopyConfigStringModal } from '@app/DashboardHub/CopyConfigStringModal';
import { DeleteDashboardModal } from '@app/DashboardHub/DeleteDashboardModal';
import { DuplicateDashboardModal } from '@app/DashboardHub/DuplicateDashboardModal';
import { ImportConfigStringModal } from '@app/DashboardHub/ImportConfigStringModal';
import { PinDashboardModal } from '@app/DashboardHub/PinDashboardModal';
import {
  IMPORT_JSON_CONFIG_MENU_LABEL,
  PIN_DASHBOARD_TO_SERVICES_MENU_LABEL,
  SHARE_DASHBOARD_MENU_LABEL,
} from '@app/useCopyConfigFeedback';

const CREATE_BLANK_DASHBOARD_FORM_ID = 'create-blank-dashboard-form';
const CREATE_BLANK_NAME_DUPLICATE_ID = 'create-blank-name-duplicate-error';

/** Table column index for "Name" (excludes the leading home-indicator column). */
const HUB_COL_NAME = 1;
/** Table column index for "Last modified". */
const HUB_COL_LAST_MOD = 3;

function lastModifiedToTime(value: string): number {
  const t = Date.parse(value);
  return Number.isNaN(t) ? 0 : t;
}

function sortHubRows(list: HubRow[], sortBy: ISortBy): HubRow[] {
  const out = [...list];
  if (sortBy.index === HUB_COL_NAME) {
    const dir = sortBy.direction === 'desc' ? -1 : 1;
    out.sort(
      (a, b) => dir * a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
    );
  } else if (sortBy.index === HUB_COL_LAST_MOD) {
    out.sort((a, b) => {
      const ta = lastModifiedToTime(a.lastModified);
      const tb = lastModifiedToTime(b.lastModified);
      if (ta === tb) {
        return 0;
      }
      if (sortBy.direction === 'asc') {
        return ta < tb ? -1 : 1;
      }
      return ta > tb ? -1 : 1;
    });
  }
  return out;
}

const DashboardHub: React.FunctionComponent = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { rows, addDashboard, isDashboardNameTaken, setDashboardAsHomepage, removeDashboard } =
    useDashboardData();
  const [openActionsRowId, setOpenActionsRowId] = React.useState<string | null>(null);
  const [tableSort, setTableSort] = React.useState<ISortBy>({
    index: HUB_COL_LAST_MOD,
    direction: 'desc',
    defaultDirection: 'desc'
  });
  const [isCreateDashboardMenuOpen, setIsCreateDashboardMenuOpen] = React.useState(false);
  const [isCreateBlankModalOpen, setIsCreateBlankModalOpen] = React.useState(false);
  const [newBlankDashboardName, setNewBlankDashboardName] = React.useState('');
  const [newBlankSetAsHomepage, setNewBlankSetAsHomepage] = React.useState(false);
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = React.useState(false);
  const [duplicateModalInitialSourceId, setDuplicateModalInitialSourceId] = React.useState('');
  const [duplicateModalInitialHomepage, setDuplicateModalInitialHomepage] = React.useState(false);
  const [isImportConfigModalOpen, setIsImportConfigModalOpen] = React.useState(false);
  const [importModalInitialHomepage, setImportModalInitialHomepage] = React.useState(false);
  const [deleteTargetRow, setDeleteTargetRow] = React.useState<HubRow | null>(null);
  const [pinModalTargetRow, setPinModalTargetRow] = React.useState<HubRow | null>(null);
  const [copyConfigModalString, setCopyConfigModalString] = React.useState('');
  const [isCopyConfigModalOpen, setIsCopyConfigModalOpen] = React.useState(false);

  type HubNavFromHome = { fromHome?: { openCreate?: 'blank' | 'import' | 'duplicate' } };

  const nameTrimmed = newBlankDashboardName.trim();
  const createBlankNameIsDuplicate = nameTrimmed.length > 0 && isDashboardNameTaken(nameTrimmed);
  const isCreateBlankValid = nameTrimmed.length > 0 && !createBlankNameIsDuplicate;

  const resetCreateBlankModal = React.useCallback(() => {
    setNewBlankDashboardName('');
    setNewBlankSetAsHomepage(false);
  }, []);

  const closeCreateBlankModal = React.useCallback(() => {
    setIsCreateBlankModalOpen(false);
    resetCreateBlankModal();
  }, [resetCreateBlankModal]);

  const handleCreateBlankDashboard = React.useCallback(() => {
    if (!isCreateBlankValid) {
      return;
    }
    const newId = addDashboard({ name: nameTrimmed, setAsHomepage: newBlankSetAsHomepage });
    if (!newId) {
      return;
    }
    closeCreateBlankModal();
    setIsCreateDashboardMenuOpen(false);
    navigate(`/dashboard-hub/${newId}`);
  }, [
    addDashboard,
    closeCreateBlankModal,
    isCreateBlankValid,
    nameTrimmed,
    navigate,
    newBlankSetAsHomepage
  ]);

  const handleCreateBlankFormSubmit = React.useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      handleCreateBlankDashboard();
    },
    [handleCreateBlankDashboard]
  );

  const closeDuplicateModal = React.useCallback(() => {
    setIsDuplicateModalOpen(false);
  }, []);

  const openDuplicateModalFromHub = React.useCallback(() => {
    setDuplicateModalInitialSourceId('');
    setDuplicateModalInitialHomepage(false);
    setIsDuplicateModalOpen(true);
  }, []);

  const handleDuplicateModalSuccess = React.useCallback(
    (newId: string) => {
      setIsDuplicateModalOpen(false);
      setIsCreateDashboardMenuOpen(false);
      navigate(`/dashboard-hub/${newId}`);
    },
    [navigate]
  );

  const closeImportConfigModal = React.useCallback(() => {
    setIsImportConfigModalOpen(false);
  }, []);

  const handleImportConfigModalSuccess = React.useCallback(
    (newId: string) => {
      setIsImportConfigModalOpen(false);
      setIsCreateDashboardMenuOpen(false);
      navigate(`/dashboard-hub/${newId}`);
    },
    [navigate]
  );

  const closeDeleteDashboardModal = React.useCallback(() => {
    setDeleteTargetRow(null);
  }, []);

  const handleDeleteDashboardConfirm = React.useCallback(() => {
    if (!deleteTargetRow) {
      return;
    }
    removeDashboard(deleteTargetRow.id);
    setDeleteTargetRow(null);
  }, [deleteTargetRow, removeDashboard]);

  React.useLayoutEffect(() => {
    const s = (location.state ?? null) as HubNavFromHome | null;
    if (!s?.fromHome?.openCreate) {
      return;
    }
    const { openCreate } = s.fromHome;
    navigate(location.pathname, { replace: true, state: null });
    if (openCreate === 'blank') {
      setNewBlankSetAsHomepage(true);
      setIsCreateBlankModalOpen(true);
    } else if (openCreate === 'duplicate') {
      setDuplicateModalInitialSourceId('');
      setDuplicateModalInitialHomepage(true);
      setIsDuplicateModalOpen(true);
    } else if (openCreate === 'import') {
      setImportModalInitialHomepage(true);
      setIsImportConfigModalOpen(true);
    } else {
      setIsCreateDashboardMenuOpen(true);
    }
  }, [location.state, location.pathname, navigate]);

  const handleCopyRowConfiguration = React.useCallback(
    (row: HubRow) => {
      const raw = resolveDashboardCanvasWidgets(row);
      const configStr = serializeDashboardConfigPayload({
        dashboardId: row.id,
        name: row.name,
        widgets: raw ?? []
      });
      setCopyConfigModalString(configStr);
      setIsCopyConfigModalOpen(true);
      setOpenActionsRowId(null);
    },
    []
  );

  const handleTableSort: OnSort = React.useCallback((_event, columnIndex) => {
    setTableSort((prev) => {
      const isActive = prev.index === columnIndex;
      if (columnIndex === HUB_COL_NAME) {
        return {
          index: columnIndex,
          direction: isActive ? (prev.direction === 'asc' ? 'desc' : 'asc') : 'asc',
          defaultDirection: 'asc'
        };
      }
      if (columnIndex === HUB_COL_LAST_MOD) {
        return {
          index: columnIndex,
          direction: isActive ? (prev.direction === 'asc' ? 'desc' : 'asc') : 'desc',
          defaultDirection: 'desc'
        };
      }
      return prev;
    });
  }, []);

  const sortedRows = React.useMemo(() => sortHubRows(rows, tableSort), [rows, tableSort]);

  return (
    <>
      <PageSection hasBodyWrapper={false}>
        <Breadcrumb>
          <RouterBreadcrumbItem to="/">Home</RouterBreadcrumbItem>
          <BreadcrumbItem isActive>Dashboard Hub</BreadcrumbItem>
        </Breadcrumb>
      </PageSection>

      <PageSection hasBodyWrapper={false}>
        <Flex
          justifyContent={{ default: 'justifyContentSpaceBetween' }}
          alignItems={{ default: 'alignItemsCenter' }}
          spaceItems={{ default: 'spaceItemsMd' }}
        >
          <FlexItem flex={{ default: 'flex_1' }}>
            <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
              <FlexItem>
                <div className="pf-m-align-self-center" style={{ minWidth: '40px' }}>
                  <OutlinedWindowRestoreIcon style={{ fontSize: '32px', color: '#0066cc' }} aria-label="page-header-icon" />
                </div>
              </FlexItem>
              <FlexItem alignSelf={{ default: 'alignSelfStretch' }}>
                <div style={{ borderLeft: '1px solid #d2d2d2', height: '100%', marginRight: '16px' }} />
              </FlexItem>
              <FlexItem flex={{ default: 'flex_1' }}>
                <div>
                  <Title headingLevel="h1" size="2xl">
                    Dashboard Hub
                  </Title>
                  <Content>
                    <p style={{ margin: 0, color: '#6a6e73' }}>
                      Browse and open your dashboards. Create, organize, and share views tailored to your teams and workflows.
                    </p>
                    <div style={{ marginTop: '12px' }}>
                      <Button
                        variant="link"
                        isInline
                        icon={<ExternalLinkAltIcon />}
                        iconPosition="end"
                        component="a"
                        href="https://docs.redhat.com/en/documentation/red_hat_hybrid_cloud_console/"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Learn more
                      </Button>
                    </div>
                  </Content>
                </div>
              </FlexItem>
            </Flex>
          </FlexItem>
          <FlexItem>
            <Dropdown
              isOpen={isCreateDashboardMenuOpen}
              onSelect={() => setIsCreateDashboardMenuOpen(false)}
              onOpenChange={(isOpen: boolean) => setIsCreateDashboardMenuOpen(isOpen)}
              popperProps={{ position: 'end' }}
              toggle={(toggleRef: React.Ref<HTMLButtonElement>) => (
                <MenuToggle
                  ref={toggleRef}
                  variant="primary"
                  icon={<PlusCircleIcon />}
                  isExpanded={isCreateDashboardMenuOpen}
                  type="button"
                  onClick={() => {
                    setIsCreateDashboardMenuOpen((open) => !open);
                    setOpenActionsRowId(null);
                  }}
                >
                  Create dashboard
                </MenuToggle>
              )}
              shouldFocusToggleOnSelect
            >
              <DropdownList>
                <DropdownItem
                  key="create-blank"
                  icon={
                    <span className="hcc-create-dashboard-menu-leading-icon">
                      <PlusCircleIcon
                        style={{ color: 'var(--pf-t--global--icon--Color--200)' }}
                        aria-hidden
                      />
                    </span>
                  }
                  onClick={() => {
                    setNewBlankSetAsHomepage(false);
                    setIsCreateBlankModalOpen(true);
                    setIsCreateDashboardMenuOpen(false);
                  }}
                >
                  Create from blank
                </DropdownItem>
                <DropdownItem
                  key="import-config"
                  icon={
                    <span className="hcc-create-dashboard-menu-leading-icon">
                      <CodeIcon style={{ color: 'var(--pf-t--global--icon--Color--200)' }} aria-hidden />
                    </span>
                  }
                  onClick={() => {
                    setImportModalInitialHomepage(false);
                    setIsImportConfigModalOpen(true);
                    setIsCreateDashboardMenuOpen(false);
                  }}
                >
                  {IMPORT_JSON_CONFIG_MENU_LABEL}
                </DropdownItem>
                <DropdownItem
                  key="duplicate"
                  icon={
                    <span className="hcc-create-dashboard-menu-leading-icon">
                      <OutlinedCloneIcon
                        style={{ color: 'var(--pf-t--global--icon--Color--200)' }}
                        aria-hidden
                      />
                    </span>
                  }
                  onClick={() => {
                    openDuplicateModalFromHub();
                    setIsCreateDashboardMenuOpen(false);
                  }}
                >
                  Duplicate existing
                </DropdownItem>
              </DropdownList>
            </Dropdown>
          </FlexItem>
        </Flex>
      </PageSection>

      <PageSection>
        <Table aria-label="Dashboard hub" gridBreakPoint="">
          <Thead>
            <Tr>
              <Th modifier="fitContent" screenReaderText="Homepage indicator" />
              <Th
                sort={{
                  columnIndex: HUB_COL_NAME,
                  sortBy: tableSort,
                  onSort: handleTableSort
                }}
              >
                Name
              </Th>
              <Th>Description</Th>
              <Th
                sort={{
                  columnIndex: HUB_COL_LAST_MOD,
                  sortBy: tableSort,
                  onSort: handleTableSort
                }}
              >
                Last modified
              </Th>
              <Th modifier="fitContent" screenReaderText="Actions" />
            </Tr>
          </Thead>
          <Tbody>
            {sortedRows.map((row) => (
              <Tr key={row.id}>
                <Td
                  dataLabel="Homepage"
                  modifier="fitContent"
                  textCenter
                >
                  {row.isHomepage ? (
                    <Tooltip content="Console homepage">
                      <span style={{ color: 'var(--pf-t--global--icon--Color--200, #4d4d4d)' }}>
                        <HomeIcon
                          style={{ display: 'block' }}
                          aria-label="Set as your console homepage"
                        />
                      </span>
                    </Tooltip>
                  ) : null}
                </Td>
                <Td dataLabel="Name">
                  <Link
                    to={`/dashboard-hub/${row.id}`}
                    className="pf-v6-c-button pf-m-link pf-m-inline"
                    style={{ padding: 0, fontSize: 'inherit' }}
                  >
                    {row.name}
                  </Link>
                </Td>
                <Td dataLabel="Description">{row.description}</Td>
                <Td dataLabel="Last modified">{row.lastModified}</Td>
                <Td dataLabel="Actions" modifier="fitContent">
                  <Dropdown
                    isOpen={openActionsRowId === row.id}
                    onSelect={() => setOpenActionsRowId(null)}
                    onOpenChange={(isOpen: boolean) => setOpenActionsRowId(isOpen ? row.id : null)}
                    popperProps={{ position: 'end' }}
                    toggle={(toggleRef: React.Ref<HTMLButtonElement>) => (
                        <MenuToggle
                          ref={toggleRef}
                          variant="plain"
                          aria-label={`Actions for ${row.name}`}
                          isExpanded={openActionsRowId === row.id}
                          onClick={() => {
                            setOpenActionsRowId((current) => (current === row.id ? null : row.id));
                            setIsCreateDashboardMenuOpen(false);
                          }}
                        >
                          <EllipsisVIcon />
                        </MenuToggle>
                    )}
                    shouldFocusToggleOnSelect
                  >
                    <DropdownList>
                      {!isPrebuiltHubRow(row) && (
                        <DropdownItem
                          key="edit"
                          onClick={() => {
                            navigate(`/dashboard-hub/${row.id}`);
                            setOpenActionsRowId(null);
                          }}
                        >
                          <span
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                          >
                            <PencilAltIcon style={{ color: 'var(--pf-t--global--icon--Color--200)' }} />
                            Edit dashboard
                          </span>
                        </DropdownItem>
                      )}
                      <DropdownItem
                        key="homepage"
                        isDisabled={Boolean(row.isHomepage)}
                        description={
                          row.isHomepage ? 'This dashboard is already your console homepage.' : undefined
                        }
                        onClick={() => {
                          if (row.isHomepage) {
                            return;
                          }
                          setDashboardAsHomepage(row.id);
                          setOpenActionsRowId(null);
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
                        key="duplicate"
                        description={
                          isPrebuiltHubRow(row)
                            ? 'System default dashboards are not editable. Create a duplicate in order to edit this dashboard.'
                            : undefined
                        }
                        onClick={() => {
                          setDuplicateModalInitialSourceId(row.id);
                          setDuplicateModalInitialHomepage(false);
                          setIsDuplicateModalOpen(true);
                          setOpenActionsRowId(null);
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
                          setPinModalTargetRow(row);
                          setOpenActionsRowId(null);
                        }}
                      >
                        <span
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                          <ThumbtackIcon style={{ color: 'var(--pf-t--global--icon--Color--200)' }} />
                          {PIN_DASHBOARD_TO_SERVICES_MENU_LABEL}
                        </span>
                      </DropdownItem>
                      <DropdownItem key="copy" onClick={() => handleCopyRowConfiguration(row)}>
                        <span
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                          <ShareAltIcon style={{ color: 'var(--pf-t--global--icon--Color--200)' }} />
                          {SHARE_DASHBOARD_MENU_LABEL}
                        </span>
                      </DropdownItem>
                      <Divider component="li" role="separator" />
                      <DropdownItem
                        key="delete"
                        isDanger={!isPrebuiltHubRow(row)}
                        isDisabled={isPrebuiltHubRow(row)}
                        onClick={() => {
                          if (isPrebuiltHubRow(row)) {
                            return;
                          }
                          setDeleteTargetRow(row);
                          setOpenActionsRowId(null);
                        }}
                      >
                        <span
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                          <OutlinedTrashAltIcon
                            style={{
                              color: isPrebuiltHubRow(row)
                                ? 'var(--pf-t--global--icon--Color--200)'
                                : 'var(--pf-t--global--danger-color--200)'
                            }}
                          />
                          Delete dashboard
                        </span>
                      </DropdownItem>
                    </DropdownList>
                  </Dropdown>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </PageSection>

      <Modal
        variant={ModalVariant.small}
        isOpen={isCreateBlankModalOpen}
        onClose={closeCreateBlankModal}
        aria-labelledby="create-blank-modal-title"
      >
        <ModalHeader
          labelId="create-blank-modal-title"
          title="Create a new blank dashboard"
          titleIconVariant={ThIcon}
        />
        <ModalBody>
          <Form id={CREATE_BLANK_DASHBOARD_FORM_ID} onSubmit={handleCreateBlankFormSubmit}>
            <FormGroup isRequired fieldId="new-blank-dashboard-name" label="New dashboard name">
              <TextInput
                autoFocus
                isRequired
                type="text"
                id="new-blank-dashboard-name"
                name="new-blank-dashboard-name"
                value={newBlankDashboardName}
                onChange={(_event, value) => setNewBlankDashboardName(value)}
                placeholder="Ie. prod-release monitoring"
                validated={createBlankNameIsDuplicate ? 'error' : 'default'}
                aria-describedby={createBlankNameIsDuplicate ? CREATE_BLANK_NAME_DUPLICATE_ID : undefined}
              />
              {createBlankNameIsDuplicate && (
                <HelperText isLiveRegion>
                  <HelperTextItem id={CREATE_BLANK_NAME_DUPLICATE_ID} variant="error" component="div">
                    {DASHBOARD_DUPLICATE_NAME_ERROR}
                  </HelperTextItem>
                </HelperText>
              )}
            </FormGroup>
            <FormGroup fieldId="new-blank-set-homepage" hasNoPaddingTop>
              <Checkbox
                id="new-blank-set-homepage"
                isChecked={newBlankSetAsHomepage}
                onChange={(_event, checked) => setNewBlankSetAsHomepage(checked)}
                label="Set as homepage"
              />
            </FormGroup>
          </Form>
        </ModalBody>
        <ModalFooter>
          <Button
            type="submit"
            variant="primary"
            form={CREATE_BLANK_DASHBOARD_FORM_ID}
            isDisabled={!isCreateBlankValid}
          >
            Create dashboard
          </Button>
          <Button type="button" variant="link" onClick={closeCreateBlankModal}>
            Cancel
          </Button>
        </ModalFooter>
      </Modal>

      <CopyConfigStringModal
        isOpen={isCopyConfigModalOpen}
        onClose={() => setIsCopyConfigModalOpen(false)}
        configString={copyConfigModalString}
      />

      <DuplicateDashboardModal
        isOpen={isDuplicateModalOpen}
        onClose={closeDuplicateModal}
        rows={rows}
        initialSourceId={duplicateModalInitialSourceId}
        initialSetAsHomepage={duplicateModalInitialHomepage}
        onSuccess={handleDuplicateModalSuccess}
      />

      <ImportConfigStringModal
        isOpen={isImportConfigModalOpen}
        onClose={closeImportConfigModal}
        initialSetAsHomepage={importModalInitialHomepage}
        onSuccess={handleImportConfigModalSuccess}
      />

      <PinDashboardModal
        isOpen={Boolean(pinModalTargetRow)}
        onClose={() => setPinModalTargetRow(null)}
        dashboardId={pinModalTargetRow?.id ?? ''}
        dashboardName={pinModalTargetRow?.name ?? ''}
      />

      <DeleteDashboardModal
        isOpen={deleteTargetRow !== null}
        onClose={closeDeleteDashboardModal}
        dashboardName={deleteTargetRow?.name ?? ''}
        onConfirm={handleDeleteDashboardConfirm}
      />
    </>
  );
};

export { DashboardHub };
