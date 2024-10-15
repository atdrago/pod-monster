import { ExternalLink } from 'components/atoms/ExternalLink';
import { Icon } from 'components/atoms/Icon';
import { Typography } from 'components/atoms/Typography';
import { Stack } from 'components/layouts/Stack';
import FundingIcon from 'icons/aid-kit.svg';
import ExternalLinkIcon from 'icons/arrow-up-right2.svg';

interface FundingProps {
  funding?: {
    message: string;
    url: string;
  } | null;
}

export const Funding = ({ funding }: FundingProps) => {
  if (!funding) {
    return null;
  }

  return (
    <Stack
      as={ExternalLink}
      href={funding.url}
      kind="flexRow"
      space="small"
      style={{ marginLeft: 0, marginRight: 'auto', width: 'auto' }}
    >
      <Icon as={FundingIcon} size="xsmall" />
      <Typography as="h4" size="headingSmaller">
        {funding.message}
      </Typography>
      <Icon as={ExternalLinkIcon} size="small" />
    </Stack>
  );
};
