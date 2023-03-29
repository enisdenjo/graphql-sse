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
import { FaCreativeCommonsZero } from 'react-icons/fa';
import { Anchor, Image } from '@theguild/components';
import Link from 'next/link';

const classes = {
  button: {
    gray: 'inline-block bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 text-gray-600 px-6 py-3 rounded-lg font-medium shadow-sm',
    emerald:
      'inline-block bg-emerald-200 hover:bg-emerald-300 dark:bg-emerald-800 dark:text-emerald-300 dark:hover:bg-emerald-700 text-emerald-600 px-6 py-3 rounded-lg font-medium shadow-sm',
  },
  link: {
    blue: 'text-blue-600 hover:text-blue-800 dark:hover:text-blue-400',
    emerald:
      'text-emerald-600 hover:text-emerald-800 dark:hover:text-emerald-400',
  },
};

const gradients: [string, string][] = [
  ['#06b6d4', '#0e7490'], // cyan
  ['#f97316', '#c2410c'], // orange
  ['#10b981', '#047857'], // emerald
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
      <Wrapper>
        <div className="container py-20 sm:py-24 lg:py-32">
          <h1 className="max-w-screen-md mx-auto font-extrabold text-5xl sm:text-5xl lg:text-6xl text-center bg-gradient-to-r from-green-700 to-emerald-400 dark:from-green-700 dark:to-emerald-400 bg-clip-text text-transparent !leading-tight">
            GraphQL SSE
          </h1>
          <p className="max-w-screen-sm mx-auto mt-6 text-2xl text-gray-600 text-center dark:text-gray-400">
            Zero-dependency, HTTP/1 safe, simple, spec compliant server and
            client
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Anchor
              className={clsx(
                classes.button.gray,
                'flex flex-row gap-2 items-center',
              )}
              href="/get-started"
            >
              <FiPlay /> Get Started
            </Anchor>
            <Anchor
              className={clsx(
                classes.button.gray,
                'flex flex-row gap-2 items-center',
              )}
              href="/recipes"
            >
              <TbChefHat /> Recipes
            </Anchor>
            <Anchor
              className={clsx(
                classes.button.gray,
                'flex flex-row gap-2 items-center',
              )}
              href="https://github.com/enisdenjo/graphql-sse"
            >
              <FiGithub /> GitHub
            </Anchor>
          </div>
        </div>
      </Wrapper>

      <Wrapper>
        <Feature
          gradient={0}
          title="Spec Compliant"
          description={
            <div className="flex flex-col gap-y-12">
              <p className="text-center mb-6">
                As a reference implementation, the library is fully compliant
                with the{' '}
                <Link
                  href="https://github.com/enisdenjo/graphql-sse/blob/master/PROTOCOL.md"
                  className={classes.link.blue}
                >
                  GraphQL over SSE (Server-Sent Events) spec
                </Link>
              </p>
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
                      description:
                        'Each connection is a subscription on its own',
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
      </Wrapper>

      <Wrapper>
        <Feature
          gradient={1}
          title="Server and Client"
          description={
            <div className="flex flex-col gap-y-12">
              <p className="text-center mb-6">
                Single library, but both the server and the client is included
              </p>
              <div className="flex flex-col gap-y-12">
                <FeatureHighlights
                  textColor={gradients[1][0]}
                  highlights={[
                    {
                      icon: <FaCreativeCommonsZero size={36} />,
                      title: 'Zero-dependency',
                      description: 'Library contains everything it needs',
                    },
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
      </Wrapper>

      <Wrapper>
        <Feature
          gradient={2}
          icon={<TbChefHat />}
          title="Recipes"
          description={
            <div className="flex flex-col gap-y-12">
              <p className="text-center mb-6">
                Short and concise code snippets for starting with common
                use-cases
              </p>
              <div className="flex flex-col gap-y-12">
                <ul className="my-0">
                  <li>
                    <Link
                      className={classes.link.emerald}
                      href="/recipes#client-usage-with-async-iterator"
                    >
                      Client usage with AsyncIterator
                    </Link>
                  </li>
                  <li>
                    <Link
                      className={classes.link.emerald}
                      href="/recipes#client-usage-with-relay"
                    >
                      Client usage with Relay
                    </Link>
                  </li>
                  <li>
                    <Link
                      className={classes.link.emerald}
                      href="/recipes#server-handler-usage-with-custom-context-value"
                    >
                      Server handler usage with custom context value
                    </Link>
                  </li>
                  <li>
                    <Link
                      className={classes.link.emerald}
                      href="/recipes#server-handler-and-client-usage-with-persisted-queries"
                    >
                      Server handler and client usage with persisted queries
                    </Link>
                  </li>
                  <li className="flex mt-2">
                    <Anchor
                      className={clsx(
                        classes.button.emerald,
                        'flex flex-row gap-2 items-center',
                      )}
                      href="/recipes"
                    >
                      And many more...
                    </Anchor>
                  </li>
                </ul>
              </div>
            </div>
          }
        />
      </Wrapper>
    </>
  );
}

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={clsx(
        'w-full',
        'py-24',
        'odd:bg-gray-50',
        'odd:dark:bg-gray-900',
        'even:bg-white',
        'even:dark:bg-black',
      )}
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
