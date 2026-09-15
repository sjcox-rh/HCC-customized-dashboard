import * as React from 'react';
import {
  Button,
  Content,
  ClipboardCopy,
  ClipboardCopyVariant,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalVariant
} from '@patternfly/react-core';
import { ShareAltIcon } from '@app/icons/rhUiIcons';
import { SHARE_DASHBOARD_MENU_LABEL } from '@app/useCopyConfigFeedback';

export type CopyConfigStringModalProps = {
  isOpen: boolean;
  onClose: () => void;
  configString: string;
};

const CopyConfigStringModal: React.FunctionComponent<CopyConfigStringModalProps> = ({
  isOpen,
  onClose,
  configString
}) => {
  const handleCopy = React.useCallback(() => {
    void navigator.clipboard.writeText(configString);
  }, [configString]);

  return (
    <Modal
      variant={ModalVariant.medium}
      isOpen={isOpen}
      onClose={onClose}
      aria-labelledby="copy-config-string-modal-title"
    >
      <ModalHeader
        labelId="copy-config-string-modal-title"
        title={SHARE_DASHBOARD_MENU_LABEL}
        titleIconVariant={ShareAltIcon}
      />
      <ModalBody>
        <Content className="hcc-copy-config-modal-intro" style={{ marginBottom: 'var(--pf-t--global--spacer--md)' }}>
          <p>
            Use this JSON configuration to share this dashboard with others. Copy the config below
            and send it to anyone in your organization — they can import it from their own Dashboard
            Hub to recreate this dashboard in their account.
          </p>
        </Content>
        <ClipboardCopy
          isReadOnly
          isExpanded
          hoverTip="Copy"
          clickTip="Copied"
          variant={ClipboardCopyVariant.expansion}
          className="hcc-copy-config-code-block"
        >
          {configString}
        </ClipboardCopy>
      </ModalBody>
      <ModalFooter>
        <Button variant="primary" onClick={() => { handleCopy(); onClose(); }}>
          Copy JSON config to share
        </Button>
        <Button variant="link" onClick={onClose}>
          Close
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export { CopyConfigStringModal };
