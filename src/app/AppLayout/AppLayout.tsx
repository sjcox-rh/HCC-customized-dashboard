import * as React from 'react';
import { AngleLeftIcon, AngleRightIcon } from '@patternfly/react-icons';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { IAppRoute, IAppRouteGroup, routes } from '@app/routes';
import { MASTHEAD_USER_DISPLAY_NAME } from '@app/mastheadUserDisplayName';
import { DashboardWidgetsHelpPanelContent } from '@app/Homepage/DashboardWidgetsHelpPanelContent';
import { useFavoritedServices } from '@app/favoriteServices/FavoritedServicesContext';
import { usePinnedDashboards } from '@app/DashboardHub/PinnedDashboardsContext';
import { PinnedDashboardNavItem } from '@app/DashboardHub/PinnedDashboardNavItem';
import { OpenshiftBundleNav } from '@app/OpenShift/OpenshiftBundleNav';
import { OPENSHIFT_BUNDLE_PATHS } from '@app/OpenShift/openshiftBundleNavigation';
import type { PinDashboardServiceTypeId } from '@app/DashboardHub/pinDashboardServiceTypes';
import {
  resolveNavigationServiceType,
  serviceTypeSupportsLeftNav,
  shouldDeferBundleNavToPinnedDashboard
} from '@app/DashboardHub/pinnedDashboardNavigation';
import { HelpPanelChatbotPanel, HELP_PANEL_CHATBOT_STYLES } from '@app/AppLayout/HelpPanelChatbotPanel';
import HappyRobotIcon from '@app/bgimages/happy-robot-icon.svg';
import FeedbackIcon from '@app/bgimages/feedback-icon.svg';
import BugIcon from '@app/bgimages/bug-icon.svg';
import DirectionIcon from '@app/bgimages/direction-icon.svg';
import {
  Avatar,
  Badge,
  Breadcrumb,
  BreadcrumbItem,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Checkbox,
  Content,
  DataList,
  DataListCell,
  DataListItem,
  DataListItemCells,
  DataListItemRow,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Divider,
  Drawer,
  DrawerActions,
  DrawerCloseButton,
  DrawerContent,
  DrawerContentBody,
  DrawerHead,
  DrawerPanelContent,
  Dropdown,
  DropdownGroup,
  DropdownItem,
  DropdownList,
  Flex,
  FlexItem,
  Label,
  LabelGroup,
  Masthead,
  MastheadBrand,
  MastheadContent,
  MastheadLogo,
  MastheadMain,
  MastheadToggle,
  Menu,
  MenuGroup,
  MenuItem,
  MenuItemAction,
  MenuList,
  MenuToggle,
  Nav,
  NavExpandable,
  NavItem,
  NavList,
  NotificationDrawer,
  NotificationDrawerBody,
  NotificationDrawerHeader,
  NotificationDrawerList,
  NotificationDrawerListItem,
  NotificationDrawerListItemBody,
  NotificationDrawerListItemHeader,
  Page,
  PageSidebar,
  PageSidebarBody,
  Pagination,
  SearchInput,
  SkipToContent,
  Spinner,
  Split,
  SplitItem,
  Tab,
  TabTitleIcon,
  TabTitleText,
  Tabs,
  Title,
  ToggleGroup,
  ToggleGroupItem,
  Tooltip,
  EmptyState
} from '@patternfly/react-core';
import { Table, Thead, Tbody, Tr, Th, Td } from '@patternfly/react-table';
import { BarsIcon, BookmarkIcon, BookOpenIcon, CloudIcon, CodeIcon, CommentsIcon, FillDripIcon, HelpIcon, InProgressIcon, LightbulbIcon, OutlinedWindowRestoreIcon, ProjectDiagramIcon, SignOutAltIcon, TachometerAltIcon, UserIcon } from '@patternfly/react-icons';
import {
  AttentionBellIcon,
  AutomationIcon,
  BellIcon,
  ClusterIcon,
  CogIcon,
  ContainerIcon,
  CreditCardIcon,
  DataSourceIcon,
  EllipsisVIcon,
  ExclamationTriangleIcon,
  ExternalLinkAltIcon,
  InfoCircleIcon,
  KeyIcon,
  ListIcon,
  ModuleIcon,
  QuestionCircleIcon,
  RhUiAiExperienceIcon,
  RhUiMonitoringIcon,
  RhUiProcessAutomationIcon,
  RocketIcon,
  SearchIcon,
  ServerIcon,
  ShieldAltIcon,
  StarIcon,
  TimesIcon,
  UsersIcon,
  WrenchIcon,
} from '@app/icons/rhUiIcons';

interface IAppLayout {
  children: React.ReactNode;
}

interface MenuItem {
  id: string;
  name: string;
  description: string;
  details: string;
  features: string[];
  icon: React.ReactElement;
  url?: string;
  isLink?: boolean;
}

// Create a context for help panel functions
interface HelpPanelContextType {
  /** `variant`: `quickstart` selects Learn + breadcrumb; `in-page` shows all tabs with none selected (default). */
  openHelpPanelWithTab: (title: string, options?: { variant?: 'quickstart' | 'in-page' }) => void;
  /** Find help → Feedback → Share general feedback (breadcrumb screen). */
  openHelpPanelToShareGeneralFeedback: () => void;
  /** Whether the help drawer is expanded and showing the "Dashboard widgets" custom view. */
  isAddWidgetsPanelOpen: boolean;
  /** Close the help panel. */
  closeHelpPanel: () => void;
}

export const HelpPanelContext = React.createContext<HelpPanelContextType | undefined>(undefined);

type HelpPanelFeedbackView = 'main' | 'general' | 'bug' | 'direction';

type HelpPanelHistoryEntry = {
  subTab: number | null;
  customHelpTitle: string | null;
  customHelpVariant: 'quickstart' | 'in-page' | null;
  feedbackView: HelpPanelFeedbackView;
  searchQuery: string;
};

const DASHBOARD_WIDGETS_HELP_CUSTOM_TITLE = 'Dashboard widgets';

const DASHBOARD_WIDGETS_SEARCH_ENTRY = {
  id: 'help-dashboard-widgets',
  title: 'All dashboard widgets',
  breadcrumb1: 'Utilities',
  breadcrumb2: '',
  labels: ['Console features'],
  tab: 'Dashboard widgets'
} as const;

// Helper function to get icon based on breadcrumb text
  const getBreadcrumbIcon = (breadcrumbText: string) => {
    const iconStyle = { width: '12px', height: '12px', marginRight: '4px', verticalAlign: 'middle' };
    
    switch (breadcrumbText) {
      case 'Learning resources':
        return <BookOpenIcon style={iconStyle} />;
      case 'Knowledgebase':
      case 'Knowledgebase article':
        return <LightbulbIcon style={iconStyle} />;
      case 'API documentation':
        return <ProjectDiagramIcon style={iconStyle} />;
      case 'My open support tickets':
        return <QuestionCircleIcon style={iconStyle} />;
      case 'Share feedback':
        return <CommentsIcon style={iconStyle} />;
      case 'Utilities':
        return <WrenchIcon style={iconStyle} />;
      default:
        return <CloudIcon style={iconStyle} />;
    }
  };

const AppLayout: React.FunctionComponent<IAppLayout> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const [isDrawerExpanded, setIsDrawerExpanded] = React.useState(false);
  /** Bottom help subtabs: Search, Learn (incl. KB content), APIs, Support, Feedback (0–4), Chat (5). Null while custom/article view is open. */
  const [helpPanelSubTab, setHelpPanelSubTab] = React.useState<number | null>(0);
  /** Topic opened via openHelpPanelWithTab — custom HTML in the scroll region. */
  const [customHelpTitle, setCustomHelpTitle] = React.useState<string | null>(null);
  /** When custom help is open: quickstart → Learn tab selected + breadcrumb; in-page → no tab selected. */
  const [customHelpVariant, setCustomHelpVariant] = React.useState<'quickstart' | 'in-page' | null>(null);
  /** Remount top help tabs when selection crosses into/out of `null` so PatternFly clears the tab accent (no matching `eventKey`). */
  const [helpTopTabsMountKey, setHelpTopTabsMountKey] = React.useState(0);
  const prevHelpPanelSubTabRef = React.useRef<number | null>(helpPanelSubTab);
  React.useEffect(() => {
    const prev = prevHelpPanelSubTabRef.current;
    const cur = helpPanelSubTab;
    if ((prev === null) !== (cur === null)) {
      setHelpTopTabsMountKey((k) => k + 1);
    }
    prevHelpPanelSubTabRef.current = cur;
  }, [helpPanelSubTab]);
  
  // Complete APIs tab data - all content (43 APIs from Red Hat API Catalog)
  const allApisContent = [
    { id: 'api-1', title: 'Advisor', breadcrumb1: 'API documentation', labels: ['RHEL'] },
    { id: 'api-2', title: 'Ansible automation controller API V1', breadcrumb1: 'API documentation', labels: ['Ansible'] },
    { id: 'api-3', title: 'Automation Hub', breadcrumb1: 'API documentation', labels: ['Ansible'] },
    { id: 'api-4', title: 'Compliance V1', breadcrumb1: 'API documentation', labels: ['RHEL'] },
    { id: 'api-5', title: 'Compliance V2', breadcrumb1: 'API documentation', labels: ['RHEL'] },
    { id: 'api-6', title: 'Cost Management', breadcrumb1: 'API documentation', labels: ['OpenShift'] },
    { id: 'api-7', title: 'Export Service', breadcrumb1: 'API documentation', labels: ['RHEL'] },
    { id: 'api-8', title: 'Image Builder', breadcrumb1: 'API documentation', labels: ['RHEL'] },
    { id: 'api-9', title: 'Integrations', breadcrumb1: 'API documentation', labels: ['Settings'] },
    { id: 'api-10', title: 'Launch', breadcrumb1: 'API documentation', labels: ['RHEL'] },
    { id: 'api-11', title: 'Malware Detection', breadcrumb1: 'API documentation', labels: ['RHEL'] },
    { id: 'api-12', title: 'Managed Inventory', breadcrumb1: 'API documentation', labels: ['RHEL'] },
    { id: 'api-13', title: 'Notifications', breadcrumb1: 'API documentation', labels: ['Settings'] },
    { id: 'api-14', title: 'Operator Gathering Conditions Service', breadcrumb1: 'API documentation', labels: ['OpenShift'] },
    { id: 'api-15', title: 'Payload Ingress Service', breadcrumb1: 'API documentation', labels: ['RHEL'] },
    { id: 'api-16', title: 'Insights Advisor for OpenShift V1', breadcrumb1: 'API documentation', labels: ['OpenShift'] },
    { id: 'api-17', title: 'Insights Advisor for OpenShift V2', breadcrumb1: 'API documentation', labels: ['OpenShift'] },
    { id: 'api-18', title: 'Patch', breadcrumb1: 'API documentation', labels: ['RHEL'] },
    { id: 'api-19', title: 'Playbook Dispatcher', breadcrumb1: 'API documentation', labels: ['RHEL'] },
    { id: 'api-20', title: 'Policies', breadcrumb1: 'API documentation', labels: ['Ansible', 'RHEL'] },
    { id: 'api-21', title: 'Remediations', breadcrumb1: 'API documentation', labels: ['Ansible', 'RHEL'] },
    { id: 'api-22', title: 'Resource Optimization', breadcrumb1: 'API documentation', labels: ['RHEL'] },
    { id: 'api-23', title: 'Repositories', breadcrumb1: 'API documentation', labels: ['RHEL'] },
    { id: 'api-24', title: 'Role-based Access Control', breadcrumb1: 'API documentation', labels: ['IAM'] },
    { id: 'api-25', title: 'Sources', breadcrumb1: 'API documentation', labels: ['IAM'] },
    { id: 'api-26', title: 'Subscriptions v1', breadcrumb1: 'API documentation', labels: ['RHEL', 'OpenShift'] },
    { id: 'api-27', title: 'Subscriptions v2', breadcrumb1: 'API documentation', labels: ['RHEL', 'OpenShift'] },
    { id: 'api-28', title: 'Tasks', breadcrumb1: 'API documentation', labels: ['Ansible', 'RHEL'] },
    { id: 'api-29', title: 'Vulnerability Management', breadcrumb1: 'API documentation', labels: ['RHEL'] },
    { id: 'api-30', title: 'Red Hat Ansible Lightspeed', breadcrumb1: 'API documentation', labels: ['Ansible'] },
    { id: 'api-31', title: 'Insights for RHEL Planning', breadcrumb1: 'API documentation', labels: ['RHEL'] },
    { id: 'api-32', title: 'Account Management Service', breadcrumb1: 'API documentation', labels: ['OpenShift'] },
    { id: 'api-33', title: 'Assisted-Install Service', breadcrumb1: 'API documentation', labels: ['OpenShift'] },
    { id: 'api-34', title: 'Authorization Service', breadcrumb1: 'API documentation', labels: ['OpenShift'] },
    { id: 'api-35', title: 'Connector Management', breadcrumb1: 'API documentation', labels: ['OpenShift'] },
    { id: 'api-36', title: 'Kafka Service Fleet Manager Service', breadcrumb1: 'API documentation', labels: ['OpenShift'] },
    { id: 'api-37', title: 'RHACS Service Fleet Manager', breadcrumb1: 'API documentation', labels: ['OpenShift'] },
    { id: 'api-38', title: 'Service Logs', breadcrumb1: 'API documentation', labels: ['OpenShift'] },
    { id: 'api-39', title: 'Service Registry Management', breadcrumb1: 'API documentation', labels: ['OpenShift'] },
    { id: 'api-40', title: 'Upgrades Information Service', breadcrumb1: 'API documentation', labels: ['OpenShift'] },
    { id: 'api-41', title: 'Vulnerability Dashboard OCP', breadcrumb1: 'API documentation', labels: ['OpenShift'] },
    { id: 'api-42', title: 'Web-RCA Service', breadcrumb1: 'API documentation', labels: ['OpenShift'] },
    { id: 'api-43', title: 'Case Management API', breadcrumb1: 'API documentation', labels: ['Ansible', 'RHEL', 'OpenShift'] }
  ];

  // Knowledgebase article list (shown in the Learn tab)
  const allKnowledgebaseContent = [
    // Real articles from page 1
    { id: 'kb-1', title: 'How do I access Red Hat Enterprise Linux 7 Extended Life Cycle Support (ELS) content after Red Hat Enterprise Linux 7 transitions to Extended Life Phase?', breadcrumb1: 'Knowledgebase article', labels: ['RHEL', 'Subscription Services'] },
    { id: 'kb-2', title: 'System Information Collected by Red Hat Insights', breadcrumb1: 'Knowledgebase article', labels: ['RHEL'] },
    { id: 'kb-3', title: 'Mejores Prácticas en la Creación de Casos Nuevos de Soporte', breadcrumb1: 'Knowledgebase article', labels: ['Settings'] },
    { id: 'kb-4', title: 'Melhores Práticas para a criação de novos casos de suporte', breadcrumb1: 'Knowledgebase article', labels: ['Settings'] },
    { id: 'kb-5', title: 'Opting Out of Sending Metadata from Red Hat Insights Client', breadcrumb1: 'Knowledgebase article', labels: ['RHEL', 'Settings'] },
    { id: 'kb-6', title: 'Obfuscating hostnames, IP addresses and MAC addresses in Red Hat Insights', breadcrumb1: 'Knowledgebase article', labels: ['RHEL', 'Settings'] },
    { id: 'kb-7', title: 'Disable Automatic Update of Collection Rules for Red Hat Insights', breadcrumb1: 'Knowledgebase article', labels: ['RHEL'] },
    { id: 'kb-8', title: 'Creating Custom Schedule for Red Hat Insights Uploads', breadcrumb1: 'Knowledgebase article', labels: ['RHEL'] },
    { id: 'kb-9', title: 'Reference Guide for Engaging with Red Hat Support', breadcrumb1: 'Knowledgebase article', labels: ['Settings'] },
    { id: 'kb-10', title: 'Understanding Red Hat Insights - Advisor: Risk of Change', breadcrumb1: 'Knowledgebase article', labels: ['RHEL'] },
    // Placeholder articles (to be replaced with actual titles from pages 2-12)
    ...Array.from({ length: 107 }, (_, i) => ({
      id: `kb-${i + 11}`,
      title: `Knowledgebase Article ${i + 11}`,
      breadcrumb1: 'Knowledgebase article',
      labels: ['RHEL'] // Default label, will be updated with real data
    }))
  ];

  // Recommended content for Search tab
  const recommendedContentSettings = [
    { id: 'rec-settings-1', title: 'Configuring notifications and integrations', url: 'https://docs.redhat.com/en/documentation/red_hat_hybrid_cloud_console/1-latest/html/configuring_notifications_on_the_red_hat_hybrid_cloud_console/index', breadcrumb1: 'Learning resources', breadcrumb2: 'Documentation', labels: ['Settings'] },
    { id: 'rec-settings-2', title: 'Azure cloud integrations (sources) on Hybrid Cloud Console to unlock Red Hat Gold Images in Microsoft Azure', url: 'https://access.redhat.com/articles/6961606', breadcrumb1: 'Knowledgebase article', breadcrumb2: '', labels: ['Settings', 'OpenShift'] },
    { id: 'rec-settings-3', title: 'Integrations', url: 'https://developers.redhat.com/api-catalog/api/integrations', breadcrumb1: 'API documentation', breadcrumb2: '', labels: ['Settings'] },
    { id: 'rec-settings-4', title: 'Notifications', url: 'https://developers.redhat.com/api-catalog/api/notifications', breadcrumb1: 'API documentation', breadcrumb2: '', labels: ['Settings'] },
    { id: 'rec-settings-5', title: 'Configuring console event notifications in Slack', url: '#', breadcrumb1: 'Learning resources', breadcrumb2: 'Quick start', labels: ['Settings'] }
  ];

  const recommendedContentAll = [
    { id: 'rec-all-1', title: 'Analyzing CentOS Linux systems for conversion in Insights', url: '#', breadcrumb1: 'Learning resources', breadcrumb2: 'Quick start', labels: ['RHEL'] },
    { id: 'rec-all-2', title: 'Getting started with the Red Hat Hybrid Cloud Console', url: '#', breadcrumb1: 'Learning resources', breadcrumb2: 'Documentation', labels: ['Settings', 'RHEL', 'IAM', 'Ansible', 'OpenShift', 'Subscription Services'] },
    { id: 'rec-all-3', title: 'Getting Started with Red Hat Insights', url: '#', breadcrumb1: 'Learning resources', breadcrumb2: 'Documentation', labels: ['RHEL'] },
    { id: 'rec-all-4', title: 'Learn about OpenShift cluster services on the console', url: '#', breadcrumb1: 'Learning resources', breadcrumb2: 'Documentation', labels: ['OpenShift'] },
    { id: 'rec-all-5', title: 'Managing user access with workspaces', url: '#', breadcrumb1: 'Learning resources', breadcrumb2: 'Quick start', labels: ['RHEL', 'IAM'] }
  ];

  // Complete Learn tab data - all content
  const allLearnContent = [
    { id: 'learn-1', title: 'Adding a machine pool to your managed OpenShift cluster', breadcrumb1: 'Learning resources', breadcrumb2: 'Quick start', labels: ['OpenShift'] },
    { id: 'learn-2', title: 'Adding an integration: Amazon Web Services', breadcrumb1: 'Learning resources', breadcrumb2: 'Documentation', labels: ['OpenShift', 'Settings'] },
    { id: 'learn-3', title: 'Adding an integration: Google Cloud Platform', breadcrumb1: 'Learning resources', breadcrumb2: 'Documentation', labels: ['OpenShift', 'Settings'] },
    { id: 'learn-4', title: 'Adding an integration: Microsoft Azure', breadcrumb1: 'Learning resources', breadcrumb2: 'Documentation', labels: ['OpenShift', 'Settings'] },
    { id: 'learn-5', title: 'Adding an integration: OpenShift Container Platform', breadcrumb1: 'Learning resources', breadcrumb2: 'Documentation', labels: ['OpenShift', 'Settings'] },
    { id: 'learn-6', title: 'Adding new users to your managed OpenShift cluster', breadcrumb1: 'Learning resources', breadcrumb2: 'Quick start', labels: ['OpenShift', 'IAM'] },
    { id: 'learn-7', title: 'Adding OCM roles and access to managed OpenShift clusters', breadcrumb1: 'Learning resources', breadcrumb2: 'Quick start', labels: ['OpenShift', 'IAM'] },
    { id: 'learn-8', title: 'API Cheatsheet', breadcrumb1: 'Learning resources', breadcrumb2: 'Documentation', labels: ['RHEL'] },
    { id: 'learn-9', title: 'APIs', breadcrumb1: 'Learning resources', breadcrumb2: 'Documentation', labels: ['RHEL', 'OpenShift', 'Settings', 'IAM', 'Ansible'] },
    { id: 'learn-10', title: 'Assess security vulnerabilities', breadcrumb1: 'Learning resources', breadcrumb2: 'Documentation', labels: ['RHEL'] },
    { id: 'learn-11', title: 'Assessing security vulnerabilities in your OpenShift cluster using Red Hat Insights', breadcrumb1: 'Learning resources', breadcrumb2: 'Documentation', labels: ['OpenShift'] },
    { id: 'learn-12', title: 'Configuring granular permissions by service', breadcrumb1: 'Learning resources', breadcrumb2: 'Quick start', labels: ['RHEL', 'IAM'] },
    { id: 'learn-13', title: 'Create images and configure automated management', breadcrumb1: 'Learning resources', breadcrumb2: 'Documentation', labels: ['RHEL'] },
    { id: 'learn-14', title: 'Create your first Ansible Playbook', breadcrumb1: 'Learning resources', breadcrumb2: 'Documentation', labels: ['Ansible'] },
    { id: 'learn-15', title: 'Creating a blueprint', breadcrumb1: 'Learning resources', breadcrumb2: 'Learning path', labels: ['RHEL'] },
    { id: 'learn-16', title: 'Creating and managing service accounts', breadcrumb1: 'Learning resources', breadcrumb2: 'Documentation', labels: ['Settings', 'IAM'] },
    { id: 'learn-17', title: 'Deploy a Java application on Kubernetes in minutes', breadcrumb1: 'Learning resources', breadcrumb2: 'Learning path', labels: ['OpenShift'] },
    { id: 'learn-18', title: 'Deploy a sample application in the Developer Sandbox', breadcrumb1: 'Learning resources', breadcrumb2: 'Learning path', labels: ['OpenShift'] },
    { id: 'learn-19', title: 'Deploy and manage RHEL systems in hybrid clouds', breadcrumb1: 'Learning resources', breadcrumb2: 'Documentation', labels: ['RHEL'] },
    { id: 'learn-20', title: 'Deploying an application using Red Hat OpenShift Service on AWS', breadcrumb1: 'Learning resources', breadcrumb2: 'Learning path', labels: ['OpenShift'] },
    { id: 'learn-21', title: 'Deploying and managing RHEL systems in hybrid clouds', breadcrumb1: 'Learning resources', breadcrumb2: 'Documentation', labels: ['RHEL'] },
    { id: 'learn-22', title: 'Deploying full-stack JavaScript applications to the Developer Sandbox for Red Hat OpenShift', breadcrumb1: 'Learning resources', breadcrumb2: 'Learning path', labels: ['OpenShift'] },
    { id: 'learn-23', title: 'Editing your managed OpenShift cluster display name', breadcrumb1: 'Learning resources', breadcrumb2: 'Quick start', labels: ['OpenShift'] },
    { id: 'learn-24', title: 'Editing your managed OpenShift cluster\'s application ingress', breadcrumb1: 'Learning resources', breadcrumb2: 'Quick start', labels: ['OpenShift'] },
    { id: 'learn-25', title: 'Getting started with automation hub', breadcrumb1: 'Learning resources', breadcrumb2: 'Documentation', labels: ['Ansible'] },
    { id: 'learn-26', title: 'Getting started with hybrid committed spend', breadcrumb1: 'Learning resources', breadcrumb2: 'Documentation', labels: ['Subscription Services'] },
    { id: 'learn-27', title: 'Getting started with RHEL system registration', breadcrumb1: 'Learning resources', breadcrumb2: 'Documentation', labels: ['Subscription Services', 'RHEL'] },
    { id: 'learn-28', title: 'Introduction to the OpenShift Developer Sandbox Series', breadcrumb1: 'Learning resources', breadcrumb2: 'Other', labels: ['OpenShift'] },
    { id: 'learn-29', title: 'Learn about OpenShift cluster services on the console', breadcrumb1: 'Learning resources', breadcrumb2: 'Documentation', labels: ['OpenShift'] },
    { id: 'learn-30', title: 'Learn about OpenShift Container Platform', breadcrumb1: 'Learning resources', breadcrumb2: 'Documentation', labels: ['OpenShift'] },
    { id: 'learn-31', title: 'Learn about OpenShift Dedicated', breadcrumb1: 'Learning resources', breadcrumb2: 'Documentation', labels: ['OpenShift'] },
    { id: 'learn-32', title: 'Learn about Red Hat Advanced Cluster Security', breadcrumb1: 'Learning resources', breadcrumb2: 'Documentation', labels: ['OpenShift'] },
    { id: 'learn-33', title: 'Learn about Red Hat OpenShift Service on AWS (ROSA)', breadcrumb1: 'Learning resources', breadcrumb2: 'Documentation', labels: ['OpenShift'] },
    { id: 'learn-34', title: 'Managing clusters', breadcrumb1: 'Learning resources', breadcrumb2: 'Documentation', labels: ['OpenShift'] },
    { id: 'learn-35', title: 'Managing subscriptions', breadcrumb1: 'Learning resources', breadcrumb2: 'Documentation', labels: ['OpenShift', 'Subscription Services'] },
    { id: 'learn-36', title: 'Monitoring your OpenShift cluster health with Insights Advisor', breadcrumb1: 'Learning resources', breadcrumb2: 'Documentation', labels: ['OpenShift'] },
    { id: 'learn-37', title: 'Reducing permissions across my organization', breadcrumb1: 'Learning resources', breadcrumb2: 'Quick start', labels: ['RHEL', 'IAM'] },
    { id: 'learn-38', title: 'Related console documentation', breadcrumb1: 'Learning resources', breadcrumb2: 'Documentation', labels: ['Settings', 'IAM'] },
    { id: 'learn-39', title: 'Related documentation for Ansible', breadcrumb1: 'Learning resources', breadcrumb2: 'Documentation', labels: ['Ansible'] },
    { id: 'learn-40', title: 'Related documentation for edge management', breadcrumb1: 'Learning resources', breadcrumb2: 'Documentation', labels: ['RHEL'] },
    { id: 'learn-41', title: 'Related documentation for hybrid committed spend', breadcrumb1: 'Learning resources', breadcrumb2: 'Documentation', labels: ['Subscription Services'] },
    { id: 'learn-42', title: 'Related documentation for OpenShift Cluster Manager', breadcrumb1: 'Learning resources', breadcrumb2: 'Documentation', labels: ['OpenShift'] },
    { id: 'learn-43', title: 'Restricting access to a service to a team', breadcrumb1: 'Learning resources', breadcrumb2: 'Quick start', labels: ['RHEL', 'IAM'] },
    { id: 'learn-44', title: 'Setting up User Access', breadcrumb1: 'Learning resources', breadcrumb2: 'Documentation', labels: ['Settings', 'IAM', 'RHEL', 'Ansible', 'OpenShift'] },
    { id: 'learn-45', title: 'Using Red Hat Marketplace', breadcrumb1: 'Learning resources', breadcrumb2: 'Documentation', labels: ['OpenShift', 'Subscription Services'] },
    { id: 'learn-46', title: 'Using the Automation Calculator', breadcrumb1: 'Learning resources', breadcrumb2: 'Documentation', labels: ['Ansible'] },
    { id: 'learn-47', title: 'Using two-factor authentication', breadcrumb1: 'Learning resources', breadcrumb2: 'Documentation', labels: ['IAM'] },
    { id: 'learn-48', title: 'Viewing automation environment reports', breadcrumb1: 'Learning resources', breadcrumb2: 'Documentation', labels: ['Ansible'] },
    { id: 'learn-49', title: 'Visit the OpenShift Library', breadcrumb1: 'Learning resources', breadcrumb2: 'Documentation', labels: ['OpenShift'] },
    { id: 'learn-50', title: 'Working with systems in the edge management application', breadcrumb1: 'Learning resources', breadcrumb2: 'Documentation', labels: ['RHEL'] },
    { id: 'learn-51', title: 'Configuring console event notifications in Slack', breadcrumb1: 'Learning resources', breadcrumb2: 'Quick start', labels: ['Settings'] }
  ];


  const [overflowTooltips] = React.useState<Array<{ selector: string; text: string }>>([]);
  
  // Feedback tab state
  const [feedbackView, setFeedbackView] = React.useState<HelpPanelFeedbackView>('main');
  const helpPanelHistoryRef = React.useRef<HelpPanelHistoryEntry[]>([]);
  const [helpPanelHistoryIndex, setHelpPanelHistoryIndex] = React.useState(0);
  const isApplyingHelpPanelHistoryRef = React.useRef(false);
  const prevHelpDrawerExpandedRef = React.useRef(false);

  // User dropdown state
  const [isUserDropdownOpen, setIsUserDropdownOpen] = React.useState(false);
  const [isUtilitiesDropdownOpen, setIsUtilitiesDropdownOpen] = React.useState(false);
  
  // Notification drawer state
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = React.useState(false);
  const [helpPanelWidth, setHelpPanelWidth] = React.useState(580); // Default size in pixels
  const helpPanelRef = React.useRef<HTMLDivElement>(null);
  const [isNotificationActionsOpen, setIsNotificationActionsOpen] = React.useState(false);

  // Menu groups data for primary-detail view
  const menuGroupsData: Record<string, MenuItem[]> = {
    'Platforms': [
      {
        id: 'ansible',
        name: 'Red Hat Ansible Automation Platform',
        description: 'Enterprise automation platform',
        details: 'Red Hat Ansible Automation Platform is a comprehensive automation solution that enables organizations to automate IT processes, configure systems, deploy applications, and orchestrate complex workflows across hybrid cloud environments.',
        features: ['IT Automation', 'Configuration Management', 'Application Deployment', 'Workflow Orchestration'],
        icon: <RhUiProcessAutomationIcon />,
        url: '/ansible-automation-platform',
        isLink: true
      },
      {
        id: 'rhel',
        name: 'Red Hat Enterprise Linux',
        description: 'Enterprise-grade Linux operating system',
        details: 'Red Hat Enterprise Linux (RHEL) is the world\'s leading enterprise Linux platform. Built for mission-critical workloads, RHEL provides enhanced security, reliability, and performance for physical, virtual, cloud, and containerized environments.',
        features: ['Security & Compliance', 'High Availability', 'Performance Optimization', 'Long-term Support'],
        icon: <ServerIcon />,
        url: '/red-hat-enterprise-linux',
        isLink: true
      },
      {
        id: 'openshift',
        name: 'Red Hat OpenShift',
        description: 'Enterprise Kubernetes platform',
        details: 'Red Hat OpenShift is a comprehensive Kubernetes platform that enables organizations to build, deploy, and manage containerized applications at scale. It provides developer-friendly tools and enterprise-grade security for modern application development.',
        features: ['Container Orchestration', 'Developer Tools', 'Multi-cloud Deployment', 'Built-in Security'],
        icon: <ClusterIcon />,
        url: '/red-hat-openshift',
        isLink: true
      }
    ],
    'Services': [
      {
        id: 'my-favorite-services',
        name: 'My favorite services',
        description: 'Quick access to your most-used services',
        details: 'Access your frequently used and bookmarked services in one convenient location. Customize your dashboard with the services you use most often to improve your workflow efficiency.',
        features: ['Quick Access', 'Custom Dashboard', 'Service Bookmarks', 'Usage Analytics'],
        icon: <StarIcon style={{ color: 'var(--pf-v6-c-button--m-favorited--hover__icon--Color, #f39200)' }} />
      },
      {
        id: 'ai-ml',
        name: 'AI/ML',
        description: 'Artificial intelligence and machine learning services',
        details: 'Build, train, and deploy machine learning models with enterprise-grade AI/ML platforms. Access GPU-accelerated computing, automated model training, and MLOps pipelines.',
        features: ['Model Training', 'GPU Computing', 'MLOps Pipelines', 'Data Science Workbenches'],
        icon: <RhUiAiExperienceIcon />
      },
      {
        id: 'alerting-data-integrations',
        name: 'Alerting & data integrations',
        description: 'Monitoring alerts and data pipeline management',
        details: 'Configure intelligent alerting systems and manage data integration workflows across your hybrid cloud infrastructure with real-time monitoring and automated responses.',
        features: ['Real-time Alerts', 'Data Pipelines', 'Integration Workflows', 'Event Processing'],
        icon: <AttentionBellIcon />
      },
      {
        id: 'automation',
        name: 'Automation',
        description: 'Infrastructure and application automation',
        details: 'Automate repetitive tasks, configuration management, and deployment processes with comprehensive automation tools and workflow orchestration.',
        features: ['Task Automation', 'Configuration Management', 'Workflow Orchestration', 'Process Optimization'],
        icon: <AutomationIcon />
      },
      {
        id: 'containers',
        name: 'Containers',
        description: 'Container management and orchestration',
        details: 'Deploy, manage, and scale containerized applications with enterprise Kubernetes platforms, container registries, and orchestration tools.',
        features: ['Container Orchestration', 'Registry Management', 'Application Scaling', 'Service Mesh'],
        icon: <ContainerIcon />
      },
      {
        id: 'deploy',
        name: 'Deploy',
        description: 'Application deployment and delivery',
        details: 'Streamline application deployment with CI/CD pipelines, automated testing, and progressive delivery strategies across multiple environments.',
        features: ['CI/CD Pipelines', 'Automated Testing', 'Progressive Delivery', 'Environment Management'],
        icon: <RocketIcon />
      },
      {
        id: 'identity-access-mgmt',
        name: 'Identity & access management',
        description: 'User authentication and authorization',
        details: 'Secure your applications with comprehensive identity management, single sign-on, multi-factor authentication, and role-based access controls.',
        features: ['Single Sign-On', 'Multi-Factor Auth', 'Role-Based Access', 'Identity Federation'],
        icon: <UsersIcon />
      },
      {
        id: 'inventories',
        name: 'Inventories',
        description: 'Asset and resource inventory management',
        details: 'Track and manage your IT assets, infrastructure resources, and application inventories with automated discovery and real-time updates.',
        features: ['Asset Discovery', 'Resource Tracking', 'Inventory Updates', 'Compliance Reporting'],
        icon: <ListIcon />
      },
      {
        id: 'observability-monitoring',
        name: 'Observability & monitoring',
        description: 'System monitoring and observability',
        details: 'Gain deep insights into your applications and infrastructure with comprehensive monitoring, logging, tracing, and performance analytics.',
        features: ['Application Monitoring', 'Infrastructure Metrics', 'Distributed Tracing', 'Log Analytics'],
        icon: <RhUiMonitoringIcon />
      },
      {
        id: 'operators',
        name: 'Operators',
        description: 'Kubernetes operators and lifecycle management',
        details: 'Deploy and manage complex applications on Kubernetes with operators that automate installation, updates, and day-2 operations.',
        features: ['Operator Lifecycle', 'Application Management', 'Automated Updates', 'Cluster Operations'],
        icon: <ModuleIcon />
      },
      {
        id: 'security',
        name: 'Security',
        description: 'Security scanning and threat protection',
        details: 'Protect your infrastructure with advanced security scanning, vulnerability management, threat detection, and compliance monitoring.',
        features: ['Vulnerability Scanning', 'Threat Detection', 'Security Policies', 'Compliance Monitoring'],
        icon: <ShieldAltIcon />
      },
      {
        id: 'subscriptions-spend',
        name: 'Subscriptions & spend',
        description: 'Subscription management and cost optimization',
        details: 'Manage subscriptions, track usage, optimize costs, and analyze spending patterns across your Red Hat services and cloud resources.',
        features: ['Subscription Tracking', 'Cost Analysis', 'Usage Optimization', 'Spend Management'],
        icon: <CreditCardIcon />
      },
      {
        id: 'system-configuration',
        name: 'System configuration',
        description: 'System settings and configuration management',
        details: 'Configure and manage system settings, infrastructure parameters, and application configurations with centralized management tools.',
        features: ['Configuration Management', 'System Settings', 'Parameter Tuning', 'Change Tracking'],
        icon: <CogIcon />
      }
    ]
  };
  
  const DEFAULT_SERVICES_MENU_ITEM_ID = 'my-favorite-services';

  // Service dropdown primary-detail state
  const [selectedMenuItem, setSelectedMenuItem] = React.useState(DEFAULT_SERVICES_MENU_ITEM_ID);
  
  // Favorited items state
  const { favoritedIds: favoritedItems, toggleFavorite } = useFavoritedServices();
  const { getPinnedForServiceType } = usePinnedDashboards();
  
  // Logo dropdown and expandable search state
  const [isLogoDropdownOpen, setIsLogoDropdownOpen] = React.useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = React.useState(false);
  const [mastheadSearchValue, setMastheadSearchValue] = React.useState('');
  const [searchResults, setSearchResults] = React.useState<Array<{id: string, title: string, description: string, category: string, route: string | null}>>([]);
  const [showSearchResults, setShowSearchResults] = React.useState(false);
  
  // Bookmarked menu items state
  const [bookmarkedItems, setBookmarkedItems] = React.useState<Set<string>>(new Set());
  
  // Support tickets state
  const [supportTickets, setSupportTickets] = React.useState<Array<{id: string, title: string, status: 'waiting-red-hat' | 'waiting-customer'}>>([]);
  const [supportTicketsLoading, setSupportTicketsLoading] = React.useState(false);
  
  // Sample support case titles
  const sampleSupportCases = [
    "Critical production outage - Database connection timeout",
    "Performance degradation in API response times",
    "SSL certificate expiration warning",
    "Unable to access admin console after recent update",
    "Cluster nodes failing health checks",
    "Memory leak in application container",
    "Network connectivity issues between nodes",
    "Authentication service intermittent failures",
    "Data replication lag in database cluster",
    "Load balancer configuration assistance needed"
  ];
  
  // Function to toggle bookmark status of a menu item
  const toggleBookmark = (itemId: string) => {
    setBookmarkedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };
  
  // Function to load support tickets from Customer Portal
  const loadSupportTickets = () => {
    setSupportTicketsLoading(true);
    // Simulate API call with a delay
    setTimeout(() => {
      setSupportTicketsLoading(false);
      
      // Get a random title from the sample cases
      const randomTitle = sampleSupportCases[Math.floor(Math.random() * sampleSupportCases.length)];
      // Randomly assign a status
      const randomStatus: 'waiting-red-hat' | 'waiting-customer' = Math.random() > 0.5 ? 'waiting-red-hat' : 'waiting-customer';
      
      // Add a new ticket to the beginning of the array (most recent on top)
      setSupportTickets(prevTickets => [
        {
          id: `support-case-${Date.now()}`,
          title: randomTitle,
          status: randomStatus
        },
        ...prevTickets
      ]);
    }, 1500); // 1.5 second delay
  };
  
  // Learn tab filter states
  const [isContentTypeOpen, setIsContentTypeOpen] = React.useState(false);
  const [showBookmarkedOnly, setShowBookmarkedOnly] = React.useState(false);
  const [selectedContentTypes, setSelectedContentTypes] = React.useState<Set<string>>(new Set());
  const [scopeFilter, setScopeFilter] = React.useState<'bundle' | 'all'>('bundle');
  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(10);
  /** Pagination for Knowledgebase article list inside the Learn tab (independent from learning-resources pagination). */
  const [kbPage, setKbPage] = React.useState(1);
  const [kbPerPage, setKbPerPage] = React.useState(10);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [recentSearches, setRecentSearches] = React.useState<Array<{ query: string; count: number }>>([]);
  const [searchPage, setSearchPage] = React.useState(1);
  const [searchPerPage, setSearchPerPage] = React.useState(10);
  const [isSearchContentTypeOpen, setIsSearchContentTypeOpen] = React.useState(false);
  const [selectedSearchContentTypes, setSelectedSearchContentTypes] = React.useState<Set<string>>(new Set());

  const RECENT_SEARCHES_STORAGE_KEY = 'hcc-recent-searches';
  const MAX_RECENT_SEARCHES = 10;

  const recordRecentSearch = React.useCallback((rawQuery: string) => {
    const query = rawQuery.trim();
    if (!query) {
      return;
    }
    setRecentSearches((prev) => {
      const match = prev.find((entry) => entry.query.toLowerCase() === query.toLowerCase());
      const next = match
        ? [
            { query: match.query, count: match.count + 1 },
            ...prev.filter((entry) => entry.query.toLowerCase() !== query.toLowerCase())
          ]
        : [{ query, count: 1 }, ...prev];
      const capped = next.slice(0, MAX_RECENT_SEARCHES);
      try {
        localStorage.setItem(RECENT_SEARCHES_STORAGE_KEY, JSON.stringify(capped));
      } catch (e) {
        console.error('Failed to store recent searches', e);
      }
      return capped;
    });
  }, []);

  // Load recent searches from localStorage on mount
  React.useEffect(() => {
    const stored = localStorage.getItem(RECENT_SEARCHES_STORAGE_KEY);
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse stored searches', e);
      }
    }
  }, []);

  const previousSearchQueryRef = React.useRef('');
  React.useEffect(() => {
    const previousQuery = previousSearchQueryRef.current;
    if (previousQuery.trim() && !searchQuery.trim()) {
      recordRecentSearch(previousQuery);
    }
    previousSearchQueryRef.current = searchQuery;
  }, [searchQuery, recordRecentSearch]);

  // Get all searchable content from all tabs
  const getAllSearchableContent = (): Array<{
    id: string;
    title: string;
    breadcrumb1: string;
    breadcrumb2: string;
    labels: string[];
    tab: string;
  }> => {
    // Use a Map to deduplicate by title (keep first occurrence)
    // Using title as key since same content may have different IDs in different arrays
    const resultsMap = new Map<string, {
      id: string;
      title: string;
      breadcrumb1: string;
      breadcrumb2: string;
      labels: string[];
      tab: string;
    }>();
    
    // Dashboard widgets in-panel help
    if (!resultsMap.has(DASHBOARD_WIDGETS_SEARCH_ENTRY.title)) {
      resultsMap.set(DASHBOARD_WIDGETS_SEARCH_ENTRY.title, {
        id: DASHBOARD_WIDGETS_SEARCH_ENTRY.id,
        title: DASHBOARD_WIDGETS_SEARCH_ENTRY.title,
        breadcrumb1: DASHBOARD_WIDGETS_SEARCH_ENTRY.breadcrumb1,
        breadcrumb2: DASHBOARD_WIDGETS_SEARCH_ENTRY.breadcrumb2,
        labels: [...DASHBOARD_WIDGETS_SEARCH_ENTRY.labels],
        tab: DASHBOARD_WIDGETS_SEARCH_ENTRY.tab
      });
    }

    // Learn tab items (51 items)
    allLearnContent.forEach(item => {
      if (!resultsMap.has(item.title)) {
        resultsMap.set(item.title, {
          id: item.id,
          title: item.title,
          breadcrumb1: item.breadcrumb1,
          breadcrumb2: item.breadcrumb2,
          labels: item.labels,
          tab: 'Learn'
        });
      }
    });
    
    // Recommended content items (also part of Learn resources)
    recommendedContentSettings.forEach(item => {
      if (!resultsMap.has(item.title)) {
        resultsMap.set(item.title, {
          id: item.id,
          title: item.title,
          breadcrumb1: item.breadcrumb1,
          breadcrumb2: item.breadcrumb2 || '',
          labels: item.labels,
          tab: 'Learn'
        });
      }
    });
    
    recommendedContentAll.forEach(item => {
      if (!resultsMap.has(item.title)) {
        resultsMap.set(item.title, {
          id: item.id,
          title: item.title,
          breadcrumb1: item.breadcrumb1,
          breadcrumb2: item.breadcrumb2 || '',
          labels: item.labels,
          tab: 'Learn'
        });
      }
    });
    
    // Knowledgebase items (117 items)
    allKnowledgebaseContent.forEach(item => {
      if (!resultsMap.has(item.title)) {
        resultsMap.set(item.title, {
          id: item.id,
          title: item.title,
          breadcrumb1: item.breadcrumb1,
          breadcrumb2: '',
          labels: item.labels,
          tab: 'Learn'
        });
      }
    });
    
    // API items (43 items)
    allApisContent.forEach(item => {
      if (!resultsMap.has(item.title)) {
        resultsMap.set(item.title, {
          id: item.id,
          title: item.title,
          breadcrumb1: item.breadcrumb1,
          breadcrumb2: '',
          labels: item.labels,
          tab: 'APIs'
        });
      }
    });
    
    // Support items (dynamic)
    supportTickets.forEach(item => {
      if (!resultsMap.has(item.title)) {
        resultsMap.set(item.title, {
          id: item.id,
          title: item.title,
          breadcrumb1: 'My open support tickets',
          breadcrumb2: '',
          labels: [],
          tab: 'Support'
        });
      }
    });
    
    // Convert Map values back to array
    return Array.from(resultsMap.values());
  };

  /**
   * Enhanced search function that searches across all tabs (Learn—including knowledgebase articles—APIs, Support)
   * Searches in: title, breadcrumbs (breadcrumb1, breadcrumb2), labels, and tab names
   * Also applies content type filters if any are selected
   */
  const getSearchResults = () => {
    if (!searchQuery.trim()) return [];
    
    let allContent = getAllSearchableContent();
    const query = searchQuery.toLowerCase();
    
    // First, filter by search query - search across title, breadcrumbs, labels, and tab
    let filteredResults = allContent.filter(item => {
      // Search in title
      if (item.title.toLowerCase().includes(query)) return true;
      
      // Search in breadcrumbs
      if (item.breadcrumb1.toLowerCase().includes(query)) return true;
      if (item.breadcrumb2 && item.breadcrumb2.toLowerCase().includes(query)) return true;
      
      // Search in tab name
      if (item.tab.toLowerCase().includes(query)) return true;
      
      // Search in labels
      if (item.labels && item.labels.some(label => label.toLowerCase().includes(query))) return true;
      
      return false;
    });
    
    // Second, apply content type filters if any are selected
    if (selectedSearchContentTypes.size > 0) {
      filteredResults = filteredResults.filter(item => {
        // Check if item matches any of the selected content types
        
        // Services filter (not implemented yet, reserved for future)
        if (selectedSearchContentTypes.has('services')) {
          // Would filter by service-related content
        }
        
        // Learning resources filters
        if (item.breadcrumb1 === 'Learning resources') {
          if (selectedSearchContentTypes.has('documentation') && item.breadcrumb2 === 'Documentation') {
            return true;
          }
          if (selectedSearchContentTypes.has('quick-starts') && item.breadcrumb2 === 'Quick start') {
            return true;
          }
          if (selectedSearchContentTypes.has('learning-paths') && item.breadcrumb2 === 'Learning path') {
            return true;
          }
          if (selectedSearchContentTypes.has('other') && item.breadcrumb2 === 'Other') {
            return true;
          }
        }
        
        // Knowledgebase filter
        if (selectedSearchContentTypes.has('knowledgebase') && item.breadcrumb1 === 'Knowledgebase article') {
          return true;
        }
        
        // API documentation filter
        if (selectedSearchContentTypes.has('api-documentation') && item.breadcrumb1 === 'API documentation') {
          return true;
        }
        
        // Support cases filter
        if (selectedSearchContentTypes.has('support-cases') && item.breadcrumb1 === 'My open support tickets') {
          return true;
        }
        
        return false;
      });
    }
    
    return filteredResults;
  };

  const helpPanelSearchResults = getSearchResults();
  const totalSearchResults = helpPanelSearchResults.length;
  const searchStartIdx = (searchPage - 1) * searchPerPage;
  const searchEndIdx = searchStartIdx + searchPerPage;
  const visibleSearchResults = helpPanelSearchResults.slice(searchStartIdx, searchEndIdx);

  // Reset search page when query changes
  React.useEffect(() => {
    setSearchPage(1);
  }, [searchQuery]);
  
  // Function to toggle content type selection
  const toggleContentType = (contentType: string) => {
    setSelectedContentTypes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(contentType)) {
        newSet.delete(contentType);
      } else {
        newSet.add(contentType);
      }
      return newSet;
    });
  };
  
  // Helper function to get content type display name
  const getContentTypeDisplayName = (contentType: string) => {
    const displayNames: { [key: string]: string } = {
      'documentation': 'Documentation',
      'quick-starts': 'Quick starts',
      'learning-paths': 'Learning paths',
      'other': 'Other'
    };
    return displayNames[contentType] || contentType;
  };
  
  // Helper function to clear all content type filters
  const clearAllContentTypeFilters = () => {
    setSelectedContentTypes(new Set());
  };

  // Search tab filter functions
  const toggleSearchContentType = (contentType: string) => {
    setSelectedSearchContentTypes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(contentType)) {
        newSet.delete(contentType);
      } else {
        newSet.add(contentType);
      }
      return newSet;
    });
  };
  
  const getSearchContentTypeDisplayName = (contentType: string) => {
    const displayNames: { [key: string]: string } = {
      'services': 'Services',
      'documentation': 'Documentation',
      'quick-starts': 'Quick starts',
      'learning-paths': 'Learning paths',
      'other': 'Other',
      'knowledgebase': 'Knowledgebase articles',
      'api-documentation': 'API documentation',
      'support-cases': 'My open support cases'
    };
    return displayNames[contentType] || contentType;
  };
  
  const clearAllSearchContentTypeFilters = () => {
    setSelectedSearchContentTypes(new Set());
  };

  // Ref for services dropdown to handle outside clicks
  const servicesDropdownRef = React.useRef<HTMLDivElement>(null);
  const servicesToggleRef = React.useRef<HTMLDivElement>(null);
  const [servicesDropdownPosition, setServicesDropdownPosition] = React.useState({ top: 0, left: 0 });
  
  // Ref for search container to handle outside clicks
  const searchContainerRef = React.useRef<HTMLDivElement>(null);
  
  // Location and navigation
  const location = useLocation();
  const navigate = useNavigate();
  
  // Function to get current bundle name based on route
  const getCurrentBundle = () => {
    const currentPath = location.pathname;
    
    // Settings bundle pages (Dashboard Hub is standalone — no bundle)
    const settingsPaths = [
      '/overview',
      '/alert-manager',
      '/data-integration',
      '/event-log',
      '/settings/appearance',
      '/learning-resources'
    ];
    if (settingsPaths.includes(currentPath)) {
      return 'Settings';
    }
    
    // IAM bundle pages
    if (['/my-user-access', '/user-access', '/users', '/groups', '/roles', '/workspaces', '/red-hat-access-requests', '/authentication-policy', '/service-accounts', '/learning-resources-iam'].includes(currentPath)) {
      return 'IAM';
    }

    // OpenShift bundle pages
    if ((OPENSHIFT_BUNDLE_PATHS as readonly string[]).includes(currentPath)) {
      return 'OpenShift';
    }
    
    // Legacy OpenShift pinned dashboard links on Settings overview
    if (currentPath === '/overview' && new URLSearchParams(location.search).get('bundle') === 'openshift') {
      return 'OpenShift';
    }
    
    // No bundle (homepage, all services, etc.)
    return null;
  };
  
  const currentBundle = getCurrentBundle();

  React.useEffect(() => {
    setKbPage(1);
  }, [scopeFilter, currentBundle]);
  
  // No app sidebar or masthead nav toggle: homepage, all services, or standalone Dashboard Hub
  const isPageWithoutNav =
    location.pathname === '/' ||
    location.pathname === '/all-services' ||
    location.pathname === '/dashboard-hub' ||
    location.pathname === '/dashboard' ||
    location.pathname.startsWith('/dashboard-hub/');

  // Mock search data
  const mockSearchData = [
    // Main Settings Bundle Pages
    { id: '1', title: 'Overview', description: 'View system overview and general information', category: 'Settings', route: '/overview' },
    {
      id: '19',
      title: 'Dashboard Hub',
      description: 'Browse, create, and organize dashboards for your workspace',
      category: 'Dashboard Hub',
      route: '/dashboard-hub'
    },
    { id: '2', title: 'Alert Manager', description: 'Configure and manage system alerts and notifications', category: 'Settings', route: '/alert-manager' },
    { id: '3', title: 'Data Integration', description: 'Manage data integration workflows, connectors, and synchronization settings', category: 'Settings', route: '/data-integration' },
    { id: '4', title: 'Event Log', description: 'View and configure system event logging and monitoring', category: 'Settings', route: '/event-log' },
    { id: '18', title: 'Appearance', description: 'Customize console theme, contrast mode, and icon set', category: 'Settings', route: '/settings/appearance' },
    { id: '5', title: 'Learning Resources', description: 'Access training materials, tutorials, and documentation resources', category: 'Settings', route: '/learning-resources' },
    
    // IAM Bundle Pages
    { id: '6', title: 'My User Access', description: 'View and manage your personal access permissions and settings', category: 'IAM', route: '/my-user-access' },
    { id: '7', title: 'User Access', description: 'Manage user accounts, groups, and access permissions overview', category: 'IAM', route: '/user-access' },
    { id: '8', title: 'Users', description: 'Manage user accounts and their access permissions', category: 'IAM', route: '/users' },
    { id: '9', title: 'Groups', description: 'Create and manage user groups and group-based permissions', category: 'IAM', route: '/groups' },
    { id: '10', title: 'Roles', description: 'Define and manage user roles with specific permissions and access levels', category: 'IAM', route: '/roles' },
    { id: '11', title: 'Workspaces', description: 'Manage workspaces and project environments for teams', category: 'IAM', route: '/workspaces' },
    { id: '12', title: 'Red Hat Access Requests', description: 'Manage access requests for Red Hat services and resources', category: 'IAM', route: '/red-hat-access-requests' },
    { id: '13', title: 'Authentication Policy', description: 'Configure authentication policies and security settings', category: 'IAM', route: '/authentication-policy' },
    { id: '14', title: 'Service Accounts', description: 'Manage service accounts and API credentials for automated systems', category: 'IAM', route: '/service-accounts' },
    { id: '15', title: 'IAM Learning Resources', description: 'Access Identity & Access Management learning materials and guides', category: 'IAM', route: '/learning-resources-iam' },
    
    // Additional Services
    { id: '16', title: 'Vulnerability', description: 'View and manage system vulnerabilities', category: 'RHEL', route: null },
    { id: '17', title: 'Policies', description: 'Configure and manage security policies', category: 'RHEL', route: null },
    { id: '18', title: 'Application Performance', description: 'Monitor application performance metrics', category: 'Monitoring', route: null }
  ];

  // Top 5 results for empty state
  const topResults = [
    { id: '1', title: 'Overview', description: 'View system overview and general information', category: 'Settings', route: '/overview' },
    { id: '2', title: 'Alert Manager', description: 'Configure and manage system alerts and notifications', category: 'Settings', route: '/alert-manager' },
    { id: '6', title: 'My User Access', description: 'View and manage your personal access permissions and settings', category: 'IAM', route: '/my-user-access' },
    { id: '7', title: 'User Access', description: 'Manage user accounts, groups, and access permissions overview', category: 'IAM', route: '/user-access' },
    { id: '3', title: 'Data Integration', description: 'Manage data integration workflows, connectors, and synchronization settings', category: 'Settings', route: '/data-integration' }
  ];

  // Hide search results and collapse search bar when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const searchButton = document.querySelector('[aria-label="Expandable search input toggle"]');
      
      // Check if click is on search toggle button - don't collapse if so
      if (searchButton && searchButton.contains(event.target as Node)) {
        return;
      }
      
      // If search is expanded and click is outside the search container
      if (isSearchExpanded && searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchExpanded(false);
        setShowSearchResults(false);
        setSearchResults([]);
        setMastheadSearchValue('');
      } else if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        // Just hide search results if search is not expanded
        setShowSearchResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSearchExpanded]);

  // Hide services dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (servicesDropdownRef.current && !servicesDropdownRef.current.contains(event.target as Node)) {
        // Also check if click is on the masthead toggle button
        const mastheadToggle = document.querySelector('[aria-label="Red Hat Hybrid Cloud Console menu"]');
        if (mastheadToggle && mastheadToggle.contains(event.target as Node)) {
          return; // Don't close if clicking on the toggle button
        }
        setIsLogoDropdownOpen(false);
      }
    };

    if (isLogoDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isLogoDropdownOpen]);

  const handleServicesMenuToggle = () => {
    if (!isLogoDropdownOpen) {
      setSelectedMenuItem(DEFAULT_SERVICES_MENU_ITEM_ID);
    }
    setIsLogoDropdownOpen((isOpen) => !isOpen);
  };

  // Position services dropdown below the masthead toggle
  React.useEffect(() => {
    if (!isLogoDropdownOpen || !servicesToggleRef.current) {
      return;
    }

    const updatePosition = () => {
      if (servicesToggleRef.current) {
        const rect = servicesToggleRef.current.getBoundingClientRect();
        setServicesDropdownPosition({
          top: rect.bottom + 4,
          left: rect.left
        });
      }
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isLogoDropdownOpen]);

  // ResizeObserver to track help panel width changes
  React.useEffect(() => {
    if (!isDrawerExpanded) {
      return;
    }

    // Find the panel element by looking for the drawer panel content
    const findPanelElement = () => {
      const selectors = [
        '.pf-v6-c-drawer__panel-content',
        '.pf-v6-c-drawer__panel',
        '[data-ouia-component-type="DrawerPanelContent"]',
        '.pf-c-drawer__panel-content',
        '.pf-c-drawer__panel'
      ];
      
      for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element) {
          return element;
        }
      }
      
      return null;
    };

    // Wait a bit for the DOM to be ready
    const timeoutId = setTimeout(() => {
      const panelElement = findPanelElement();
      
      if (!panelElement) {
        return;
      }

      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const newWidth = entry.contentRect.width;
          setHelpPanelWidth(newWidth);
        }
      });

      resizeObserver.observe(panelElement);

      // Store the observer for cleanup
      (window as any).helpPanelResizeObserver = resizeObserver;
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      if ((window as any).helpPanelResizeObserver) {
        (window as any).helpPanelResizeObserver.disconnect();
        delete (window as any).helpPanelResizeObserver;
      }
    };
  }, [isDrawerExpanded]);

  // PatternFly Tabs overflow counts visible tabs on window resize; drawer resize does not fire that.
  React.useEffect(() => {
    if (!isDrawerExpanded) {
      return;
    }
    window.dispatchEvent(new Event('resize'));
  }, [helpPanelWidth, isDrawerExpanded]);

  const captureHelpPanelState = React.useCallback((): HelpPanelHistoryEntry => ({
    subTab: helpPanelSubTab,
    customHelpTitle,
    customHelpVariant,
    feedbackView,
    searchQuery
  }), [helpPanelSubTab, customHelpTitle, customHelpVariant, feedbackView, searchQuery]);

  const applyHelpPanelState = React.useCallback((entry: HelpPanelHistoryEntry) => {
    setHelpPanelSubTab(entry.subTab);
    setCustomHelpTitle(entry.customHelpTitle);
    setCustomHelpVariant(entry.customHelpVariant);
    setFeedbackView(entry.feedbackView);
    setSearchQuery(entry.searchQuery);
  }, []);

  const navigateHelpPanel = React.useCallback(
    (entry: HelpPanelHistoryEntry) => {
      if (isApplyingHelpPanelHistoryRef.current) {
        applyHelpPanelState(entry);
        return;
      }
      setHelpPanelHistoryIndex((currentIndex) => {
        const truncated = helpPanelHistoryRef.current.slice(0, currentIndex + 1);
        truncated.push(entry);
        helpPanelHistoryRef.current = truncated;
        return truncated.length - 1;
      });
      applyHelpPanelState(entry);
    },
    [applyHelpPanelState]
  );

  const goHelpPanelBack = React.useCallback(() => {
    if (helpPanelHistoryIndex <= 0) {
      return;
    }
    const nextIndex = helpPanelHistoryIndex - 1;
    isApplyingHelpPanelHistoryRef.current = true;
    setHelpPanelHistoryIndex(nextIndex);
    applyHelpPanelState(helpPanelHistoryRef.current[nextIndex]);
    window.requestAnimationFrame(() => {
      isApplyingHelpPanelHistoryRef.current = false;
    });
  }, [helpPanelHistoryIndex, applyHelpPanelState]);

  const goHelpPanelForward = React.useCallback(() => {
    if (helpPanelHistoryIndex >= helpPanelHistoryRef.current.length - 1) {
      return;
    }
    const nextIndex = helpPanelHistoryIndex + 1;
    isApplyingHelpPanelHistoryRef.current = true;
    setHelpPanelHistoryIndex(nextIndex);
    applyHelpPanelState(helpPanelHistoryRef.current[nextIndex]);
    window.requestAnimationFrame(() => {
      isApplyingHelpPanelHistoryRef.current = false;
    });
  }, [helpPanelHistoryIndex, applyHelpPanelState]);

  const canHelpPanelGoBack = helpPanelHistoryIndex > 0;
  const canHelpPanelGoForward = helpPanelHistoryIndex < helpPanelHistoryRef.current.length - 1;

  React.useEffect(() => {
    if (isDrawerExpanded && !prevHelpDrawerExpandedRef.current) {
      if (helpPanelHistoryRef.current.length === 0) {
        helpPanelHistoryRef.current = [captureHelpPanelState()];
        setHelpPanelHistoryIndex(0);
      }
    }
    if (!isDrawerExpanded && prevHelpDrawerExpandedRef.current) {
      helpPanelHistoryRef.current = [];
      setHelpPanelHistoryIndex(0);
    }
    prevHelpDrawerExpandedRef.current = isDrawerExpanded;
  }, [isDrawerExpanded, captureHelpPanelState]);

  const selectHelpPanelSubTab = React.useCallback(
    (subTabIndex: number) => {
      navigateHelpPanel({
        subTab: subTabIndex,
        customHelpTitle: null,
        customHelpVariant: null,
        feedbackView: subTabIndex === 4 ? 'main' : feedbackView,
        searchQuery: ''
      });
    },
    [navigateHelpPanel, feedbackView]
  );

  const navigateFeedbackView = React.useCallback(
    (view: HelpPanelFeedbackView) => {
      navigateHelpPanel({
        subTab: 4,
        customHelpTitle: null,
        customHelpVariant: null,
        feedbackView: view,
        searchQuery
      });
    },
    [navigateHelpPanel, searchQuery]
  );

  const openDashboardWidgetsHelp = React.useCallback(() => {
    navigateHelpPanel({
      subTab: null,
      customHelpTitle: DASHBOARD_WIDGETS_HELP_CUSTOM_TITLE,
      customHelpVariant: 'in-page',
      feedbackView,
      searchQuery: ''
    });
    if (!isDrawerExpanded) {
      setIsDrawerExpanded(true);
    }
    if (isNotificationDrawerOpen) {
      setIsNotificationDrawerOpen(false);
    }
  }, [navigateHelpPanel, feedbackView, isDrawerExpanded, isNotificationDrawerOpen]);

  const onDrawerToggle = () => {
    const newDrawerState = !isDrawerExpanded;
    setIsDrawerExpanded(newDrawerState);
    
    // If opening the help drawer, close the notification drawer
    if (newDrawerState && isNotificationDrawerOpen) {
      setIsNotificationDrawerOpen(false);
    }
  };

  const onDrawerClose = () => {
    setIsDrawerExpanded(false);
  };

  const onNotificationDrawerToggle = () => {
    const newNotificationState = !isNotificationDrawerOpen;
    setIsNotificationDrawerOpen(newNotificationState);
    
    // If closing the notification drawer, also close the actions dropdown
    if (!newNotificationState) {
      setIsNotificationActionsOpen(false);
    }
    
    // If opening the notification drawer, close the help drawer
    if (newNotificationState && isDrawerExpanded) {
      setIsDrawerExpanded(false);
    }
  };

  const onNotificationDrawerClose = () => {
    setIsNotificationDrawerOpen(false);
    setIsNotificationActionsOpen(false); // Close actions dropdown when drawer closes
  };

  const openHelpPanelWithTab = React.useCallback(
    (title: string, options?: { variant?: 'quickstart' | 'in-page' }) => {
      const variant = options?.variant ?? 'in-page';
      navigateHelpPanel({
        subTab: variant === 'quickstart' ? 1 : null,
        customHelpTitle: title,
        customHelpVariant: variant,
        feedbackView,
        searchQuery: ''
      });

      if (!isDrawerExpanded) {
        setIsDrawerExpanded(true);
      }
      if (isNotificationDrawerOpen) {
        setIsNotificationDrawerOpen(false);
      }
    },
    [navigateHelpPanel, feedbackView, isDrawerExpanded, isNotificationDrawerOpen]
  );

  const openHelpPanelToShareGeneralFeedback = React.useCallback(() => {
    navigateHelpPanel({
      subTab: 4,
      customHelpTitle: null,
      customHelpVariant: null,
      feedbackView: 'general',
      searchQuery: ''
    });

    if (!isDrawerExpanded) {
      setIsDrawerExpanded(true);
    }
    if (isNotificationDrawerOpen) {
      setIsNotificationDrawerOpen(false);
    }
  }, [navigateHelpPanel, isDrawerExpanded, isNotificationDrawerOpen]);

  const createSearchHandlers = () => {
    const onSearchSubmit = (value: string) => {
      const trimmed = value.trim();
      if (trimmed) {
        setSearchQuery(trimmed);
        recordRecentSearch(trimmed);
      }
    };

    const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        onSearchSubmit((event.currentTarget as HTMLInputElement).value);
      }
    };

    const handleSearchClear = () => {
      setSearchQuery('');
    };

    return { onSearchSubmit, handleSearchKeyDown, handleSearchClear };
  };


  const onUserDropdownToggle = () => {
    setIsUserDropdownOpen(!isUserDropdownOpen);
  };

  const onUserDropdownSelect = () => {
    setIsUserDropdownOpen(false);
  };

  const onUtilitiesDropdownToggle = () => {
    setIsUtilitiesDropdownOpen(!isUtilitiesDropdownOpen);
  };

  const onUtilitiesDropdownSelect = () => {
    setIsUtilitiesDropdownOpen(false);
  };

  const onLogoDropdownSelect = () => {
    setIsLogoDropdownOpen(false);
  };

  const onSearchToggle = (event: React.SyntheticEvent<HTMLButtonElement>, isExpanded: boolean) => {
    setIsSearchExpanded(!isSearchExpanded);
    // Hide search results when collapsing, show top results when expanding
    if (isSearchExpanded) {
      setShowSearchResults(false);
      setSearchResults([]);
    } else {
      // Show top results when expanding and search is empty
      if (mastheadSearchValue.trim().length === 0) {
        setSearchResults(topResults);
        setShowSearchResults(true);
      }
    }
  };

  const onMastheadSearchChange = (_event: React.FormEvent<HTMLInputElement>, value: string) => {
    setMastheadSearchValue(value);
    
    // Show top results when search is empty, filtered results when typing
    if (value.trim().length === 0) {
      // Show top results when search is empty
      setSearchResults(topResults);
      setShowSearchResults(true);
    } else if (value.trim().length >= 2) {
      // Perform filtered search when user types (minimum 2 characters)
      const filteredResults = mockSearchData.filter(item =>
        item.title.toLowerCase().includes(value.toLowerCase()) ||
        item.description.toLowerCase().includes(value.toLowerCase()) ||
        item.category.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 6); // Limit to 6 results
      
      setSearchResults(filteredResults);
      setShowSearchResults(true);
    } else {
      // Hide results when typing 1 character (between empty and 2 chars)
      setSearchResults([]);
      setShowSearchResults(false);
    }
  };

  const onMastheadSearchClear = () => {
    setMastheadSearchValue('');
    // Show top results when clearing search (if expanded)
    if (isSearchExpanded) {
      setSearchResults(topResults);
      setShowSearchResults(true);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  };

  const renderHelpChatPanel = () => <HelpPanelChatbotPanel />;

  const renderCustomHelpByTitle = (title: string) => {
    if (title === 'Alert manager') {
      return (
        <div style={{ padding: '24px' }}>
          <Content>
            <Title headingLevel="h2" size="xl" style={{ marginBottom: '16px' }}>
              Alert Manager Help
            </Title>
            <p style={{ fontSize: '14px', lineHeight: '1.6', color: '#6a6e73' }}>
              This section provides information and guidance about using the Alert Manager feature. Configure alert default settings for your workspace and learn how fired events can alert users and groups through various communication channels.
            </p>
          </Content>
        </div>
      );
    }
    if (title === DASHBOARD_WIDGETS_HELP_CUSTOM_TITLE) {
      return <DashboardWidgetsHelpPanelContent />;
    }
    if (title === 'Configuring console event notifications in Slack') {
      return (
        <div style={{ padding: '24px' }}>
          <Content>
            <Title headingLevel="h2" size="xl" style={{ marginBottom: '16px' }}>
              Configuring console event notifications in Slack
            </Title>
            <p style={{ fontSize: '14px', lineHeight: '1.6', color: '#6a6e73', marginBottom: '24px' }}>
              Follow these steps to configure your console event notifications to be sent to Slack channels.
            </p>
            <Title headingLevel="h3" size="md" style={{ marginBottom: '12px', marginTop: '24px' }}>
              Prerequisites
            </Title>
            <ul style={{ fontSize: '14px', lineHeight: '1.8', color: '#6a6e73', marginBottom: '24px' }}>
              <li>Active Slack workspace with admin permissions</li>
              <li>Red Hat Hybrid Cloud Console account</li>
              <li>Webhook URL from your Slack workspace</li>
            </ul>
            <Title headingLevel="h3" size="md" style={{ marginBottom: '12px', marginTop: '24px' }}>
              Step 1: Create a Slack webhook
            </Title>
            <p style={{ fontSize: '14px', lineHeight: '1.6', color: '#6a6e73', marginBottom: '16px' }}>
              Navigate to your Slack workspace settings and create a new incoming webhook for the channel where you want to receive notifications.
            </p>
            <Title headingLevel="h3" size="md" style={{ marginBottom: '12px', marginTop: '24px' }}>
              Step 2: Configure integration in console
            </Title>
            <p style={{ fontSize: '14px', lineHeight: '1.6', color: '#6a6e73', marginBottom: '16px' }}>
              Go to Settings → Integrations and add a new Slack integration using your webhook URL.
            </p>
            <Title headingLevel="h3" size="md" style={{ marginBottom: '12px', marginTop: '24px' }}>
              Step 3: Configure notification rules
            </Title>
            <p style={{ fontSize: '14px', lineHeight: '1.6', color: '#6a6e73', marginBottom: '16px' }}>
              Set up which events should trigger Slack notifications in the Alert Manager settings.
            </p>
          </Content>
        </div>
      );
    }
    return (
      <div style={{ padding: '24px' }}>
        <Content>
          <Title headingLevel="h2" size="xl" style={{ marginBottom: '16px' }}>
            {title}
          </Title>
          <p style={{ fontSize: '14px', lineHeight: '1.6', color: '#6a6e73' }}>Help content for this topic.</p>
        </Content>
      </div>
    );
  };

  /**
   * Sentinel `activeKey` so no top tab matches (`eventKey` is 0–5 only). PatternFly leaves none selected;
   * we remount when crossing into/out of `null` so the tab underline accent resets.
   */
  const HELP_PANEL_TOP_TABS_NONE_KEY = -1;

  /** Static help subtabs — always at top of panel; selection mirrors `helpPanelSubTab` (null = none selected). */
  const renderHelpPanelTopTabs = () => {
    const isChatTabActive = helpPanelSubTab === 5;
    const mainTabsActiveKey =
      helpPanelSubTab !== null && !isChatTabActive ? helpPanelSubTab : HELP_PANEL_TOP_TABS_NONE_KEY;

    return (
      <div
        className="help-panel-top-tabs-strip"
        style={{
          flexShrink: 0,
          paddingTop: 'var(--pf-v6-global--spacer--xs)',
          paddingBottom: 'var(--pf-v6-global--spacer--xs)',
          paddingLeft: 'var(--pf-v6-global--spacer--sm)',
          paddingRight: 0,
          backgroundColor: 'var(--pf-v6-global--BackgroundColor--100)'
        }}
      >
        <div className="help-panel-top-tabs-row">
          <Tabs
            key={`hcc-help-top-${helpTopTabsMountKey}`}
            id="hcc-help-panel-top-tabs"
            className="help-panel-top-tabs-main"
            hasNoBorderBottom
            isOverflowHorizontal={{
              defaultTitleText: 'More',
              toggleAriaLabel: 'More help tabs',
              showTabCount: true,
              popperProps: {
                appendTo: () => document.body,
                zIndex: 9999
              }
            }}
            activeKey={mainTabsActiveKey}
            onSelect={(_event, key) => {
              if (key === HELP_PANEL_TOP_TABS_NONE_KEY) {
                return;
              }
              selectHelpPanelSubTab(typeof key === 'number' ? key : Number(key));
            }}
            aria-label="Help navigation"
          >
            <Tab
              eventKey={0}
              title={
                <TabTitleIcon>
                  <SearchIcon aria-label="Search" />
                </TabTitleIcon>
              }
              aria-label="Search sub tab"
            >
              <span className="pf-v6-u-screen-reader">Search</span>
            </Tab>
            <Tab eventKey={1} title={<TabTitleText>Learn</TabTitleText>} aria-label="Learn sub tab">
              <span className="pf-v6-u-screen-reader">Learn</span>
            </Tab>
            <Tab eventKey={2} title={<TabTitleText>APIs</TabTitleText>} aria-label="APIs sub tab">
              <span className="pf-v6-u-screen-reader">APIs</span>
            </Tab>
            <Tab eventKey={3} title={<TabTitleText>Support</TabTitleText>} aria-label="Support sub tab">
              <span className="pf-v6-u-screen-reader">Support</span>
            </Tab>
            <Tab eventKey={4} title={<TabTitleText>Feedback</TabTitleText>} aria-label="Feedback sub tab">
              <span className="pf-v6-u-screen-reader">Feedback</span>
            </Tab>
          </Tabs>
          <nav
            className="help-panel-chat-tab-pinned pf-v6-c-tabs pf-m-no-border-bottom"
            aria-label="Chat"
          >
            <ul className="pf-v6-c-tabs__list" role="presentation">
              <li
                className={`pf-v6-c-tabs__item help-panel-chat-tab${isChatTabActive ? ' pf-m-current' : ''}`}
                role="presentation"
              >
                <button
                  type="button"
                  role="tab"
                  className="pf-v6-c-tabs__link"
                  aria-selected={isChatTabActive}
                  aria-label="Chat sub tab"
                  onClick={() => selectHelpPanelSubTab(5)}
                >
                  <TabTitleIcon>
                    <img
                      src={HappyRobotIcon}
                      alt=""
                      aria-hidden
                      style={{
                        width: '24px',
                        height: 'auto',
                        aspectRatio: '1 / 1',
                        display: 'block',
                        objectFit: 'contain'
                      }}
                    />
                  </TabTitleIcon>
                  <span className="pf-v6-u-screen-reader">Chat</span>
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    );
  };

  const renderFindHelpSubTabs = () => {
    const { onSearchSubmit, handleSearchKeyDown, handleSearchClear } = createSearchHandlers();

    return (
      <div
        className="help-panel-inner-tabs-shell"
        style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
      >
      <Tabs
        activeKey={helpPanelSubTab ?? 0}
        onSelect={(_event, subTabIndex) => selectHelpPanelSubTab(subTabIndex as number)}
        aria-label="Find help sub tabs"
      >
      <Tab 
        eventKey={0} 
        title={<SearchIcon aria-label="Search" />}
        aria-label="Search sub tab"
      >
        <style>{`
          .learn-menu .pf-v6-c-menu {
            box-shadow: none !important;
            border: none !important;
            width: 100% !important;
          }
          .learn-menu .pf-v6-c-menu__list {
            padding: 0 !important;
          }
          .learn-menu .pf-v6-c-menu__list-item {
            width: 100% !important;
          }
          .learn-menu .pf-v6-c-menu__item-main {
            display: flex !important;
            align-items: flex-start !important;
            gap: 12px !important;
            padding-right: 0 !important;
          }
          .learn-menu .pf-v6-c-menu__item-text {
            padding-right: 0 !important;
          }
          .learn-menu .menu-item-content {
            display: flex;
            flex-direction: column;
            flex: 1;
            gap: 4px;
            min-width: 0;
            width: 100%;
          }
          .learn-menu .menu-item-title-row {
            display: flex;
            align-items: center;
            gap: 4px;
            min-width: 0;
          }
          .learn-menu .menu-item-title-row button {
            padding: 4px !important;
          }
          .learn-menu .menu-item-breadcrumb-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
          }
          .learn-menu .menu-item-title {
            color: var(--pf-v6-global--link--Color, #0066cc);
            cursor: pointer;
            text-decoration: none;
            flex: 1;
            min-width: 0;
            word-wrap: break-word;
            word-break: break-word;
          }
          .learn-menu .menu-item-title:hover {
            color: var(--pf-v6-global--link--Color--hover, #004080);
            text-decoration: underline;
          }
          .learn-menu .menu-item-label {
            pointer-events: none;
          }
          /* Hover effect for overflow label */
          .learn-menu .menu-item-label.overflow-label:hover {
            filter: brightness(0.85);
            transition: filter 0.2s ease;
          }
          /* Remove hover background on menu items - multiple selectors for specificity */
          .learn-menu .pf-v6-c-menu__list-item:hover,
          .learn-menu .pf-v6-c-menu__list-item:hover .pf-v6-c-menu__item,
          .learn-menu .pf-v6-c-menu__item:hover,
          .learn-menu .pf-v6-c-menu__item-main:hover,
          .learn-menu .pf-v6-c-menu__list-item:hover .pf-v6-c-menu__item-main {
            background-color: transparent !important;
          }
          /* Override PatternFly CSS variables for hover */
          .learn-menu .pf-v6-c-menu__list-item {
            --pf-v6-c-menu__list-item--hover--BackgroundColor: transparent !important;
          }
          .learn-menu .pf-v6-c-menu__item {
            --pf-v6-c-menu__item--hover--BackgroundColor: transparent !important;
          }
          /* Make the menu item itself non-clickable */
          .learn-menu .pf-v6-c-menu__item {
            pointer-events: none !important;
          }
          /* Re-enable pointer events for specific clickable elements */
          .learn-menu .pf-v6-c-menu__item button,
          .learn-menu .pf-v6-c-menu__item .menu-item-title {
            pointer-events: auto !important;
          }
          /* Bookmark icon colors */
          .learn-menu .bookmark-icon {
            color: var(--pf-t--global--icon--color--disabled, #6a6e73);
            transition: color 0.2s ease;
          }
          .learn-menu .bookmark-icon.bookmarked {
            color: var(--pf-t--global--color--brand--default, #0066cc);
          }
          /* Hide pagination options menu toggle */
          .learn-menu .pf-v6-c-pagination .pf-v6-c-menu-toggle.pf-m-plain.pf-m-text {
            display: none !important;
          }
          /* Ensure menu items can wrap */
          .learn-menu .pf-v6-c-menu__item {
            width: 100% !important;
            max-width: 100% !important;
          }
          .learn-menu .pf-v6-c-menu__item-text {
            width: 100% !important;
            max-width: 100% !important;
          }
          /* Fix dropdown content type menu styling */
          .pf-v6-c-dropdown .pf-v6-c-menu {
            box-shadow: none !important;
            border: none !important;
            --pf-v6-c-menu--BoxShadow: none !important;
          }
          .pf-v6-c-dropdown .pf-v6-c-menu__list {
            padding: 0 !important;
          }
          .pf-v6-c-dropdown .pf-v6-c-menu__content {
            box-shadow: none !important;
            --pf-v6-c-menu__content--BoxShadow: none !important;
          }
          /* Remove shadow from the dropdown popper/panel itself */
          .pf-v6-c-menu-toggle + .pf-v6-c-menu {
            box-shadow: var(--pf-v6-global--BoxShadow--md) !important;
          }
        `}</style>
        <div className="learn-menu">
          <div style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ flex: 1 }}>
              <SearchInput
                placeholder="Search documentation, APIs, and resources..."
                value={searchQuery}
                onChange={(_event, value) => setSearchQuery(value)}
                onClear={handleSearchClear}
                onKeyDown={handleSearchKeyDown}
                aria-label="Search help resources"
              />
            </div>
            {searchQuery.trim() && (
              <Dropdown
                isOpen={isSearchContentTypeOpen}
                onOpenChange={(isOpen: boolean) => setIsSearchContentTypeOpen(isOpen)}
                popperProps={{
                  position: 'right'
                }}
                toggle={(toggleRef: React.Ref<any>) => (
                  <MenuToggle
                    ref={toggleRef}
                    onClick={() => setIsSearchContentTypeOpen(!isSearchContentTypeOpen)}
                    isExpanded={isSearchContentTypeOpen}
                    badge={selectedSearchContentTypes.size > 0 ? <Badge isRead>{selectedSearchContentTypes.size}</Badge> : undefined}
                  >
                    Content type
                  </MenuToggle>
                )}
              >
                <Menu>
                  <MenuList>
                    <MenuItem itemId="services">
                      <Checkbox
                        id="search-content-type-services"
                        label="Services"
                        isChecked={selectedSearchContentTypes.has('services')}
                        onChange={() => toggleSearchContentType('services')}
                      />
                    </MenuItem>
                    <Divider component="li" />
                    <MenuGroup label="Learning resources">
                      <MenuItem itemId="documentation">
                        <Checkbox
                          id="search-content-type-documentation"
                          label="Documentation"
                          isChecked={selectedSearchContentTypes.has('documentation')}
                          onChange={() => toggleSearchContentType('documentation')}
                        />
                      </MenuItem>
                      <MenuItem itemId="quick-starts">
                        <Checkbox
                          id="search-content-type-quick-starts"
                          label="Quick starts"
                          isChecked={selectedSearchContentTypes.has('quick-starts')}
                          onChange={() => toggleSearchContentType('quick-starts')}
                        />
                      </MenuItem>
                      <MenuItem itemId="learning-paths">
                        <Checkbox
                          id="search-content-type-learning-paths"
                          label="Learning paths"
                          isChecked={selectedSearchContentTypes.has('learning-paths')}
                          onChange={() => toggleSearchContentType('learning-paths')}
                        />
                      </MenuItem>
                      <MenuItem itemId="other">
                        <Checkbox
                          id="search-content-type-other"
                          label="Other"
                          isChecked={selectedSearchContentTypes.has('other')}
                          onChange={() => toggleSearchContentType('other')}
                        />
                      </MenuItem>
                    </MenuGroup>
                    <Divider component="li" />
                    <MenuItem itemId="knowledgebase">
                      <Checkbox
                        id="search-content-type-knowledgebase"
                        label="Knowledgebase articles"
                        isChecked={selectedSearchContentTypes.has('knowledgebase')}
                        onChange={() => toggleSearchContentType('knowledgebase')}
                      />
                    </MenuItem>
                    <MenuItem itemId="api-documentation">
                      <Checkbox
                        id="search-content-type-api-documentation"
                        label="API documentation"
                        isChecked={selectedSearchContentTypes.has('api-documentation')}
                        onChange={() => toggleSearchContentType('api-documentation')}
                      />
                    </MenuItem>
                    <MenuItem itemId="support-cases">
                      <Checkbox
                        id="search-content-type-support-cases"
                        label="My open support cases"
                        isChecked={selectedSearchContentTypes.has('support-cases')}
                        onChange={() => toggleSearchContentType('support-cases')}
                      />
                    </MenuItem>
                  </MenuList>
                </Menu>
              </Dropdown>
            )}
          </div>
          {!searchQuery.trim() && (
            <div style={{ padding: '0 16px 16px 16px', fontSize: '14px', lineHeight: '1.5', color: 'var(--pf-v6-global--Color--200)' }}>
              Find documentation, quick starts, API documentation, knowledgebase articles, and open support tickets.
            </div>
          )}
          
          {searchQuery.trim() && selectedSearchContentTypes.size > 0 && (
            <div style={{ padding: '0 16px 16px 16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <LabelGroup numLabels={4}>
                {Array.from(selectedSearchContentTypes).map(contentType => (
                  <Label
                    key={contentType}
                    onClose={() => toggleSearchContentType(contentType)}
                  >
                    {getSearchContentTypeDisplayName(contentType)}
                  </Label>
                ))}
              </LabelGroup>
              <Button variant="link" onClick={clearAllSearchContentTypeFilters}>
                Clear all filters
              </Button>
            </div>
          )}

          {searchQuery.trim() ? (
            // Show search results when user is typing
            <>
              <div style={{ padding: '16px 16px 8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 'var(--pf-t--global--font--size--body--lg, 18px)', fontWeight: '400' }}>
                  Search results ({totalSearchResults})
                </span>
                <Pagination
                  itemCount={totalSearchResults}
                  perPage={searchPerPage}
                  page={searchPage}
                  onSetPage={(_event, pageNumber) => setSearchPage(pageNumber)}
                  onPerPageSelect={(_event, perPage) => {
                    setSearchPerPage(perPage);
                    setSearchPage(1);
                  }}
                  variant="top"
                  isCompact
                  toggleTemplate={() => <></>}
                />
              </div>
              {visibleSearchResults.length > 0 ? (
                <Menu>
                  <MenuList>
                    {visibleSearchResults.map((result, idx) => (
                      <React.Fragment key={result.id}>
                        {idx > 0 && <Divider component="li" />}
                        <MenuItem itemId={result.id}>
                          <div className="menu-item-content">
                            <div className="menu-item-title-row">
                              {result.breadcrumb1 === 'Learning resources' && (
                                <Button
                                  variant="plain"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleBookmark(result.id);
                                  }}
                                  aria-label="Bookmark"
                                  style={{ minWidth: 'auto' }}
                                >
                                  <BookmarkIcon className={`bookmark-icon ${bookmarkedItems.has(result.id) ? 'bookmarked' : ''}`} />
                                </Button>
                              )}
                              {result.id === 'help-dashboard-widgets' ? (
                                <div
                                  className="menu-item-title"
                                  onClick={() => openDashboardWidgetsHelp()}
                                  style={{ display: 'inline', flex: 1, cursor: 'pointer' }}
                                >
                                  {result.title}
                                </div>
                              ) : result.title === 'Configuring console event notifications in Slack' ? (
                                <div 
                                  className="menu-item-title"
                                  onClick={() => openHelpPanelWithTab('Configuring console event notifications in Slack', { variant: 'quickstart' })}
                                  style={{ display: 'inline', flex: 1, cursor: 'pointer' }}
                                >
                                  {result.title}
                                </div>
                              ) : (
                                <div className="menu-item-title">{result.title}</div>
                              )}
                            </div>
                            <div className="menu-item-breadcrumb-row">
                              <Breadcrumb>
                                <BreadcrumbItem>
                                  {getBreadcrumbIcon(result.breadcrumb1)}
                                  {result.breadcrumb1}
                                </BreadcrumbItem>
                                {result.breadcrumb2 && <BreadcrumbItem>{result.breadcrumb2}</BreadcrumbItem>}
                              </Breadcrumb>
                              <div style={{ display: 'flex', gap: '8px', flexWrap: 'nowrap', alignItems: 'center' }}>
                                {/* Show first 2 labels, then "(X) more" if needed */}
                                {result.labels.slice(0, 2).map((label, labelIdx) => (
                                  <Label key={labelIdx} className="menu-item-label" color="grey" isCompact>
                                    {label}
                                  </Label>
                                ))}
                                {result.labels.length > 2 && (
                                  <span style={{ display: 'inline-block' }}>
                                    <Tooltip
                                      content={result.labels.slice(2).join(', ')}
                                    >
                                      <Label 
                                        className="menu-item-label overflow-label" 
                                        color="grey" 
                                        isCompact 
                                        style={{ pointerEvents: 'auto', cursor: 'pointer' }}
                                      >
                                        ({result.labels.length - 2}) more
                                      </Label>
                                    </Tooltip>
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </MenuItem>
                      </React.Fragment>
                    ))}
                  </MenuList>
                </Menu>
              ) : (
                <div style={{ 
                  padding: '32px 16px', 
                  textAlign: 'center', 
                  color: 'var(--pf-v6-global--Color--200)',
                  fontSize: '14px'
                }}>
                  No results found for "{searchQuery}"
                </div>
              )}
              <div style={{ padding: '16px', borderTop: '1px solid var(--pf-v6-global--BorderColor--100)' }}>
                <Pagination
                  itemCount={totalSearchResults}
                  perPage={searchPerPage}
                  page={searchPage}
                  onSetPage={(_event, pageNumber) => setSearchPage(pageNumber)}
                  onPerPageSelect={(_event, perPage) => {
                    setSearchPerPage(perPage);
                    setSearchPage(1);
                  }}
                  variant="bottom"
                />
              </div>
            </>
          ) : (
            // Show recent searches and recommended content when not searching
            <>
              <div style={{ padding: '16px 16px 8px 16px' }}>
                <span style={{ fontSize: 'var(--pf-t--global--font--size--body--lg, 18px)', fontWeight: '400' }}>Recent search queries</span>
              </div>
              {recentSearches.length === 0 ? (
                <div style={{ 
                  padding: '32px 16px', 
                  textAlign: 'center', 
                  color: 'var(--pf-v6-global--Color--200)',
                  fontSize: '14px'
                }}>
                  No recent queries
                </div>
              ) : (
                <Menu>
                  <MenuList>
                    {recentSearches.map((search, idx) => (
                      <React.Fragment key={`recent-search-${idx}`}>
                        {idx > 0 && <Divider component="li" />}
                        <MenuItem
                          itemId={`recent-search-${idx}`}
                          onClick={() => {
                            setSearchQuery(search.query);
                            recordRecentSearch(search.query);
                          }}
                        >
                          <div className="menu-item-title" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {search.query}
                            <span style={{ color: 'var(--pf-v6-global--Color--200)', fontSize: '14px' }}>({search.count})</span>
                          </div>
                        </MenuItem>
                      </React.Fragment>
                    ))}
                  </MenuList>
                </Menu>
              )}
              <div style={{ padding: '16px 16px 8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <span style={{ fontSize: 'var(--pf-t--global--font--size--body--lg, 18px)', fontWeight: '400' }}>Recommended content</span>
                  {currentBundle ? (
                    <ToggleGroup aria-label="Scope filter" isCompact>
                      <ToggleGroupItem
                        text={currentBundle}
                        buttonId="scope-bundle"
                        isSelected={scopeFilter === 'bundle'}
                        onChange={() => setScopeFilter('bundle')}
                      />
                      <ToggleGroupItem
                        text="All"
                        buttonId="scope-all"
                        isSelected={scopeFilter === 'all'}
                        onChange={() => setScopeFilter('all')}
                      />
                    </ToggleGroup>
                  ) : (
                    <ToggleGroup aria-label="Scope filter" isCompact>
                      <ToggleGroupItem
                        text="All"
                        buttonId="scope-all"
                        isSelected={true}
                        onChange={() => {}}
                      />
                    </ToggleGroup>
                  )}
                </div>
              </div>
              <Menu>
            <MenuList>
              {(() => {
                // Select content based on scope filter
                const content = scopeFilter === 'all' || !currentBundle
                  ? recommendedContentAll
                  : recommendedContentSettings;
                
                // Sort alphabetically by title
                const sortedContent = [...content].sort((a, b) => a.title.localeCompare(b.title));
                
                return sortedContent.map((item, idx) => (
                  <React.Fragment key={item.id}>
                    {idx > 0 && <Divider component="li" />}
                    <MenuItem itemId={item.id}>
                      <div className="menu-item-content">
                        <div className="menu-item-title-row">
                          {item.breadcrumb1 === 'Learning resources' && (
                            <Button
                              variant="plain"
                              aria-label={bookmarkedItems.has(item.id) ? 'Remove bookmark' : 'Add bookmark'}
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleBookmark(item.id);
                              }}
                              style={{ padding: '4px', marginLeft: '-4px' }}
                            >
                              <BookmarkIcon className={`bookmark-icon ${bookmarkedItems.has(item.id) ? 'bookmarked' : ''}`} />
                            </Button>
                          )}
                          {item.title === 'Configuring console event notifications in Slack' ? (
                            <div 
                              className="menu-item-title"
                              onClick={() => openHelpPanelWithTab('Configuring console event notifications in Slack', { variant: 'quickstart' })}
                              style={{ display: 'inline', flex: 1, cursor: 'pointer' }}
                            >
                              {item.title}
                            </div>
                          ) : (
                            <a 
                              href={item.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="menu-item-title"
                              style={{ display: 'inline', flex: 1 }}
                            >
                              {item.title}
                              <ExternalLinkAltIcon style={{ width: '12px', height: '12px', verticalAlign: 'middle', marginLeft: '4px' }} />
                            </a>
                          )}
                        </div>
                        <div className="menu-item-breadcrumb-row">
                          <Breadcrumb>
                            <BreadcrumbItem>
                              {getBreadcrumbIcon(item.breadcrumb1)}
                              {item.breadcrumb1}
                            </BreadcrumbItem>
                            {item.breadcrumb2 && <BreadcrumbItem>{item.breadcrumb2}</BreadcrumbItem>}
                          </Breadcrumb>
                          {item.labels.length > 0 && (
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'nowrap', alignItems: 'center' }}>
                              {/* Show first 2 labels, then "(X) more" if needed */}
                              {item.labels.slice(0, 2).map((label, labelIdx) => (
                                <Label key={labelIdx} className="menu-item-label" color="grey" isCompact>
                                  {label}
                                </Label>
                              ))}
                              {item.labels.length > 2 && (
                                <span style={{ display: 'inline-block' }}>
                                  <Tooltip
                                    content={item.labels.slice(2).join(', ')}
                                  >
                                    <Label 
                                      className="menu-item-label overflow-label" 
                                      color="grey" 
                                      isCompact 
                                      style={{ pointerEvents: 'auto', cursor: 'pointer' }}
                                    >
                                      ({item.labels.length - 2}) more
                                    </Label>
                                  </Tooltip>
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </MenuItem>
                  </React.Fragment>
                ));
              })()}
            </MenuList>
          </Menu>
            </>
          )}
        </div>
      </Tab>
      <Tab 
        eventKey={1} 
        title={<TabTitleText>Learn</TabTitleText>}
        aria-label="Learn sub tab"
      >
        <style>{`
          .learn-menu .pf-v6-c-menu {
            box-shadow: none !important;
            border: none !important;
            width: 100% !important;
          }
          .learn-menu .pf-v6-c-menu__list {
            padding: 0 !important;
          }
          .learn-menu .pf-v6-c-menu__list-item {
            width: 100% !important;
          }
          .learn-menu .pf-v6-c-menu__item-main {
            display: flex !important;
            align-items: flex-start !important;
            gap: 12px !important;
            padding-right: 0 !important;
          }
          .learn-menu .pf-v6-c-menu__item-text {
            padding-right: 0 !important;
          }
          .learn-menu .menu-item-content {
            display: flex;
            flex-direction: column;
            flex: 1;
            gap: 4px;
            min-width: 0;
            width: 100%;
          }
          .learn-menu .menu-item-title-row {
            display: flex;
            align-items: center;
            gap: 4px;
            min-width: 0;
          }
          .learn-menu .menu-item-title-row button {
            padding: 4px !important;
          }
          .learn-menu .menu-item-breadcrumb-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
          }
          .learn-menu .menu-item-title {
            color: var(--pf-v6-global--link--Color, #0066cc);
            cursor: pointer;
            text-decoration: none;
            flex: 1;
            min-width: 0;
            word-wrap: break-word;
            word-break: break-word;
          }
          .learn-menu .menu-item-title:hover {
            color: var(--pf-v6-global--link--Color--hover, #004080);
            text-decoration: underline;
          }
          .learn-menu .menu-item-label {
            pointer-events: none;
          }
          /* Hover effect for overflow label */
          .learn-menu .menu-item-label.overflow-label:hover {
            filter: brightness(0.85);
            transition: filter 0.2s ease;
          }
          /* Remove hover background on menu items - multiple selectors for specificity */
          .learn-menu .pf-v6-c-menu__list-item:hover,
          .learn-menu .pf-v6-c-menu__list-item:hover .pf-v6-c-menu__item,
          .learn-menu .pf-v6-c-menu__item:hover,
          .learn-menu .pf-v6-c-menu__item-main:hover,
          .learn-menu .pf-v6-c-menu__list-item:hover .pf-v6-c-menu__item-main {
            background-color: transparent !important;
          }
          /* Override PatternFly CSS variables for hover */
          .learn-menu .pf-v6-c-menu__list-item {
            --pf-v6-c-menu__list-item--hover--BackgroundColor: transparent !important;
          }
          .learn-menu .pf-v6-c-menu__item {
            --pf-v6-c-menu__item--hover--BackgroundColor: transparent !important;
          }
          /* Make the menu item itself non-clickable */
          .learn-menu .pf-v6-c-menu__item {
            pointer-events: none !important;
          }
          /* Re-enable pointer events for specific clickable elements */
          .learn-menu .pf-v6-c-menu__item button,
          .learn-menu .pf-v6-c-menu__item .menu-item-title {
            pointer-events: auto !important;
          }
          /* Bookmark icon colors */
          .learn-menu .bookmark-icon {
            color: var(--pf-t--global--icon--color--disabled, #6a6e73);
            transition: color 0.2s ease;
          }
          .learn-menu .bookmark-icon.bookmarked {
            color: var(--pf-t--global--color--brand--default, #0066cc);
          }
          /* Hide pagination options menu toggle */
          .learn-menu .pf-v6-c-pagination .pf-v6-c-menu-toggle.pf-m-plain.pf-m-text {
            display: none !important;
          }
          /* Ensure menu items can wrap */
          .learn-menu .pf-v6-c-menu__item {
            width: 100% !important;
            max-width: 100% !important;
          }
          .learn-menu .pf-v6-c-menu__item-text {
            width: 100% !important;
            max-width: 100% !important;
          }
        `}</style>
        <div className="learn-menu">
          <div style={{ padding: '16px 16px 12px 16px', fontSize: '14px', lineHeight: '1.5', color: 'var(--pf-v6-global--Color--200)' }}>
            Find product documentation, quick starts, learning paths, knowledgebase articles, and more related to services on the Hybrid Cloud Console. For learning resources, browse the <a href="https://console.redhat.com/learning-resources?tab=all" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--pf-v6-global--link--Color, #0066cc)', textDecoration: 'none' }} onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'} onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}>All Learning Catalog</a>. For broader knowledgebase and support content, see the <a href="https://access.redhat.com/kb/search?document_kinds=Article&start=0&products=Red+Hat+Hybrid+Cloud+Console" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--pf-v6-global--link--Color, #0066cc)', textDecoration: 'none' }} onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'} onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}>Customer Portal</a>.
          </div>
          <div style={{ padding: '0 16px 16px 16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Dropdown
              isOpen={isContentTypeOpen}
              onOpenChange={(isOpen: boolean) => setIsContentTypeOpen(isOpen)}
              toggle={(toggleRef: React.Ref<any>) => (
                <MenuToggle
                  ref={toggleRef}
                  onClick={() => setIsContentTypeOpen(!isContentTypeOpen)}
                  isExpanded={isContentTypeOpen}
                  badge={selectedContentTypes.size > 0 ? <Badge isRead>{selectedContentTypes.size}</Badge> : undefined}
                >
                  Content type
                </MenuToggle>
              )}
            >
              <DropdownList>
                <DropdownItem>
                  <Checkbox
                    id="content-type-documentation"
                    label="Documentation"
                    isChecked={selectedContentTypes.has('documentation')}
                    onChange={() => toggleContentType('documentation')}
                  />
                </DropdownItem>
                <DropdownItem>
                  <Checkbox
                    id="content-type-quick-starts"
                    label="Quick starts"
                    isChecked={selectedContentTypes.has('quick-starts')}
                    onChange={() => toggleContentType('quick-starts')}
                  />
                </DropdownItem>
                <DropdownItem>
                  <Checkbox
                    id="content-type-learning-paths"
                    label="Learning paths"
                    isChecked={selectedContentTypes.has('learning-paths')}
                    onChange={() => toggleContentType('learning-paths')}
                  />
                </DropdownItem>
                <DropdownItem>
                  <Checkbox
                    id="content-type-other"
                    label="Other"
                    isChecked={selectedContentTypes.has('other')}
                    onChange={() => toggleContentType('other')}
                  />
                </DropdownItem>
              </DropdownList>
            </Dropdown>
            <Checkbox
              id="show-bookmarked-only"
              label="Show bookmarked only"
              isChecked={showBookmarkedOnly}
              onChange={(_event, checked) => setShowBookmarkedOnly(checked)}
            />
          </div>
          {selectedContentTypes.size > 0 && (
            <div style={{ padding: '0 16px 16px 16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <LabelGroup numLabels={4}>
                {Array.from(selectedContentTypes).map(contentType => (
                  <Label
                    key={contentType}
                    color="blue"
                    onClose={() => toggleContentType(contentType)}
                  >
                    {getContentTypeDisplayName(contentType)}
                  </Label>
                ))}
              </LabelGroup>
              <Button
                variant="link"
                isInline
                onClick={clearAllContentTypeFilters}
              >
                Clear all filters
              </Button>
            </div>
          )}
          <div style={{ padding: '16px 16px 8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span style={{ fontSize: 'var(--pf-t--global--font--size--body--lg, 18px)', fontWeight: '400' }}>
                Learning resources ({scopeFilter === 'bundle' && currentBundle ? allLearnContent.filter(item => item.labels.includes(currentBundle)).length : allLearnContent.length})
              </span>
              {currentBundle ? (
                <ToggleGroup aria-label="Scope filter" isCompact>
                  <ToggleGroupItem
                    text={currentBundle}
                    buttonId="scope-bundle"
                    isSelected={scopeFilter === 'bundle'}
                    onChange={() => setScopeFilter('bundle')}
                  />
                  <ToggleGroupItem
                    text="All"
                    buttonId="scope-all"
                    isSelected={scopeFilter === 'all'}
                    onChange={() => setScopeFilter('all')}
                  />
                </ToggleGroup>
              ) : (
                <ToggleGroup aria-label="Scope filter" isCompact>
                  <ToggleGroupItem
                    text="All"
                    buttonId="scope-all"
                    isSelected={true}
                    onChange={() => {}}
                  />
                </ToggleGroup>
              )}
            </div>
            <Pagination
              itemCount={scopeFilter === 'bundle' && currentBundle ? allLearnContent.filter(item => item.labels.includes(currentBundle)).length : allLearnContent.length}
              perPage={perPage}
              page={page}
              onSetPage={(_event, pageNumber) => setPage(pageNumber)}
              onPerPageSelect={(_event, perPage) => setPerPage(perPage)}
              variant="top"
              isCompact
              toggleTemplate={() => <></>}
            />
          </div>
          <Menu>
            <MenuList>
              {/* Dynamic filtering based on bundle selection */}
              {(() => {
                // Filter content based on bundle selection
                const filteredContent = scopeFilter === 'bundle' && currentBundle
                  ? allLearnContent.filter(item => item.labels.includes(currentBundle))
                  : allLearnContent;
                
                // Sort alphabetically
                const sortedContent = [...filteredContent].sort((a, b) => a.title.localeCompare(b.title));
                
                // Pagination: show only items for current page (10 per page)
                const startIdx = (page - 1) * perPage;
                const endIdx = startIdx + perPage;
                const paginatedContent = sortedContent.slice(startIdx, endIdx);
                
                return paginatedContent.map((item, idx) => (
                  <React.Fragment key={item.id}>
                    {idx > 0 && <Divider component="li" />}
                    <MenuItem itemId={item.id}>
                      <div className="menu-item-content">
                        <div className="menu-item-title-row">
                          <Button
                            variant="plain"
                            aria-label={bookmarkedItems.has(item.id) ? 'Remove bookmark' : 'Add bookmark'}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleBookmark(item.id);
                            }}
                            style={{ padding: '4px', marginLeft: '-4px' }}
                          >
                            <BookmarkIcon className={`bookmark-icon ${bookmarkedItems.has(item.id) ? 'bookmarked' : ''}`} />
                          </Button>
                          {item.title === 'Configuring console event notifications in Slack' ? (
                            <div 
                              className="menu-item-title"
                              onClick={() => openHelpPanelWithTab('Configuring console event notifications in Slack', { variant: 'quickstart' })}
                              style={{ display: 'inline', flex: 1, cursor: 'pointer' }}
                            >
                              {item.title}
                            </div>
                          ) : (
                            <div className="menu-item-title">{item.title}</div>
                          )}
                        </div>
                        <div className="menu-item-breadcrumb-row">
                          <Breadcrumb>
                            <BreadcrumbItem>
                              {getBreadcrumbIcon(item.breadcrumb1)}
                              {item.breadcrumb1}
                            </BreadcrumbItem>
                            <BreadcrumbItem>{item.breadcrumb2}</BreadcrumbItem>
                          </Breadcrumb>
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'nowrap', alignItems: 'center' }}>
                            {/* Show first 2 labels, then "(X) more" if needed */}
                            {item.labels.slice(0, 2).map((label, labelIdx) => (
                              <Label key={labelIdx} className="menu-item-label" color="grey" isCompact>
                                {label}
                              </Label>
                            ))}
                            {item.labels.length > 2 && (
                              <span style={{ display: 'inline-block' }}>
                                <Tooltip
                                  content={item.labels.slice(2).join(', ')}
                                >
                                  <Label 
                                    className="menu-item-label overflow-label" 
                                    color="grey" 
                                    isCompact 
                                    style={{ pointerEvents: 'auto', cursor: 'pointer' }}
                                  >
                                    ({item.labels.length - 2}) more
                                  </Label>
                                </Tooltip>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </MenuItem>
                  </React.Fragment>
                ));
              })()}
            </MenuList>
          </Menu>
          <div style={{ padding: '16px', borderTop: '1px solid var(--pf-v6-global--BorderColor--100)' }}>
            <Pagination
              itemCount={scopeFilter === 'bundle' && currentBundle ? allLearnContent.filter(item => item.labels.includes(currentBundle)).length : allLearnContent.length}
              perPage={perPage}
              page={page}
              onSetPage={(_event, pageNumber) => setPage(pageNumber)}
              onPerPageSelect={(_event, perPage) => setPerPage(perPage)}
              variant="bottom"
            />
          </div>
          <Divider inset={{ default: 'insetNone' }} />
          <div style={{ padding: '16px 16px 8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span style={{ fontSize: 'var(--pf-t--global--font--size--body--lg, 18px)', fontWeight: '400' }}>
                Knowledgebase articles ({scopeFilter === 'bundle' && currentBundle ? allKnowledgebaseContent.filter(item => item.labels.includes(currentBundle)).length : allKnowledgebaseContent.length})
              </span>
              {currentBundle ? (
                <ToggleGroup aria-label="Knowledgebase scope filter" isCompact>
                  <ToggleGroupItem
                    text={currentBundle}
                    buttonId="kb-scope-bundle"
                    isSelected={scopeFilter === 'bundle'}
                    onChange={() => setScopeFilter('bundle')}
                  />
                  <ToggleGroupItem
                    text="All"
                    buttonId="kb-scope-all"
                    isSelected={scopeFilter === 'all'}
                    onChange={() => setScopeFilter('all')}
                  />
                </ToggleGroup>
              ) : (
                <ToggleGroup aria-label="Knowledgebase scope filter" isCompact>
                  <ToggleGroupItem
                    text="All"
                    buttonId="kb-scope-all-only"
                    isSelected={true}
                    onChange={() => {}}
                  />
                </ToggleGroup>
              )}
            </div>
            <Pagination
              itemCount={scopeFilter === 'bundle' && currentBundle ? allKnowledgebaseContent.filter(item => item.labels.includes(currentBundle)).length : allKnowledgebaseContent.length}
              perPage={kbPerPage}
              page={kbPage}
              onSetPage={(_event, pageNumber) => setKbPage(pageNumber)}
              onPerPageSelect={(_event, p) => setKbPerPage(p)}
              variant="top"
              isCompact
              toggleTemplate={() => <></>}
            />
          </div>
          <Menu>
            <MenuList>
              {(() => {
                const filteredKb = scopeFilter === 'bundle' && currentBundle
                  ? allKnowledgebaseContent.filter(item => item.labels.includes(currentBundle))
                  : allKnowledgebaseContent;
                const sortedKb = [...filteredKb].sort((a, b) => a.title.localeCompare(b.title));
                const kbStart = (kbPage - 1) * kbPerPage;
                const kbEnd = kbStart + kbPerPage;
                const paginatedKb = sortedKb.slice(kbStart, kbEnd);
                return paginatedKb.map((item, idx) => (
                  <React.Fragment key={item.id}>
                    {idx > 0 && <Divider component="li" />}
                    <MenuItem itemId={item.id}>
                      <div className="menu-item-content">
                        <div className="menu-item-title-row">
                          <div className="menu-item-title">{item.title}</div>
                        </div>
                        <div className="menu-item-breadcrumb-row">
                          <Breadcrumb>
                            <BreadcrumbItem>
                              {getBreadcrumbIcon(item.breadcrumb1)}
                              {item.breadcrumb1}
                            </BreadcrumbItem>
                          </Breadcrumb>
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'nowrap', alignItems: 'center' }}>
                            {item.labels.slice(0, 2).map((label, labelIdx) => (
                              <Label key={labelIdx} className="menu-item-label" color="grey" isCompact>
                                {label}
                              </Label>
                            ))}
                            {item.labels.length > 2 && (
                              <span style={{ display: 'inline-block' }}>
                                <Tooltip content={item.labels.slice(2).join(', ')}>
                                  <Label
                                    className="menu-item-label overflow-label"
                                    color="grey"
                                    isCompact
                                    style={{ pointerEvents: 'auto', cursor: 'pointer' }}
                                  >
                                    ({item.labels.length - 2}) more
                                  </Label>
                                </Tooltip>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </MenuItem>
                  </React.Fragment>
                ));
              })()}
            </MenuList>
          </Menu>
          <div style={{ padding: '16px', borderTop: '1px solid var(--pf-v6-global--BorderColor--100)' }}>
            <Pagination
              itemCount={scopeFilter === 'bundle' && currentBundle ? allKnowledgebaseContent.filter(item => item.labels.includes(currentBundle)).length : allKnowledgebaseContent.length}
              perPage={kbPerPage}
              page={kbPage}
              onSetPage={(_event, pageNumber) => setKbPage(pageNumber)}
              onPerPageSelect={(_event, p) => setKbPerPage(p)}
              variant="bottom"
            />
          </div>
        </div>
      </Tab>
      <Tab 
        eventKey={2} 
        title={<TabTitleText>APIs</TabTitleText>}
        aria-label="APIs sub tab"
      >
        <style>{`
          .learn-menu .pf-v6-c-menu {
            box-shadow: none !important;
            border: none !important;
            width: 100% !important;
          }
          .learn-menu .pf-v6-c-menu__list {
            padding: 0 !important;
          }
          .learn-menu .pf-v6-c-menu__list-item {
            width: 100% !important;
          }
          .learn-menu .pf-v6-c-menu__item-main {
            display: flex !important;
            align-items: flex-start !important;
            gap: 12px !important;
            padding-right: 0 !important;
          }
          .learn-menu .pf-v6-c-menu__item-text {
            padding-right: 0 !important;
          }
          .learn-menu .menu-item-content {
            display: flex;
            flex-direction: column;
            flex: 1;
            gap: 4px;
            min-width: 0;
            width: 100%;
          }
          .learn-menu .menu-item-title-row {
            display: flex;
            align-items: center;
            gap: 4px;
            min-width: 0;
          }
          .learn-menu .menu-item-title-row button {
            padding: 4px !important;
          }
          .learn-menu .menu-item-breadcrumb-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
          }
          .learn-menu .menu-item-title {
            color: var(--pf-v6-global--link--Color, #0066cc);
            cursor: pointer;
            text-decoration: none;
            flex: 1;
            min-width: 0;
            word-wrap: break-word;
            word-break: break-word;
          }
          .learn-menu .menu-item-title:hover {
            color: var(--pf-v6-global--link--Color--hover, #004080);
            text-decoration: underline;
          }
          .learn-menu .menu-item-label {
            pointer-events: none;
          }
          .learn-menu .menu-item-label.overflow-label:hover {
            filter: brightness(0.85);
            transition: filter 0.2s ease;
          }
          /* Remove hover background on menu items - multiple selectors for specificity */
          .learn-menu .pf-v6-c-menu__list-item:hover,
          .learn-menu .pf-v6-c-menu__list-item:hover .pf-v6-c-menu__item,
          .learn-menu .pf-v6-c-menu__item:hover,
          .learn-menu .pf-v6-c-menu__item-main:hover,
          .learn-menu .pf-v6-c-menu__list-item:hover .pf-v6-c-menu__item-main {
            background-color: transparent !important;
          }
          /* Override PatternFly CSS variables for hover */
          .learn-menu .pf-v6-c-menu__list-item {
            --pf-v6-c-menu__list-item--hover--BackgroundColor: transparent !important;
          }
          .learn-menu .pf-v6-c-menu__item {
            --pf-v6-c-menu__item--hover--BackgroundColor: transparent !important;
          }
          /* Make the menu item itself non-clickable */
          .learn-menu .pf-v6-c-menu__item {
            pointer-events: none !important;
          }
          /* Re-enable pointer events for specific clickable elements */
          .learn-menu .pf-v6-c-menu__item button,
          .learn-menu .pf-v6-c-menu__item .menu-item-title {
            pointer-events: auto !important;
          }
          /* Bookmark icon colors */
          .learn-menu .bookmark-icon {
            color: var(--pf-t--global--icon--color--disabled, #6a6e73);
            transition: color 0.2s ease;
          }
          .learn-menu .bookmark-icon.bookmarked {
            color: var(--pf-t--global--color--brand--default, #0066cc);
          }
          /* Hide pagination options menu toggle */
          .learn-menu .pf-v6-c-pagination .pf-v6-c-menu-toggle.pf-m-plain.pf-m-text {
            display: none !important;
          }
          /* Ensure menu items can wrap */
          .learn-menu .pf-v6-c-menu__item {
            width: 100% !important;
            max-width: 100% !important;
          }
          .learn-menu .pf-v6-c-menu__item-text {
            width: 100% !important;
            max-width: 100% !important;
          }
        `}</style>
        <div className="learn-menu">
          <div style={{ padding: '16px 16px 12px 16px', fontSize: '14px', lineHeight: '1.5', color: 'var(--pf-v6-global--Color--200)' }}>
            Browse the APIs for Hybrid Cloud Console services. See full API documentation on the <a href="https://developers.redhat.com/api-catalog/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--pf-v6-global--link--Color, #0066cc)', textDecoration: 'none' }} onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'} onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}>API documentation catalog</a>.
          </div>
          <div style={{ padding: '16px 16px 8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              {(() => {
                const filteredContent = scopeFilter === 'bundle' && currentBundle
                  ? allApisContent.filter(item => item.labels.includes(currentBundle))
                  : allApisContent;
                
                return <span style={{ fontSize: 'var(--pf-t--global--font--size--body--lg, 18px)', fontWeight: '400' }}>API documentation ({filteredContent.length})</span>;
              })()}
              {currentBundle ? (
                <ToggleGroup aria-label="Scope filter" isCompact>
                  <ToggleGroupItem
                    text={currentBundle}
                    buttonId="scope-bundle"
                    isSelected={scopeFilter === 'bundle'}
                    onChange={() => setScopeFilter('bundle')}
                  />
                  <ToggleGroupItem
                    text="All"
                    buttonId="scope-all"
                    isSelected={scopeFilter === 'all'}
                    onChange={() => setScopeFilter('all')}
                  />
                </ToggleGroup>
              ) : (
                <ToggleGroup aria-label="Scope filter" isCompact>
                  <ToggleGroupItem
                    text="All"
                    buttonId="scope-all"
                    isSelected={true}
                    onChange={() => {}}
                  />
                </ToggleGroup>
              )}
            </div>
            {(() => {
              const filteredContent = scopeFilter === 'bundle' && currentBundle
                ? allApisContent.filter(item => item.labels.includes(currentBundle))
                : allApisContent;
              
              return (
                <Pagination
                  itemCount={filteredContent.length}
                  perPage={perPage}
                  page={page}
                  onSetPage={(_event, pageNumber) => setPage(pageNumber)}
                  onPerPageSelect={(_event, perPage) => setPerPage(perPage)}
                  variant="top"
                  isCompact
                  toggleTemplate={() => <></>}
                />
              );
            })()}
          </div>
          <Menu>
            <MenuList>
              {(() => {
                const filteredContent = scopeFilter === 'bundle' && currentBundle
                  ? allApisContent.filter(item => item.labels.includes(currentBundle))
                  : allApisContent;
                
                const sortedContent = [...filteredContent].sort((a, b) => a.title.localeCompare(b.title));
                
                // Pagination: show only 10 items per page
                const startIdx = (page - 1) * perPage;
                const endIdx = startIdx + perPage;
                const paginatedContent = sortedContent.slice(startIdx, endIdx);
                
                return paginatedContent.map((item, idx) => (
                  <React.Fragment key={item.id}>
                    {idx > 0 && <Divider component="li" />}
                    <MenuItem itemId={item.id}>
                      <div className="menu-item-content">
                        <div className="menu-item-title-row">
                          <div className="menu-item-title">{item.title}</div>
                        </div>
                        <div className="menu-item-breadcrumb-row">
                          <Breadcrumb>
                            <BreadcrumbItem>
                              {getBreadcrumbIcon(item.breadcrumb1)}
                              {item.breadcrumb1}
                            </BreadcrumbItem>
                          </Breadcrumb>
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'nowrap', alignItems: 'center' }}>
                            {/* Show first 2 labels, then "(X) more" if needed */}
                            {item.labels.slice(0, 2).map((label, labelIdx) => (
                              <Label key={labelIdx} className="menu-item-label" color="grey" isCompact>
                                {label}
                              </Label>
                            ))}
                            {item.labels.length > 2 && (
                              <span style={{ display: 'inline-block' }}>
                                <Tooltip
                                  content={item.labels.slice(2).join(', ')}
                                >
                                  <Label 
                                    className="menu-item-label overflow-label" 
                                    color="grey" 
                                    isCompact 
                                    style={{ pointerEvents: 'auto', cursor: 'pointer' }}
                                  >
                                    ({item.labels.length - 2}) more
                                  </Label>
                                </Tooltip>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </MenuItem>
                  </React.Fragment>
                ));
              })()}
            </MenuList>
          </Menu>
          <div style={{ padding: '16px', borderTop: '1px solid var(--pf-v6-global--BorderColor--100)' }}>
            {(() => {
              const filteredContent = scopeFilter === 'bundle' && currentBundle
                ? allApisContent.filter(item => item.labels.includes(currentBundle))
                : allApisContent;
              
              return (
                <Pagination
                  itemCount={filteredContent.length}
                  perPage={perPage}
                  page={page}
                  onSetPage={(_event, pageNumber) => setPage(pageNumber)}
                  onPerPageSelect={(_event, perPage) => setPerPage(perPage)}
                  variant="bottom"
                />
              );
            })()}
          </div>
        </div>
      </Tab>
      <Tab 
        eventKey={3} 
        title={<TabTitleText>Support</TabTitleText>}
        aria-label="Support sub tab"
      >
        <style>{`
          .learn-menu .pf-v6-c-menu {
            box-shadow: none !important;
            border: none !important;
            width: 100% !important;
          }
          .learn-menu .pf-v6-c-menu__list {
            padding: 0 !important;
          }
          .learn-menu .pf-v6-c-menu__list-item {
            width: 100% !important;
          }
          .learn-menu .pf-v6-c-menu__item-main {
            display: flex !important;
            align-items: flex-start !important;
            gap: 12px !important;
            padding-right: 0 !important;
          }
          .learn-menu .pf-v6-c-menu__item-text {
            padding-right: 0 !important;
          }
          .learn-menu .menu-item-content {
            display: flex;
            flex-direction: column;
            flex: 1;
            gap: 4px;
            min-width: 0;
            width: 100%;
          }
          .learn-menu .menu-item-title-row {
            display: flex;
            align-items: center;
            gap: 4px;
            min-width: 0;
          }
          .learn-menu .menu-item-title-row button {
            padding: 4px !important;
          }
          .learn-menu .menu-item-breadcrumb-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
          }
          .learn-menu .menu-item-title {
            color: var(--pf-v6-global--link--Color, #0066cc);
            cursor: pointer;
            text-decoration: none;
            flex: 1;
            min-width: 0;
            word-wrap: break-word;
            word-break: break-word;
          }
          .learn-menu .menu-item-title:hover {
            color: var(--pf-v6-global--link--Color--hover, #004080);
            text-decoration: underline;
          }
          .learn-menu .menu-item-label {
            pointer-events: none;
          }
          /* Remove hover background on menu items - multiple selectors for specificity */
          .learn-menu .pf-v6-c-menu__list-item:hover,
          .learn-menu .pf-v6-c-menu__list-item:hover .pf-v6-c-menu__item,
          .learn-menu .pf-v6-c-menu__item:hover,
          .learn-menu .pf-v6-c-menu__item-main:hover,
          .learn-menu .pf-v6-c-menu__list-item:hover .pf-v6-c-menu__item-main {
            background-color: transparent !important;
          }
          /* Override PatternFly CSS variables for hover */
          .learn-menu .pf-v6-c-menu__list-item {
            --pf-v6-c-menu__list-item--hover--BackgroundColor: transparent !important;
          }
          .learn-menu .pf-v6-c-menu__item {
            --pf-v6-c-menu__item--hover--BackgroundColor: transparent !important;
          }
          /* Make the menu item itself non-clickable */
          .learn-menu .pf-v6-c-menu__item {
            pointer-events: none !important;
          }
          /* Re-enable pointer events for specific clickable elements */
          .learn-menu .pf-v6-c-menu__item button,
          .learn-menu .pf-v6-c-menu__item .menu-item-title {
            pointer-events: auto !important;
          }
          /* Bookmark icon colors */
          .learn-menu .bookmark-icon {
            color: var(--pf-t--global--icon--color--disabled, #6a6e73);
            transition: color 0.2s ease;
          }
          .learn-menu .bookmark-icon.bookmarked {
            color: var(--pf-t--global--color--brand--default, #0066cc);
          }
          /* Hide pagination options menu toggle */
          .learn-menu .pf-v6-c-pagination .pf-v6-c-menu-toggle.pf-m-plain.pf-m-text {
            display: none !important;
          }
          /* Ensure menu items can wrap */
          .learn-menu .pf-v6-c-menu__item {
            width: 100% !important;
            max-width: 100% !important;
          }
          .learn-menu .pf-v6-c-menu__item-text {
            width: 100% !important;
            max-width: 100% !important;
          }
        `}</style>
        <div className="learn-menu">
          <div style={{ padding: '16px 16px 12px 16px', fontSize: '14px', lineHeight: '1.5', color: 'var(--pf-v6-global--Color--200)' }}>
            Quickly see the status on all of your open support cases. To manage support case or open a new one, visit the{' '}
            <a 
              href="#" 
              onClick={(e) => {
                e.preventDefault();
                loadSupportTickets();
              }}
              style={{ color: 'var(--pf-v6-global--link--Color, #0066cc)', textDecoration: 'none', cursor: 'pointer' }} 
              onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'} 
              onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
            >
              Customer Portal
            </a>.
          </div>
          
          {supportTicketsLoading ? (
            <div style={{ padding: '64px 16px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <Spinner size="xl" aria-label="Loading support tickets" />
            </div>
          ) : supportTickets.length > 0 ? (
            <>
              <div style={{ padding: '16px 16px 8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 'var(--pf-t--global--font--size--body--lg, 18px)', fontWeight: '400' }}>My open support cases ({supportTickets.length})</span>
              </div>
              <Menu>
                <MenuList>
                  {supportTickets.map((ticket, idx) => (
                    <React.Fragment key={ticket.id}>
                      {idx > 0 && <Divider component="li" />}
                      <MenuItem itemId={ticket.id}>
                        <div className="menu-item-content">
                          <div className="menu-item-title-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, minWidth: 0 }}>
                              <span className="menu-item-title" style={{ display: 'inline' }}>
                                {ticket.title}
                                <ExternalLinkAltIcon style={{ width: '12px', height: '12px', verticalAlign: 'middle', marginLeft: '6px', color: 'var(--pf-v6-global--link--Color, #0066cc)' }} />
                              </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', marginLeft: '16px' }}>
                              {ticket.status === 'waiting-red-hat' ? (
                                <>
                                  <span style={{ fontSize: '14px', color: 'var(--pf-v6-global--Color--200)' }}>Waiting on Red Hat</span>
                                  <InProgressIcon style={{ width: '14px', height: '14px', color: '#151515' }} />
                                </>
                              ) : (
                                <>
                                  <span style={{ fontSize: '14px', color: 'var(--pf-v6-global--Color--200)' }}>Waiting on customer</span>
                                  <BellIcon style={{ width: '14px', height: '14px', color: '#6753AC' }} />
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </MenuItem>
                    </React.Fragment>
                  ))}
                </MenuList>
              </Menu>
            </>
          ) : (
            <div style={{ padding: '64px 16px' }}>
              <EmptyState>
                <Title headingLevel="h4" size="lg">
                  No open support tickets filed by you.
                </Title>
              </EmptyState>
            </div>
          )}
        </div>
      </Tab>
      <Tab 
        eventKey={4} 
        title={<TabTitleText>Feedback</TabTitleText>}
        aria-label="Feedback sub tab"
      >
        {(() => {
          if (feedbackView === 'general') {
            return (
              <div style={{ padding: '16px 16px 24px 16px' }}>
                <Breadcrumb style={{ marginBottom: '16px' }}>
                  <BreadcrumbItem>
                    <a 
                      href="#" 
                      onClick={(e) => { e.preventDefault(); navigateFeedbackView('main'); }}
                      style={{ color: 'var(--pf-v6-global--link--Color, #0066cc)', textDecoration: 'none' }}
                      onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                      onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                    >
                      Share feedback
                    </a>
                  </BreadcrumbItem>
                  <BreadcrumbItem isActive>Share general feedback</BreadcrumbItem>
                </Breadcrumb>
                <div style={{ fontSize: '14px', lineHeight: '1.5', color: 'var(--pf-v6-global--Color--200)' }}>
                  [Content for Share general feedback will go here]
                </div>
              </div>
            );
          }

          if (feedbackView === 'bug') {
            return (
              <div style={{ padding: '16px 16px 24px 16px' }}>
                <Breadcrumb style={{ marginBottom: '16px' }}>
                  <BreadcrumbItem>
                    <a 
                      href="#" 
                      onClick={(e) => { e.preventDefault(); navigateFeedbackView('main'); }}
                      style={{ color: 'var(--pf-v6-global--link--Color, #0066cc)', textDecoration: 'none' }}
                      onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                      onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                    >
                      Share feedback
                    </a>
                  </BreadcrumbItem>
                  <BreadcrumbItem isActive>Report a bug</BreadcrumbItem>
                </Breadcrumb>
                <div style={{ fontSize: '14px', lineHeight: '1.5', color: 'var(--pf-v6-global--Color--200)' }}>
                  [Content for Report a bug will go here]
                </div>
              </div>
            );
          }

          if (feedbackView === 'direction') {
            return (
              <div style={{ padding: '16px 16px 24px 16px' }}>
                <Breadcrumb style={{ marginBottom: '16px' }}>
                  <BreadcrumbItem>
                    <a 
                      href="#" 
                      onClick={(e) => { e.preventDefault(); navigateFeedbackView('main'); }}
                      style={{ color: 'var(--pf-v6-global--link--Color, #0066cc)', textDecoration: 'none' }}
                      onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                      onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                    >
                      Share feedback
                    </a>
                  </BreadcrumbItem>
                  <BreadcrumbItem isActive>Inform the direction of Red Hat</BreadcrumbItem>
                </Breadcrumb>
                <div style={{ fontSize: '14px', lineHeight: '1.5', color: 'var(--pf-v6-global--Color--200)' }}>
                  [Content for Inform the direction of Red Hat will go here]
                </div>
              </div>
            );
          }

          // Main view
          return (
            <div style={{ padding: '16px 16px 24px 16px' }}>
              <style>{`
                .feedback-card {
                  cursor: pointer !important;
                }
                .feedback-card:hover {
                  border-color: #0066cc !important;
                  border-width: 2px !important;
                  border-style: solid !important;
                }
                .feedback-card.pf-v6-c-card:hover {
                  --pf-v6-c-card--BorderColor: #0066cc !important;
                  --pf-v6-c-card--BorderWidth: 2px !important;
                }
              `}</style>
              <div style={{ fontSize: '14px', lineHeight: '1.5', color: 'var(--pf-v6-global--Color--200)', marginBottom: '24px' }}>
                Help us improve the Red Hat Hybrid Cloud Console by sharing your experience. For urgent issues, <a href="https://access.redhat.com/support/cases/#/case/new/get-support?" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--pf-v6-global--link--Color, #0066cc)', textDecoration: 'none' }} onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'} onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}>open a support case</a>.
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '800px' }}>
                {/* Card 1 */}
                <Card 
                  className="feedback-card"
                  variant="secondary"
                  isClickable 
                  isSelectable
                  onClick={() => navigateFeedbackView('general')}
                  style={{ cursor: 'pointer' }}
                >
                  <CardHeader style={{ paddingBottom: '8px' }}>
                    <img 
                      src={FeedbackIcon} 
                      alt="Share general feedback" 
                      style={{ 
                        height: '48px',
                        width: 'auto',
                        display: 'block'
                      }} 
                    />
                  </CardHeader>
                  <CardTitle style={{ paddingTop: 0 }}>Share general feedback</CardTitle>
                  <CardBody>
                    What has your console experience been like so far?
                  </CardBody>
                </Card>

                {/* Card 2 */}
                <Card 
                  className="feedback-card"
                  variant="secondary"
                  isClickable 
                  isSelectable
                  onClick={() => navigateFeedbackView('bug')}
                  style={{ cursor: 'pointer' }}
                >
                  <CardHeader style={{ paddingBottom: '8px' }}>
                    <img 
                      src={BugIcon} 
                      alt="Report a bug" 
                      style={{ 
                        height: '48px',
                        width: 'auto',
                        display: 'block'
                      }} 
                    />
                  </CardHeader>
                  <CardTitle style={{ paddingTop: 0 }}>Report a bug</CardTitle>
                  <CardBody>
                    Describe the bug you encountered.
                  </CardBody>
                </Card>

                {/* Card 3 */}
                <Card 
                  className="feedback-card"
                  variant="secondary"
                  isClickable 
                  isSelectable
                  onClick={() => navigateFeedbackView('direction')}
                  style={{ cursor: 'pointer' }}
                >
                  <CardHeader style={{ paddingBottom: '8px' }}>
                    <img 
                      src={DirectionIcon} 
                      alt="Inform the direction of Red Hat" 
                      style={{ 
                        height: '48px',
                        width: 'auto',
                        display: 'block'
                      }} 
                    />
                  </CardHeader>
                  <CardTitle style={{ paddingTop: 0 }}>Inform the direction of Red Hat</CardTitle>
                  <CardBody>
                    Learn about opportunities to share your feedback with our User Research Team.
                  </CardBody>
                </Card>
              </div>
            </div>
          );
        })()}
      </Tab>
      <Tab
        eventKey={5}
        className="help-panel-chat-tab"
        title={
          <TabTitleIcon>
            <img
              src={HappyRobotIcon}
              alt=""
              aria-hidden
              style={{
                width: '24px',
                height: 'auto',
                aspectRatio: '1 / 1',
                display: 'block',
                objectFit: 'contain'
              }}
            />
          </TabTitleIcon>
        }
        aria-label="Chat sub tab"
      >
        {renderHelpChatPanel()}
      </Tab>
    </Tabs>
      </div>
    );
  };

  const renderHelpPanelBody = () => (
    <div data-hcc-help-shell="top-tabs-v2" style={{ height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {customHelpTitle !== 'Dashboard widgets' && (
        <>
          {renderHelpPanelTopTabs()}
          <Divider
            component="hr"
            inset={{ default: 'insetNone' }}
            className="help-panel-header-divider"
          />
        </>
      )}
      {customHelpTitle && customHelpVariant === 'quickstart' && (
        <div style={{ padding: '12px 16px 0', flexShrink: 0 }}>
          <Breadcrumb>
            <BreadcrumbItem component="button" onClick={() => selectHelpPanelSubTab(1)}>
              Learn
            </BreadcrumbItem>
            <BreadcrumbItem isActive>{customHelpTitle}</BreadcrumbItem>
          </Breadcrumb>
        </div>
      )}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {customHelpTitle ? (
          <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>{renderCustomHelpByTitle(customHelpTitle)}</div>
        ) : (
          <div
            className="help-panel-hide-native-tab-list"
            style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
          >
            {renderFindHelpSubTabs()}
          </div>
        )}
      </div>
    </div>
  );


  const masthead = (
    <Masthead>
      <MastheadMain>
        {!isPageWithoutNav && (
          <MastheadToggle>
            <Button
              icon={<BarsIcon />}
              variant="plain"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Global navigation"
            />
          </MastheadToggle>
        )}
        <MastheadBrand data-codemods>
          <MastheadLogo data-codemods onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/thumb/d/d8/Red_Hat_logo.svg/3840px-Red_Hat_logo.svg.png"
              alt="Red Hat Logo"
              style={{ height: '40px', width: 'auto' }}
            />
          </MastheadLogo>
        </MastheadBrand>
        {/* Application dropdown next to logo */}
        <div ref={servicesToggleRef} style={{ marginLeft: '4px', marginRight: '4px' }}>
          <Tooltip 
            content="Browse services" 
            position="bottom"
            {...(isLogoDropdownOpen ? { isVisible: false } : {})}
          >
            <MenuToggle
              onClick={handleServicesMenuToggle}
              isExpanded={isLogoDropdownOpen}
              aria-label="Red Hat Hybrid Cloud Console menu"
              style={{ 
                fontSize: '14px'
              }}
            >
              Red Hat Hybrid Cloud Console
            </MenuToggle>
          </Tooltip>
        </div>
        
        {/* Expandable Search Input */}
        <div 
          ref={searchContainerRef}
          style={{ 
            marginRight: '4px',
            width: isSearchExpanded ? '552px' : 'auto',
            minWidth: isSearchExpanded ? '552px' : 'auto',
            transition: 'all 0.3s ease',
            position: 'relative'
          }}
        >
          <style>{`
            .pf-v6-c-masthead__logo {
              width: auto !important;
            }
            .masthead-search-expanded {
              --pf-v6-c-search-input--Width: 552px !important;
              --pf-v6-c-search-input__text-input--Width: 552px !important;
              --pf-v6-c-search-input--MinWidth: 552px !important;
            }
            .masthead-search-expanded .pf-v6-c-search-input,
            .masthead-search-expanded .pf-v6-c-search-input__text-input,
            .masthead-search-expanded .pf-v6-c-form-control {
              width: 552px !important;
              min-width: 552px !important;
            }
            .search-results-dropdown {
              position: absolute;
              top: calc(100% + 4px);
              left: 0;
              right: 0;
              z-index: 1000;
              background: var(--pf-v6-global--BackgroundColor--100);
              border: var(--pf-v6-global--BorderWidth--sm) solid var(--pf-v6-global--BorderColor--200);
              border-radius: var(--pf-v6-global--BorderRadius--md);
              box-shadow: var(--pf-v6-global--BoxShadow--lg);
              max-height: 400px;
              overflow-y: auto;
              padding: 24px;
            }
            .search-result-category-badge {
              font-size: var(--pf-v6-global--FontSize--xs);
              font-weight: var(--pf-v6-global--FontWeight--semi-bold);
              color: var(--pf-v6-global--primary-color--100);
              background-color: var(--pf-v6-global--primary-color--200);
              padding: var(--pf-v6-global--spacer--xs) var(--pf-v6-global--spacer--sm);
              border-radius: var(--pf-v6-global--BorderRadius--sm);
              text-transform: uppercase;
              letter-spacing: 0.025em;
              white-space: nowrap;
              margin-left: auto;
            }
          `}</style>
          <Tooltip 
            content="Search services" 
            position="bottom"
            {...(isSearchExpanded ? { isVisible: false } : {})}
          >
            <div className={isSearchExpanded ? 'masthead-search-expanded' : ''}>
              <SearchInput
                placeholder="Search across all services..."
                value={mastheadSearchValue}
                onChange={onMastheadSearchChange}
                onClear={onMastheadSearchClear}
                expandableInput={{
                  isExpanded: isSearchExpanded,
                  onToggleExpand: onSearchToggle,
                  toggleAriaLabel: "Expandable search input toggle",
                  hasAnimations: true
                }}
                aria-label="Global search"
              />
              
              {/* Search Results Dropdown */}
              {showSearchResults && searchResults.length > 0 && isSearchExpanded && (
                <div className="search-results-dropdown">
                                      <Menu 
                        onSelect={(event, itemId) => {
                          console.log('Selected search result:', itemId);
                          setShowSearchResults(false);
                          // Find the result and navigate if it has a route
                          const selectedResult = searchResults.find(result => result.id === itemId);
                          if (selectedResult && selectedResult.route) {
                            navigate(selectedResult.route);
                          }
                        }}
                      >
                      <MenuList>
                        <MenuGroup label="Top 5 results">
                          {searchResults.map((result) => (
                            <MenuItem 
                              key={result.id}
                              itemId={result.id}
                              description={result.description}
                              onClick={() => {
                                console.log('Selected search result:', result);
                                setShowSearchResults(false);
                                // Navigate to the route if it exists
                                if (result.route) {
                                  navigate(result.route);
                                }
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                                <span>{result.title}</span>
                                <span className="search-result-category-badge">{result.category}</span>
                              </div>
                            </MenuItem>
                          ))}
                        </MenuGroup>
                      </MenuList>
                    </Menu>
                  </div>
                )}
              </div>
            </Tooltip>
        </div>
      </MastheadMain>
      <MastheadContent>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
            {/* Settings */}
            <Tooltip 
              content="Settings" 
              position="bottom"
              {...(isUtilitiesDropdownOpen ? { isVisible: false } : {})}
            >
              <Dropdown
                isOpen={isUtilitiesDropdownOpen}
                onSelect={onUtilitiesDropdownSelect}
                onOpenChange={(isOpen: boolean) => setIsUtilitiesDropdownOpen(isOpen)}
                toggle={(toggleRef: React.Ref<any>) => (
                  <Button
                    ref={toggleRef}
                    onClick={onUtilitiesDropdownToggle}
                    variant="control"
                    aria-label="Settings"
                    aria-expanded={isUtilitiesDropdownOpen}
                  >
                    <CogIcon />
                  </Button>
                )}
                shouldFocusToggleOnSelect
              >
                <DropdownGroup label="Settings">
                  <DropdownList>
                    <DropdownItem
                      icon={<BellIcon />}
                      onClick={() => {
                        navigate('/alert-manager');
                        setIsUtilitiesDropdownOpen(false);
                      }}
                    >
                      Alert manager
                    </DropdownItem>
                    <DropdownItem
                      icon={<DataSourceIcon />}
                      onClick={() => {
                        navigate('/data-integration');
                        setIsUtilitiesDropdownOpen(false);
                      }}
                    >
                      Data integration
                    </DropdownItem>
                  </DropdownList>
                </DropdownGroup>
                <DropdownGroup label="Identity & access management">
                  <DropdownList>
                    <DropdownItem
                      icon={<UsersIcon />}
                      onClick={() => {
                        navigate('/user-access');
                        setIsUtilitiesDropdownOpen(false);
                      }}
                    >
                      User access
                    </DropdownItem>
                    <DropdownItem
                      icon={<ShieldAltIcon />}
                      onClick={() => {
                        navigate('/authentication-policy');
                        setIsUtilitiesDropdownOpen(false);
                      }}
                    >
                      Authentication policy
                    </DropdownItem>
                    <DropdownItem
                      icon={<KeyIcon />}
                      onClick={() => {
                        navigate('/service-accounts');
                        setIsUtilitiesDropdownOpen(false);
                      }}
                    >
                      Service accounts
                    </DropdownItem>
                  </DropdownList>
                </DropdownGroup>
                <Divider />
                <DropdownList>
                  <DropdownItem
                    icon={<FillDripIcon />}
                    onClick={() => {
                      navigate('/settings/appearance');
                      setIsUtilitiesDropdownOpen(false);
                    }}
                  >
                    Customize appearance
                  </DropdownItem>
                </DropdownList>
              </Dropdown>
            </Tooltip>

            {/* Help Panel */}
            <Tooltip 
              content="Help" 
              position="bottom"
              {...(isDrawerExpanded ? { isVisible: false } : {})}
            >
              <Button
                variant="control"
                onClick={onDrawerToggle}
                aria-label="Help"
                aria-expanded={isDrawerExpanded}
                className={isDrawerExpanded ? 'pf-m-clicked' : ''}
                icon={<RhUiAiExperienceIcon aria-hidden />}
                iconPosition="start"
              >
                Help
              </Button>
            </Tooltip>

            {/* Alerts */}
            <Tooltip 
              content="Alerts" 
              position="bottom"
              {...(isNotificationDrawerOpen ? { isVisible: false } : {})}
            >
              <Button
                variant="control"
                onClick={onNotificationDrawerToggle}
                aria-label="Alerts"
                aria-expanded={isNotificationDrawerOpen}
                className={isNotificationDrawerOpen ? 'pf-m-clicked' : ''}
              >
                <BellIcon aria-hidden />
              </Button>
            </Tooltip>

            {/* User dropdown */}
            <Tooltip 
              content="User menu" 
              position="bottom"
              {...(isUserDropdownOpen ? { isVisible: false } : {})}
            >
              <Dropdown
                isOpen={isUserDropdownOpen}
                onSelect={onUserDropdownSelect}
                onOpenChange={(isOpen: boolean) => setIsUserDropdownOpen(isOpen)}
                toggle={(toggleRef: React.Ref<any>) => (
                  <MenuToggle
                    ref={toggleRef}
                    onClick={onUserDropdownToggle}
                    isExpanded={isUserDropdownOpen}
                    aria-label="User menu"
                    icon={<UserIcon />}
                  >
                    {MASTHEAD_USER_DISPLAY_NAME}
                  </MenuToggle>
                )}
                shouldFocusToggleOnSelect
              >
              <DropdownList>
                <div style={{ padding: '16px' }}>
                  <DescriptionList isCompact>
                    <DescriptionListGroup>
                      <DescriptionListTerm>Username:</DescriptionListTerm>
                      <DescriptionListDescription>
                        {MASTHEAD_USER_DISPLAY_NAME}
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                      <DescriptionListTerm>Account number:</DescriptionListTerm>
                      <DescriptionListDescription>12345678</DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                      <DescriptionListTerm>Org ID:</DescriptionListTerm>
                      <DescriptionListDescription>987654321</DescriptionListDescription>
                    </DescriptionListGroup>
                  </DescriptionList>
                </div>
                <div style={{ paddingBottom: '8px' }}>
                  <Divider />
                </div>
                <DropdownItem
                  onClick={() => {
                    navigate('/settings/appearance');
                    setIsUserDropdownOpen(false);
                  }}
                >
                  My profile
                </DropdownItem>
                <DropdownItem
                  onClick={() => {
                    navigate('/my-user-access');
                    setIsUserDropdownOpen(false);
                  }}
                >
                  My User Access
                </DropdownItem>
                <DropdownItem
                  onClick={() => {
                    navigate('/alert-manager');
                    setIsUserDropdownOpen(false);
                  }}
                >
                  My Alert Preferences
                </DropdownItem>
                <div style={{ paddingTop: '8px', paddingBottom: '8px' }}>
                  <Divider />
                </div>
                <DropdownItem>
                  Logout
                </DropdownItem>
              </DropdownList>
              </Dropdown>
            </Tooltip>
        </div>
      </MastheadContent>
    </Masthead>
  );

  const renderNavItem = (
    route: IAppRoute,
    index: number,
    serviceTypeId: PinDashboardServiceTypeId = 'core-console-settings'
  ) => (
    <NavItem
      key={`${route.label}-${index}`}
      id={`${route.label}-${index}`}
      isActive={
        route.path === location.pathname &&
        !shouldDeferBundleNavToPinnedDashboard(location.pathname, location.search, serviceTypeId)
      }
    >
      <NavLink to={route.path}>{route.label}</NavLink>
    </NavItem>
  );

  const renderNavGroup = (group: IAppRouteGroup, groupIndex: number) => (
    <NavExpandable
      key={`${group.label}-${groupIndex}`}
      id={`${group.label}-${groupIndex}`}
      title={group.label}
      isActive={group.routes.some((route) => route.path === location.pathname)}
    >
      {group.routes.map((route, idx) => route.label && renderNavItem(route, idx))}
    </NavExpandable>
  );

  const activeNavigationServiceType = resolveNavigationServiceType(
    location.pathname,
    location.search
  );
  const navigationServiceType: PinDashboardServiceTypeId =
    activeNavigationServiceType ?? 'core-console-settings';

  const renderPinnedDashboardNavItems = (serviceTypeId: PinDashboardServiceTypeId) => {
    if (!serviceTypeSupportsLeftNav(serviceTypeId)) {
      return null;
    }

    const pinned = getPinnedForServiceType(serviceTypeId);
    if (pinned.length === 0) {
      return null;
    }

    return pinned.map((entry) => (
      <PinnedDashboardNavItem
        key={`${serviceTypeId}-${entry.dashboardId}`}
        entry={entry}
        serviceTypeId={serviceTypeId}
      />
    ));
  };

  // Primary navigation structure (current navigation)
  const primaryNavRoutes = routes.filter((route): route is IAppRoute => {
    // Only individual routes, no expandable groups
    return !route.routes && !!route.label && ['Overview', 'Alert Manager', 'Data Integration', 'Event Log', 'Appearance', 'Learning Resources'].includes(route.label);
  });

  // Secondary navigation structure (IAM bundle)
  const deferIamNavToPinned = shouldDeferBundleNavToPinnedDashboard(
    location.pathname,
    location.search,
    'identity-access-management'
  );
  const secondaryNavItems = [
    {
      label: 'My User Access',
      path: '/my-user-access',
      isActive: location.pathname === '/my-user-access' && !deferIamNavToPinned
    },
    { 
      label: 'User Access', 
      path: '/user-access', 
      isActive: ['/user-access', '/users', '/groups', '/roles', '/workspaces', '/red-hat-access-requests'].includes(location.pathname),
      isExpandable: true,
      subItems: [
        { label: 'Overview', path: '/user-access', isActive: location.pathname === '/user-access' },
        { label: 'Users', path: '/users', isActive: location.pathname === '/users' },
        { label: 'Groups', path: '/groups', isActive: location.pathname === '/groups' },
        { label: 'Roles', path: '/roles', isActive: location.pathname === '/roles' },
        { label: 'Workspaces', path: '/workspaces', isActive: location.pathname === '/workspaces' },
        { label: 'Red Hat Access Requests', path: '/red-hat-access-requests', isActive: location.pathname === '/red-hat-access-requests' },
      ]
    },
    { label: 'Authentication Policy', path: '/authentication-policy', isActive: location.pathname === '/authentication-policy' },
    { label: 'Service Accounts', path: '/service-accounts', isActive: location.pathname === '/service-accounts' },
    { label: 'IAM Learning', path: '/learning-resources-iam', isActive: location.pathname === '/learning-resources-iam' },
  ];

  const deferOpenshiftNavToPinned = shouldDeferBundleNavToPinnedDashboard(
    location.pathname,
    location.search,
    'openshift'
  );

  const Navigation = (
    <Nav id="nav-primary-simple">
      <NavList id="nav-list-simple">
        {navigationServiceType === 'core-console-settings' ? (
          <>
            {primaryNavRoutes.map((route, idx) => route.label && renderNavItem(route, idx, 'core-console-settings'))}
            {renderPinnedDashboardNavItems('core-console-settings')}
          </>
        ) : navigationServiceType === 'identity-access-management' ? (
          <>
            {secondaryNavItems.map((item, idx) =>
              item.isExpandable ? (
                <NavExpandable
                  key={`secondary-expandable-${idx}`}
                  id={`secondary-expandable-${idx}`}
                  title={item.label}
                  isActive={item.isActive}
                >
                  {item.subItems?.map((subItem, subIdx) => (
                    <NavItem
                      key={`secondary-sub-${idx}-${subIdx}`}
                      id={`secondary-sub-${idx}-${subIdx}`}
                      isActive={subItem.isActive}
                    >
                      <NavLink to={subItem.path}>{subItem.label}</NavLink>
                    </NavItem>
                  ))}
                </NavExpandable>
              ) : (
                <NavItem key={`secondary-${idx}`} id={`secondary-${idx}`} isActive={item.isActive}>
                  <NavLink to={item.path}>{item.label}</NavLink>
                </NavItem>
              )
            )}
            {renderPinnedDashboardNavItems('identity-access-management')}
          </>
        ) : navigationServiceType === 'openshift' ? (
          <OpenshiftBundleNav
            pathname={location.pathname}
            deferOverviewToPinned={deferOpenshiftNavToPinned}
            pinnedNavItems={renderPinnedDashboardNavItems('openshift')}
          />
        ) : (
          primaryNavRoutes.map((route, idx) => route.label && renderNavItem(route, idx))
        )}
      </NavList>
    </Nav>
  );

  const Sidebar = (
    <PageSidebar>
      <PageSidebarBody>{Navigation}</PageSidebarBody>
    </PageSidebar>
  );

  const pageId = 'primary-app-container';

  const PageSkipToContent = (
    <SkipToContent
      onClick={(event) => {
        event.preventDefault();
        const primaryContentContainer = document.getElementById(pageId);
        primaryContentContainer?.focus();
      }}
      href={`#${pageId}`}
    >
      Skip to Content
    </SkipToContent>
  );

  const drawerContent = (
    <DrawerPanelContent 
      ref={helpPanelRef}
      defaultSize="580px"
      minSize="320px"
      maxSize="800px"
      isResizable
    >
      <DrawerHead>
        <Title headingLevel="h2" size="lg">
            {customHelpTitle === 'Dashboard widgets' ? 'Add Widgets' : 'Help'}
        </Title>
        <DrawerActions>
          {customHelpTitle !== 'Dashboard widgets' && (
            <>
              <Button
                variant="plain"
                aria-label="Back in help panel"
                isDisabled={!canHelpPanelGoBack}
                onClick={goHelpPanelBack}
                icon={<AngleLeftIcon aria-hidden />}
              />
              <Button
                variant="plain"
                aria-label="Forward in help panel"
                isDisabled={!canHelpPanelGoForward}
                onClick={goHelpPanelForward}
                icon={<AngleRightIcon aria-hidden />}
              />
            </>
          )}
          <DrawerCloseButton onClick={onDrawerClose} />
        </DrawerActions>
      </DrawerHead>
      <DrawerContentBody style={{ padding: 0 }}>
        <style>{`
          /* Force hidden drawer panels to not take up space */
          .pf-v6-c-drawer__panel[hidden] {
            display: none !important;
          }
          
          /* Force drawer panel to clip any overflow, except when menu is open */
          .pf-v6-c-drawer__panel {
            overflow: hidden !important;
          }
          
          /* Allow overflow when tabs overflow menu is open */
          .pf-v6-c-drawer__panel:has(.pf-v6-c-tabs [role="menu"]) {
            overflow: visible !important;
          }
          
          .pf-v6-c-drawer__panel-content {
            overflow: visible !important; /* Allow menus to escape */
          }
          
          /* Allow drawer body to overflow when menu is open */
          .pf-v6-c-drawer__body:has(.pf-v6-c-tabs [role="menu"]),
          .pf-v6-c-drawer__body {
            overflow: visible !important;
          }
          
          /* Override PatternFly's dynamic width variable to constrain tabs */
          .pf-v6-c-drawer__panel .pf-v6-c-tabs {
            --pf-v6-c-tabs--Width: 100% !important;
            width: 100% !important;
            max-width: 100% !important;
            overflow: visible !important; /* Allow dropdown menu to show */
          }
          
          /* Constrain the scrollable tab list area */
          .pf-v6-c-drawer__panel .pf-v6-c-tabs__scroll-container {
            max-width: 100%;
            overflow-x: auto;
          }
          
          .pf-v6-c-drawer__panel .pf-v6-c-tabs__list {
            max-width: 100%;
          }
          
          /* Constrain tab content areas */
          .pf-v6-c-drawer__panel .pf-v6-c-tabs__panel {
            overflow-x: hidden;
          }
          
          /* Target all dropdown menus within tabs overflow */
          [data-popper-placement] .pf-v6-c-menu,
          .pf-v6-c-dropdown__menu,
          .pf-v6-c-menu {
            min-width: 300px !important;
            width: 300px !important;
          }
          
          /* Allow dynamic positioning for tabs overflow menu */
          .pf-v6-c-tabs [role="menu"] {
            /* Positioning will be set dynamically via JavaScript */
            max-width: 300px !important;
          }
          
          /* Adjust popper positioning for tabs overflow menu */
          .pf-v6-c-tabs [data-popper-placement] {
            /* Positioning will be set dynamically via JavaScript */
            max-width: 300px !important;
          }
          
          /* Ensure menu stays within drawer panel bounds */
          .pf-v6-c-drawer__panel .pf-v6-c-tabs [role="menu"] {
            position: absolute !important;
          }
          
          /* Target menu items specifically */
          .pf-v6-c-menu__list-item,
          .pf-v6-c-dropdown__menu-item {
            min-width: 280px !important;
            white-space: nowrap !important;
          }
          
          /* Ensure tabs overflow menu items show ellipsis when truncated */
          .pf-v6-c-tabs [role="menu"] button[role="menuitem"] {
            display: flex !important;
            align-items: center !important;
            max-width: 300px !important;
            overflow: hidden !important;
          }
          
          .pf-v6-c-tabs [role="menu"] .menu-item-text-wrapper {
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            white-space: nowrap !important;
            display: block !important;
          }
          
          /* Truncate visible tab titles */
          .pf-v6-c-tabs__item .pf-v6-c-tabs__item-text {
            max-width: 180px !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            white-space: nowrap !important;
            display: inline-block !important;
          }
          
          /* Add extra padding for check icons */
          .pf-v6-c-menu__item-text {
            padding-right: 32px !important;
          }
          
          /* Target the tabs overflow container specifically */
          .pf-v6-c-tabs [role="menu"] {
            min-width: 300px !important;
            width: 300px !important;
          }
          
          /* Top strip uses its own Tabs row; hide empty tab panels rendered by that duplicate Tabs */
          .help-panel-top-tabs-strip .pf-v6-c-tab-content {
            display: none !important;
          }

          /*
           * Search + middle tabs use PF horizontal overflow; chat tab is pinned on the right.
           * Middle tabs collapse into the "More" menu as the drawer narrows.
           */
          .help-panel-top-tabs-strip {
            position: relative;
            z-index: var(--pf-t--global--z-index--md);
          }

          .help-panel-top-tabs-row {
            display: flex;
            align-items: flex-end;
            width: 100%;
            min-width: 0;
          }

          .help-panel-top-tabs-main.pf-v6-c-tabs {
            flex: 1 1 auto;
            min-width: 0;
            overflow: visible;
            width: auto !important;
          }

          .help-panel-top-tabs-strip .help-panel-top-tabs-main.pf-v6-c-tabs {
            overflow: visible !important;
            width: auto !important;
            max-width: 100% !important;
          }

          .help-panel-top-tabs-strip .pf-v6-c-tabs__scroll-container {
            max-width: 100%;
            min-width: 0;
          }

          .help-panel-top-tabs-strip .help-panel-top-tabs-main .pf-v6-c-tabs__list {
            display: flex !important;
            flex-wrap: nowrap !important;
            width: 100% !important;
            max-width: 100% !important;
            min-width: 0 !important;
            overflow: hidden !important;
          }

          .help-panel-chat-tab-pinned.pf-v6-c-tabs {
            flex-shrink: 0 !important;
            width: auto !important;
            overflow: visible !important;
          }

          .help-panel-chat-tab-pinned .pf-v6-c-tabs__list {
            overflow: visible !important;
          }

          .help-panel-chat-tab-pinned .pf-v6-c-tabs__item.help-panel-chat-tab {
            margin-inline-start: var(--pf-t--global--spacer--xs) !important;
          }

          .help-panel-chat-tab-pinned .pf-v6-c-tabs__item.help-panel-chat-tab .pf-v6-c-tabs__link {
            min-width: 2.75rem !important;
            justify-content: center !important;
          }

          /* Full-bleed grey rule under tab strip (separator from scroll content; insetNone = panel width) */
          .help-panel-header-divider.pf-v6-c-divider {
            width: 100% !important;
            align-self: stretch !important;
            flex-shrink: 0 !important;
          }

          /* Duplicate tab row is rendered above; hide PatternFly's tab buttons inside the scroll region */
          .help-panel-hide-native-tab-list .pf-v6-c-tabs__scroll-buttons,
          .help-panel-hide-native-tab-list .pf-v6-c-tabs__list {
            display: none !important;
          }

          /*
           * PF merges Tabs style prop onto .pf-v6-c-tabs (the nav), not the panels.
           * flex:1 on Tabs stretched the empty nav and caused a large gap above tab body (APIs, Support, etc.).
           * Shell wraps Tabs; collapse the hidden nav and let the active tab panel fill height.
           */
          .help-panel-inner-tabs-shell > .pf-v6-c-tabs {
            flex-grow: 0 !important;
            flex-shrink: 0 !important;
            height: 0 !important;
            max-height: 0 !important;
            min-height: 0 !important;
            overflow: hidden !important;
            padding: 0 !important;
            margin: 0 !important;
            border: none !important;
          }
          .help-panel-inner-tabs-shell > .pf-v6-c-tab-content:not([hidden]) {
            flex: 1 1 auto !important;
            min-height: 0 !important;
            overflow: auto !important;
          }
          
          /* Chat sub-tab content fills available height */
          .pf-v6-c-tabs__panel:has([data-help-panel="chat"]) {
            height: 100% !important;
            display: flex !important;
            flex-direction: column !important;
          }
          
          [data-help-panel="chat"] {
            height: 100% !important;
            display: flex !important;
            flex-direction: column !important;
            min-width: 0 !important;
            max-width: 100% !important;
            overflow-x: hidden !important;
          }

          ${HELP_PANEL_CHATBOT_STYLES}
          
          /* Style the overflow button to look like a persistent tab */
          .pf-v6-c-tabs__scroll-button[data-overflowing] {
            border: 1px solid var(--pf-v6-global--BorderColor--100) !important;
            border-bottom: none !important;
            background: var(--pf-v6-global--BackgroundColor--100) !important;
            padding: 8px 16px !important;
            min-width: auto !important;
            font-size: var(--pf-v6-global--FontSize--sm) !important;
            font-weight: 500 !important;
            color: var(--pf-v6-global--Color--100) !important;
            border-radius: var(--pf-v6-global--BorderRadius--sm) var(--pf-v6-global--BorderRadius--sm) 0 0 !important;
            margin-left: 4px !important;
            order: 999 !important;
            position: relative !important;
          }
          
          .pf-v6-c-tabs__scroll-button[data-overflowing]:hover {
            background: var(--pf-v6-global--BackgroundColor--200) !important;
            cursor: pointer !important;
          }
          
          .pf-v6-c-tabs__scroll-button[data-overflowing] svg {
            display: none !important;
          }
          
          /* Allow overflow menu to escape tabs boundaries - only apply to tabs, not drawer */
          .pf-v6-c-tabs,
          .pf-v6-c-tabs__list {
            overflow: visible !important;
          }
          
          /* Make sure tabs container doesn't create scroll region */
          .pf-v6-c-tabs__scroll-button {
            overflow: visible !important;
          }
          
          /* Ensure overflow menu has high z-index and can overlay content */
          .pf-v6-c-tabs [role="menu"] {
            z-index: 9999 !important;
            position: fixed !important;
            background-color: var(--pf-v6-global--BackgroundColor--100, #ffffff) !important;
            box-shadow: 0 0.25rem 0.5rem 0rem rgba(3, 3, 3, 0.16), 0 0 0.375rem 0 rgba(3, 3, 3, 0.08) !important;
            border-radius: var(--pf-v6-global--BorderRadius--sm, 4px) !important;
          }
          
          /* Prevent any parent from creating a scroll container for the menu */
          .pf-v6-c-tabs .pf-v6-c-menu {
            overflow: visible !important;
            background-color: var(--pf-v6-global--BackgroundColor--100, #ffffff) !important;
          }
          
          /* Ensure menu items have proper background */
          .pf-v6-c-tabs [role="menu"] [role="menuitem"] {
            background-color: var(--pf-v6-global--BackgroundColor--100, #ffffff) !important;
          }
          
          /* Menu item hover state */
          .pf-v6-c-tabs [role="menu"] [role="menuitem"]:hover {
            background-color: var(--pf-v6-global--BackgroundColor--200, #f5f5f5) !important;
          }
          
          /* Close all button styling */
          .pf-v6-c-tabs [role="menu"] .close-all-tabs-button {
            color: var(--pf-v6-global--danger-color--100, #c9190b) !important;
            font-weight: 500 !important;
          }
          
          .pf-v6-c-tabs [role="menu"] .close-all-tabs-button:hover {
            color: var(--pf-v6-global--danger-color--200, #a30000) !important;
            background-color: var(--pf-v6-global--BackgroundColor--200, #f5f5f5) !important;
          }
        `}</style>
        {renderHelpPanelBody()}
      </DrawerContentBody>
    </DrawerPanelContent>
  );



  // Create notification drawer content
  const notificationDrawerContent = (
    <DrawerPanelContent defaultSize="580px">
      <DrawerHead>
        <span style={{ fontWeight: 'bold' }}>Notifications</span>
        <DrawerActions>
          <Dropdown
            isOpen={isNotificationActionsOpen}
            onOpenChange={(isOpen: boolean) => setIsNotificationActionsOpen(isOpen)}
            popperProps={{
              position: 'right'
            }}
            toggle={(toggleRef: React.Ref<any>) => (
              <MenuToggle
                ref={toggleRef}
                aria-label="Notification actions menu"
                variant="plain"
                onClick={() => setIsNotificationActionsOpen(!isNotificationActionsOpen)}
              >
                <EllipsisVIcon />
              </MenuToggle>
            )}
            shouldFocusToggleOnSelect
          >
            <DropdownList>
              <DropdownItem
                onClick={() => {
                  navigate('/event-log');
                  setIsNotificationActionsOpen(false);
                }}
              >
                Event log
              </DropdownItem>
              <DropdownItem
                onClick={() => {
                  navigate('/alert-manager');
                  setIsNotificationActionsOpen(false);
                }}
              >
                My alert preferences
              </DropdownItem>
              <DropdownItem
                onClick={() => {
                  navigate('/alert-manager');
                  setIsNotificationActionsOpen(false);
                }}
              >
                Organization defaults
              </DropdownItem>
            </DropdownList>
          </Dropdown>
          <DrawerCloseButton onClick={onNotificationDrawerClose} />
        </DrawerActions>
      </DrawerHead>
      <DrawerContentBody>
        <NotificationDrawer>
          <NotificationDrawerBody>
            <NotificationDrawerList>
              <NotificationDrawerListItem variant="info">
                <NotificationDrawerListItemHeader
                  variant="info"
                  title="System Update Available"
                  srTitle="Info notification:"
                />
                <NotificationDrawerListItemBody timestamp="5 minutes ago">
                  A new system update is available for installation. Click to view details.
                </NotificationDrawerListItemBody>
              </NotificationDrawerListItem>
              <NotificationDrawerListItem variant="warning">
                <NotificationDrawerListItemHeader
                  variant="warning"
                  title="Storage Space Low"
                  srTitle="Warning notification:"
                />
                <NotificationDrawerListItemBody timestamp="15 minutes ago">
                  Your storage space is running low. Consider removing unused files.
                </NotificationDrawerListItemBody>
              </NotificationDrawerListItem>
              <NotificationDrawerListItem variant="success">
                <NotificationDrawerListItemHeader
                  variant="success"
                  title="Backup Completed"
                  srTitle="Success notification:"
                />
                <NotificationDrawerListItemBody timestamp="1 hour ago">
                  Your scheduled backup has completed successfully.
                </NotificationDrawerListItemBody>
              </NotificationDrawerListItem>
            </NotificationDrawerList>
          </NotificationDrawerBody>
        </NotificationDrawer>
      </DrawerContentBody>
    </DrawerPanelContent>
  );

  return (
    <>
      <Page
        mainContainerId={pageId}
        masthead={masthead}
        sidebar={sidebarOpen && !isPageWithoutNav && Sidebar}
        skipToContent={PageSkipToContent}
      >
        {/* Notification Drawer (outer, right-side) */}
        <Drawer isExpanded={isNotificationDrawerOpen} isInline position="right">
          <DrawerContent panelContent={notificationDrawerContent}>
            {/* Help Drawer (inner, left-side) */}
            <Drawer isExpanded={isDrawerExpanded} isInline>
              <HelpPanelContext.Provider value={{ openHelpPanelWithTab, openHelpPanelToShareGeneralFeedback, isAddWidgetsPanelOpen: isDrawerExpanded && customHelpTitle === 'Dashboard widgets', closeHelpPanel: onDrawerClose }}>
                {/* Provider wraps DrawerContent so help panel tab bodies (e.g. Dashboard widgets) receive context, not only route children */}
                <DrawerContent panelContent={drawerContent}>{children}</DrawerContent>
              </HelpPanelContext.Provider>
            </Drawer>
          </DrawerContent>
        </Drawer>
      </Page>
      
      {/* Services primary-detail dropdown */}
      {isLogoDropdownOpen && (
        <div
          ref={servicesDropdownRef}
          style={{
            position: 'fixed',
            top: `${servicesDropdownPosition.top}px`,
            left: `${servicesDropdownPosition.left}px`,
            zIndex: 9999,
            animation: 'slideDown 0.3s ease-out'
          }}
        >
          <style>
            {`
              @keyframes slideDown {
                from {
                  opacity: 0;
                  transform: translateY(-10px);
                }
                to {
                  opacity: 1;
                  transform: translateY(0);
                }
              }
              .services-dropdown-panel {
                box-shadow: var(--pf-v6-c-menu--BoxShadow, var(--pf-t--global--box-shadow--md));
                background-color: var(--pf-v6-c-menu--BackgroundColor, var(--pf-t--global--background--color--floating--default));
                border: var(--pf-v6-c-menu--BorderWidth, var(--pf-t--global--border--width--high-contrast--regular)) solid var(--pf-v6-c-menu--BorderColor, var(--pf-t--global--border--color--high-contrast));
                border-radius: var(--pf-v6-c-menu--BorderRadius, var(--pf-t--global--border--radius--medium));
                overflow: hidden;
              }
              .services-dropdown-panel .pf-v6-c-menu {
                box-shadow: none !important;
                background-color: transparent !important;
                border: none !important;
                --pf-v6-c-menu--BoxShadow: none;
              }
              .services-dropdown-panel__scroll {
                height: 100%;
                min-height: 0;
                overflow-y: auto;
                overflow-x: hidden;
              }
              /* Selected state — PF v6 paints row highlight on .pf-v6-c-menu__list-item::before */
              .services-dropdown-panel .pf-v6-c-menu__list-item.pf-m-selected:not([data-is-link="true"]),
              .services-dropdown-panel .pf-v6-c-menu__list-item[data-selected="true"]:not([data-is-link="true"]) {
                --pf-v6-c-menu__list-item--BackgroundColor: var(--pf-t--global--background--color--action--plain--clicked);
                --pf-v6-c-menu__list-item--BorderWidth: var(--pf-t--global--border--width--action--plain--hover);
              }
              .services-dropdown-panel .pf-v6-c-menu__list-item.pf-m-selected:not([data-is-link="true"]):hover,
              .services-dropdown-panel .pf-v6-c-menu__list-item[data-selected="true"]:not([data-is-link="true"]):hover {
                --pf-v6-c-menu__list-item--BackgroundColor: var(--pf-t--global--background--color--action--plain--clicked);
              }
              .services-dropdown-panel .pf-v6-c-menu__list-item.pf-m-selected .pf-v6-c-menu__item-select-icon,
              .services-dropdown-panel .pf-v6-c-menu__list-item[data-selected="true"] .pf-v6-c-menu__item-select-icon {
                display: none !important;
              }
              /* Favorited star icon in My favorite services */
              .services-dropdown-panel .pf-v6-c-menu__list-item[data-item-id="my-favorite-services"] .pf-v6-c-menu__item-icon svg {
                color: var(--pf-v6-c-button--m-favorited--hover__icon--Color, #f39200) !important;
                fill: var(--pf-v6-c-button--m-favorited--hover__icon--Color, #f39200) !important;
              }
              /* Style link items differently - increased specificity */
              .pf-v6-c-menu__item[data-is-link="true"] .pf-v6-c-menu__item-main {
                color: var(--pf-v6-global--link--Color) !important;
              }
              .pf-v6-c-menu__item[data-is-link="true"]:hover .pf-v6-c-menu__item-main {
                background-color: var(--pf-v6-global--BackgroundColor--100) !important;
                color: var(--pf-v6-global--link--Color--hover) !important;
                text-decoration: underline;
              }
              .pf-v6-c-menu__item[data-is-link="true"]:hover {
                background-color: var(--pf-v6-global--BackgroundColor--100) !important;
              }
              /* Maximum specificity targeting for link items */
              .pf-v6-c-menu .pf-v6-c-menu__list .pf-v6-c-menu__item[data-is-link="true"] {
                color: #0066cc !important;
              }
              .pf-v6-c-menu .pf-v6-c-menu__list .pf-v6-c-menu__item[data-is-link="true"]:hover {
                color: #004080 !important;
                background-color: #f0f0f0 !important;
              }
              /* Target all possible child elements and text content */
              .pf-v6-c-menu .pf-v6-c-menu__item[data-is-link="true"] *,
              .pf-v6-c-menu .pf-v6-c-menu__item[data-is-link="true"] .pf-v6-c-menu__item-text,
              .pf-v6-c-menu .pf-v6-c-menu__item[data-is-link="true"] .pf-v6-c-menu__item-main,
              .pf-v6-c-menu .pf-v6-c-menu__item[data-is-link="true"] button,
              .pf-v6-c-menu .pf-v6-c-menu__item[data-is-link="true"] a,
              .pf-v6-c-menu .pf-v6-c-menu__item[data-is-link="true"] span,
              .pf-v6-c-menu .pf-v6-c-menu__item[data-is-link="true"] div {
                color: #0066cc !important;
              }
              .pf-v6-c-menu .pf-v6-c-menu__item[data-is-link="true"]:hover *,
              .pf-v6-c-menu .pf-v6-c-menu__item[data-is-link="true"]:hover .pf-v6-c-menu__item-text,
              .pf-v6-c-menu .pf-v6-c-menu__item[data-is-link="true"]:hover .pf-v6-c-menu__item-main,
              .pf-v6-c-menu .pf-v6-c-menu__item[data-is-link="true"]:hover button,
              .pf-v6-c-menu .pf-v6-c-menu__item[data-is-link="true"]:hover a,
              .pf-v6-c-menu .pf-v6-c-menu__item[data-is-link="true"]:hover span,
              .pf-v6-c-menu .pf-v6-c-menu__item[data-is-link="true"]:hover div {
                color: #004080 !important;
              }
              /* Nuclear option - override everything within link items */
              [data-is-link="true"] {
                color: #0066cc !important;
              }
              [data-is-link="true"]:hover {
                color: #004080 !important;
              }
              /* Ultimate specificity - target the exact component structure */
              .pf-v6-c-menu__list .pf-v6-c-menu__item[data-is-link="true"] {
                color: #0066cc !important;
              }
              .pf-v6-c-menu__list .pf-v6-c-menu__item[data-is-link="true"]:hover {
                color: #004080 !important;
              }
              /* Override PatternFly's CSS custom properties */
              .pf-v6-c-menu__item[data-is-link="true"] {
                --pf-v6-c-menu__item--Color: #0066cc !important;
                --pf-v6-c-menu__item--m-current--Color: #0066cc !important;
                --pf-v6-c-menu__item--hover--Color: #004080 !important;
              }
              /* CSS class targeting for link items */
              .custom-link-menu-item {
                color: #0066cc !important;
              }
              .custom-link-menu-item:hover {
                color: #004080 !important;
                background-color: #f0f0f0 !important;
              }
              .custom-link-menu-item * {
                color: #0066cc !important;
              }
              .custom-link-menu-item:hover * {
                color: #004080 !important;
              }
              /* Prevent link items from showing selected state */
              .services-dropdown-panel .pf-v6-c-menu__list-item[data-is-link="true"].pf-m-selected {
                --pf-v6-c-menu__list-item--BackgroundColor: var(--pf-t--global--background--color--action--plain--default);
              }
              .pf-v6-c-menu__item[data-is-link="true"] .pf-v6-c-menu__item-select-icon {
                display: none !important;
              }

            `}
          </style>
          <div className="services-dropdown-panel" style={{ width: '900px', height: '560px' }}>
            <Split style={{ height: '100%', minHeight: 0 }}>
              {/* Primary (Menu) Side */}
              <SplitItem style={{ 
                width: '450px', 
                minWidth: '450px', 
                maxWidth: '450px', 
                flexShrink: 0, 
                flexGrow: 0,
                minHeight: 0,
                overflow: 'hidden',
                borderRight: '1px solid var(--pf-t--global--border--color--default)' 
              }}>
                <div className="services-dropdown-panel__scroll">
                  <Menu 
                    key={`services-menu-${selectedMenuItem}`}
                    aria-label="Services menu"
                    isPlain
                    activeItemId={selectedMenuItem}
                    selected={selectedMenuItem}
                        onSelect={(event, itemId) => {
                          // Find the clicked item across all groups
                          let clickedItem: MenuItem | null = null;
                          for (const groupItems of Object.values(menuGroupsData)) {
                            const found = groupItems.find(item => item.id === itemId);
                            if (found) {
                              clickedItem = found;
                              break;
                            }
                          }
                          
                          if (clickedItem?.isLink && clickedItem?.url) {
                            // Navigate to URL for link items
                            window.location.href = clickedItem.url;
                          } else {
                            // Set selection for non-link items
                            setSelectedMenuItem(itemId as string);
                          }
                        }}
                      >
                        <MenuList>
                          {Object.entries(menuGroupsData).map(([groupTitle, groupItems], groupIndex, groupsArray) => (
                            <React.Fragment key={groupTitle}>
                              {groupTitle === 'Services' ? (
                                <MenuGroup>
                                  <div style={{ 
                                    display: 'flex', 
                                    justifyContent: 'space-between', 
                                    alignItems: 'center',
                                    padding: '8px 16px 8px 16px',
                                    fontSize: 'var(--pf-v6-global--FontSize--sm)',
                                    fontWeight: 'var(--pf-v6-global--FontWeight--bold)',
                                    color: 'var(--pf-v6-global--Color--200)'
                                  }}>
                                    <span>Services</span>
                                    <a 
                                      href="/all-services"
                                      style={{ 
                                        fontSize: 'var(--pf-v6-global--FontSize--xs)',
                                        fontWeight: 'var(--pf-v6-global--FontWeight--normal)',
                                        color: '#0066cc',
                                        textDecoration: 'none'
                                      }}
                                      onMouseEnter={(e) => (e.target as HTMLElement).style.textDecoration = 'underline'}
                                      onMouseLeave={(e) => (e.target as HTMLElement).style.textDecoration = 'none'}
                                    >
                                      View all services
                                    </a>
                                  </div>
                                  {groupItems.map((item) => (
                                    <MenuItem 
                                      key={item.id}
                                      itemId={item.id}
                                      icon={!item.isLink ? item.icon : undefined}
                                      isSelected={!item.isLink && selectedMenuItem === item.id}
                                      isActive={!item.isLink && selectedMenuItem === item.id}
                                      data-item-id={item.id}
                                      data-selected={!item.isLink && selectedMenuItem === item.id ? "true" : "false"}
                                      data-is-link={item.isLink ? "true" : "false"}
                                      className={`${item.isLink ? 'custom-link-menu-item' : ''} ${!item.isLink && selectedMenuItem === item.id ? 'pf-m-selected' : ''}`.trim()}
                                      style={item.isLink ? { 
                                        color: '#0066cc', 
                                        cursor: 'pointer',
                                        ['--pf-v6-c-menu__item--Color' as any]: '#0066cc',
                                        ['--pf-v6-c-menu__item--m-current--Color' as any]: '#0066cc',
                                        ['--pf-v6-c-menu__item--hover--Color' as any]: '#004080'
                                      } : undefined}
                                    >
                                      {item.name}
                                    </MenuItem>
                                  ))}
                                </MenuGroup>
                              ) : (
                                <MenuGroup label={groupTitle}>
                                  {groupItems.map((item) => (
                                    <MenuItem 
                                      key={item.id}
                                      itemId={item.id}
                                      icon={!item.isLink ? item.icon : undefined}
                                      isSelected={!item.isLink && selectedMenuItem === item.id}
                                      isActive={!item.isLink && selectedMenuItem === item.id}
                                      data-item-id={item.id}
                                      data-selected={!item.isLink && selectedMenuItem === item.id ? "true" : "false"}
                                      data-is-link={item.isLink ? "true" : "false"}
                                      className={`${item.isLink ? 'custom-link-menu-item' : ''} ${!item.isLink && selectedMenuItem === item.id ? 'pf-m-selected' : ''}`.trim()}
                                      style={item.isLink ? { 
                                        color: '#0066cc', 
                                        cursor: 'pointer',
                                        ['--pf-v6-c-menu__item--Color' as any]: '#0066cc',
                                        ['--pf-v6-c-menu__item--m-current--Color' as any]: '#0066cc',
                                        ['--pf-v6-c-menu__item--hover--Color' as any]: '#004080'
                                      } : undefined}
                                    >
                                      {item.name}
                                    </MenuItem>
                                  ))}
                                </MenuGroup>
                              )}
                              {groupIndex < groupsArray.length - 1 && (
                                <Divider component="li" />
                              )}
                            </React.Fragment>
                          ))}
                        </MenuList>
                  </Menu>
                </div>
              </SplitItem>

              {/* Detail Side */}
              <SplitItem isFilled style={{ minHeight: 0, overflow: 'hidden' }}>
                <div className="services-dropdown-panel__scroll" style={{ padding: '24px' }}>
                      {(() => {
                        // Find the selected menu item only among non-link items
                        let currentMenuItem: MenuItem | null = null;
                        for (const groupItems of Object.values(menuGroupsData)) {
                          const found = groupItems.find(item => item.id === selectedMenuItem && !item.isLink);
                          if (found) {
                            currentMenuItem = found;
                            break;
                          }
                        }
                        if (!currentMenuItem) return null;
                        
                        return (
                          <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsLg' }}>
                            <FlexItem>
                              <Title headingLevel="h3" size="xl">
                                {currentMenuItem.name}
                              </Title>
                            </FlexItem>
                            
                            <FlexItem>
                              {currentMenuItem.id === 'my-favorite-services' ? (
                                // Dynamic My Favorite Services content based on user's favorites
                                favoritedItems.size === 0 ? (
                                  <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--pf-v6-global--Color--200)' }}>
                                    <div style={{ marginBottom: '16px' }}>
                                      <img 
                                        src="https://www.redhat.com/rhdc/managed-files/console-tech-stack.png"
                                        alt="No favorited services"
                                        style={{ height: '200px', width: 'auto' }}
                                      />
                                            </div>
                                    <Title headingLevel="h4" size="lg" style={{ marginBottom: '8px' }}>No favorited services</Title>
                                    <p style={{ marginBottom: '24px' }}>Add a service to your favorites to get started here.</p>
                                    <Button 
                                      variant="primary" 
                                      onClick={() => {
                                        navigate('/all-services');
                                        setIsLogoDropdownOpen(false);
                                      }}
                                    >
                                      View all services
                                    </Button>
                                  </div>
                                ) : (
                                  <Menu>
                                    {(() => {
                                      // Map of itemId to display information with category grouping
                                      const itemMapping: { [key: string]: { name: string, description: string, onClick: () => void, category: string } } = {
                                            'alert-manager-settings': {
                                              name: 'Alert manager | settings',
                                              description: 'Configure and manage system alerts and notifications',
                                              category: 'Console settings',
                                              onClick: () => {
                                                navigate('/alert-manager');
                                                setIsLogoDropdownOpen(false);
                                              }
                                            },
                                            'data-integration-settings': {
                                              name: 'Data integration | settings', 
                                              description: 'Manage data integration workflows and connectors',
                                              category: 'Console settings',
                                              onClick: () => {
                                                navigate('/data-integrations');
                                                setIsLogoDropdownOpen(false);
                                              }
                                            },
                                            'event-log-settings': {
                                              name: 'Event log | settings',
                                              description: 'View and configure system event logging',
                                              category: 'Console settings',
                                              onClick: () => {
                                                navigate('/event-log');
                                                setIsLogoDropdownOpen(false);
                                              }
                                            },
                                            'overview-settings': {
                                              name: 'Overview | settings',
                                              description: 'Access the main console overview and dashboard',
                                              category: 'Console settings',
                                              onClick: () => {
                                                navigate('/overview');
                                                setIsLogoDropdownOpen(false);
                                              }
                                            },
                                            'users': {
                                              name: 'Users',
                                              description: 'Manage user accounts and their access permissions',
                                              category: 'Identity & access management (IAM)',
                                              onClick: () => {
                                                navigate('/users');
                                                setIsLogoDropdownOpen(false);
                                              }
                                            },
                                            'groups': {
                                              name: 'Groups',
                                              description: 'Create and manage user groups and permissions',
                                              category: 'Identity & access management (IAM)',
                                              onClick: () => {
                                                navigate('/groups');
                                                setIsLogoDropdownOpen(false);
                                              }
                                            },
                                            'roles': {
                                              name: 'Roles',
                                              description: 'Define and manage user roles with specific permissions',
                                              category: 'Identity & access management (IAM)',
                                              onClick: () => {
                                                navigate('/roles');
                                                setIsLogoDropdownOpen(false);
                                              }
                                            },
                                            '60day-trial-openshift-ai': {
                                              name: '60-day product trial | OpenShift AI',
                                              description: 'Create, train, and service AI/ML models',
                                              category: 'Red Hat OpenShift',
                                              onClick: () => console.log('60-day product trial | OpenShift AI clicked')
                                            },
                                            'developer-sandbox-openshift-ai': {
                                              name: 'Developer sandbox | OpenShift AI',
                                              description: 'Create, train, and service AI/ML models',
                                              category: 'Red Hat OpenShift',
                                              onClick: () => console.log('Developer sandbox | OpenShift AI clicked')
                                            },
                                            'authentication-factors': {
                                              name: 'Authentication factors',
                                              description: 'Configure multi-factor authentication and security settings',
                                              category: 'Identity & access management (IAM)',
                                              onClick: () => console.log('Authentication factors clicked')
                                            },
                                            'service-accounts': {
                                              name: 'Service accounts',
                                              description: 'Create and manage service accounts for automated systems',
                                              category: 'Identity & access management (IAM)',
                                              onClick: () => console.log('Service Accounts clicked')
                                            },
                                            'identity-provider-information': {
                                              name: 'Identity provider information',
                                              description: 'Configure and manage external identity providers',
                                              category: 'Identity & access management (IAM)',
                                              onClick: () => console.log('Identity provider information clicked')
                                            },
                                            'workspaces': {
                                              name: 'Workspaces',
                                              description: 'Manage organizational workspaces and their access controls',
                                              category: 'Identity & access management (IAM)',
                                              onClick: () => console.log('Workspaces clicked')
                                            },
                                            'directory-domain-services': {
                                              name: 'Directory and domain services',
                                              description: 'Configure directory services and domain management',
                                              category: 'Console settings',
                                              onClick: () => console.log('Directory and domain services clicked')
                                            },
                                            'rhel-rhc': {
                                              name: 'Remote host configuration (RHC)',
                                              description: 'Configure and manage remote host connections',
                                              category: 'Red Hat Enterprise Linux',
                                              onClick: () => console.log('Remote host configuration (RHC) clicked')
                                            },
                                            'rhel-activation-keys': {
                                              name: 'Activation keys',
                                              description: 'Manage activation keys for system registration',
                                              category: 'Red Hat Enterprise Linux',
                                              onClick: () => console.log('Activation keys clicked')
                                            },
                                            'rhel-registration-assistant': {
                                              name: 'Registration assistant',
                                              description: 'Step-by-step guidance for registering systems',
                                              category: 'Red Hat Enterprise Linux',
                                              onClick: () => console.log('Registration assistant clicked')
                                            },
                                            'rhel-staleness-deletion': {
                                              name: 'Staleness & deletion',
                                              description: 'Configure system staleness detection and automated deletion',
                                              category: 'Red Hat Enterprise Linux',
                                              onClick: () => console.log('Staleness & deletion clicked')
                                            },
                                            'ansible-registration-assistant': {
                                              name: 'Registration assistant',
                                              description: 'Guided setup for Ansible automation workflows',
                                              category: 'Red Hat Ansible Automation Platform',
                                              onClick: () => console.log('Ansible Registration assistant clicked')
                                            },
                                            'console-alert-manager': {
                                              name: 'Alert manager',
                                              description: 'Configure and manage system alerts and notifications',
                                              category: 'Console settings',
                                              onClick: () => {
                                                navigate('/alert-manager');
                                                setIsLogoDropdownOpen(false);
                                              }
                                            },
                                            'console-data-integration': {
                                              name: 'Data integration',
                                              description: 'Manage data integration workflows and connectors',
                                              category: 'Console settings',
                                              onClick: () => {
                                                navigate('/data-integrations');
                                                setIsLogoDropdownOpen(false);
                                              }
                                            },
                                            'console-dashboard-hub': {
                                              name: 'Dashboard hub',
                                              description: 'Browse, create, and organize dashboards for your workspace',
                                              category: 'Console settings',
                                              onClick: () => {
                                                navigate('/dashboard-hub');
                                                setIsLogoDropdownOpen(false);
                                              }
                                            },
                                            // Additional items from default System Configuration menu
                                            'rhel-insights': {
                                              name: 'Red Hat Insights',
                                              description: 'Proactive identification and remediation of threats',
                                              category: 'Red Hat Enterprise Linux',
                                              onClick: () => console.log('Red Hat Insights clicked')
                                            },
                                            'rhel-patch': {
                                              name: 'Patch management',
                                              description: 'Automated patching and system updates for RHEL environments',
                                              category: 'Red Hat Enterprise Linux',
                                              onClick: () => console.log('Patch management clicked')
                                            },
                                            'openshift-clusters': {
                                              name: 'OpenShift clusters',
                                              description: 'Manage and monitor your OpenShift Kubernetes clusters',
                                              category: 'Red Hat OpenShift',
                                              onClick: () => console.log('OpenShift clusters clicked')
                                            },
                                            'container-registry': {
                                              name: 'Container registry',
                                              description: 'Secure container image registry for storing and managing images',
                                              category: 'Red Hat OpenShift',
                                              onClick: () => console.log('Container registry clicked')
                                            },
                                            'automation-hub': {
                                              name: 'Automation hub',
                                              description: 'Centralized repository for Ansible content collections',
                                              category: 'Red Hat Ansible Automation Platform',
                                              onClick: () => console.log('Automation Hub clicked')
                                            },
                                            'automation-controller': {
                                              name: 'Automation controller',
                                              description: 'Enterprise automation control plane for Ansible playbooks',
                                              category: 'Red Hat Ansible Automation Platform',
                                              onClick: () => console.log('Automation Controller clicked')
                                            },
                                            'user-access-item': {
                                              name: 'User access',
                                              description: 'Manage user permissions, roles, and access controls',
                                              category: 'Identity & access management (IAM)',
                                              onClick: () => console.log('User Access clicked')
                                            },
                                            'service-accounts-item': {
                                              name: 'Service accounts',
                                              description: 'Create and manage service accounts for automated systems',
                                              category: 'Identity & access management (IAM)',
                                              onClick: () => console.log('Service Accounts clicked')
                                            },
                                            'preferences': {
                                              name: 'Preferences',
                                              description: 'Customize your console experience, themes, and settings',
                                              category: 'Console settings',
                                              onClick: () => console.log('Preferences clicked')
                                            },
                                            'notifications': {
                                              name: 'Notifications',
                                              description: 'Configure alert preferences and notification settings',
                                              category: 'Console settings',
                                              onClick: () => console.log('Notifications clicked')
                                            },
                                            'subscriptions': {
                                              name: 'Subscriptions',
                                              description: 'View and manage your Red Hat product subscriptions',
                                              category: 'Subscription services',
                                              onClick: () => console.log('Subscriptions clicked')
                                            },
                                            'billing': {
                                              name: 'Billing',
                                              description: 'Access billing information, invoices, and payment methods',
                                              category: 'Subscription services',
                                              onClick: () => console.log('Billing clicked')
                                            },
                                            'documentation': {
                                              name: 'Documentation',
                                              description: 'Access comprehensive guides and technical documentation',
                                              category: 'Other',
                                              onClick: () => console.log('Documentation clicked')
                                            },
                                            'support': {
                                              name: 'Support',
                                              description: 'Get help from Red Hat support team and submit cases',
                                              category: 'Other',
                                              onClick: () => console.log('Support clicked')
                                            }
                                          };

                                          // Group favorited items by category
                                          const favoritesByCategory: { [category: string]: Array<{ id: string, item: typeof itemMapping[string] }> } = {};
                                          
                                          Array.from(favoritedItems).forEach(itemId => {
                                            const item = itemMapping[itemId];
                                            if (item) {
                                              if (!favoritesByCategory[item.category]) {
                                                favoritesByCategory[item.category] = [];
                                              }
                                              favoritesByCategory[item.category].push({ id: itemId, item });
                                            }
                                          });

                                          // Define category order for consistent display
                                          const categoryOrder = [
                                            'Red Hat Enterprise Linux',
                                            'Red Hat OpenShift', 
                                            'Red Hat Ansible Automation Platform',
                                            'Identity & access management (IAM)',
                                            'Console settings',
                                            'Subscription services',
                                            'Other'
                                          ];

                                          return (
                                            <>
                                              {categoryOrder.map((category, categoryIndex) => {
                                                const categoryItems = favoritesByCategory[category];
                                                if (!categoryItems || categoryItems.length === 0) return null;

                                                return (
                                                  <div key={category} style={categoryIndex > 0 ? { marginTop: '24px' } : {}}>
                                                    <MenuGroup label={category} labelHeadingLevel="h2">
                                                      <Divider />
                                                      <MenuList>
                                                        {categoryItems.map(({ id, item }) => (
                                                          <MenuItem
                                                            key={id}
                                                            itemId={`favorite-${id}`}
                                                            description={item.description}
                                                            onClick={item.onClick}
                                                            actions={
                                                              <MenuItemAction
                                                                icon={<StarIcon />}
                                                                actionId="unfavorite"
                                                                onClick={(e) => {
                                                                  e.stopPropagation();
                                                                  toggleFavorite(id);
                                                                }}
                                                                isFavorited={true}
                                                                aria-label="Remove from favorites"
                                                              />
                                                            }
                                                          >
                                                            {item.name}
                                                          </MenuItem>
                                                        ))}
                                                      </MenuList>
                                                    </MenuGroup>
                                                  </div>
                                                );
                                              })}
                                            </>
                                          );
                                        })()}
                                  </Menu>
                                )
                              ) : currentMenuItem.id === 'ai-ml' ? (
                                <Menu>
                                  <MenuGroup label="Red Hat OpenShift" labelHeadingLevel="h2">
                                    <Divider />
                                    <MenuList>
                                      <MenuItem 
                                        itemId="60day-trial-openshift-ai"
                                        description="Create, train, and service artificial intelligence and machine learning (AI/ML) models."
                                        onClick={() => console.log('60-day product trial | OpenShift AI clicked')}
                                        actions={
                                          <MenuItemAction
                                            icon={<StarIcon />}
                                            actionId="favorite"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              toggleFavorite('60day-trial-openshift-ai');
                                            }}
                                            isFavorited={favoritedItems.has('60day-trial-openshift-ai')}
                                            aria-label={favoritedItems.has('60day-trial-openshift-ai') ? "Remove from favorites" : "Add to favorites"}
                                          />
                                        }
                                      >
                                        60-day product trial | OpenShift AI
                                      </MenuItem>
                                      <MenuItem 
                                        itemId="developer-sandbox-openshift-ai"
                                        description="Create, train, and service artificial intelligence and machine learning (AI/ML) models."
                                        onClick={() => console.log('Developer sandbox | OpenShift AI clicked')}
                                        actions={
                                          <MenuItemAction
                                            icon={<StarIcon />}
                                            actionId="favorite"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              toggleFavorite('developer-sandbox-openshift-ai');
                                            }}
                                            isFavorited={favoritedItems.has('developer-sandbox-openshift-ai')}
                                            aria-label={favoritedItems.has('developer-sandbox-openshift-ai') ? "Remove from favorites" : "Add to favorites"}
                                          />
                                        }
                                      >
                                        Developer sandbox | OpenShift AI
                                      </MenuItem>
                                    </MenuList>
                                  </MenuGroup>
                                </Menu>
                              ) : currentMenuItem.id === 'alerting-data-integrations' ? (
                                <Menu>
                                  <MenuGroup label="Console settings" labelHeadingLevel="h2">
                                    <Divider />
                                    <MenuList>
                                      <MenuItem 
                                        itemId="alert-manager-settings"
                                        description="Mary to add a description here eventually"
                                        onClick={() => {
                                          navigate('/alert-manager');
                                          setIsLogoDropdownOpen(false);
                                        }}
                                        actions={
                                          <MenuItemAction
                                            icon={<StarIcon />}
                                            actionId="favorite"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              toggleFavorite('alert-manager-settings');
                                            }}
                                            isFavorited={favoritedItems.has('alert-manager-settings')}
                                            aria-label={favoritedItems.has('alert-manager-settings') ? "Remove from favorites" : "Add to favorites"}
                                          />
                                        }
                                      >
                                        Alert manager | settings
                                      </MenuItem>
                                      <MenuItem 
                                        itemId="data-integration-settings"
                                        description="Mary to add a description here eventually"
                                        onClick={() => {
                                          navigate('/data-integrations');
                                          setIsLogoDropdownOpen(false);
                                        }}
                                        actions={
                                          <MenuItemAction
                                            icon={<StarIcon />}
                                            actionId="favorite"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              toggleFavorite('data-integration-settings');
                                            }}
                                            isFavorited={favoritedItems.has('data-integration-settings')}
                                            aria-label={favoritedItems.has('data-integration-settings') ? "Remove from favorites" : "Add to favorites"}
                                          />
                                        }
                                      >
                                        Data integration | settings
                                      </MenuItem>
                                      <MenuItem 
                                        itemId="event-log-settings"
                                        description="Mary to add a description here eventually"
                                        onClick={() => {
                                          navigate('/event-log');
                                          setIsLogoDropdownOpen(false);
                                        }}
                                        actions={
                                          <MenuItemAction
                                            icon={<StarIcon />}
                                            actionId="favorite"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              toggleFavorite('event-log-settings');
                                            }}
                                            isFavorited={favoritedItems.has('event-log-settings')}
                                            aria-label={favoritedItems.has('event-log-settings') ? "Remove from favorites" : "Add to favorites"}
                                          />
                                        }
                                      >
                                        Event log | settings
                                      </MenuItem>
                                      <MenuItem 
                                        itemId="overview-settings"
                                        description="Mary to add a description here evenually"
                                        onClick={() => {
                                          navigate('/overview');
                                          setIsLogoDropdownOpen(false);
                                        }}
                                        actions={
                                          <MenuItemAction
                                            icon={<StarIcon />}
                                            actionId="favorite"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              toggleFavorite('overview-settings');
                                            }}
                                            isFavorited={favoritedItems.has('overview-settings')}
                                            aria-label={favoritedItems.has('overview-settings') ? "Remove from favorites" : "Add to favorites"}
                                          />
                                        }
                                      >
                                        Overview | settings
                                      </MenuItem>
                                    </MenuList>
                                  </MenuGroup>
                                </Menu>
                              ) : currentMenuItem.id === 'identity-access-mgmt' ? (
                                <Menu>
                                  <MenuGroup label="Identity & access management (IAM)" labelHeadingLevel="h2">
                                    <Divider />
                                    <MenuList>
                                      <MenuItem 
                                        itemId="users"
                                        description="Manage user accounts and their access permissions"
                                        onClick={() => {
                                          navigate('/users');
                                          setIsLogoDropdownOpen(false);
                                        }}
                                        actions={
                                          <MenuItemAction
                                            icon={<StarIcon />}
                                            actionId="favorite"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              toggleFavorite('users');
                                            }}
                                            isFavorited={favoritedItems.has('users')}
                                            aria-label={favoritedItems.has('users') ? "Remove from favorites" : "Add to favorites"}
                                          />
                                        }
                                      >
                                        Users
                                      </MenuItem>
                                      <MenuItem 
                                        itemId="groups"
                                        description="Create and manage user groups and group-based permissions"
                                        onClick={() => {
                                          navigate('/groups');
                                          setIsLogoDropdownOpen(false);
                                        }}
                                        actions={
                                          <MenuItemAction
                                            icon={<StarIcon />}
                                            actionId="favorite"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              toggleFavorite('groups');
                                            }}
                                            isFavorited={favoritedItems.has('groups')}
                                            aria-label={favoritedItems.has('groups') ? "Remove from favorites" : "Add to favorites"}
                                          />
                                        }
                                      >
                                        Groups
                                      </MenuItem>
                                      <MenuItem 
                                        itemId="roles"
                                        description="Define and manage user roles with specific permissions and access levels"
                                        onClick={() => {
                                          navigate('/roles');
                                          setIsLogoDropdownOpen(false);
                                        }}
                                        actions={
                                          <MenuItemAction
                                            icon={<StarIcon />}
                                            actionId="favorite"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              toggleFavorite('roles');
                                            }}
                                            isFavorited={favoritedItems.has('roles')}
                                            aria-label={favoritedItems.has('roles') ? "Remove from favorites" : "Add to favorites"}
                                          />
                                        }
                                      >
                                        Roles
                                      </MenuItem>
                                      <MenuItem 
                                        itemId="authentication-factors"
                                        description="Configure multi-factor authentication and security settings"
                                        onClick={() => console.log('Authentication factors clicked')}
                                        actions={
                                          <MenuItemAction
                                            icon={<StarIcon />}
                                            actionId="favorite"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              toggleFavorite('authentication-factors');
                                            }}
                                            isFavorited={favoritedItems.has('authentication-factors')}
                                            aria-label={favoritedItems.has('authentication-factors') ? "Remove from favorites" : "Add to favorites"}
                                          />
                                        }
                                      >
                                        Authentication factors
                                      </MenuItem>
                                      <MenuItem 
                                        itemId="service-accounts"
                                        description="Create and manage service accounts for automated systems and application integrations"
                                        onClick={() => console.log('Service accounts clicked')}
                                        actions={
                                          <MenuItemAction
                                            icon={<StarIcon />}
                                            actionId="favorite"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              toggleFavorite('service-accounts');
                                            }}
                                            isFavorited={favoritedItems.has('service-accounts')}
                                            aria-label={favoritedItems.has('service-accounts') ? "Remove from favorites" : "Add to favorites"}
                                          />
                                        }
                                      >
                                        Service accounts
                                      </MenuItem>
                                      <MenuItem 
                                        itemId="identity-provider-information"
                                        description="Configure and manage external identity providers and federation settings"
                                        onClick={() => console.log('Identity provider information clicked')}
                                        actions={
                                          <MenuItemAction
                                            icon={<StarIcon />}
                                            actionId="favorite"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              toggleFavorite('identity-provider-information');
                                            }}
                                            isFavorited={favoritedItems.has('identity-provider-information')}
                                            aria-label={favoritedItems.has('identity-provider-information') ? "Remove from favorites" : "Add to favorites"}
                                          />
                                        }
                                      >
                                        Identity provider information
                                      </MenuItem>
                                      <MenuItem 
                                        itemId="workspaces"
                                        description="Manage organizational workspaces and their access controls"
                                        onClick={() => console.log('Workspaces clicked')}
                                        actions={
                                          <MenuItemAction
                                            icon={<StarIcon />}
                                            actionId="favorite"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              toggleFavorite('workspaces');
                                            }}
                                            isFavorited={favoritedItems.has('workspaces')}
                                            aria-label={favoritedItems.has('workspaces') ? "Remove from favorites" : "Add to favorites"}
                                          />
                                        }
                                      >
                                        Workspaces
                                      </MenuItem>
                                    </MenuList>
                                  </MenuGroup>
                                  
                                  <div style={{ marginTop: '24px' }}>
                                    <MenuGroup label="Console settings" labelHeadingLevel="h2">
                                      <Divider />
                                      <MenuList>
                                        <MenuItem 
                                                                                  itemId="directory-domain-services"
                                        description="Configure directory services and domain management settings"
                                        onClick={() => console.log('Directory and domain services clicked')}
                                        actions={
                                          <MenuItemAction
                                            icon={<StarIcon />}
                                            actionId="favorite"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              toggleFavorite('directory-domain-services');
                                            }}
                                            isFavorited={favoritedItems.has('directory-domain-services')}
                                            aria-label={favoritedItems.has('directory-domain-services') ? "Remove from favorites" : "Add to favorites"}
                                            />
                                          }
                                        >
                                          Directory and domain services
                                        </MenuItem>
                                      </MenuList>
                                    </MenuGroup>
                                            </div>
                                </Menu>
                              ) : currentMenuItem.id === 'system-configuration' ? (
                                <Menu>
                                  <MenuGroup label="Red Hat Enterprise Linux" labelHeadingLevel="h2">
                                    <Divider />
                                    <MenuList>
                                      <MenuItem 
                                        itemId="rhel-rhc"
                                        description="Configure and manage remote host connections and system configurations"
                                        onClick={() => console.log('Remote host configuration (RHC) clicked')}
                                        actions={
                                          <MenuItemAction
                                            icon={<StarIcon />}
                                            actionId="favorite"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              toggleFavorite('rhel-rhc');
                                            }}
                                            isFavorited={favoritedItems.has('rhel-rhc')}
                                            aria-label={favoritedItems.has('rhel-rhc') ? "Remove from favorites" : "Add to favorites"}
                                          />
                                        }
                                      >
                                        Remote host configuration (RHC)
                                      </MenuItem>
                                      <MenuItem 
                                        itemId="rhel-activation-keys"
                                        description="Manage activation keys for system registration and subscription management"
                                        onClick={() => console.log('Activation keys clicked')}
                                        actions={
                                          <MenuItemAction
                                            icon={<StarIcon />}
                                            actionId="favorite"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              toggleFavorite('rhel-activation-keys');
                                            }}
                                            isFavorited={favoritedItems.has('rhel-activation-keys')}
                                            aria-label={favoritedItems.has('rhel-activation-keys') ? "Remove from favorites" : "Add to favorites"}
                                          />
                                        }
                                      >
                                        Activation keys
                                      </MenuItem>
                                      <MenuItem 
                                        itemId="rhel-registration-assistant"
                                        description="Step-by-step guidance for registering systems to Red Hat services"
                                        onClick={() => console.log('Registration assistant clicked')}
                                        actions={
                                          <MenuItemAction
                                            icon={<StarIcon />}
                                            actionId="favorite"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              toggleFavorite('rhel-registration-assistant');
                                            }}
                                            isFavorited={favoritedItems.has('rhel-registration-assistant')}
                                            aria-label={favoritedItems.has('rhel-registration-assistant') ? "Remove from favorites" : "Add to favorites"}
                                          />
                                        }
                                      >
                                        Registration assistant
                                      </MenuItem>
                                      <MenuItem 
                                        itemId="rhel-staleness-deletion"
                                        description="Configure system staleness detection and automated deletion policies"
                                        onClick={() => console.log('Staleness & deletion clicked')}
                                        actions={
                                          <MenuItemAction
                                            icon={<StarIcon />}
                                            actionId="favorite"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              toggleFavorite('rhel-staleness-deletion');
                                            }}
                                            isFavorited={favoritedItems.has('rhel-staleness-deletion')}
                                            aria-label={favoritedItems.has('rhel-staleness-deletion') ? "Remove from favorites" : "Add to favorites"}
                                          />
                                        }
                                      >
                                        Staleness & deletion
                                      </MenuItem>
                                    </MenuList>
                                  </MenuGroup>
                                  
                                  <div style={{ marginTop: '24px' }}>
                                    <MenuGroup label="Red Hat Ansible Automation Platform" labelHeadingLevel="h2">
                                      <Divider />
                                      <MenuList>
                                        <MenuItem 
                                                                                  itemId="ansible-registration-assistant"
                                        description="Guided setup for registering and configuring Ansible automation workflows"
                                        onClick={() => console.log('Ansible Registration assistant clicked')}
                                        actions={
                                          <MenuItemAction
                                            icon={<StarIcon />}
                                            actionId="favorite"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              toggleFavorite('ansible-registration-assistant');
                                            }}
                                            isFavorited={favoritedItems.has('ansible-registration-assistant')}
                                            aria-label={favoritedItems.has('ansible-registration-assistant') ? "Remove from favorites" : "Add to favorites"}
                                            />
                                          }
                                        >
                                          Registration assistant
                                        </MenuItem>
                                      </MenuList>
                                    </MenuGroup>
                                  </div>
                                  
                                  <div style={{ marginTop: '24px' }}>
                                    <MenuGroup label="Console settings" labelHeadingLevel="h2">
                                      <Divider />
                                      <MenuList>
                                        <MenuItem 
                                                                                  itemId="console-alert-manager"
                                        description="Configure and manage system alerts, notifications, and escalation policies"
                                        onClick={() => {
                                          navigate('/alert-manager');
                                          setIsLogoDropdownOpen(false);
                                        }}
                                        actions={
                                          <MenuItemAction
                                            icon={<StarIcon />}
                                            actionId="favorite"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              toggleFavorite('console-alert-manager');
                                            }}
                                            isFavorited={favoritedItems.has('console-alert-manager')}
                                            aria-label={favoritedItems.has('console-alert-manager') ? "Remove from favorites" : "Add to favorites"}
                                            />
                                          }
                                        >
                                          Alert manager
                                        </MenuItem>
                                        <MenuItem 
                                                                                  itemId="console-data-integration"
                                        description="Manage data integration workflows, connectors, and synchronization settings"
                                        onClick={() => {
                                          navigate('/data-integrations');
                                          setIsLogoDropdownOpen(false);
                                        }}
                                        actions={
                                          <MenuItemAction
                                            icon={<StarIcon />}
                                            actionId="favorite"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              toggleFavorite('console-data-integration');
                                            }}
                                            isFavorited={favoritedItems.has('console-data-integration')}
                                            aria-label={favoritedItems.has('console-data-integration') ? "Remove from favorites" : "Add to favorites"}
                                            />
                                          }
                                        >
                                          Data integration
                                        </MenuItem>
                                        <MenuItem
                                          itemId="console-dashboard-hub"
                                          description="Browse, create, and organize dashboards for your workspace"
                                          onClick={() => {
                                            navigate('/dashboard-hub');
                                            setIsLogoDropdownOpen(false);
                                          }}
                                          actions={
                                            <MenuItemAction
                                              icon={<StarIcon />}
                                              actionId="favorite"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                toggleFavorite('console-dashboard-hub');
                                              }}
                                              isFavorited={favoritedItems.has('console-dashboard-hub')}
                                              aria-label={
                                                favoritedItems.has('console-dashboard-hub')
                                                  ? 'Remove from favorites'
                                                  : 'Add to favorites'
                                              }
                                            />
                                          }
                                        >
                                          Dashboard hub
                                        </MenuItem>
                                      </MenuList>
                                    </MenuGroup>
                                  </div>
                                </Menu>
                              ) : (
                                <Menu>
                                  <MenuGroup label="Red Hat Enterprise Linux" labelHeadingLevel="h2">
                                    <Divider />
                                    <MenuList>
                                      <MenuItem 
                                        itemId="rhel-insights"
                                        description="Proactive identification and remediation of threats to security, performance, availability, and stability"
                                        onClick={() => console.log('Red Hat Insights clicked')}
                                        actions={
                                          <MenuItemAction
                                            icon={<StarIcon />}
                                            actionId="favorite"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              toggleFavorite('rhel-insights');
                                            }}
                                            isFavorited={favoritedItems.has('rhel-insights')}
                                            aria-label={favoritedItems.has('rhel-insights') ? "Remove from favorites" : "Add to favorites"}
                                          />
                                        }
                                      >
                                        Red Hat Insights
                                      </MenuItem>
                                      <MenuItem 
                                        itemId="rhel-patch"
                                        description="Automated patching and system updates for Red Hat Enterprise Linux environments"
                                        onClick={() => console.log('Patch management clicked')}
                                        actions={
                                          <MenuItemAction
                                            icon={<StarIcon />}
                                            actionId="favorite"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              toggleFavorite('rhel-patch');
                                            }}
                                            isFavorited={favoritedItems.has('rhel-patch')}
                                            aria-label={favoritedItems.has('rhel-patch') ? "Remove from favorites" : "Add to favorites"}
                                          />
                                        }
                                      >
                                        Patch management
                                      </MenuItem>
                                    </MenuList>
                                  </MenuGroup>
                                  
                                  <div style={{ marginTop: '24px' }}>
                                    <MenuGroup label="Red Hat OpenShift" labelHeadingLevel="h2">
                                      <Divider />
                                      <MenuList>
                                        <MenuItem 
                                          itemId="openshift-clusters"
                                          description="Manage and monitor your OpenShift Kubernetes clusters across hybrid cloud environments"
                                          onClick={() => console.log('OpenShift clusters clicked')}
                                          actions={
                                            <MenuItemAction
                                              icon={<StarIcon />}
                                              actionId="favorite"
                                              onClick={(e) => {
                                              e.stopPropagation();
                                              toggleFavorite('openshift-clusters');
                                            }}
                                              isFavorited={favoritedItems.has('openshift-clusters')}
                                            aria-label={favoritedItems.has('openshift-clusters') ? "Remove from favorites" : "Add to favorites"}
                                            />
                                          }
                                        >
                                          OpenShift clusters
                                        </MenuItem>
                                        <MenuItem 
                                          itemId="container-registry"
                                          description="Secure container image registry for storing, managing, and deploying container images"
                                          onClick={() => console.log('Container registry clicked')}
                                          actions={
                                            <MenuItemAction
                                              icon={<StarIcon />}
                                              actionId="favorite"
                                              onClick={(e) => {
                                              e.stopPropagation();
                                              toggleFavorite('container-registry');
                                            }}
                                              isFavorited={favoritedItems.has('container-registry')}
                                            aria-label={favoritedItems.has('container-registry') ? "Remove from favorites" : "Add to favorites"}
                                            />
                                          }
                                        >
                                          Container registry
                                        </MenuItem>
                                      </MenuList>
                                    </MenuGroup>
                                  </div>
                                  
                                  <div style={{ marginTop: '24px' }}>
                                    <MenuGroup label="Red Hat Ansible Automation Platform" labelHeadingLevel="h2">
                                      <Divider />
                                      <MenuList>
                                        <MenuItem 
                                          itemId="automation-hub"
                                          description="Centralized repository for discovering, downloading, and sharing Ansible content collections"
                                          onClick={() => console.log('Automation Hub clicked')}
                                          actions={
                                            <MenuItemAction
                                              icon={<StarIcon />}
                                              actionId="favorite"
                                              onClick={(e) => {
                                              e.stopPropagation();
                                              toggleFavorite('automation-hub');
                                            }}
                                              isFavorited={favoritedItems.has('automation-hub')}
                                            aria-label={favoritedItems.has('automation-hub') ? "Remove from favorites" : "Add to favorites"}
                                            />
                                          }
                                        >
                                          Automation hub
                                        </MenuItem>
                                        <MenuItem 
                                          itemId="automation-controller"
                                          description="Enterprise automation control plane for scheduling, scaling, and managing Ansible playbooks"
                                          onClick={() => console.log('Automation Controller clicked')}
                                          actions={
                                            <MenuItemAction
                                              icon={<StarIcon />}
                                              actionId="favorite"
                                              onClick={(e) => {
                                              e.stopPropagation();
                                              toggleFavorite('automation-controller');
                                            }}
                                              isFavorited={favoritedItems.has('automation-controller')}
                                            aria-label={favoritedItems.has('automation-controller') ? "Remove from favorites" : "Add to favorites"}
                                            />
                                          }
                                        >
                                          Automation controller
                                        </MenuItem>
                                      </MenuList>
                                    </MenuGroup>
                                  </div>
                                  
                                  <div style={{ marginTop: '24px' }}>
                                    <MenuGroup label="Identity & access management (IAM)" labelHeadingLevel="h2">
                                      <Divider />
                                      <MenuList>
                                        <MenuItem 
                                          itemId="user-access"
                                          description="Manage user permissions, roles, and access controls across Red Hat services"
                                          onClick={() => console.log('User Access clicked')}
                                          actions={
                                            <MenuItemAction
                                              icon={<StarIcon />}
                                              actionId="favorite"
                                              onClick={(e) => {
                                              e.stopPropagation();
                                              toggleFavorite('user-access-item');
                                            }}
                                              isFavorited={favoritedItems.has('user-access-item')}
                                            aria-label={favoritedItems.has('user-access-item') ? "Remove from favorites" : "Add to favorites"}
                                            />
                                          }
                                        >
                                          User access
                                        </MenuItem>
                                        <MenuItem 
                                          itemId="service-accounts"
                                          description="Create and manage service accounts for automated systems and application integrations"
                                          onClick={() => console.log('Service accounts clicked')}
                                          actions={
                                            <MenuItemAction
                                              icon={<StarIcon />}
                                              actionId="favorite"
                                              onClick={(e) => {
                                              e.stopPropagation();
                                              toggleFavorite('service-accounts-item');
                                            }}
                                              isFavorited={favoritedItems.has('service-accounts-item')}
                                            aria-label={favoritedItems.has('service-accounts-item') ? "Remove from favorites" : "Add to favorites"}
                                            />
                                          }
                                        >
                                          Service accounts
                                        </MenuItem>
                                      </MenuList>
                                    </MenuGroup>
                                  </div>
                                  
                                  <div style={{ marginTop: '24px' }}>
                                    <MenuGroup label="Console settings" labelHeadingLevel="h2">
                                      <Divider />
                                      <MenuList>
                                        <MenuItem 
                                          itemId="preferences"
                                          description="Customize your console experience, themes, and personal settings"
                                          onClick={() => console.log('Preferences clicked')}
                                          actions={
                                            <MenuItemAction
                                              icon={<StarIcon />}
                                              actionId="favorite"
                                              onClick={(e) => {
                                              e.stopPropagation();
                                              toggleFavorite('preferences');
                                            }}
                                              isFavorited={favoritedItems.has('preferences')}
                                            aria-label={favoritedItems.has('preferences') ? "Remove from favorites" : "Add to favorites"}
                                            />
                                          }
                                        >
                                          Preferences
                                        </MenuItem>
                                        <MenuItem 
                                          itemId="notifications"
                                          description="Configure alert preferences and notification settings for system events"
                                          onClick={() => console.log('Notifications clicked')}
                                          actions={
                                            <MenuItemAction
                                              icon={<StarIcon />}
                                              actionId="favorite"
                                              onClick={(e) => {
                                              e.stopPropagation();
                                              toggleFavorite('notifications');
                                            }}
                                              isFavorited={favoritedItems.has('notifications')}
                                            aria-label={favoritedItems.has('notifications') ? "Remove from favorites" : "Add to favorites"}
                                            />
                                          }
                                        >
                                          Notifications
                                        </MenuItem>
                                      </MenuList>
                                    </MenuGroup>
                                  </div>
                                  
                                  <div style={{ marginTop: '24px' }}>
                                    <MenuGroup label="Subscription services" labelHeadingLevel="h2">
                                      <Divider />
                                      <MenuList>
                                        <MenuItem 
                                          itemId="subscriptions"
                                          description="View and manage your Red Hat product subscriptions and entitlements"
                                          onClick={() => console.log('Subscriptions clicked')}
                                          actions={
                                            <MenuItemAction
                                              icon={<StarIcon />}
                                              actionId="favorite"
                                              onClick={(e) => {
                                              e.stopPropagation();
                                              toggleFavorite('subscriptions');
                                            }}
                                              isFavorited={favoritedItems.has('subscriptions')}
                                            aria-label={favoritedItems.has('subscriptions') ? "Remove from favorites" : "Add to favorites"}
                                            />
                                          }
                                        >
                                          Subscriptions
                                        </MenuItem>
                                        <MenuItem 
                                          itemId="billing"
                                          description="Access billing information, invoices, and payment methods for Red Hat services"
                                          onClick={() => console.log('Billing clicked')}
                                          actions={
                                            <MenuItemAction
                                              icon={<StarIcon />}
                                              actionId="favorite"
                                              onClick={(e) => {
                                              e.stopPropagation();
                                              toggleFavorite('billing');
                                            }}
                                              isFavorited={favoritedItems.has('billing')}
                                            aria-label={favoritedItems.has('billing') ? "Remove from favorites" : "Add to favorites"}
                                            />
                                          }
                                        >
                                          Billing
                                        </MenuItem>
                                      </MenuList>
                                    </MenuGroup>
                                  </div>
                                  
                                  <div style={{ marginTop: '24px' }}>
                                    <MenuGroup label="Other" labelHeadingLevel="h2">
                                      <Divider />
                                      <MenuList>
                                        <MenuItem 
                                          itemId="documentation"
                                          description="Access comprehensive guides, tutorials, and technical documentation for Red Hat products"
                                          onClick={() => console.log('Documentation clicked')}
                                          actions={
                                            <MenuItemAction
                                              icon={<StarIcon />}
                                              actionId="favorite"
                                              onClick={(e) => {
                                              e.stopPropagation();
                                              toggleFavorite('documentation');
                                            }}
                                              isFavorited={favoritedItems.has('documentation')}
                                            aria-label={favoritedItems.has('documentation') ? "Remove from favorites" : "Add to favorites"}
                                            />
                                          }
                                        >
                                          Documentation
                                        </MenuItem>
                                        <MenuItem 
                                          itemId="support"
                                          description="Get help from Red Hat support team, submit cases, and access community resources"
                                          onClick={() => console.log('Support clicked')}
                                          actions={
                                            <MenuItemAction
                                              icon={<StarIcon />}
                                              actionId="favorite"
                                              onClick={(e) => {
                                              e.stopPropagation();
                                              toggleFavorite('support');
                                            }}
                                              isFavorited={favoritedItems.has('support')}
                                            aria-label={favoritedItems.has('support') ? "Remove from favorites" : "Add to favorites"}
                                            />
                                          }
                                        >
                                          Support
                                        </MenuItem>
                                      </MenuList>
                                    </MenuGroup>
                                  </div>
                                </Menu>
                              )}
                            </FlexItem>
                          </Flex>
                        );
                      })()}
                </div>
              </SplitItem>
            </Split>
          </div>
        </div>
      )}
      
      {/* Floating Comments Button */}
      <div
        style={{
          position: 'fixed',
          bottom: '32px',
          right: isDrawerExpanded ? `${helpPanelWidth + 32}px` : '32px', // 32px from panel edge when open, 32px from viewport edge when closed
          width: '56px',
          height: '56px',
          zIndex: 1000,
          transition: 'right 0.2s ease-in-out',
        }}
      >
        <Button
          variant="plain"
          onClick={() => {
            setCustomHelpTitle(null);
            setCustomHelpVariant(null);
            setHelpPanelSubTab(5);
            setIsDrawerExpanded(true);
          }}
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: '#ee0000',
            border: 'none',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
          }}
          aria-label="Open help chat"
        >
          <img
            src={HappyRobotIcon}
            alt=""
            aria-hidden
            style={{
              width: '28px',
              height: 'auto',
              aspectRatio: '1 / 1',
              display: 'block',
              objectFit: 'contain',
              flexShrink: 0,
              filter: 'brightness(0) invert(1)'
            }}
          />
        </Button>
      </div>

      {/* PatternFly Tooltips for truncated overflow menu items */}
      {overflowTooltips.map((tooltip, index) => (
        <Tooltip
          key={`overflow-${tooltip.text}-${index}`}
          content={tooltip.text}
          triggerRef={() => document.querySelector(tooltip.selector) as HTMLElement}
          entryDelay={100}
          exitDelay={0}
          animationDuration={100}
          position="top"
        />
      ))}
      
    </>
  );
};

export { AppLayout };
