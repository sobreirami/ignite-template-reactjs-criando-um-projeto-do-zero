import { GetStaticPaths, GetStaticProps } from 'next';
import { RichText } from 'prismic-dom';

import format from 'date-fns/format';
import { ptBR } from 'date-fns/locale';

import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';
import Prismic from '@prismicio/client';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import Header from '../../components/Header';
import Comment from '../../components/Comment';

interface Post {
  first_publication_date: string | null;
  last_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostPaginate {
  uid: string;
  title: string;
}

interface PostProps {
  post: Post;
  preview: boolean;
  prevPost?: PostPaginate | null;
  nextPost?: PostPaginate | null;
}

export default function Post({
  post,
  preview,
  prevPost,
  nextPost,
}: PostProps): JSX.Element {
  const router = useRouter();

  if (router.isFallback) {
    return <div>Carregando...</div>;
  }

  const tempRead = post.data.content.reduce((acc, content) => {
    const textBody = RichText.asText(content.body)
      .split(/<.+?>(.+?)<\/.+?>/g)
      .filter(t => t);

    const ar = [];
    textBody.forEach(fr => {
      fr.split(' ').forEach(pl => {
        ar.push(pl);
      });
    });

    const min = Math.ceil(ar.length / 200);
    return acc + min;
  }, 0);

  return (
    <>
      <Head>
        <title>{post.data.title} | Spacetraveling</title>
      </Head>

      <Header />

      <div className={styles.bannerContainer}>
        <img src={post.data.banner.url} alt={post.data.title} />
      </div>
      <main className={commonStyles.container}>
        <article className={styles.post}>
          <h1>{post.data.title}</h1>

          <div className={styles.postInfo}>
            <p>
              <FiCalendar />
              {format(new Date(post.first_publication_date), "dd MMM' 'yyyy", {
                locale: ptBR,
              })}
            </p>
            <p>
              <FiUser /> {post.data.author}
            </p>
            <p>
              <FiClock /> {tempRead} min
            </p>
          </div>

          {post.last_publication_date && (
            <div className={styles.lastUpdate}>
              <p>
                * editado em{' '}
                {format(
                  new Date(post.last_publication_date),
                  "dd MMM' 'yyyy', às 'HH:mm",
                  {
                    locale: ptBR,
                  }
                )}
              </p>
            </div>
          )}

          {post.data.content.map(content => (
            <div className={styles.postContent} key={content.heading}>
              <h1>{content.heading}</h1>
              <div
                className={styles.postContentBody}
                dangerouslySetInnerHTML={{
                  __html: RichText.asHtml(content.body),
                }}
              />
            </div>
          ))}
        </article>

        <div className={styles.postPaginate}>
          <div>
            {prevPost && (
              <>
                <p>{prevPost.title}</p>
                <Link href={`/post/${prevPost.uid}`}>
                  <a>Post anterior</a>
                </Link>
              </>
            )}
          </div>

          <div>
            {nextPost && (
              <>
                <p>{nextPost.title}</p>
                <Link href={`/post/${nextPost.uid}`}>
                  <a>Próximo post</a>
                </Link>
              </>
            )}
          </div>
        </div>

        <Comment />

        {preview && (
          <aside className={commonStyles.previewContainer}>
            <Link href="/api/exit-preview">
              <a>Sair do modo Preview</a>
            </Link>
          </aside>
        )}
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();

  const posts = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      fetch: ['post.uid'],
      pageSize: 2,
    }
  );

  const paths = posts.results.map(post => ({
    params: { slug: post.uid },
  }));

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({
  params,
  preview = false,
  previewData,
}) => {
  const { slug } = params;

  const prismic = getPrismicClient();
  const response = await prismic.getByUID('post', String(slug), {
    ref: previewData?.ref ?? null,
  });

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    last_publication_date: response.last_publication_date,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      author: response.data.author,
      banner: {
        url: response.data.banner.url,
      },
      content: response.data.content.map(content => {
        return {
          heading: content.heading,
          body: [...content.body],
        };
      }),
    },
  };

  const responsePrevPost = await prismic.query(
    [
      Prismic.predicates.dateBefore(
        'document.first_publication_date',
        post.first_publication_date
      ),
    ],
    {
      fetch: ['post.title'],
      pageSize: 1,
      orderings: '[document.first_publication_date desc]',
    }
  );

  const prevPost =
    responsePrevPost.results.length > 0
      ? {
          title: responsePrevPost.results[0].data.title,
          uid: responsePrevPost.results[0].uid,
        }
      : null;

  const responseNextPost = await prismic.query(
    [
      Prismic.predicates.dateAfter(
        'document.first_publication_date',
        post.first_publication_date
      ),
    ],
    {
      fetch: ['post.title'],
      pageSize: 1,
      orderings: '[document.first_publication_date]',
    }
  );

  const nextPost =
    responseNextPost.results.length > 0
      ? {
          title: responseNextPost.results[0].data.title,
          uid: responseNextPost.results[0].uid,
        }
      : null;

  return {
    props: {
      post,
      preview,
      prevPost,
      nextPost,
    },
  };
};
