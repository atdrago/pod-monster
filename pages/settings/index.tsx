import type { GetStaticProps } from 'next';
import Link from 'next/link';
import { FunctionComponent, ReactEventHandler, useState } from 'react';
import { useMutation } from 'react-query';

import { Checkbox } from 'components/atoms/Checkbox';
import { Head } from 'components/atoms/Head';
import { Typography } from 'components/atoms/Typography';
import { Stack } from 'components/layouts/Stack';
import { FileField } from 'components/molecules/FileField';
import { useSettingsContext } from 'contexts/SettingsContext';
import { useOpmlFileUrl } from 'hooks/useOpmlFileUrl';
import DownloadIcon from 'icons/download2.svg';
import { fetchOpmlImport } from 'rest/fetchOpmlImport';
import { listItem, listLayout, underlinedLink } from 'styles';
import type { IApiErrorResponse, OpmlImportResponse } from 'types';

export const getStaticProps: GetStaticProps = () => {
  return {
    props: {},
  };
};

const SettingsPage: FunctionComponent = () => {
  const opmlFileUrl = useOpmlFileUrl();
  const [shouldMergeOpmlImport, setShouldMergeOpmlImport] = useState(true);
  const { feedSettings, setAllFeedSettings } = useSettingsContext();
  const hasExistingSubscriptions = Object.keys(feedSettings).length > 0;

  const { data, error, isError, isLoading, isSuccess, mutate } = useMutation<
    OpmlImportResponse,
    IApiErrorResponse,
    { file: File }
  >(async ({ file }) => await fetchOpmlImport(file), {
    onSuccess: (successData) => {
      if (successData?.feedSettings) {
        if (!shouldMergeOpmlImport) {
          setAllFeedSettings(successData.feedSettings);
        } else {
          setAllFeedSettings({
            ...feedSettings,
            ...successData.feedSettings,
          });
        }
      }
    },
  });

  const handleFileChange: ReactEventHandler<HTMLInputElement> = async (
    event
  ) => {
    const file = event.currentTarget.files?.[0];

    if (file) {
      if (
        hasExistingSubscriptions &&
        !shouldMergeOpmlImport &&
        !window.confirm(
          'Are you sure you want to remove your existing Pod Monster subscriptions and subscribe to the podcasts in this OPML file instead?'
        )
      ) {
        return;
      }

      mutate({ file });
    }
  };

  return (
    <>
      <Head titles={['Settings']} description={`Pod Monster settings`} />
      <Stack as="main" maxWidth="small">
        <Stack as="section">
          <Typography as="h3" size="headingMedium">
            OPML
          </Typography>
          <Typography as="p" size="paragraph">
            <a
              className={underlinedLink}
              href="http://opml.org/"
              target="_blank"
              rel="noreferrer noopener"
            >
              OPML
            </a>{' '}
            is a standard format for exchanging groups of RSS feeds. And since a
            podcast is just an RSS feed that points to an audio or video file,
            OPML is commonly used to import and export podcast subscriptions
            between applications.
          </Typography>
          {opmlFileUrl ? (
            <Stack as="section" space="small">
              <Typography as="h3" size="headingSmall">
                Export
              </Typography>
              <Typography as="p" size="paragraph">
                <Stack
                  className={underlinedLink}
                  as="a"
                  kind="flexRow"
                  space="xsmall"
                  align="center"
                  href={opmlFileUrl}
                  download="podmonster.opml"
                >
                  <DownloadIcon aria-hidden="true" />
                  Download subscriptions as OPML
                </Stack>
              </Typography>
            </Stack>
          ) : null}
          <Stack as="section" space="small">
            <Typography as="h3" size="headingSmall">
              Import
            </Typography>
            {hasExistingSubscriptions ? (
              <Checkbox
                checked={shouldMergeOpmlImport}
                onChange={(event) =>
                  setShouldMergeOpmlImport(event.currentTarget.checked)
                }
              >
                Merge imported podcasts with existing subscriptions
              </Checkbox>
            ) : null}
            <div>
              <FileField
                accept=".opml, .xml, application/xml, text/xml, text/x-opml"
                isLoading={isLoading}
                onChange={handleFileChange}
                label="Import OPML"
                loadingLabel="Importing..."
              />
            </div>
            {isError && error?.error ? (
              <Typography as="p" size="paragraph">
                The following error occurred during the import:{' '}
                {error?.error.message}
              </Typography>
            ) : null}
            {isSuccess && data && 'errors' in data ? (
              data.errors.length > 0 ? (
                <>
                  <Typography as="p" size="paragraph">
                    All feeds except the following were imported:
                  </Typography>
                  <Typography
                    as="ul"
                    className={listLayout}
                    size="paragraph"
                    shouldUseCapsize={false}
                  >
                    {data.errors.map(({ title }, i) => {
                      return (
                        <li className={listItem} key={i}>
                          {title}
                        </li>
                      );
                    })}
                  </Typography>
                </>
              ) : (
                <Typography as="p" size="paragraph">
                  All feeds were imported successfully.{' '}
                  <Link className={underlinedLink} href="/">
                    View all subscriptions.
                  </Link>
                </Typography>
              )
            ) : null}
          </Stack>
        </Stack>
      </Stack>
    </>
  );
};

export default SettingsPage;
