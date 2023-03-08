import React from 'react';
import clsx from 'clsx';
import { FiGithub, FiPlay } from 'react-icons/fi';
import {
  TbArrowMergeBoth,
  TbArrowUpCircle,
  TbChefHat,
  TbPlugConnected,
  TbRepeat,
  TbServer,
} from 'react-icons/tb';
import { BsBoxSeam } from 'react-icons/bs';
import { Anchor, Image } from '@theguild/components';
import Link from 'next/link';

const classes = {
  button:
    'inline-block bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 text-gray-600 px-6 py-3 rounded-lg font-medium shadow-sm',
  link: 'text-primary-500',
};

const gradients: [string, string][] = [
  ['#8b5cf6', '#6d28d9'], // violet
  ['#06b6d4', '#0e7490'], // cyan
  ['#f59e0b', '#d97706'], // amber
  ['#ec4899', '#db2777'], // pink
];

function pickGradient(i: number) {
  const gradient = gradients[i % gradients.length];
  if (!gradient) {
    throw new Error('No gradient found');
  }
  return gradient;
}

export function Index() {
  return (
    <>
      <AltBackground>
        <div className="container py-20 sm:py-24 lg:py-32">
          <h1 className="max-w-screen-md mx-auto font-extrabold text-5xl sm:text-5xl lg:text-6xl text-center bg-gradient-to-r from-blue-700 to-red-400 dark:from-blue-700 dark:to-red-400 bg-clip-text text-transparent !leading-tight">
            GraphQL SSE
          </h1>
          <p className="max-w-screen-sm mx-auto mt-6 text-2xl text-gray-600 text-center dark:text-gray-400">
            Zero-dependency, HTTP/1 safe, simple, spec compliant server and
            client.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Anchor
              className={clsx(
                classes.button,
                'flex flex-row gap-2 items-center',
              )}
              href="/get-started"
            >
              <FiPlay /> Get Started
            </Anchor>
            <Anchor
              className={clsx(
                classes.button,
                'flex flex-row gap-2 items-center',
              )}
              href="/recipes"
            >
              <TbChefHat /> Recipes
            </Anchor>
            <Anchor
              className={clsx(
                classes.button,
                'flex flex-row gap-2 items-center',
              )}
              href="https://github.com/enisdenjo/graphql-sse"
            >
              <FiGithub /> GitHub
            </Anchor>
          </div>
        </div>
      </AltBackground>

      <Feature
        gradient={0}
        image="TODO"
        title="Spec Compliant"
        description={
          <div className="flex flex-col gap-y-12">
            <div>
              <p>
                As a reference implementation, the library is fully compliant
                with the{' '}
                <Link
                  href="https://github.com/enisdenjo/graphql-sse/blob/master/PROTOCOL.md"
                  className={classes.link}
                >
                  GraphQL over SSE (Server-Sent Events) spec
                </Link>
                .
              </p>
            </div>
            <div className="flex flex-col gap-y-12">
              <FeatureHighlights
                textColor={gradients[0][0]}
                highlights={[
                  {
                    icon: <TbArrowMergeBoth size={36} />,
                    title: 'Single connection mode',
                    description:
                      'Safe for HTTP/1 servers and subscription heavy apps',
                  },
                  {
                    icon: <TbPlugConnected size={36} />,
                    title: 'Distinct connection mode',
                    description: 'Each connection is a subscription on its own',
                  },
                  {
                    icon: <TbArrowUpCircle size={36} />,
                    title: 'Upgrade over regular SSE',
                    description:
                      'Contains improvements for clarity and stability',
                  },
                ]}
              />
            </div>
          </div>
        }
      />

      <AltBackground>
        <Feature
          flipped
          gradient={1}
          image="TODO"
          title="Server and Client"
          description={
            <div className="flex flex-col gap-y-12">
              <div>
                <p>
                  Single library, but both the server and the client is
                  included.
                </p>
              </div>
              <div className="flex flex-col gap-y-12">
                <FeatureHighlights
                  textColor={gradients[1][0]}
                  highlights={[
                    {
                      link: 'https://bundlephobia.com/package/graphql-sse',
                      icon: <BsBoxSeam size={36} />,
                      title: 'Still small bundle',
                      description:
                        'Thanks to tree-shaking and module separation',
                    },
                    {
                      icon: <TbRepeat size={36} />,
                      title: 'Smart retry strategies',
                      description:
                        'Customize the reconnection process to your desires',
                    },
                    {
                      icon: <TbServer size={36} />,
                      title: 'Run everywhere',
                      description:
                        'Completely server agnostic, run them both anywhere',
                    },
                  ]}
                />
              </div>
            </div>
          }
        />
      </AltBackground>

      <Feature
        flipped
        gradient={2}
        icon={<TbChefHat />}
        title="Recipes"
        description={
          <div className="flex flex-col gap-y-12">
            <div>
              <p className="text-center">
                Short and concise code snippets for starting with common
                use-cases.
              </p>
            </div>
            <div className="flex flex-col gap-y-12">
              <ul>
                <li>
                  <Link
                    className={clsx(
                      classes.link,
                      'text-amber-600 dark:text-amber-300',
                    )}
                    href="/recipes#client-usage-with-async-iterator"
                  >
                    Client usage with AsyncIterator
                  </Link>
                </li>
                <li>
                  <Link
                    className={clsx(
                      classes.link,
                      'text-amber-600 dark:text-amber-300',
                    )}
                    href="/recipes#client-usage-with-relay"
                  >
                    Client usage with Relay
                  </Link>
                </li>
                <li>
                  <Link
                    className={clsx(
                      classes.link,
                      'text-amber-600 dark:text-amber-300',
                    )}
                    href="/recipes#server-handler-usage-with-custom-context-value"
                  >
                    Server handler usage with custom context value
                  </Link>
                </li>
                <li>
                  <Link
                    className={clsx(
                      classes.link,
                      'text-amber-600 dark:text-amber-300',
                    )}
                    href="/recipes#server-handler-and-client-usage-with-persisted-queries"
                  >
                    Server handler and client usage with persisted queries
                  </Link>
                </li>
                <li className="flex mt-6">
                  <Anchor
                    className={clsx(
                      classes.button,
                      'bg-amber-200 text-amber-600 hover:bg-amber-300 dark:bg-amber-800 dark:text-amber-300 dark:hover:bg-amber-700',
                      'flex flex-row gap-2 items-center',
                    )}
                    href="/recipes"
                  >
                    And many more...
                  </Anchor>
                  {/* <div className="flex">
                  </div> */}
                </li>
              </ul>
            </div>
          </div>
        }
      />
    </>
  );
}

function AltBackground({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`
        w-full py-24
        odd:bg-gray-50
        odd:dark:bg-gray-900
        even:bg-white
        even:dark:bg-black
      `}
    >
      {children}
    </div>
  );
}

function Feature({
  icon,
  title,
  description,
  children,
  image,
  gradient,
  flipped,
}: {
  children?: React.ReactNode;
  icon?: React.ReactNode;
  title: string;
  description: React.ReactNode;
  highlights?: {
    title: string;
    description: React.ReactNode;
    icon?: React.ReactNode;
  }[];
  image?: string;
  gradient: number;
  flipped?: boolean;
}) {
  const [start, end] = pickGradient(gradient);

  return (
    <AltBackground>
      <div className="container box-border px-6 mx-auto flex flex-col gap-y-24">
        <div
          className={clsx(
            'flex flex-col gap-24 md:gap-12 lg:gap-24 justify-center items-stretch',
            flipped ? 'md:flex-row-reverse' : 'md:flex-row',
          )}
        >
          <div
            className={clsx(
              'flex flex-col gap-4 w-full md:w-3/5 lg:w-2/5 flex-shrink-0',
              !image && 'items-center',
            )}
          >
            {icon && (
              <div className="text-5xl" style={{ color: start }}>
                {icon}
              </div>
            )}
            <h2
              className={clsx(
                'font-semibold text-5xl bg-clip-text text-transparent dark:text-transparent leading-normal',
                !image && 'text-center',
              )}
              style={{
                backgroundImage: `linear-gradient(-70deg, ${end}, ${start})`,
              }}
            >
              {title}
            </h2>
            <div className="text-lg text-gray-600 dark:text-gray-400 leading-7">
              {description}
            </div>
          </div>
          {image && (
            <div
              className="rounded-3xl overflow-hidden p-8 flex-grow flex flex-col justify-center items-stretch relative"
              style={{
                backgroundImage: `linear-gradient(70deg, ${start}, ${end})`,
              }}
            >
              <Image
                src={image}
                fill
                className="rounded-xl mx-auto"
                placeholder="empty"
                alt={title}
              />
            </div>
          )}
        </div>
        {children}
      </div>
    </AltBackground>
  );
}

function FeatureHighlights({
  highlights,
  textColor,
}: {
  textColor?: string;
  highlights?: {
    title: string;
    description: React.ReactNode;
    icon?: React.ReactNode;
    link?: string;
  }[];
}) {
  if (!Array.isArray(highlights)) {
    return null;
  }

  return (
    <>
      {highlights.map(({ title, description, icon, link }) => {
        const Comp = link ? Anchor : 'div';
        return (
          <Comp
            key={title}
            className="flex flex-row md:flex-col lg:flex-row flex-1 gap-4"
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            {...(link && ({ href: link } as any))}
          >
            {icon && (
              <div
                className="flex-shrink-0"
                style={textColor ? { color: textColor } : {}}
              >
                {icon}
              </div>
            )}
            <div className="text-black dark:text-white">
              <h3
                className={clsx('text-xl font-semibold', !icon && 'text-lg')}
                style={textColor ? { color: textColor } : {}}
              >
                {title}
              </h3>
              <p
                className={clsx(
                  'text-gray-600 dark:text-gray-400',
                  !icon && 'text-sm',
                )}
              >
                {description}
              </p>
            </div>
          </Comp>
        );
      })}
    </>
  );
}
